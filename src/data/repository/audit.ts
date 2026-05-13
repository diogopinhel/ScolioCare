import { supabase } from '../../lib/supabase';

/**
 * Regista uma acção no audit_log via a função `registar_acao` (SECURITY DEFINER).
 *
 * Fire-and-forget — qualquer erro é silencioso para não bloquear a acção principal.
 * Os campos `nome` e `perfil` são preenchidos automaticamente pela função SQL.
 */
export function registarAcao(
  tipoAcao: string,
  entidadeAfetada: string,
  entidadeId?: string | null,
): void {
  supabase.rpc('registar_acao', {
    p_tipo_acao: tipoAcao,
    p_entidade_afetada: entidadeAfetada,
    p_entidade_id: entidadeId ?? null,
  }).then(() => undefined, () => undefined);
}
