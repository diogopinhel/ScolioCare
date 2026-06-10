import { supabase } from '../../lib/supabase';

export type TipoNotificacao =
  | 'EXAME'
  | 'GLASS_BREAK'
  | 'PACIENTE'
  | 'RELATORIO'
  | 'SISTEMA';

export interface NotificacaoItem {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  dataEnvio: string;         // ISO datetime
  lida: boolean;             // data_leitura IS NOT NULL
  referenciaEntidade: string | null;
  referenciaId: string | null;
}

/**
 * Insere uma notificação para um destinatário específico.
 * Fire-and-forget — erros são silenciosos para não interromper o fluxo principal.
 */
export async function criarNotificacao(params: {
  destinatarioId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  referenciaEntidade?: string;
  referenciaId?: string;
}): Promise<void> {
  await supabase.from('notificacoes').insert({
    destinatario_id:    params.destinatarioId,
    tipo:               params.tipo,
    titulo:             params.titulo,
    mensagem:           params.mensagem,
    referencia_entidade: params.referenciaEntidade ?? null,
    referencia_id:      params.referenciaId ?? null,
  });
}

/**
 * Carrega as notificações do utilizador autenticado.
 * A RLS da tabela `notificacoes` filtra automaticamente por destinatario_id.
 */
export async function getNotificacoesUtilizador(): Promise<NotificacaoItem[]> {
  const { data, error } = await supabase
    .from('notificacoes')
    .select('id, tipo, titulo, mensagem, data_envio, data_leitura, referencia_entidade, referencia_id')
    .order('data_envio', { ascending: false })
    .limit(30);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id as string,
    tipo: (row.tipo ?? 'SISTEMA') as TipoNotificacao,
    titulo: row.titulo as string,
    mensagem: row.mensagem as string,
    dataEnvio: row.data_envio as string,
    lida: row.data_leitura !== null,
    referenciaEntidade: (row.referencia_entidade ?? null) as string | null,
    referenciaId: (row.referencia_id ?? null) as string | null,
  }));
}

/** Marca uma notificação como lida. */
export async function marcarComoLida(id: string): Promise<void> {
  await supabase
    .from('notificacoes')
    .update({ data_leitura: new Date().toISOString() })
    .eq('id', id)
    .is('data_leitura', null); // só atualiza se ainda não foi lida
}

/** Marca todas as notificações não lidas do utilizador como lidas. */
export async function marcarTodasComoLidas(): Promise<void> {
  await supabase
    .from('notificacoes')
    .update({ data_leitura: new Date().toISOString() })
    .is('data_leitura', null);
}

/**
 * Resolve o link de navegação a partir da entidade e ID referenciados.
 * Extende aqui quando surgirem novos tipos de referência.
 */
export function resolverLink(
  entidade: string | null,
  id: string | null,
  perfil: string,
): string {
  if (!entidade || !id) return '/';
  switch (entidade) {
    case 'estudos':
      return perfil === 'TECNICO' ? '/tecnico/queue' : `/exam-viewer/${id}`;
    case 'utilizadores':
      if (perfil === 'TECNICO') return '/tecnico/patients?tab=pendentes';
      if (perfil === 'ADMIN') return '/admin-panel/users';
      return `/patients/${id}`;
    case 'glassbreak_log':
      return perfil === 'ADMIN' ? '/admin-panel/audit' : '/patients';
    default:
      return '/';
  }
}

/**
 * Marca como lidas todas as notificações do utilizador autenticado que
 * apontam para um paciente específico. Usado quando o técnico atribui o
 * médico — a notificação de "Novo paciente pendente" deixa de fazer sentido.
 *
 * RLS limita o UPDATE ao destinatario_id do próprio utilizador, por isso
 * apenas o técnico que atribuiu o médico vê a notificação ser limpa.
 * Para limpar para todos os técnicos é necessário trigger na BD
 * (ver supabase/migrations).
 */
export async function marcarNotificacoesPacienteComoLidas(pacienteId: string): Promise<void> {
  await supabase
    .from('notificacoes')
    .update({ data_leitura: new Date().toISOString() })
    .eq('tipo', 'PACIENTE')
    .eq('referencia_entidade', 'utilizadores')
    .eq('referencia_id', pacienteId)
    .is('data_leitura', null);
}
