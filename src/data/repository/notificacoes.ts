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
      return `/patients/${id}`;
    case 'glassbreak_log':
      return perfil === 'ADMIN' ? '/admin-panel/audit' : '/patients';
    default:
      return '/';
  }
}
