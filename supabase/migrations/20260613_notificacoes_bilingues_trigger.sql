CREATE OR REPLACE FUNCTION notify_tecnicos_new_patient()
RETURNS trigger AS $$
DECLARE
  v_tecnico_id UUID;
  v_devia_disparar BOOLEAN;
BEGIN
  IF NEW.perfil <> 'PACIENTE' OR NEW.conta_ativada <> false THEN
    RETURN NEW;
  END IF;

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
    INSERT INTO notificacoes (
      destinatario_id, tipo, titulo, mensagem,
      titulo_en, mensagem_en,
      referencia_entidade, referencia_id
    )
    VALUES (
      v_tecnico_id,
      'PACIENTE',
      'Novo paciente aguarda atribuição',
      'O paciente ' || NEW.nome_completo || ' criou conta e aguarda atribuição de médico.',
      'New patient awaiting assignment',
      'Patient ' || NEW.nome_completo || ' created an account and is awaiting a doctor assignment.',
      'utilizadores',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
