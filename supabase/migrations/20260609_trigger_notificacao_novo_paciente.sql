-- Trigger: notificar todos os técnicos ativos quando um novo paciente se regista
-- com conta_ativada = false (registo próprio via app mobile).
--
-- Pré-requisito: tabela `notificacoes` deve existir com as colunas:
--   destinatario_id UUID, tipo TEXT, titulo TEXT, mensagem TEXT,
--   referencia_entidade TEXT, referencia_id UUID
--
-- Aplicar no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION notify_tecnicos_new_patient()
RETURNS trigger AS $$
DECLARE
  v_tecnico_id UUID;
BEGIN
  IF NEW.perfil = 'PACIENTE' AND NEW.conta_ativada = false THEN
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_patient_registration
  AFTER INSERT ON utilizadores
  FOR EACH ROW EXECUTE FUNCTION notify_tecnicos_new_patient();
