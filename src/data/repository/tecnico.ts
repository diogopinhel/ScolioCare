import { supabase } from '../../lib/supabase';
import type {
  EstudoFilaItem,
  MetricasDashboardTecnico,
  PacienteTecnico,
  EstadoEstudo,
  AtividadeResumo,
} from '../types';

const BUCKET_IMAGENS = 'exam-images';

// ═══════════════════════════════════════════════════════════════════
// Dashboard Técnico
// ═══════════════════════════════════════════════════════════════════

export async function getMetricasDashboardTecnico(): Promise<MetricasDashboardTecnico> {
  const hojeInicio = new Date();
  hojeInicio.setHours(0, 0, 0, 0);

  const [
    { count: carregadosHoje },
    { count: emProcessamento },
    { count: prontoValidacao },
    { count: arquivados },
  ] = await Promise.all([
    supabase
      .from('estudos')
      .select('*', { count: 'exact', head: true })
      .gte('data_submissao', hojeInicio.toISOString()),
    supabase
      .from('estudos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'PROCESSING')
      .eq('arquivado', false),
    supabase
      .from('estudos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'PENDING_VALIDATION')
      .eq('arquivado', false),
    supabase
      .from('estudos')
      .select('*', { count: 'exact', head: true })
      .eq('arquivado', true),
  ]);

  return {
    carregadosHoje: carregadosHoje ?? 0,
    emProcessamento: emProcessamento ?? 0,
    prontoValidacao: prontoValidacao ?? 0,
    arquivados: arquivados ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Fila de exames
// ═══════════════════════════════════════════════════════════════════

/**
 * Carrega os estudos para a fila do Técnico.
 * Nota: RLS bloqueia TECNICO de ver rows de MEDICO em utilizadores,
 * por isso medicoNome será null; medicoId fica disponível para referência.
 */
export async function getFilaEstudos(estadoFiltro?: EstadoEstudo): Promise<EstudoFilaItem[]> {
  let query = supabase
    .from('estudos')
    .select(`
      id, estado, data_estudo, data_submissao,
      utilizadores!estudos_paciente_id_fkey(id, nome_completo)
    `)
    .eq('arquivado', false)
    .order('data_submissao', { ascending: false })
    .limit(100);

  if (estadoFiltro) {
    query = query.eq('estado', estadoFiltro);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => {
    const submissao = new Date(row.data_submissao as string);
    const agora = new Date();
    const horasEspera = (agora.getTime() - submissao.getTime()) / (1000 * 60 * 60);

    return {
      id: row.id as string,
      pacienteNome: (row.utilizadores?.nome_completo ?? '—') as string,
      pacienteId: (row.utilizadores?.id ?? '') as string,
      dataSubmissao: row.data_submissao as string,
      dataEstudo: row.data_estudo as string,
      estado: row.estado as EstadoEstudo,
      confiancaModelo: null, // TECNICO não tem acesso a resultados via RLS
      medicoNome: null,      // TECNICO não tem acesso a rows de MEDICO via RLS
      horasEspera: Math.round(horasEspera * 10) / 10,
    };
  });
}

export async function getAtividadeRecenteTecnico(): Promise<AtividadeResumo[]> {
  const { data, error } = await supabase
    .from('historico_estado')
    .select(`
      id, estado_novo, data_transicao, utilizador_nome,
      estudos!historico_estado_estudo_id_fkey(
        utilizadores!estudos_paciente_id_fkey(nome_completo)
      )
    `)
    .order('data_transicao', { ascending: false })
    .limit(8);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id as string,
    estadoNovo: row.estado_novo as EstadoEstudo,
    dataTransicao: row.data_transicao as string,
    utilizadorNome: row.utilizador_nome as string,
    pacienteNome: row.estudos?.utilizadores?.nome_completo ?? '—',
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Arquivar estudo (Técnico)
// ═══════════════════════════════════════════════════════════════════

export async function arquivarEstudoTecnico(
  estudoId: string,
  motivo: string,
  utilizadorId: string,
  utilizadorNome: string,
  estadoAtual: EstadoEstudo,
): Promise<void> {
  const agora = new Date().toISOString();

  const { error: errEstudo } = await supabase
    .from('estudos')
    .update({
      arquivado: true,
      estado: 'ARCHIVED',
      motivo_arquivo: motivo,
      estado_anterior_arquivo: estadoAtual,
      data_arquivo: agora,
    })
    .eq('id', estudoId);

  if (errEstudo) throw errEstudo;

  const { error: errHist } = await supabase.from('historico_estado').insert({
    estudo_id: estudoId,
    utilizador_id: utilizadorId,
    utilizador_nome: utilizadorNome,
    utilizador_perfil: 'TECNICO',
    estado_anterior: estadoAtual,
    estado_novo: 'ARCHIVED',
    observacao: `Arquivado pelo técnico: ${motivo}`,
  });

  if (errHist) throw errHist;
}

// ═══════════════════════════════════════════════════════════════════
// Pacientes (vista operacional)
// ═══════════════════════════════════════════════════════════════════

export async function getPacientesTecnico(): Promise<PacienteTecnico[]> {
  const { data: pacientes, error } = await supabase
    .from('utilizadores')
    .select('id, nome_completo, numero_utente, data_nascimento, genero')
    .eq('perfil', 'PACIENTE')
    .eq('ativo', true)
    .order('nome_completo');

  if (error || !pacientes) return [];

  const ids = pacientes.map((p) => p.id);
  if (ids.length === 0) return [];

  const { data: estudos } = await supabase
    .from('estudos')
    .select('paciente_id, data_estudo')
    .in('paciente_id', ids)
    .eq('arquivado', false)
    .order('data_estudo', { ascending: false });

  const resumoPorPaciente = new Map<string, { total: number; ultimaData: string }>();
  for (const e of (estudos ?? [])) {
    const pid = e.paciente_id as string;
    const existing = resumoPorPaciente.get(pid);
    if (!existing) {
      resumoPorPaciente.set(pid, { total: 1, ultimaData: e.data_estudo as string });
    } else {
      existing.total++;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (pacientes as any[]).map((p) => ({
    id: p.id as string,
    nomeCompleto: p.nome_completo as string,
    numeroUtente: p.numero_utente as string | null,
    dataNascimento: p.data_nascimento as string | null,
    genero: p.genero as string | null,
    totalExames: resumoPorPaciente.get(p.id)?.total ?? 0,
    ultimoExame: resumoPorPaciente.get(p.id)?.ultimaData ?? null,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Upload de exame
// ═══════════════════════════════════════════════════════════════════

/**
 * Obtém o médico responsável de um paciente a partir dos estudos anteriores.
 * Fallback: devolve null se não existir histórico.
 * (TECNICO não tem acesso a paciente_medico via RLS)
 */
export async function getMedicoResponsavelDoPaciente(pacienteId: string): Promise<string | null> {
  const { data } = await supabase
    .from('estudos')
    .select('medico_responsavel_id')
    .eq('paciente_id', pacienteId)
    .eq('arquivado', false)
    .order('data_submissao', { ascending: false })
    .limit(1)
    .single();

  return (data?.medico_responsavel_id as string | null) ?? null;
}

/**
 * Cria um novo estudo e regista a imagem.
 * O upload do ficheiro para Supabase Storage é feito separadamente via uploadImagemEstudo().
 * Devolve o ID do estudo criado.
 */
export async function criarEstudo(
  pacienteId: string,
  medicoResponsavelId: string,
  tecnicoId: string,
  dataEstudo: string,
  tipoEstudo: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('estudos')
    .insert({
      paciente_id: pacienteId,
      medico_responsavel_id: medicoResponsavelId,
      tecnico_id: tecnicoId,
      data_estudo: dataEstudo,
      tipo_estudo: tipoEstudo,
      estado: 'UPLOADED',
    })
    .select('id')
    .single();

  if (error || !data) throw error ?? new Error('Falha ao criar estudo.');
  return data.id as string;
}

/**
 * Faz upload do ficheiro de imagem para Supabase Storage e regista
 * os metadados em imagens_estudo.
 *
 * Bucket: 'exam-images' (configurar em Supabase Storage com políticas adequadas).
 * Path: `{pacienteId}/{estudoId}/{filename}`
 */
export async function uploadImagemEstudo(
  estudoId: string,
  pacienteId: string,
  ficheiro: File,
): Promise<void> {
  const extensao = ficheiro.name.split('.').pop() ?? 'dcm';
  const formato = extensao.toUpperCase();
  const storagePath = `${pacienteId}/${estudoId}/${Date.now()}.${extensao}`;

  // Upload para Supabase Storage
  const { error: errUpload } = await supabase.storage
    .from(BUCKET_IMAGENS)
    .upload(storagePath, ficheiro, { upsert: false });

  if (errUpload) throw errUpload;

  // Calcular hash simples (SHA-256 via Web Crypto API)
  const buffer = await ficheiro.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Registar metadados em imagens_estudo
  const { error: errImg } = await supabase.from('imagens_estudo').insert({
    estudo_id: estudoId,
    formato,
    caminho_armazenamento: storagePath,
    tamanho_bytes: ficheiro.size,
    hash_integridade: hashHex,
    cifrada: true,
  });

  if (errImg) throw errImg;

  // Transicionar estado para PROCESSING (o modelo ML irá processar)
  await supabase
    .from('estudos')
    .update({ estado: 'PROCESSING' })
    .eq('id', estudoId);
}
