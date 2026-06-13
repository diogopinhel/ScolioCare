import { supabase } from '../../lib/supabase';
import { invocarEdgeFunction } from './edge';
import type {
  PacienteResumo,
  PacienteListagem,
  PacienteDetalhe,
  EstadoEstudo,
  DadosAtualizacaoPaciente,
  MedicoResumo,
  NotaPaciente,
} from '../types';

/**
 * Devolve todos os pacientes associados ao médico autenticado (paciente_medico.data_fim IS NULL),
 * com contagem de exames e estado do exame mais recente agregados em TypeScript (2 queries).
 */
export async function getPacientesListagem(): Promise<PacienteListagem[]> {
  const { data: associacoes, error: errAssoc } = await supabase
    .from('paciente_medico')
    .select(`
      data_associacao,
      utilizadores!paciente_medico_paciente_id_fkey(
        id, nome_completo, numero_utente, data_nascimento, genero
      )
    `)
    .is('data_fim', null)
    .order('data_associacao', { ascending: false });

  if (errAssoc || !associacoes) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pacientes = (associacoes as any[])
    .filter((a) => a.utilizadores)
    .map((a) => a.utilizadores as {
      id: string;
      nome_completo: string;
      numero_utente: string | null;
      data_nascimento: string | null;
      genero: string | null;
    });

  if (pacientes.length === 0) return [];

  // Buscar exames destes pacientes numa única query
  const ids = pacientes.map((p) => p.id);
  const { data: estudos } = await supabase
    .from('estudos')
    .select('paciente_id, estado, data_estudo')
    .in('paciente_id', ids)
    .eq('arquivado', false)
    .order('data_estudo', { ascending: false });

  // Agregar em TypeScript: percorre exames já ordenados por data desc,
  // por isso o primeiro encontrado por paciente é o mais recente.
  const resumoPorPaciente = new Map<string, { total: number; ultimoEstado: EstadoEstudo; ultimaData: string }>();
  for (const e of (estudos ?? [])) {
    const pid = e.paciente_id as string;
    const existing = resumoPorPaciente.get(pid);
    if (!existing) {
      resumoPorPaciente.set(pid, {
        total: 1,
        ultimoEstado: e.estado as EstadoEstudo,
        ultimaData: e.data_estudo as string,
      });
    } else {
      existing.total++;
    }
  }

  return pacientes.map((p) => ({
    id: p.id,
    nomeCompleto: p.nome_completo,
    numeroUtente: p.numero_utente ?? '—',
    dataNascimento: p.data_nascimento ?? null,
    genero: p.genero ?? null,
    totalExames: resumoPorPaciente.get(p.id)?.total ?? 0,
    ultimoExame: resumoPorPaciente.get(p.id)?.ultimaData ?? null,
    estadoUltimoExame: resumoPorPaciente.get(p.id)?.ultimoEstado ?? null,
  }));
}

export async function getPaciente(id: string): Promise<PacienteDetalhe | null> {
  const { data, error } = await supabase
    .from('utilizadores')
    .select('id, nome_completo, data_nascimento, genero, numero_utente, contacto, morada, cartao_cidadao')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id as string,
    nomeCompleto: row.nome_completo as string,
    dataNascimento: row.data_nascimento as string | null,
    genero: row.genero as string | null,
    numeroUtente: row.numero_utente as string | null,
    contacto: row.contacto as string | null,
    morada: row.morada as string | null,
    cartaoCidadao: row.cartao_cidadao as string | null,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Notas clínicas gerais por paciente
// ═══════════════════════════════════════════════════════════════════

/** Carrega todas as notas do paciente, da mais recente para a mais antiga. */
export async function getNotasDoPaciente(pacienteId: string): Promise<NotaPaciente[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('notas_paciente')
    .select('id, medico_id, medico_nome, conteudo, data_criacao')
    .eq('paciente_id', pacienteId)
    .order('data_criacao', { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id as string,
    medicoNome: row.medico_nome as string,
    conteudo: row.conteudo as string,
    dataCriacao: row.data_criacao as string,
    eMinhaAutoria: row.medico_id === user?.id,
  }));
}

/** Cria uma nova nota para o paciente e devolve o registo criado. */
export async function criarNotaPaciente(
  pacienteId: string,
  conteudo: string,
  medicoId: string,
  medicoNome: string,
): Promise<NotaPaciente> {
  const { data, error } = await supabase
    .from('notas_paciente')
    .insert({
      paciente_id: pacienteId,
      medico_id: medicoId,
      medico_nome: medicoNome,
      conteudo: conteudo.trim(),
    })
    .select('id, medico_id, medico_nome, conteudo, data_criacao')
    .single();

  if (error || !data) throw error ?? new Error('Falha ao guardar nota.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id as string,
    medicoNome: row.medico_nome as string,
    conteudo: row.conteudo as string,
    dataCriacao: row.data_criacao as string,
    eMinhaAutoria: true,
  };
}

