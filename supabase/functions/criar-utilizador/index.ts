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

    // ── 2. Verificar perfil — apenas ADMIN pode criar utilizadores ───────────
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: perfilRow } = await adminClient
      .from('utilizadores')
      .select('perfil, nome_completo')
      .eq('id', user.id)
      .single()

    if (!perfilRow || perfilRow.perfil !== 'ADMIN') {
      return json({ erro: 'Sem permissão para criar utilizadores' }, 403)
    }

    // ── 3. Validar corpo do pedido ──────────────────────────────────────────
    const body = await req.json()
    const { perfil, nomeCompleto, email, redirectTo } = body

    if (!nomeCompleto?.trim() || !email?.trim() || !redirectTo?.trim()) {
      return json({ erro: 'Nome completo, email e redirectTo são obrigatórios' }, 400)
    }

    if (!['MEDICO', 'TECNICO', 'ADMIN'].includes(perfil)) {
      return json({ erro: 'Perfil inválido. Use MEDICO, TECNICO ou ADMIN.' }, 400)
    }

    // ── 4. Convidar utilizador por email (sem password — o próprio define
    //      a password no primeiro acesso, em redirectTo) ────────────────────
    const { data: authData, error: createErr } = await adminClient.auth.admin.inviteUserByEmail(
      email.trim().toLowerCase(),
      {
        data: { nome_completo: nomeCompleto.trim() },
        redirectTo,
      },
    )

    if (createErr || !authData.user) {
      if (createErr?.message?.toLowerCase().includes('already registered')) {
        return json({ erro: 'Já existe um utilizador com este email.' }, 409)
      }
      return json({ erro: createErr?.message ?? 'Falha ao convidar utilizador' }, 500)
    }

    const novoId = authData.user.id

    // ── 5. Campos específicos por perfil ────────────────────────────────────
    const camposBase: Record<string, unknown> = {
      nome_completo: nomeCompleto.trim(),
      perfil,
      ativo: true,
      idioma: 'pt',
      two_factor_ativo: false,
      conta_bloqueada: false,
    }

    if (perfil === 'MEDICO') {
      camposBase.cedula_profissional = body.cedulaProfissional?.trim() ?? ''
      camposBase.especialidade = body.especialidade?.trim() ?? ''
    } else if (perfil === 'TECNICO') {
      camposBase.codigo_funcionario = body.codigoFuncionario?.trim() ?? ''
      camposBase.departamento = body.departamento?.trim() ?? ''
    }

    // ── 6. Criar a row em utilizadores com os dados definidos pelo admin.
    //      handle_new_user() só cria esta row quando o convite é aceite
    //      (email confirmado) — até aí não existe nenhuma row para
    //      atualizar, por isso usamos upsert. Se handle_new_user() vier a
    //      correr depois, o ON CONFLICT (id) DO NOTHING dele preserva os
    //      dados gravados aqui.
    const { error: upsertErr } = await adminClient
      .from('utilizadores')
      .upsert({ id: novoId, ...camposBase })

    if (upsertErr) {
      // Reverter: eliminar o utilizador Auth para não ficar registo órfão
      await adminClient.auth.admin.deleteUser(novoId)
      return json({ erro: `Falha ao gravar perfil: ${upsertErr.message}` }, 500)
    }

    await adminClient.from('audit_log').insert({
      utilizador_snapshot: { nome: perfilRow.nome_completo, perfil: perfilRow.perfil },
      tipo_acao: 'CRIAR_UTILIZADOR',
      entidade_afetada: 'utilizadores',
      entidade_id: novoId,
      data_hora: new Date().toISOString(),
    })

    return json({ id: novoId }, 201)

  } catch (err) {
    // Loga o erro completo (com stack) para os Function Logs do dashboard.
    console.error('criar-utilizador failed:', err)
    const mensagem =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    return json({ erro: mensagem }, 500)
  }
})
