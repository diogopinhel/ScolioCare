-- Robustez das notificações de pacientes pendentes
--
-- (1) Corrige notify_tecnicos_new_patient para disparar também em UPDATE.
--     Razão: no fluxo de auto-registo via Supabase Auth a linha em
--     `utilizadores` é normalmente criada por um trigger de auth com
--     perfil/conta_ativada nulos ou default, e só depois a mobile app faz
--     UPDATE para definir perfil='PACIENTE' e conta_ativada=false. O
--     trigger original só corria AFTER INSERT e por isso falhava silenciosamente.
--
-- (2) Novo trigger marcar_notificacoes_paciente_lidas: quando o paciente
--     é ativado (conta_ativada false → true, normalmente porque o técnico
--     atribuiu médico), marca todas as notificações "novo paciente pendente"
--     referentes a esse paciente como lidas — para TODOS os técnicos. Isto
--     evita badges fantasma após a atribuição.
--
-- Aplicar no Supabase SQL Editor.

-- ─── 1. Reabrir o trigger para INSERT e UPDATE ─────────────────────────────
CREATE OR REPLACE FUNCTION notify_tecnicos_new_patient()
RETURNS trigger AS $$
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
    SELECT id FROM utilizadores WHERE perfil = 'TECNICO' AND ativo = true
  LOOP
    INSERT INTO notificacoes (destinatario_id, tipo, titulo, mensagem, referencia_entidade, referencia_id)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger para incluir UPDATE dos campos relevantes
DROP TRIGGER IF EXISTS on_new_patient_registration ON utilizadores;
CREATE TRIGGER on_new_patient_registration
  AFTER INSERT OR UPDATE OF perfil, conta_ativada ON utilizadores
  FOR EACH ROW EXECUTE FUNCTION notify_tecnicos_new_patient();


-- ─── 2. Limpar notificações quando o paciente é ativado ────────────────────
CREATE OR REPLACE FUNCTION marcar_notificacoes_paciente_lidas()
RETURNS trigger AS $$
BEGIN
  IF NEW.perfil = 'PACIENTE'
     AND OLD.conta_ativada = false
     AND NEW.conta_ativada = true THEN
    UPDATE notificacoes
    SET data_leitura = NOW()
    WHERE tipo = 'PACIENTE'
      AND referencia_entidade = 'utilizadores'
      AND referencia_id = NEW.id
      AND data_leitura IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_paciente_activated_mark_notifications_read ON utilizadores;
CREATE TRIGGER on_paciente_activated_mark_notifications_read
  AFTER UPDATE OF conta_ativada ON utilizadores
  FOR EACH ROW EXECUTE FUNCTION marcar_notificacoes_paciente_lidas();
