import { supabase } from '../../lib/supabase';

/**
 * Regista uma acção no audit_log via a função `registar_acao` (SECURITY DEFINER).
 *
 * Fire-and-forget — qualquer erro é silencioso para não bloquear a acção principal.
 * Os campos `nome` e `perfil` são preenchidos automaticamente pela função SQL.
 *
 * `detalhe` (opcional) é gravado na coluna jsonb `audit_log.detalhe` e mostrado
 * no modal de detalhes do AdminAuditScreen. Só é enviado quando existe — assim
 * as chamadas simples continuam a funcionar mesmo que a migração que adiciona
 * `p_detalhe` ainda não esteja aplicada.
 */
export function registarAcao(
  tipoAcao: string,
  entidadeAfetada: string,
  entidadeId?: string | null,
  detalhe?: Record<string, unknown> | null,
): void {
  const base = {
    p_tipo_acao: tipoAcao,
    p_entidade_afetada: entidadeAfetada,
    p_entidade_id: entidadeId ?? null,
  };
  const semDetalhe = () => supabase.rpc('registar_acao', base).then(() => undefined, () => undefined);

  if (detalhe == null) {
    semDetalhe();
    return;
  }

  // Com detalhe. Se a função em produção ainda não aceitar p_detalhe (migração
  // por aplicar), repete sem detalhe para não perder o registo de auditoria.
  supabase.rpc('registar_acao', { ...base, p_detalhe: detalhe }).then(
    ({ error }) => { if (error) semDetalhe(); },
    () => { semDetalhe(); },
  );
}
