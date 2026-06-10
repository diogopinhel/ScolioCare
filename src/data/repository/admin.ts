import { supabase } from '../../lib/supabase';
import { registarAcao } from './audit';
import type { AuditLogEntry, UtilizadorAdmin, UtilizadorAdminCompleto, MetricasDashboardAdmin, SystemSettings, RgpdPedido, EstadoRgpdPedido } from '../types';

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
  registarAcao(ativo ? 'ATIVAR_UTILIZADOR' : 'DESATIVAR_UTILIZADOR', 'utilizadores', id);
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
  // Edição de PACIENTE já é logada pela Edge Function atualizar-paciente,
  // por isso só registamos para MEDICO/TECNICO/ADMIN.
  if (perfil !== 'PACIENTE') {
    registarAcao('EDITAR_UTILIZADOR', 'utilizadores', id);
  }
}

export async function toggleBloqueioUtilizador(id: string, contaBloqueada: boolean): Promise<void> {
  const { error } = await supabase
    .from('utilizadores')
    .update({ conta_bloqueada: contaBloqueada })
    .eq('id', id);
  if (error) throw error;
  registarAcao(contaBloqueada ? 'BLOQUEAR_UTILIZADOR' : 'DESBLOQUEAR_UTILIZADOR', 'utilizadores', id);
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

// ═══════════════════════════════════════════════════════════════════
// Métricas IA
// ═══════════════════════════════════════════════════════════════════

export interface MetricasIA {
  totalAnalises: number;
  analisesValidadas: number;   // decisao IS NOT NULL
  analisesAceites: number;     // decisao = 'ACEITE'
  analisesCorrigidas: number;  // decisao = 'CORRIGIDO'
  confiancaMedia: number;      // avg confianca_modelo (0–1)
  tempoMedioMs: number;        // avg tempo_processamento_ms
  versaoAtiva: string;         // versao_modelo da análise mais recente
  distribuicaoGrau: { grau: string; contagem: number }[];
}

export async function getMetricasIA(): Promise<MetricasIA> {
  const { data } = await supabase
    .from('resultados')
    .select('versao_modelo, grau_curvatura, decisao, confianca_modelo, tempo_processamento_ms')
    .order('data_processamento', { ascending: false });

  if (!data || data.length === 0) {
    return {
      totalAnalises: 0,
      analisesValidadas: 0,
      analisesAceites: 0,
      analisesCorrigidas: 0,
      confiancaMedia: 0,
      tempoMedioMs: 0,
      versaoAtiva: '—',
      distribuicaoGrau: [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[];
  const analisesValidadas  = rows.filter((r) => r.decisao != null).length;
  const analisesAceites    = rows.filter((r) => r.decisao === 'ACEITE').length;
  const analisesCorrigidas = rows.filter((r) => r.decisao === 'CORRIGIDO').length;

  const confiancaMedia = rows.reduce((s, r) => s + Number(r.confianca_modelo ?? 0), 0) / rows.length;
  const tempoMedioMs   = rows.reduce((s, r) => s + Number(r.tempo_processamento_ms ?? 0), 0) / rows.length;
  const versaoAtiva    = rows[0]?.versao_modelo ?? '—';

  const grauMap: Record<string, number> = {};
  for (const r of rows) {
    const g = r.grau_curvatura ?? 'DESCONHECIDO';
    grauMap[g] = (grauMap[g] ?? 0) + 1;
  }
  const distribuicaoGrau = Object.entries(grauMap).map(([grau, contagem]) => ({ grau, contagem }));

  return {
    totalAnalises: rows.length,
    analisesValidadas,
    analisesAceites,
    analisesCorrigidas,
    confiancaMedia,
    tempoMedioMs,
    versaoAtiva,
    distribuicaoGrau,
  };
}

// ═══════════════════════════════════════════════════════════════════
// System Settings
// ═══════════════════════════════════════════════════════════════════

const DEFAULTS: SystemSettings = {
  instituicao: '', nif: '', rgpdContact: '',
  timeoutSessao: 30, tentativasLogin: 5, minPasswordLength: 12, validadePassword: 90,
  force2faMedico: true, force2faTecnico: true, force2faAdmin: true,
  modoManutencao: false, backupSchedule: '0 3 * * *', backupRetencao: 30,
};

function rowsToSettings(rows: { chave: string; valor: string | null }[]): SystemSettings {
  const m = Object.fromEntries(rows.map((r) => [r.chave, r.valor ?? '']));
  return {
    instituicao:        m.instituicao        ?? DEFAULTS.instituicao,
    nif:                m.nif               ?? DEFAULTS.nif,
    rgpdContact:        m.rgpd_contact      ?? DEFAULTS.rgpdContact,
    timeoutSessao:      Number(m.timeout_sessao)      || DEFAULTS.timeoutSessao,
    tentativasLogin:    Number(m.tentativas_login)    || DEFAULTS.tentativasLogin,
    minPasswordLength:  Number(m.min_password_length) || DEFAULTS.minPasswordLength,
    validadePassword:   Number(m.validade_password)   || DEFAULTS.validadePassword,
    force2faMedico:     m.force_2fa_medico  !== 'false',
    force2faTecnico:    m.force_2fa_tecnico !== 'false',
    force2faAdmin:      m.force_2fa_admin   !== 'false',
    modoManutencao:     m.modo_manutencao   === 'true',
    backupSchedule:     m.backup_schedule   ?? DEFAULTS.backupSchedule,
    backupRetencao:     Number(m.backup_retencao)     || DEFAULTS.backupRetencao,
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('chave, valor');
  if (error || !data) return { ...DEFAULTS };
  return rowsToSettings(data as { chave: string; valor: string | null }[]);
}

export async function saveSystemSettings(s: SystemSettings): Promise<void> {
  const rows = [
    { chave: 'instituicao',         valor: s.instituicao },
    { chave: 'nif',                 valor: s.nif },
    { chave: 'rgpd_contact',        valor: s.rgpdContact },
    { chave: 'timeout_sessao',      valor: String(s.timeoutSessao) },
    { chave: 'tentativas_login',    valor: String(s.tentativasLogin) },
    { chave: 'min_password_length', valor: String(s.minPasswordLength) },
    { chave: 'validade_password',   valor: String(s.validadePassword) },
    { chave: 'force_2fa_medico',    valor: String(s.force2faMedico) },
    { chave: 'force_2fa_tecnico',   valor: String(s.force2faTecnico) },
    { chave: 'force_2fa_admin',     valor: String(s.force2faAdmin) },
    { chave: 'modo_manutencao',     valor: String(s.modoManutencao) },
    { chave: 'backup_schedule',     valor: s.backupSchedule },
    { chave: 'backup_retencao',     valor: String(s.backupRetencao) },
  ];
  const { error } = await supabase
    .from('system_settings')
    .upsert(rows, { onConflict: 'chave' });
  if (error) throw error;
  registarAcao('EDITAR_SETTINGS', 'system_settings', null);
}

// ═══════════════════════════════════════════════════════════════════
// RGPD Pedidos
// ═══════════════════════════════════════════════════════════════════

export async function getRgpdPedidos(estado?: EstadoRgpdPedido): Promise<RgpdPedido[]> {
  let query = supabase
    .from('rgpd_pedidos')
    .select(`id, paciente_id, tipo, estado, descricao, notas_admin, tratado_por,
             data_pedido, data_resolucao,
             utilizadores!rgpd_pedidos_paciente_id_fkey(nome_completo)`)
    .order('data_pedido', { ascending: false });

  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query;
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => ({
    id: r.id as string,
    pacienteId: r.paciente_id as string,
    pacienteNome: (r.utilizadores?.nome_completo ?? '—') as string,
    tipo: r.tipo as RgpdPedido['tipo'],
    estado: r.estado as RgpdPedido['estado'],
    descricao: r.descricao as string | null,
    notasAdmin: r.notas_admin as string | null,
    tratadoPor: r.tratado_por as string | null,
    dataPedido: r.data_pedido as string,
    dataResolucao: r.data_resolucao as string | null,
    prazo: new Date(new Date(r.data_pedido).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export async function atualizarRgpdPedido(
  id: string,
  estado: EstadoRgpdPedido,
  notasAdmin?: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const update: Record<string, unknown> = {
    estado,
    tratado_por: user?.id ?? null,
    notas_admin: notasAdmin ?? null,
  };
  if (estado === 'CONCLUIDO' || estado === 'REJEITADO') {
    update.data_resolucao = new Date().toISOString();
  }
  const { error } = await supabase.from('rgpd_pedidos').update(update).eq('id', id);
  if (error) throw error;
  registarAcao('ATUALIZAR_PEDIDO_RGPD', 'rgpd_pedidos', id);
}
