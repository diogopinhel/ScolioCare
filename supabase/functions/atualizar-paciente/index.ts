import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // ── 1. Verificar identidade do chamador ─────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ erro: 'Não autorizado' }, 401)

    const chamadorClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await chamadorClient.auth.getUser()
    if (authErr || !user) return json({ erro: 'Não autorizado' }, 401)

    // ── 2. Verificar perfil (MEDICO ou ADMIN) ───────────────────────────────
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: perfilRow } = await adminClient
      .from('utilizadores')
      .select('perfil, nome_completo')
      .eq('id', user.id)
      .single()

    if (!perfilRow || !['TECNICO', 'ADMIN'].includes(perfilRow.perfil)) {
      return json({ erro: 'Sem permissão para editar dados de pacientes' }, 403)
    }

    // ── 3. Validar corpo do pedido ──────────────────────────────────────────
    const body = await req.json()
    const { pacienteId, nomeCompleto, dataNascimento, genero, numeroUtente, contacto, morada, cartaoCidadao } = body

    if (!pacienteId) return json({ erro: 'pacienteId é obrigatório' }, 400)
    if (!nomeCompleto?.trim()) return json({ erro: 'Nome completo é obrigatório' }, 400)

    // TECNICO e ADMIN têm acesso irrestrito a todos os pacientes.

    // ── 5. Verificar que o paciente existe e é realmente PACIENTE ───────────
    const { data: pacienteExistente } = await adminClient
      .from('utilizadores')
      .select('id, perfil, nome_completo, data_nascimento, genero, numero_utente, contacto, morada, cartao_cidadao')
      .eq('id', pacienteId)
      .eq('perfil', 'PACIENTE')
      .single()

    if (!pacienteExistente) {
      return json({ erro: 'Paciente não encontrado' }, 404)
    }

    // ── 6. Actualizar os campos editáveis do paciente ────────────────────────
    // Campos imutáveis (email, perfil, ativo, conta_bloqueada, etc.) não são
    // expostos neste endpoint. A alteração de email requer fluxo separado.
    const novosValores = {
      nome_completo: nomeCompleto.trim(),
      data_nascimento: dataNascimento || null,
      genero: genero || null,
      numero_utente: numeroUtente?.trim() || null,
      contacto: contacto?.trim() || null,
      morada: morada?.trim() || null,
      cartao_cidadao: cartaoCidadao?.trim() || null,
    }

    const { error: updateErr } = await adminClient
      .from('utilizadores')
      .update(novosValores)
      .eq('id', pacienteId)

    if (updateErr) {
      return json({ erro: updateErr.message }, 500)
    }

    // Diff antes→depois dos campos que mudaram, para o registo de auditoria.
    const alteracoes: Record<string, string> = {}
    for (const [campo, depois] of Object.entries(novosValores)) {
      const antes = (pacienteExistente as Record<string, unknown>)[campo] ?? null
      if (String(antes ?? '') !== String(depois ?? '')) {
        alteracoes[campo] = `${antes ?? '—'} → ${depois ?? '—'}`
      }
    }

    await adminClient.from('audit_log').insert({
      utilizador_snapshot: { nome: perfilRow.nome_completo, perfil: perfilRow.perfil },
      tipo_acao: 'EDITAR_PACIENTE',
      entidade_afetada: 'utilizadores',
      entidade_id: pacienteId,
      detalhe: Object.keys(alteracoes).length > 0 ? alteracoes : null,
      data_hora: new Date().toISOString(),
    })

    // Notificar o paciente (fire-and-forget — não bloqueia a resposta)
    adminClient.from('notificacoes').insert({
      destinatario_id: pacienteId,
      tipo: 'PACIENTE',
      titulo: 'Dados clínicos atualizados',
      mensagem: 'Os seus dados clínicos foram atualizados pelo técnico de saúde.',
      referencia_entidade: 'utilizadores',
      referencia_id: pacienteId,
    }).then(() => {/* silencioso */})

    return json({ ok: true }, 200)

  } catch (err) {
    return json({ erro: String(err) }, 500)
  }
})
