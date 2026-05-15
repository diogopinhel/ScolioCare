import { supabase } from '../../lib/supabase';
import type {
  EstudoResumo,
  MetricasDashboardMedico,
  DadosSemanais,
  AtividadeResumo,
  EstadoEstudo,
  EstudoComResultado,
  HistoricoEstadoEntry,
  EstudoCompleto,
  ResultadoCompleto,
  ImagemEstudoInfo,
  EstudoComparacao,
  AvaliacaoComparacao,
  TipoAvaliacao,
} from '../types';

/**
 * Nome do bucket Supabase Storage onde ficam as imagens dos exames.
 * Ajustar se o bucket tiver outro nome no projecto.
 */
const BUCKET_IMAGENS = 'exam-images';

export async function getMetricasDashboard(): Promise<MetricasDashboardMedico> {
  const inicioDaSemana = new Date();
  inicioDaSemana.setDate(inicioDaSemana.getDate() - inicioDaSemana.getDay());
  inicioDaSemana.setHours(0, 0, 0, 0);

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const [
    { count: totalPacientes },
    { count: examesPendentes },
    { count: examesAnalisados },
    { count: relatoriosGerados },
  ] = await Promise.all([
    supabase
      .from('paciente_medico')
      .select('*', { count: 'exact', head: true })
      .is('data_fim', null),
    supabase
      .from('estudos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'PENDING_VALIDATION'),
    supabase
      .from('estudos')
      .select('*', { count: 'exact', head: true })
      .in('estado', ['VALIDATED', 'DIAGNOSED', 'SENT'])
      .gte('data_submissao', inicioDaSemana.toISOString()),
    supabase
      .from('estudos')
      .select('*', { count: 'exact', head: true })
      .not('ficheiro_pdf', 'is', null)
      .gte('data_assinatura', inicioDoMes.toISOString()),
  ]);

  return {
    totalPacientes: totalPacientes ?? 0,
    examesPendentesValidacao: examesPendentes ?? 0,
    examesAnalisadosEstaSemana: examesAnalisados ?? 0,
    relatoriosGeradosEsteMes: relatoriosGerados ?? 0,
  };
}

export async function getEstudosPendentesValidacao(): Promise<EstudoResumo[]> {
  const { data: rows, error } = await supabase
    .from('estudos')
    .select('id, data_submissao, estado, utilizadores!estudos_paciente_id_fkey(nome_completo)')
    .eq('estado', 'PENDING_VALIDATION')
    .order('data_submissao', { ascending: false })
    .limit(10);

  if (error || !rows) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((row) => ({
    id: row.id as string,
    pacienteNome: (row.utilizadores as { nome_completo: string } | null)?.nome_completo ?? '—',
    dataSubmissao: row.data_submissao as string,
    estado: row.estado as EstadoEstudo,
  }));
}

export async function getExamesPorSemana(): Promise<DadosSemanais[]> {
  const oitoSemanasAtras = new Date();
  oitoSemanasAtras.setDate(oitoSemanasAtras.getDate() - 56);

  const { data: rows, error } = await supabase
    .from('estudos')
    .select('data_submissao')
    .gte('data_submissao', oitoSemanasAtras.toISOString())
    .order('data_submissao', { ascending: true });

  if (error || !rows) return semanasFallback();

  const agora = new Date();
  const contagens: number[] = Array(8).fill(0);

  for (const row of rows) {
    const submissao = new Date(row.data_submissao as string);
    const diffDias = Math.floor((agora.getTime() - submissao.getTime()) / (1000 * 60 * 60 * 24));
    const indice = 7 - Math.floor(diffDias / 7);
    if (indice >= 0 && indice <= 7) contagens[indice]++;
  }

  return contagens.map((exames, i) => ({ semana: `S${i + 1}`, exames }));
}

export async function getAtividadeRecente(): Promise<AtividadeResumo[]> {
  const { data: rows, error } = await supabase
    .from('historico_estado')
    .select(`
      id, estado_novo, data_transicao, utilizador_nome,
      estudos!historico_estado_estudo_id_fkey(
        utilizadores!estudos_paciente_id_fkey(nome_completo)
      )
    `)
    .order('data_transicao', { ascending: false })
    .limit(5);

  if (error || !rows) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((row) => ({
    id: row.id as string,
    estadoNovo: row.estado_novo as EstadoEstudo,
    dataTransicao: row.data_transicao as string,
    utilizadorNome: row.utilizador_nome as string,
    pacienteNome: row.estudos?.utilizadores?.nome_completo ?? '—',
  }));
}

function semanasFallback(): DadosSemanais[] {
  return Array.from({ length: 8 }, (_, i) => ({ semana: `S${i + 1}`, exames: 0 }));
}

export async function getEstudosDoPaciente(pacienteId: string): Promise<EstudoComResultado[]> {
  const { data, error } = await supabase
    .from('estudos')
    .select(`
      id, data_estudo, estado, notas_clinicas, ficheiro_pdf,
      resultados(id, angulo_cobb, angulo_cobb_corrigido, grau_curvatura, localizacao_curva, nivel_vertebras)
    `)
    .eq('paciente_id', pacienteId)
    .eq('arquivado', false)
    .order('data_estudo', { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => {
    const resultados = Array.isArray(row.resultados) ? row.resultados : [];
    const r = resultados[0] ?? null;
    return {
      id: row.id as string,
      dataEstudo: row.data_estudo as string,
      estado: row.estado as EstadoEstudo,
      notasClinicas: row.notas_clinicas as string | null,
      ficheiroPdf: row.ficheiro_pdf as string | null,
      resultado: r ? {
        id: r.id as string,
        anguloCobb: r.angulo_cobb as number,
        anguloCobbCorrigido: r.angulo_cobb_corrigido as number | null,
        grauCurvatura: r.grau_curvatura as string,
        localizacaoCurva: r.localizacao_curva as string | null,
        nivelVertebras: r.nivel_vertebras as string | null,
      } : null,
    };
  });
}

export async function getHistoricoEstadoDoPaciente(pacienteId: string): Promise<HistoricoEstadoEntry[]> {
  const { data: exames, error: errExames } = await supabase
    .from('estudos')
    .select('id')
    .eq('paciente_id', pacienteId)
    .eq('arquivado', false);

  if (errExames || !exames || exames.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exameIds = (exames as any[]).map((e) => e.id as string);

  const { data: rows, error } = await supabase
    .from('historico_estado')
    .select('id, utilizador_nome, utilizador_perfil, estado_anterior, estado_novo, data_transicao, observacao')
    .in('estudo_id', exameIds)
    .order('data_transicao', { ascending: false })
    .limit(50);

  if (error || !rows) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((row) => ({
    id: row.id as string,
    dataTransicao: row.data_transicao as string,
    utilizadorNome: row.utilizador_nome as string,
    utilizadorPerfil: row.utilizador_perfil as string,
    estadoAnterior: row.estado_anterior as string | null,
    estadoNovo: row.estado_novo as string,
    observacao: row.observacao as string | null,
  }));
}


// ═══════════════════════════════════════════════════════════════════
// Avaliações de comparação de exames
// ═══════════════════════════════════════════════════════════════════

/**
 * Guarda a avaliação do médico para uma comparação de dois exames.
 * Substitui a avaliação anterior para o mesmo par (A, B) se existir.
 */
export async function guardarAvaliacaoComparacao(
  pacienteId: string,
  estudoAId: string,
  estudoBId: string,
  medicoId: string,
  medicoNome: string,
  tipo: TipoAvaliacao,
  texto: string | null,
  variacaoAngulo: number | null,
): Promise<AvaliacaoComparacao> {
  const { data, error } = await supabase
    .from('avaliacoes_comparacao')
    .insert({
      paciente_id: pacienteId,
      estudo_a_id: estudoAId,
      estudo_b_id: estudoBId,
      medico_id: medicoId,
      medico_nome: medicoNome,
      tipo,
      texto: texto ?? null,
      variacao_angulo: variacaoAngulo ?? null,
    })
    .select('id, medico_nome, tipo, texto, variacao_angulo, data_criacao')
    .single();

  if (error || !data) throw error ?? new Error('Falha ao guardar avaliação.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id as string,
    medicoNome: row.medico_nome as string,
    tipo: row.tipo as TipoAvaliacao,
    texto: (row.texto ?? null) as string | null,
    variacaoAngulo: (row.variacao_angulo ?? null) as number | null,
    dataCriacao: row.data_criacao as string,
  };
}

/**
 * Carrega a avaliação mais recente para um par de exames.
 * Retorna null se ainda não existir avaliação.
 */
export async function getAvaliacaoComparacao(
  estudoAId: string,
  estudoBId: string,
): Promise<AvaliacaoComparacao | null> {
  const { data, error } = await supabase
    .from('avaliacoes_comparacao')
    .select('id, medico_nome, tipo, texto, variacao_angulo, data_criacao')
    .or(
      `and(estudo_a_id.eq.${estudoAId},estudo_b_id.eq.${estudoBId}),` +
      `and(estudo_a_id.eq.${estudoBId},estudo_b_id.eq.${estudoAId})`,
    )
    .order('data_criacao', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id as string,
    medicoNome: row.medico_nome as string,
    tipo: row.tipo as TipoAvaliacao,
    texto: (row.texto ?? null) as string | null,
    variacaoAngulo: (row.variacao_angulo ?? null) as number | null,
    dataCriacao: row.data_criacao as string,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ExamComparisonScreen — exames de um paciente com ângulo e imagem
// ═══════════════════════════════════════════════════════════════════

/**
 * Carrega os exames de um paciente que têm resultado de ângulo de Cobb,
 * ordenados do mais recente para o mais antigo (máx. 10).
 * Para cada exame obtém também a URL assinada da primeira imagem.
 */
export async function getEstudosParaComparacao(pacienteId: string): Promise<EstudoComparacao[]> {
  const { data, error } = await supabase
    .from('estudos')
    .select(`
      id, data_estudo,
      resultados(angulo_cobb, angulo_cobb_corrigido, nivel_vertebras),
      imagens_estudo(caminho_armazenamento)
    `)
    .eq('paciente_id', pacienteId)
    .eq('arquivado', false)
    .order('data_estudo', { ascending: false })
    .limit(10);

  if (error || !data) return [];

  const resultado = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data as any[]).map(async (row) => {
      const resultados = Array.isArray(row.resultados) ? row.resultados : [];
      const r = resultados[0] ?? null;
      if (!r) return null; // sem resultado ML → não mostrar na comparação

      const imagens = Array.isArray(row.imagens_estudo) ? row.imagens_estudo : [];
      const caminho = (imagens[0]?.caminho_armazenamento as string | undefined) ?? null;
      const urlImagem = caminho ? await getUrlImagemEstudo(caminho) : null;

      return {
        id: row.id as string,
        dataEstudo: row.data_estudo as string,
        anguloCobb: ((r.angulo_cobb_corrigido ?? r.angulo_cobb) as number),
        nivelVertebras: (r.nivel_vertebras as string | null) ?? null,
        urlImagem,
      } satisfies EstudoComparacao;
    }),
  );

  return resultado.filter((e): e is EstudoComparacao => e !== null);
}

// ═══════════════════════════════════════════════════════════════════
// ExamViewerScreen — carregar estudo completo + acções de validação
// ═══════════════════════════════════════════════════════════════════

/**
 * Carrega um estudo completo (paciente, resultado ML, imagens) para o ExamViewerScreen.
 * O modelo ML popula a tabela `resultados` via service role / endpoint externo.
 */
export async function getEstudoCompleto(estudoId: string): Promise<EstudoCompleto | null> {
  const { data, error } = await supabase
    .from('estudos')
    .select(`
      id, data_estudo, tipo_estudo, estado, notas_clinicas, ficheiro_pdf,
      hash_documento, assinatura_digital, data_assinatura,
      arquivado, gerado_por_ia,
      utilizadores!estudos_paciente_id_fkey(id, nome_completo),
      resultados(
        id, angulo_cobb, grau_curvatura, localizacao_curva,
        nivel_vertebras, confianca_modelo, versao_modelo, overlay_json,
        decisao, angulo_cobb_corrigido, justificacao_validacao,
        data_validacao, concluido, observacoes_medico
      ),
      imagens_estudo(id, caminho_armazenamento, projecao, formato)
    `)
    .eq('id', estudoId)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const resultados = Array.isArray(row.resultados) ? row.resultados : [];
  const r = resultados[0] ?? null;
  const imagens = Array.isArray(row.imagens_estudo) ? row.imagens_estudo : [];

  const resultado: ResultadoCompleto | null = r
    ? {
        id: r.id as string,
        anguloCobb: r.angulo_cobb as number,
        grauCurvatura: r.grau_curvatura as string,
        localizacaoCurva: r.localizacao_curva as string | null,
        nivelVertebras: r.nivel_vertebras as string | null,
        confiancaModelo: r.confianca_modelo as number,
        versaoModelo: r.versao_modelo as string,
        overlayJson: r.overlay_json,
        decisao: r.decisao as ResultadoCompleto['decisao'],
        anguloCobbCorrigido: r.angulo_cobb_corrigido as number | null,
        justificacaoValidacao: r.justificacao_validacao as string | null,
        dataValidacao: r.data_validacao as string | null,
        concluido: r.concluido as boolean,
        observacoesMedico: r.observacoes_medico as string | null,
      }
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imagensInfo: ImagemEstudoInfo[] = imagens.map((img: any) => ({
    id: img.id as string,
    caminhoArmazenamento: img.caminho_armazenamento as string,
    projecao: img.projecao as string | null,
    formato: img.formato as string,
  }));

  return {
    id: row.id as string,
    pacienteId: (row.utilizadores?.id ?? '') as string,
    pacienteNome: (row.utilizadores?.nome_completo ?? '—') as string,
    dataEstudo: row.data_estudo as string,
    tipoEstudo: row.tipo_estudo as string,
    estado: row.estado as EstadoEstudo,
    notasClinicas: row.notas_clinicas as string | null,
    ficheiroPdf: row.ficheiro_pdf as string | null,
    hashDocumento: row.hash_documento as string | null,
    assinaturaDigital: row.assinatura_digital as string | null,
    dataAssinatura: row.data_assinatura as string | null,
    arquivado: row.arquivado as boolean,
    geradoPorIA: row.gerado_por_ia as boolean,
    resultado,
    imagens: imagensInfo,
  };
}

/**
 * Gera uma URL assinada (válida 1 hora) para uma imagem no Supabase Storage.
 * Devolve null se o ficheiro não existir ou o acesso for negado.
 */
export async function getUrlImagemEstudo(caminhoArmazenamento: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET_IMAGENS)
    .createSignedUrl(caminhoArmazenamento, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

// ─── Helper interno: inserir linha em historico_estado ─────────────────────

async function inserirHistoricoEstado(
  estudoId: string,
  utilizadorId: string,
  utilizadorNome: string,
  utilizadorPerfil: string,
  estadoAnterior: EstadoEstudo,
  estadoNovo: EstadoEstudo,
  observacao?: string,
): Promise<void> {
  const { error } = await supabase.from('historico_estado').insert({
    estudo_id: estudoId,
    utilizador_id: utilizadorId,
    utilizador_nome: utilizadorNome,
    utilizador_perfil: utilizadorPerfil,
    estado_anterior: estadoAnterior,
    estado_novo: estadoNovo,
    observacao: observacao ?? null,
  });
  if (error) throw error;
}

// ─── Acções de validação do médico ────────────────────────────────────────

// ─── Helper interno: notificar paciente ───────────────────────────────────────

async function notificarPaciente(
  pacienteId: string,
  tipo: string,
  titulo: string,
  mensagem: string,
  referenciaEntidade: string,
  referenciaId: string,
): Promise<void> {
  // fire-and-forget — não bloqueia nem propaga erros para o chamador
  supabase.from('notificacoes').insert({
    destinatario_id: pacienteId,
    tipo,
    titulo,
    mensagem,
    referencia_entidade: referenciaEntidade,
    referencia_id: referenciaId,
  }).then(() => {/* silencioso */});
}

/**
 * Médico aceita as métricas calculadas pelo modelo ML sem alterações.
 * Transiciona o estudo para VALIDATED e regista em historico_estado.
 * Notifica o paciente via tabela `notificacoes`.
 */
export async function confirmarMetricasIA(
  resultadoId: string,
  estudoId: string,
  pacienteId: string,
  utilizadorId: string,
  utilizadorNome: string,
  utilizadorPerfil: string,
  estadoAtual: EstadoEstudo,
): Promise<void> {
  const agora = new Date().toISOString();

  const [r1, r2] = await Promise.all([
    supabase
      .from('resultados')
      .update({ decisao: 'ACEITE', data_validacao: agora })
      .eq('id', resultadoId),
    supabase
      .from('estudos')
      .update({ estado: 'VALIDATED' })
      .eq('id', estudoId),
  ]);

  if (r1.error) throw r1.error;
  if (r2.error) throw r2.error;

  await inserirHistoricoEstado(
    estudoId, utilizadorId, utilizadorNome, utilizadorPerfil,
    estadoAtual, 'VALIDATED', 'Métricas IA aceites',
  );

  notificarPaciente(
    pacienteId, 'EXAME',
    'Exame analisado',
    'O seu exame foi analisado e validado pelo médico responsável. Consulte os detalhes na aplicação.',
    'estudos', estudoId,
  );
}

/**
 * Médico corrige o ângulo (e opcionalmente a vértebra) calculados pelo modelo.
 * Transiciona o estudo para VALIDATED e regista em historico_estado.
 * Notifica o paciente via tabela `notificacoes`.
 */
export async function corrigirMetricasIA(
  resultadoId: string,
  estudoId: string,
  pacienteId: string,
  utilizadorId: string,
  utilizadorNome: string,
  utilizadorPerfil: string,
  estadoAtual: EstadoEstudo,
  anguloCorrigido: number,
  vertebraCorrigida: string | null,
  justificacao: string,
): Promise<void> {
  const agora = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    decisao: 'CORRIGIDO',
    angulo_cobb_corrigido: anguloCorrigido,
    justificacao_validacao: justificacao,
    data_validacao: agora,
  };
  if (vertebraCorrigida) updates.nivel_vertebras = vertebraCorrigida;

  const [r1, r2] = await Promise.all([
    supabase.from('resultados').update(updates).eq('id', resultadoId),
    supabase.from('estudos').update({ estado: 'VALIDATED' }).eq('id', estudoId),
  ]);

  if (r1.error) throw r1.error;
  if (r2.error) throw r2.error;

  await inserirHistoricoEstado(
    estudoId, utilizadorId, utilizadorNome, utilizadorPerfil,
    estadoAtual, 'VALIDATED',
    `Métricas corrigidas: ângulo ${anguloCorrigido}°${vertebraCorrigida ? `, vértebra ${vertebraCorrigida}` : ''}`,
  );

  notificarPaciente(
    pacienteId, 'EXAME',
    'Exame analisado',
    'O seu exame foi analisado e validado pelo médico responsável. Consulte os detalhes na aplicação.',
    'estudos', estudoId,
  );
}

/**
 * Guarda as observações do médico visíveis ao paciente na app mobile.
 */
export async function guardarObservacoesMedico(resultadoId: string, observacoes: string): Promise<void> {
  const { error } = await supabase
    .from('resultados')
    .update({ observacoes_medico: observacoes })
    .eq('id', resultadoId);
  if (error) throw error;
}

/**
 * Guarda o path do PDF no Storage em estudos.ficheiro_pdf e notifica o paciente.
 */
export async function guardarFicheiroPdf(
  estudoId: string,
  path: string,
  pacienteId: string,
): Promise<void> {
  const { error } = await supabase
    .from('estudos')
    .update({ ficheiro_pdf: path })
    .eq('id', estudoId);
  if (error) throw error;

  notificarPaciente(
    pacienteId, 'RELATORIO',
    'Novo relatório de exame disponível',
    'O relatório do seu exame foi gerado pelo médico responsável e está disponível para consulta na aplicação.',
    'estudos', estudoId,
  );
}

/**
 * Guarda o path do PDF, o hash SHA-256 e a assinatura digital numa única operação atómica.
 */
export async function guardarAssinaturaDocumento(
  estudoId: string,
  path: string,
  hashDocumento: string,
  assinaturaDigital: string,
  dataAssinatura: string,
): Promise<void> {
  const { error } = await supabase
    .from('estudos')
    .update({
      ficheiro_pdf: path,
      hash_documento: hashDocumento,
      assinatura_digital: assinaturaDigital,
      data_assinatura: dataAssinatura,
    })
    .eq('id', estudoId);
  if (error) throw error;
}

/**
 * Gera URL assinada (válida 7 dias) para um relatório PDF no Storage.
 */
export async function getUrlRelatorioPdf(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('relatorios')
    .createSignedUrl(path, 3600 * 24 * 7);
  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Guarda as notas clínicas do médico para este estudo.
 */
export async function guardarNotasClinicas(estudoId: string, notas: string): Promise<void> {
  const { error } = await supabase
    .from('estudos')
    .update({ notas_clinicas: notas })
    .eq('id', estudoId);
  if (error) throw error;
}

export async function enviarEstudoAoPaciente(estudoId: string, pacienteId: string): Promise<void> {
  const { error } = await supabase
    .from('estudos')
    .update({ estado: 'SENT' })
    .eq('id', estudoId);
  if (error) throw error;

  // Notificar o paciente que o relatório está disponível (fire-and-forget)
  notificarPaciente(
    pacienteId,
    'RELATORIO',
    'Relatório clínico disponível',
    'O seu relatório clínico foi assinado e enviado pelo seu médico.',
    'estudos',
    estudoId,
  );
}

/**
 * Arquiva um estudo (soft-delete). Regista o estado anterior para possível
 * restauro futuro e insere linha em historico_estado.
 */
export async function arquivarEstudoMedico(
  estudoId: string,
  utilizadorId: string,
  utilizadorNome: string,
  utilizadorPerfil: string,
  estadoAtual: EstadoEstudo,
): Promise<void> {
  const agora = new Date().toISOString();

  const { error } = await supabase
    .from('estudos')
    .update({
      arquivado: true,
      estado: 'ARCHIVED',
      estado_anterior_arquivo: estadoAtual,
      data_arquivo: agora,
    })
    .eq('id', estudoId);

  if (error) throw error;

  await inserirHistoricoEstado(
    estudoId, utilizadorId, utilizadorNome, utilizadorPerfil,
    estadoAtual, 'ARCHIVED',
  );
}
