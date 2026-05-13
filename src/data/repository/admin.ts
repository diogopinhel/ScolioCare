import { supabase } from '../../lib/supabase';
import type { AuditLogEntry, UtilizadorAdmin, UtilizadorAdminCompleto, MetricasDashboardAdmin } from '../types';

// ═══════════════════════════════════════════════════════════════════
// Dashboard Admin
// ═══════════════════════════════════════════════════════════════════

export async function getMetricasDashboardAdmin(): Promise<MetricasDashboardAdmin> {
  const h24Atras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUtilizadoresAtivos },
    { count: examesUltimas24h },
    { count: glassbreakAtivos },
    { count: alertasSeguranca },
  ] = await Promise.all([
    supabase
      .from('utilizadores')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true),
    supabase
      .from('estudos')
      .select('*', { count: 'exact', head: true })
      .gte('data_submissao', h24Atras),
    supabase
      .from('glassbreak_log')
      .select('*', { count: 'exact', head: true })
      .is('encerrado_em', null)
      .gt('data_expiracao', new Date().toISOString()),
    supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('data_hora', h24Atras),
  ]);

  return {
    totalUtilizadoresAtivos: totalUtilizadoresAtivos ?? 0,
    examesUltimas24h: examesUltimas24h ?? 0,
    glassbreakAtivos: glassbreakAtivos ?? 0,
    alertasSeguranca: alertasSeguranca ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Audit Log
// ═══════════════════════════════════════════════════════════════════

export async function getAuditLog(
  pesquisa?: string,
  limite = 100,
): Promise<AuditLogEntry[]> {
  let query = supabase
    .from('audit_log')
    .select('id, utilizador_snapshot, tipo_acao, entidade_afetada, entidade_id, data_hora')
    .order('data_hora', { ascending: false })
    .limit(limite);

  if (pesquisa) {
    query = query.or(
      `tipo_acao.ilike.%${pesquisa}%,entidade_afetada.ilike.%${pesquisa}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id as string,
    utilizadorSnapshot: row.utilizador_snapshot as AuditLogEntry['utilizadorSnapshot'],
    tipoAcao: row.tipo_acao as string,
    entidadeAfetada: row.entidade_afetada as string,
    entidadeId: row.entidade_id as string | null,
    dataHora: row.data_hora as string,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Utilizadores (Admin)
// ═══════════════════════════════════════════════════════════════════

export async function getUtilizadoresAdmin(): Promise<UtilizadorAdmin[]> {
  const { data, error } = await supabase
    .from('utilizadores')
    .select(
      'id, nome_completo, perfil, ativo, conta_bloqueada, two_factor_ativo, ultimo_login, data_criacao',
    )
    .order('data_criacao', { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id as string,
    nomeCompleto: row.nome_completo as string,
    perfil: row.perfil as string,
    ativo: row.ativo as boolean,
    contaBloqueada: row.conta_bloqueada as boolean,
    twoFactorAtivo: row.two_factor_ativo as boolean,
    ultimoLogin: row.ultimo_login as string | null,
    dataCriacao: row.data_criacao as string,
  }));
}

export async function toggleAtivoUtilizador(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase
    .from('utilizadores')
    .update({ ativo })
    .eq('id', id);
  if (error) throw error;
}

export async function getUtilizadorCompleto(id: string): Promise<UtilizadorAdminCompleto | null> {
  const { data, error } = await supabase
    .from('utilizadores')
    .select(`id, nome_completo, perfil, ativo, conta_bloqueada, two_factor_ativo, ultimo_login,
             data_criacao, cedula_profissional, especialidade, codigo_funcionario, departamento,
             data_nascimento, genero, numero_utente, contacto, morada, cartao_cidadao`)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = data as any;
  return {
    id: r.id,
    nomeCompleto: r.nome_completo,
    perfil: r.perfil,
    ativo: r.ativo,
    contaBloqueada: r.conta_bloqueada,
    twoFactorAtivo: r.two_factor_ativo,
    ultimoLogin: r.ultimo_login,
    dataCriacao: r.data_criacao,
    cedulaProfissional: r.cedula_profissional,
    especialidade: r.especialidade,
    codigoFuncionario: r.codigo_funcionario,
    departamento: r.departamento,
    dataNascimento: r.data_nascimento,
    genero: r.genero,
    numeroUtente: r.numero_utente,
    contacto: r.contacto,
    morada: r.morada,
    cartaoCidadao: r.cartao_cidadao,
  };
}

export interface CamposEdicaoUtilizador {
  nomeCompleto: string;
  // MEDICO
  cedulaProfissional?: string;
  especialidade?: string;
  // TECNICO
  codigoFuncionario?: string;
  departamento?: string;
  // PACIENTE
  dataNascimento?: string;
  genero?: string;
  numeroUtente?: string;
  contacto?: string;
  morada?: string;
  cartaoCidadao?: string;
}

export async function editarUtilizadorAdmin(id: string, perfil: string, campos: CamposEdicaoUtilizador): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dados: Record<string, any> = {
    nome_completo: campos.nomeCompleto.trim(),
  };

  if (perfil === 'MEDICO') {
    dados.cedula_profissional = campos.cedulaProfissional?.trim() ?? null;
    dados.especialidade       = campos.especialidade?.trim() ?? null;
  } else if (perfil === 'TECNICO') {
    dados.codigo_funcionario = campos.codigoFuncionario?.trim() ?? null;
    dados.departamento       = campos.departamento?.trim() ?? null;
  } else if (perfil === 'PACIENTE') {
    dados.data_nascimento = campos.dataNascimento ?? null;
    dados.genero          = campos.genero ?? null;
    dados.numero_utente   = campos.numeroUtente?.trim() ?? null;
    dados.contacto        = campos.contacto?.trim() ?? null;
    dados.morada          = campos.morada?.trim() ?? null;
    dados.cartao_cidadao  = campos.cartaoCidadao?.trim() ?? null;
  }

  const { error } = await supabase.from('utilizadores').update(dados).eq('id', id);
  if (error) throw error;
}

export async function toggleBloqueioUtilizador(id: string, contaBloqueada: boolean): Promise<void> {
  const { error } = await supabase
    .from('utilizadores')
    .update({ conta_bloqueada: contaBloqueada })
    .eq('id', id);
  if (error) throw error;
}

export interface UsoSemanalDia {
  dia: string;   // 'Seg', 'Ter', …
  medico: number;
  tecnico: number;
  admin: number;
}

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export async function getUsoPorPerfil(): Promise<UsoSemanalDia[]> {
  const { data } = await supabase.rpc('get_uso_semanal');
  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    dia: DIAS_PT[new Date(row.data + 'T00:00:00').getDay()],
    medico: Number(row.medico),
    tecnico: Number(row.tecnico),
    admin: Number(row.admin_count),
  }));
}

export interface DadosCriarUtilizador {
  perfil: 'MEDICO' | 'TECNICO' | 'ADMIN';
  nomeCompleto: string;
  email: string;
  password: string;
  // MEDICO
  cedulaProfissional?: string;
  especialidade?: string;
  // TECNICO
  codigoFuncionario?: string;
  departamento?: string;
}

export async function criarUtilizador(dados: DadosCriarUtilizador): Promise<{ id: string }> {
  const { data, error } = await supabase.functions.invoke('criar-utilizador', { body: dados });

  if (error) throw new Error(error.message);
  if (data?.erro) throw new Error(data.erro);
  return data as { id: string };
}
