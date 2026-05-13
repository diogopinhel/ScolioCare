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
    const { perfil, nomeCompleto, email, password } = body

    if (!nomeCompleto?.trim() || !email?.trim() || !password?.trim()) {
      return json({ erro: 'Nome completo, email e password são obrigatórios' }, 400)
    }

    if (!['MEDICO', 'TECNICO', 'ADMIN'].includes(perfil)) {
      return json({ erro: 'Perfil inválido. Use MEDICO, TECNICO ou ADMIN.' }, 400)
    }

    if (password.length < 8) {
      return json({ erro: 'A password deve ter pelo menos 8 caracteres' }, 400)
    }

    // ── 4. Criar utilizador no Supabase Auth ────────────────────────────────
    const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      email_confirm: true,
      password: password.trim(),
      user_metadata: { nome_completo: nomeCompleto.trim() },
    })

    if (createErr || !authData.user) {
      if (createErr?.message?.toLowerCase().includes('already registered')) {
        return json({ erro: 'Já existe um utilizador com este email.' }, 409)
      }
      return json({ erro: createErr?.message ?? 'Falha ao criar utilizador Auth' }, 500)
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

    // ── 6. Atualizar a row em utilizadores criada pelo trigger de auth ───────
    const { error: updateErr } = await adminClient
      .from('utilizadores')
      .update(camposBase)
      .eq('id', novoId)

    if (updateErr) {
      // Reverter: eliminar o utilizador Auth para não ficar registo órfão
      await adminClient.auth.admin.deleteUser(novoId)
      return json({ erro: `Falha ao actualizar perfil: ${updateErr.message}` }, 500)
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
    return json({ erro: String(err) }, 500)
  }
})
