-- registar_acao: passa a aceitar `detalhe` (jsonb) opcional, para enriquecer o
-- audit_log com contexto (ex.: ângulo corrigido, peso/altura, campos alterados).
--
-- Substitui a versão de 3 argumentos por uma de 4 (p_detalhe DEFAULT NULL). As
-- chamadas existentes com 3 argumentos continuam a resolver para esta função
-- pelo default, por isso nada parte. O cliente só inclui p_detalhe quando há
-- detalhe a registar.
--
-- Aplicar no Supabase SQL Editor.

DROP FUNCTION IF EXISTS public.registar_acao(text, text, uuid);

CREATE OR REPLACE FUNCTION public.registar_acao(
  p_tipo_acao        text,
  p_entidade_afetada text,
  p_entidade_id      uuid  DEFAULT NULL,
  p_detalhe          jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.audit_log (utilizador_snapshot, tipo_acao, entidade_afetada, entidade_id, detalhe, data_hora)
  SELECT
    jsonb_build_object('nome', u.nome_completo, 'perfil', u.perfil),
    p_tipo_acao,
    p_entidade_afetada,
    p_entidade_id,
    p_detalhe,
    NOW()
  FROM public.utilizadores u
  WHERE u.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.registar_acao(text, text, uuid, jsonb) TO authenticated;
