-- Glass-break: terminar sessão antes dos 15 min + resumo de ações
--
-- (1) encerrar_glassbreak(p_paciente_id): marca encerrado_em = now() na sessão
--     ativa do médico autenticado para aquele paciente. Só altera encerrado_em,
--     por isso passa o trigger de imutabilidade `fn_glassbreak_proteger` (que
--     permite exatamente esse campo). SECURITY DEFINER porque o médico não tem
--     UPDATE direto via RLS.
--
-- (2) get_resumo_glassbreak(p_paciente_id): devolve um JSON com os metadados da
--     última sessão do médico para o paciente + a lista de ações que o médico
--     fez durante a janela (de data_inicio até encerrado_em/data_expiracao).
--     As ações vêm do audit_log filtradas pelo nome no snapshot (registar_acao
--     não grava utilizador_id) + janela temporal. Exclui o próprio GLASS_BREAK.
--
-- Aplicar no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION encerrar_glassbreak(p_paciente_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE glassbreak_log
  SET encerrado_em = now()
  WHERE medico_id = auth.uid()
    AND paciente_id = p_paciente_id
    AND encerrado_em IS NULL
    AND data_expiracao > now();
$$;

GRANT EXECUTE ON FUNCTION encerrar_glassbreak(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION get_resumo_glassbreak(p_paciente_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH sessao AS (
    SELECT g.*
    FROM glassbreak_log g
    WHERE g.medico_id = auth.uid()
      AND g.paciente_id = p_paciente_id
    ORDER BY g.data_inicio DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'pacienteNome',          u.nome_completo,
    'motivoCategoria',       s.motivo_categoria,
    'justificacao',          s.justificacao,
    'dataInicio',            s.data_inicio,
    'dataFim',               COALESCE(s.encerrado_em, s.data_expiracao),
    'encerradoManualmente',  (s.encerrado_em IS NOT NULL),
    'acoes', COALESCE((
      SELECT jsonb_agg(
               jsonb_build_object(
                 'dataHora',        a.data_hora,
                 'tipoAcao',        a.tipo_acao,
                 'entidadeAfetada', a.entidade_afetada
               ) ORDER BY a.data_hora
             )
      FROM audit_log a
      WHERE a.utilizador_snapshot->>'nome' = (SELECT nome_completo FROM utilizadores WHERE id = auth.uid())
        AND a.data_hora >= s.data_inicio
        AND a.data_hora <= COALESCE(s.encerrado_em, s.data_expiracao)
        AND a.tipo_acao <> 'GLASS_BREAK'
    ), '[]'::jsonb)
  )
  FROM sessao s
  JOIN utilizadores u ON u.id = s.paciente_id;
$$;

GRANT EXECUTE ON FUNCTION get_resumo_glassbreak(uuid) TO authenticated;
