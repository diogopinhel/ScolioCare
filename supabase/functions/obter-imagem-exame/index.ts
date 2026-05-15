/**
 * Edge Function: obter-imagem-exame
 *
 * Endpoint para os modelos de Machine Learning obterem acesso temporário
 * às imagens de um estudo. Devolve URLs assinadas (válidas 1h) para download
 * directo do Supabase Storage, sem expor a service role key.
 *
 * Autenticação: API key partilhada (SCOLIO_ML_API_KEY) no header Authorization.
 * Não usa Supabase Auth — é uma chamada server-to-server.
 *
 * Contrato:
 *   POST /functions/v1/obter-imagem-exame
 *   Headers: Authorization: Bearer <SCOLIO_ML_API_KEY>
 *   Body:    { "estudoId": "uuid" }
 *
 *   200 → { estudoId, pacienteId, dataEstudo, tipoEstudo, imagens: [...] }
 *   400 → { erro: "estudoId é obrigatório" }
 *   401 → { erro: "API key inválida" }
 *   404 → { erro: "Estudo não encontrado" | "Estudo sem imagens" }
 *   410 → { erro: "Estudo arquivado" }
 *   500 → { erro: "<mensagem>" }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SIGNED_URL_TTL_SECONDS = 3600 // 1h

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ erro: 'Método não permitido' }, 405)
  }

  try {
    // ── 1. Validar API key partilhada ───────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim()
    const expectedKey = Deno.env.get('SCOLIO_ML_API_KEY')

    if (!expectedKey) {
      return json({ erro: 'SCOLIO_ML_API_KEY não configurada no servidor' }, 500)
    }
    if (!apiKey || apiKey !== expectedKey) {
      return json({ erro: 'API key inválida' }, 401)
    }

    // ── 2. Validar corpo do pedido ──────────────────────────────────────────
    let body: { estudoId?: string }
    try {
      body = await req.json()
    } catch {
      return json({ erro: 'Corpo do pedido inválido (JSON malformado)' }, 400)
    }

    const estudoId = body.estudoId?.trim()
    if (!estudoId) {
      return json({ erro: 'estudoId é obrigatório' }, 400)
    }

    // ── 3. Cliente admin (bypass RLS) ───────────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // ── 4. Obter o estudo ───────────────────────────────────────────────────
    const { data: estudo, error: errEstudo } = await adminClient
      .from('estudos')
      .select('id, paciente_id, data_estudo, tipo_estudo, estado, arquivado')
      .eq('id', estudoId)
      .single()

    if (errEstudo || !estudo) {
      return json({ erro: 'Estudo não encontrado' }, 404)
    }

    if (estudo.arquivado) {
      return json({ erro: 'Estudo arquivado — não disponível para análise' }, 410)
    }

    // ── 5. Obter as imagens do estudo ───────────────────────────────────────
    const { data: imagensRow, error: errImg } = await adminClient
      .from('imagens_estudo')
      .select('id, caminho_armazenamento, formato, projecao, tamanho_bytes, hash_integridade')
      .eq('estudo_id', estudoId)

    if (errImg) {
      return json({ erro: errImg.message }, 500)
    }
    if (!imagensRow || imagensRow.length === 0) {
      return json({ erro: 'Estudo sem imagens' }, 404)
    }

    // ── 6. Gerar URLs assinadas (TTL 1h) ────────────────────────────────────
    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString()

    const imagens = await Promise.all(
      imagensRow.map(async (img) => {
        const { data: signed, error: errSigned } = await adminClient.storage
          .from('exam-images')
          .createSignedUrl(img.caminho_armazenamento as string, SIGNED_URL_TTL_SECONDS)

        return {
          id: img.id as string,
          url: signed?.signedUrl ?? null,
          erroAssinatura: errSigned?.message ?? null,
          expiresAt,
          formato: img.formato as string | null,
          projecao: img.projecao as string | null,
          tamanhoBytes: img.tamanho_bytes as number | null,
          hashIntegridade: img.hash_integridade as string | null,
        }
      })
    )

    // ── 7. Registar acesso no audit log (fire-and-forget) ───────────────────
    adminClient.from('audit_log').insert({
      utilizador_snapshot: { nome: 'Sistema ML', perfil: 'SISTEMA' },
      tipo_acao: 'ACESSO_IMAGEM_IA',
      entidade_afetada: 'estudos',
      entidade_id: estudoId,
      data_hora: new Date().toISOString(),
    }).then(() => {/* silencioso */})

    return json({
      estudoId: estudo.id,
      pacienteId: estudo.paciente_id,
      dataEstudo: estudo.data_estudo,
      tipoEstudo: estudo.tipo_estudo,
      estado: estudo.estado,
      imagens,
    })

  } catch (err) {
    return json({ erro: String(err) }, 500)
  }
})
