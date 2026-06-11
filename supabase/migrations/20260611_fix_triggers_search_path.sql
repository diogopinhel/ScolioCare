-- Fix do search_path nas funções SECURITY DEFINER de notificação.
--
-- Sintoma: ao chamar `auth.admin.createUser` (ou `auth.signUp`) com o role
-- `supabase_auth_admin`, o INSERT em auth.users dispara `handle_new_user`,
-- que por sua vez faz INSERT em `public.utilizadores`. Esse INSERT acorda o
-- trigger `notify_tecnicos_new_patient`, que tenta `SELECT id FROM utilizadores`
-- (sem schema). Como o search_path no contexto `supabase_auth_admin` não
-- inclui `public`, o SELECT falha com 42P01 ("relation does not exist") e o
-- erro propaga até ao Auth API, que devolve a mensagem genérica
-- "Database error creating new user".
--
-- Fix:
--   1. Fixar `search_path = public, pg_temp` na definição das funções
--      SECURITY DEFINER (boa prática geral além de resolver este bug).
--   2. Qualificar referências a tabelas com `public.` por defesa em
--      profundidade.
--
-- Aplicar no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.notify_tecnicos_new_patient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tecnico_id UUID;
  v_devia_disparar BOOLEAN;
BEGIN
  -- Estado atual qualifica como "paciente pendente"?
  IF NEW.perfil <> 'PACIENTE' OR NEW.conta_ativada <> false THEN
    RETURN NEW;
  END IF;

  -- Anti-duplicado: em INSERT dispara sempre; em UPDATE só quando a transição
  -- para o estado pendente é nova (estava noutro perfil OU tinha conta ativa).
  IF TG_OP = 'INSERT' THEN
    v_devia_disparar := true;
  ELSE
    v_devia_disparar :=
      OLD.perfil IS DISTINCT FROM 'PACIENTE'
      OR OLD.conta_ativada IS DISTINCT FROM false;
  END IF;

  IF NOT v_devia_disparar THEN
    RETURN NEW;
  END IF;

  FOR v_tecnico_id IN
    SELECT id FROM public.utilizadores WHERE perfil = 'TECNICO' AND ativo = true
  LOOP
    INSERT INTO public.notificacoes (destinatario_id, tipo, titulo, mensagem, referencia_entidade, referencia_id)
    VALUES (
      v_tecnico_id,
      'PACIENTE',
      'Novo paciente aguarda atribuição',
      'O paciente ' || NEW.nome_completo || ' criou conta e aguarda atribuição de médico.',
      'utilizadores',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION public.marcar_notificacoes_paciente_lidas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.perfil = 'PACIENTE'
     AND OLD.conta_ativada = false
     AND NEW.conta_ativada = true THEN
    UPDATE public.notificacoes
    SET data_leitura = NOW()
    WHERE tipo = 'PACIENTE'
      AND referencia_entidade = 'utilizadores'
      AND referencia_id = NEW.id
      AND data_leitura IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
