-- Trigger: notificar paciente nas transições de estado do exame
--
-- Substitui as chamadas client-side a criarNotificacao() em tecnico.ts e
-- estudos.ts para estas três transições, que falhavam silenciosamente devido
-- a RLS (cliente autenticado não pode inserir notificações para outro user).
-- SECURITY DEFINER bypassa a RLS tal como fazem os restantes triggers e as
-- Edge Functions que usam o service role key.
--
-- Transições cobertas:
--   INSERT com estado = 'UPLOADED'                 → "Novo exame registado"
--   UPDATE * → PENDING_VALIDATION                  → "Exame em análise" (LLM concluído, aguarda médico)
--   UPDATE * → SENT                                → "Resultado disponível"
--
-- Aplicar no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION notify_paciente_estado_exame()
RETURNS trigger AS $$
DECLARE
  v_paciente_id UUID;
  v_estudo_id   UUID;
BEGIN
  v_paciente_id := COALESCE(NEW.paciente_id, OLD.paciente_id);
  v_estudo_id   := NEW.id;

  -- INSERT: exame carregado (UPLOADED)
  IF TG_OP = 'INSERT' AND NEW.estado = 'UPLOADED' THEN
    INSERT INTO notificacoes (
      destinatario_id, tipo, titulo, mensagem,
      titulo_en, mensagem_en,
      referencia_entidade, referencia_id
    ) VALUES (
      v_paciente_id,
      'EXAME',
      'Novo exame registado',
      'O seu exame foi carregado na plataforma e será analisado em breve.',
      'New exam registered',
      'Your exam has been uploaded to the platform and will be analysed shortly.',
      'estudos',
      v_estudo_id
    );

  -- UPDATE: LLM concluiu e exame aguarda validação do médico (* → PENDING_VALIDATION)
  ELSIF TG_OP = 'UPDATE'
    AND OLD.estado <> 'PENDING_VALIDATION'
    AND NEW.estado = 'PENDING_VALIDATION' THEN
    INSERT INTO notificacoes (
      destinatario_id, tipo, titulo, mensagem,
      titulo_en, mensagem_en,
      referencia_entidade, referencia_id
    ) VALUES (
      v_paciente_id,
      'EXAME',
      'Exame em análise',
      'O seu exame está a ser analisado pelo médico responsável.',
      'Exam under analysis',
      'Your exam is being reviewed by your doctor.',
      'estudos',
      v_estudo_id
    );

  -- UPDATE: médico enviou ao paciente (* → SENT)
  ELSIF TG_OP = 'UPDATE'
    AND OLD.estado <> 'SENT'
    AND NEW.estado = 'SENT' THEN
    INSERT INTO notificacoes (
      destinatario_id, tipo, titulo, mensagem,
      titulo_en, mensagem_en,
      referencia_entidade, referencia_id
    ) VALUES (
      v_paciente_id,
      'RELATORIO',
      'Resultado disponível',
      'O seu exame foi analisado e os resultados foram disponibilizados pelo seu médico.',
      'Results available',
      'Your exam has been reviewed and the results have been made available by your doctor.',
      'estudos',
      v_estudo_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_estudo_estado_notificar_paciente ON estudos;
CREATE TRIGGER on_estudo_estado_notificar_paciente
  AFTER INSERT OR UPDATE OF estado ON estudos
  FOR EACH ROW EXECUTE FUNCTION notify_paciente_estado_exame();
