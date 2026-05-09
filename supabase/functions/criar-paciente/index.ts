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

    // ── 2. Verificar perfil (apenas MEDICO ou ADMIN pode criar pacientes) ───
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: perfilRow } = await adminClient
      .from('utilizadores')
      .select('perfil')
      .eq('id', user.id)
      .single()

    if (!perfilRow || !['TECNICO', 'ADMIN'].includes(perfilRow.perfil)) {
      return json({ erro: 'Sem permissão para criar pacientes' }, 403)
    }

    // ── 3. Validar corpo do pedido ──────────────────────────────────────────
    const body = await req.json()
    const { nomeCompleto, email, dataNascimento, genero, numeroUtente, medicoId } = body

    if (!nomeCompleto?.trim() || !email?.trim()) {
      return json({ erro: 'Nome completo e email são obrigatórios' }, 400)
    }

    // ── 4. Criar utilizador no Supabase Auth ────────────────────────────────
    // email_confirm: true → conta activa sem necessitar de verificação de email
    // password aleatória → o paciente deverá repô-la via "esqueci a password"
    const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: { nome_completo: nomeCompleto.trim() },
    })

    if (createErr || !authData.user) {
      return json({ erro: createErr?.message ?? 'Falha ao criar utilizador Auth' }, 500)
    }

    const novoId = authData.user.id

    // ── 5. Actualizar a row em utilizadores criada pelo trigger de auth ──────
    // O trigger on auth.users insere uma row base; aqui preenchemos os campos
    // específicos do perfil PACIENTE usando service_role (bypass RLS).
    const { error: updateErr } = await adminClient
      .from('utilizadores')
      .update({
        nome_completo: nomeCompleto.trim(),
        perfil: 'PACIENTE',
        ativo: true,
        data_nascimento: dataNascimento || null,
        genero: genero || null,
        numero_utente: numeroUtente?.trim() || null,
        conta_ativada: false,
        idioma: 'pt',
        two_factor_ativo: false,
        conta_bloqueada: false,
      })
      .eq('id', novoId)

    if (updateErr) {
      // Reverter: eliminar o utilizador Auth para não ficar registo órfão
      await adminClient.auth.admin.deleteUser(novoId)
      return json({ erro: `Falha ao actualizar perfil: ${updateErr.message}` }, 500)
    }

    // ── 6. Criar associação paciente_medico ─────────────────────────────────
    if (medicoId) {
      const { error: assocErr } = await adminClient
        .from('paciente_medico')
        .insert({ paciente_id: novoId, medico_id: medicoId })

      if (assocErr) {
        // Paciente foi criado; apenas a associação falhou — aviso não-fatal
        return json({ id: novoId, avisoAssociacao: assocErr.message }, 201)
      }
    }

    return json({ id: novoId }, 201)

  } catch (err) {
    return json({ erro: String(err) }, 500)
  }
})
