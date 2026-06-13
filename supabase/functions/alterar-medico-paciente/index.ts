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

    // ── 2. Verificar perfil (apenas TECNICO ou ADMIN) ───────────────────────
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: perfilRow } = await adminClient
      .from('utilizadores')
      .select('perfil, nome_completo')
      .eq('id', user.id)
      .single()

    if (!perfilRow || !['TECNICO', 'ADMIN'].includes(perfilRow.perfil)) {
      return json({ erro: 'Sem permissão para alterar o médico responsável' }, 403)
    }

    // ── 3. Validar corpo do pedido ──────────────────────────────────────────
    const body = await req.json()
    const { pacienteId, novoMedicoId } = body

    if (!pacienteId || !novoMedicoId) {
      return json({ erro: 'pacienteId e novoMedicoId são obrigatórios' }, 400)
    }

    // ── 4. Verificar que o novo médico existe, é MEDICO e está ativo ────────
    const { data: novoMedico } = await adminClient
      .from('utilizadores')
      .select('id, nome_completo, perfil')
      .eq('id', novoMedicoId)
      .eq('perfil', 'MEDICO')
      .eq('ativo', true)
      .single()

    if (!novoMedico) {
      return json({ erro: 'Médico não encontrado ou inativo' }, 404)
    }

    // ── 5. Obter paciente (para saber se a conta já está ativada) ───────────
    const { data: pacienteRow } = await adminClient
      .from('utilizadores')
      .select('id, conta_ativada, nome_completo')
      .eq('id', pacienteId)
      .eq('perfil', 'PACIENTE')
      .single()

    if (!pacienteRow) {
      return json({ erro: 'Paciente não encontrado' }, 404)
    }

    // ── 6. Obter associação ativa atual ─────────────────────────────────────
    const { data: assocAtual } = await adminClient
      .from('paciente_medico')
      .select('id, medico_id')
      .eq('paciente_id', pacienteId)
      .is('data_fim', null)
      .maybeSingle()

    // Se já existe associação ao mesmo médico:
    //  • Conta ativa → re-atribuição redundante: devolve 409 (fluxo da edição).
    //  • Conta inativa → fluxo de ativação: garante apenas conta_ativada=true.
    if (assocAtual?.medico_id === novoMedicoId) {
      if (pacienteRow.conta_ativada) {
        return json({ erro: 'O médico selecionado já é o responsável deste paciente' }, 409)
      }
      await adminClient
        .from('utilizadores')
        .update({ conta_ativada: true })
        .eq('id', pacienteId)
      return json({ ok: true })
    }

    // ── 7. Obter nome do médico anterior para o log ─────────────────────────
    let medicoAnteriorNome: string | null = null
    if (assocAtual) {
      const { data: medicoAnterior } = await adminClient
        .from('utilizadores')
        .select('nome_completo')
        .eq('id', assocAtual.medico_id)
        .single()
      medicoAnteriorNome = medicoAnterior?.nome_completo ?? null

      // Encerrar associação anterior (soft-delete via data_fim)
      const { error: errFim } = await adminClient
        .from('paciente_medico')
        .update({ data_fim: new Date().toISOString() })
        .eq('id', assocAtual.id)

      if (errFim) {
        return json({ erro: `Falha ao encerrar associação anterior: ${errFim.message}` }, 500)
      }
    }

    // ── 8. Criar nova associação ────────────────────────────────────────────
    const { error: errAssoc } = await adminClient
      .from('paciente_medico')
      .insert({ paciente_id: pacienteId, medico_id: novoMedicoId })

    if (errAssoc) {
      return json({ erro: `Falha ao criar nova associação: ${errAssoc.message}` }, 500)
    }

    // ── 8b. Ativar conta do paciente (desbloqueio na app mobile) ────────────
    await adminClient
      .from('utilizadores')
      .update({ conta_ativada: true })
      .eq('id', pacienteId)

    // ── 9. Registar no audit_log e procurar os exames pendentes em paralelo.
    //       São operações independentes (tabelas diferentes, sem ordem entre
    //       si), por isso correm juntas para poupar uma ida-e-volta. ──────────
    const [, { data: estudosPendentes, error: errEstudos }] = await Promise.all([
      adminClient.from('audit_log').insert({
        utilizador_id: user.id,
        utilizador_snapshot: {
          nome: perfilRow.nome_completo,
          perfil: perfilRow.perfil,
          email: user.email,
        },
        tipo_acao: 'ALTERAR_MEDICO_PACIENTE',
        entidade_afetada: 'paciente_medico',
        entidade_id: pacienteId,
        detalhe: {
          medico_anterior_id: assocAtual?.medico_id ?? null,
          medico_anterior_nome: medicoAnteriorNome,
          medico_novo_id: novoMedicoId,
          medico_novo_nome: novoMedico.nome_completo,
        },
      }),
      adminClient
        .from('estudos')
        .select('id')
        .eq('paciente_id', pacienteId)
        .in('estado', ['UPLOADED', 'PROCESSING', 'PENDING_VALIDATION']),
    ])

    // ── 10. Notificar o novo médico dos exames que herda por analisar. A RLS
    //       de `estudos` baseia-se na associação ativa, por isso o novo médico
    //       já tem acesso — falta apenas avisá-lo (na troca de médico, o exame
    //       deixa de aparecer ao anterior e ninguém era notificado).
    //       "Por analisar" = qualquer estado antes da validação. Inclui
    //       UPLOADED/PROCESSING porque o pipeline de ML que transiciona para
    //       PENDING_VALIDATION pode não estar ativo — sem isto, exames reais
    //       (presos em PROCESSING) nunca gerariam notificação.
    //       Best-effort: uma falha aqui não desfaz a reatribuição.
    if (errEstudos) {
      console.error('alterar-medico-paciente: falha ao procurar exames pendentes:', errEstudos)
    } else if (estudosPendentes && estudosPendentes.length > 0) {
      const nomePaciente = pacienteRow.nome_completo ?? 'um paciente'
      const { error: errNotif } = await adminClient.from('notificacoes').insert(
        estudosPendentes.map((e) => ({
          destinatario_id:     novoMedicoId,
          tipo:                'EXAME',
          titulo:              'Exame por validar atribuído',
          mensagem:            `O paciente ${nomePaciente} foi-lhe atribuído e tem um exame por validar.`,
          titulo_en:           'Exam to validate assigned',
          mensagem_en:         `Patient ${nomePaciente} has been assigned to you and has an exam awaiting validation.`,
          referencia_entidade: 'estudos',
          referencia_id:       e.id,
        })),
      )
      if (errNotif) {
        console.error('alterar-medico-paciente: falha ao notificar novo médico:', errNotif)
      }
    }

    return json({ ok: true })

  } catch (err) {
    return json({ erro: String(err) }, 500)
  }
})
