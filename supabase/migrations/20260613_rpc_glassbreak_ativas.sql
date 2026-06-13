-- RPC: sessões glass-break ativas do médico autenticado
--
-- Alimenta o banner global de acesso de emergência (Layout do médico). O
-- médico não tem SELECT direto em glassbreak_log (lido apenas pelo admin),
-- por isso esta função SECURITY DEFINER devolve só as SUAS próprias sessões
-- ativas, já com o nome real do paciente (glassbreak_log.paciente_nome é
-- gravado como '—' no momento da confirmação).
--
-- "Ativa" = mesma definição do dashboard admin: encerrado_em IS NULL e ainda
-- dentro da janela (data_expiracao > now()). DISTINCT ON evita duplicar o
-- banner quando há vários glass-breaks sobrepostos para o mesmo paciente.
--
-- Aplicar no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION get_sessoes_glassbreak_ativas()
RETURNS TABLE (
  paciente_id    uuid,
  paciente_nome  text,
  data_expiracao timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT DISTINCT ON (g.paciente_id)
         g.paciente_id,
         u.nome_completo,
         g.data_expiracao
  FROM glassbreak_log g
  JOIN utilizadores u ON u.id = g.paciente_id
  WHERE g.medico_id = auth.uid()
    AND g.encerrado_em IS NULL
    AND g.data_expiracao > now()
  ORDER BY g.paciente_id, g.data_expiracao DESC;
$$;

GRANT EXECUTE ON FUNCTION get_sessoes_glassbreak_ativas() TO authenticated;
