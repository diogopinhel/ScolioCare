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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey        = Deno.env.get('SUPABASE_ANON_KEY')!

    // ── 1. Verificar identidade do chamador ─────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ erro: 'Não autorizado' }, 401)

    const chamadorClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await chamadorClient.auth.getUser()
    if (authErr || !user) return json({ erro: 'Não autorizado' }, 401)

    // ── 2. Verificar perfil — TECNICO ou ADMIN ──────────────────────────────
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: perfilRow } = await adminClient
      .from('utilizadores')
      .select('perfil, nome_completo')
      .eq('id', user.id)
      .single()

    if (!perfilRow || !['TECNICO', 'ADMIN'].includes(perfilRow.perfil)) {
      return json({ erro: 'Sem permissão para reatribuir pacientes' }, 403)
    }

    // ── 3. Validar corpo ────────────────────────────────────────────────────
    const body = await req.json()
    const { pacienteId, novoMedicoId } = body

    if (!pacienteId || !novoMedicoId) {
      return json({ erro: 'pacienteId e novoMedicoId são obrigatórios' }, 400)
    }

    // ── 4. Verificar que o paciente existe ──────────────────────────────────
    const { data: paciente } = await adminClient
      .from('utilizadores')
      .select('id, perfil')
      .eq('id', pacienteId)
      .eq('perfil', 'PACIENTE')
      .single()

    if (!paciente) return json({ erro: 'Paciente não encontrado' }, 404)

    // ── 5. Verificar que o novo médico existe e está ativo ──────────────────
    const { data: medico } = await adminClient
      .from('utilizadores')
      .select('id, perfil, ativo')
      .eq('id', novoMedicoId)
      .eq('perfil', 'MEDICO')
      .eq('ativo', true)
      .single()

    if (!medico) return json({ erro: 'Médico não encontrado ou inativo' }, 404)

    // ── 6. Fechar associação actual (se existir) ────────────────────────────
    await adminClient
      .from('paciente_medico')
      .update({ data_fim: new Date().toISOString() })
      .eq('paciente_id', pacienteId)
      .is('data_fim', null)

    // ── 7. Criar nova associação (INSERT sempre — o histórico fica preservado)
    const { error: insertErr } = await adminClient
      .from('paciente_medico')
      .insert({ paciente_id: pacienteId, medico_id: novoMedicoId })

    if (insertErr) return json({ erro: insertErr.message }, 500)

    await adminClient.from('audit_log').insert({
      utilizador_snapshot: { nome: perfilRow.nome_completo, perfil: perfilRow.perfil },
      tipo_acao: 'REATRIBUIR_MEDICO',
      entidade_afetada: 'paciente_medico',
      entidade_id: pacienteId,
      data_hora: new Date().toISOString(),
    })

    return json({ ok: true }, 200)

  } catch (err) {
    return json({ erro: String(err) }, 500)
  }
})
