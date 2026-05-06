import { supabase } from '../../lib/supabase';
import type {
  EstudoResumo,
  MetricasDashboardMedico,
  DadosSemanais,
  AtividadeResumo,
  EstadoEstudo,
  EstudoComResultado,
  HistoricoEstadoEntry,
} from '../types';

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
