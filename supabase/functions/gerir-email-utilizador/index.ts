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

    // ── 2. Verificar perfil — apenas ADMIN pode ver/editar o email de outros ─
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: perfilRow } = await adminClient
      .from('utilizadores')
      .select('perfil, nome_completo')
      .eq('id', user.id)
      .single()

    if (!perfilRow || perfilRow.perfil !== 'ADMIN') {
      return json({ erro: 'Sem permissão' }, 403)
    }

    // ── 3. Validar corpo do pedido ───────────────────────────────────────────
    const body = await req.json()
    const { utilizadorId, novoEmail } = body

    if (!utilizadorId?.trim()) {
      return json({ erro: 'utilizadorId é obrigatório' }, 400)
    }

    // ── 4a. Sem novoEmail → devolver o email atual ──────────────────────────
    if (novoEmail === undefined) {
      const { data: authData, error: getErr } = await adminClient.auth.admin.getUserById(utilizadorId)
      if (getErr || !authData.user) {
        return json({ erro: 'Utilizador não encontrado' }, 404)
      }
      return json({ email: authData.user.email ?? '' })
    }

    // ── 4b. Com novoEmail → atualizar ─────────────────────────────────────────
    const emailNormalizado = novoEmail.trim().toLowerCase()
    if (!emailNormalizado) {
      return json({ erro: 'Email inválido' }, 400)
    }

    const { error: updateErr } = await adminClient.auth.admin.updateUserById(utilizadorId, {
      email: emailNormalizado,
      email_confirm: true,
    })

    if (updateErr) {
      if (updateErr.message?.toLowerCase().includes('already been registered') ||
          updateErr.message?.toLowerCase().includes('already registered')) {
        return json({ erro: 'Já existe um utilizador com este email.' }, 409)
      }
      return json({ erro: updateErr.message }, 500)
    }

    await adminClient.from('audit_log').insert({
      utilizador_snapshot: { nome: perfilRow.nome_completo, perfil: perfilRow.perfil },
      tipo_acao: 'EDITAR_EMAIL_UTILIZADOR',
      entidade_afetada: 'utilizadores',
      entidade_id: utilizadorId,
      data_hora: new Date().toISOString(),
    })

    return json({ email: emailNormalizado })

  } catch (err) {
    console.error('gerir-email-utilizador failed:', err)
    const mensagem =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    return json({ erro: mensagem }, 500)
  }
})
