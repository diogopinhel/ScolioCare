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
      .select('perfil')
      .eq('id', user.id)
      .single()

    if (!perfilRow || !['MEDICO', 'ADMIN'].includes(perfilRow.perfil)) {
      return json({ erro: 'Sem permissão para editar dados de pacientes' }, 403)
    }

    // ── 3. Validar corpo do pedido ──────────────────────────────────────────
    const body = await req.json()
    const { pacienteId, nomeCompleto, dataNascimento, genero, numeroUtente, contacto, morada } = body

    if (!pacienteId) return json({ erro: 'pacienteId é obrigatório' }, 400)
    if (!nomeCompleto?.trim()) return json({ erro: 'Nome completo é obrigatório' }, 400)

    // ── 4. MEDICO: verificar que está associado ao paciente ─────────────────
    // ADMIN tem acesso irrestrito; MEDICO só pode editar os seus pacientes.
    if (perfilRow.perfil === 'MEDICO') {
      const { count } = await adminClient
        .from('paciente_medico')
        .select('paciente_id', { count: 'exact', head: true })
        .eq('medico_id', user.id)
        .eq('paciente_id', pacienteId)
        .is('data_fim', null)

      if ((count ?? 0) === 0) {
        return json({ erro: 'Não está associado a este paciente' }, 403)
      }
    }

    // ── 5. Verificar que o paciente existe e é realmente PACIENTE ───────────
    const { data: pacienteExistente } = await adminClient
      .from('utilizadores')
      .select('id, perfil')
      .eq('id', pacienteId)
      .eq('perfil', 'PACIENTE')
      .single()

    if (!pacienteExistente) {
      return json({ erro: 'Paciente não encontrado' }, 404)
    }

    // ── 6. Actualizar os campos editáveis do paciente ────────────────────────
    // Campos imutáveis (email, perfil, ativo, conta_bloqueada, etc.) não são
    // expostos neste endpoint. A alteração de email requer fluxo separado.
    const { error: updateErr } = await adminClient
      .from('utilizadores')
      .update({
        nome_completo: nomeCompleto.trim(),
        data_nascimento: dataNascimento || null,
        genero: genero || null,
        numero_utente: numeroUtente?.trim() || null,
        contacto: contacto?.trim() || null,
        morada: morada?.trim() || null,
      })
      .eq('id', pacienteId)

    if (updateErr) {
      return json({ erro: updateErr.message }, 500)
    }

    return json({ ok: true }, 200)

  } catch (err) {
    return json({ erro: String(err) }, 500)
  }
})