/** Apaga uma nota. Só funciona se o autor for o médico autenticado (RLS). */
export async function apagarNotaPaciente(notaId: string): Promise<void> {
  const { error } = await supabase
    .from('notas_paciente')
    .delete()
    .eq('id', notaId);

  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════
// Pesquisa global de pacientes (acesso de emergência / glass-break)
// ═══════════════════════════════════════════════════════════════════

export interface PacienteResultadoGlobal {
  id: string;
  nomeCompleto: string;
  numeroUtente: string | null;
  dataNascimento: string | null;
  genero: string | null;
}

/**
 * Pesquisa todos os pacientes activos pelo nome ou número de utente.
 * Usado exclusivamente no fluxo de acesso de emergência (glass-break).
 * Requer que a RLS de `utilizadores` permita MEDICO ler rows de PACIENTE.
 */
/**
 * Pesquisa pacientes activos por nome ou número de utente via RPC SECURITY DEFINER.
 * Query directa a `utilizadores` bloqueada por RLS para MEDICOs — esta função
 * bypassa RLS tal como `get_medicos_ativos()` faz para TECNICOs.
 */
export async function pesquisarPacientesGlobal(query: string): Promise<PacienteResultadoGlobal[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const { data, error } = await supabase.rpc('pesquisar_pacientes_global', { q });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id as string,
    nomeCompleto: row.nome_completo as string,
    numeroUtente: (row.numero_utente ?? null) as string | null,
    dataNascimento: (row.data_nascimento ?? null) as string | null,
    genero: (row.genero ?? null) as string | null,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Sessões glass-break ativas (banner global de acesso de emergência)
// ═══════════════════════════════════════════════════════════════════

export interface SessaoGlassBreak {
  pacienteId: string;
  pacienteNome: string;
  dataExpiracao: string; // ISO (timestamptz)
}

/**
 * Sessões de acesso de emergência (glass-break) ativas do médico autenticado.
 * Via RPC SECURITY DEFINER `get_sessoes_glassbreak_ativas` — o médico não lê
 * `glassbreak_log` diretamente. Alimenta o banner global no Layout do médico,
 * que mostra o tempo restante até `data_expiracao` em todos os ecrãs.
 */
export async function getSessoesGlassBreakAtivas(): Promise<SessaoGlassBreak[]> {
  const { data, error } = await supabase.rpc('get_sessoes_glassbreak_ativas');

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    pacienteId: row.paciente_id as string,
    pacienteNome: row.paciente_nome as string,
    dataExpiracao: row.data_expiracao as string,
  }));
}

export interface AcaoResumoGlassBreak {
  dataHora: string;
  tipoAcao: string;
  entidadeAfetada: string;
}

export interface ResumoGlassBreak {
  pacienteNome: string;
  motivoCategoria: string;
  justificacao: string;
  dataInicio: string;
  dataFim: string;
  encerradoManualmente: boolean;
  acoes: AcaoResumoGlassBreak[];
}

/**
 * Termina (encerra) a sessão glass-break ativa do médico para o paciente, antes
 * dos 15 min. Via RPC SECURITY DEFINER `encerrar_glassbreak` — só escreve
 * `encerrado_em`, o único campo que o trigger de imutabilidade permite alterar.
 */
export async function encerrarGlassBreak(pacienteId: string): Promise<void> {
  await supabase.rpc('encerrar_glassbreak', { p_paciente_id: pacienteId });
}

/**
 * Resumo da última sessão glass-break do médico para o paciente: metadados +
 * lista de ações feitas durante a janela. Mostrado no modal quando a sessão
 * termina (manualmente ou por expiração). Via RPC `get_resumo_glassbreak`.
 */
export async function getResumoGlassBreak(pacienteId: string): Promise<ResumoGlassBreak | null> {
  const { data, error } = await supabase.rpc('get_resumo_glassbreak', { p_paciente_id: pacienteId });

  if (error || !data) return null;

  return data as ResumoGlassBreak;
}

// ═══════════════════════════════════════════════════════════════════
// Lista de médicos (para dropdown no formulário de novo paciente)
// ═══════════════════════════════════════════════════════════════════

export async function getMedicos(): Promise<MedicoResumo[]> {
  const { data, error } = await supabase.rpc('get_medicos_ativos');

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id as string,
    nomeCompleto: row.nome_completo as string,
    especialidade: (row.especialidade ?? '') as string,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Criação de paciente via Edge Function (service_role)
// ═══════════════════════════════════════════════════════════════════

/**
 * Atualiza os dados editáveis de um paciente via Edge Function (service_role).
 * A Edge Function verifica que o MEDICO está associado ao paciente antes de
 * permitir a atualização.
 */
export async function atualizarPaciente(dados: DadosAtualizacaoPaciente): Promise<void> {
  await invocarEdgeFunction('atualizar-paciente', dados);
}

/**
 * Atribui (ou re-atribui) o médico responsável de um paciente.
 * Invoca a Edge Function `alterar-medico-paciente` que:
 *  - encerra a associação ativa anterior (se existir)
 *  - cria nova linha em paciente_medico
 *  - ativa conta_ativada=true se ainda não estava
 *  - regista em audit_log
 */
export async function alterarMedicoPaciente(pacienteId: string, novoMedicoId: string): Promise<void> {
  await invocarEdgeFunction('alterar-medico-paciente', { pacienteId, novoMedicoId });
}

export async function getPacientesAssociados(): Promise<PacienteResumo[]> {
  const { data: rows, error } = await supabase
    .from('paciente_medico')
    .select('data_associacao, utilizadores!paciente_medico_paciente_id_fkey(id, nome_completo, numero_utente)')
    .is('data_fim', null)
    .order('data_associacao', { ascending: false })
    .limit(10);

  if (error || !rows) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[])
    .filter((row) => row.utilizadores)
    .map((row) => ({
      id: row.utilizadores.id as string,
      nomeCompleto: row.utilizadores.nome_completo as string,
      numeroUtente: (row.utilizadores.numero_utente ?? '—') as string,
      dataAssociacao: row.data_associacao as string,
    }));
}
