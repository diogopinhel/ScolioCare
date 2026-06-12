-- Tabela medidas_paciente: histórico de peso/altura do paciente, registado
-- pelo médico (o utente é pesado/medido na consulta e o médico introduz os
-- valores na plataforma).
--
-- "Valor atual" = registo mais recente (data_registo DESC) — não há colunas
-- peso/altura em utilizadores, evita duplicação/sincronização. O histórico
-- completo fica disponível para consulta.
--
-- Append-only, tal como historico_estado: UPDATE/DELETE bloqueados por trigger.
--
-- Aplicar no Supabase SQL Editor.

CREATE TABLE medidas_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  peso NUMERIC(5,2) NOT NULL CHECK (peso > 0),
  altura NUMERIC(5,1) NOT NULL CHECK (altura > 0),
  data_registo TIMESTAMPTZ NOT NULL DEFAULT now(),
  registado_por UUID REFERENCES utilizadores(id) ON DELETE SET NULL,
  registado_por_nome TEXT NOT NULL
);

CREATE INDEX idx_medidas_paciente_paciente_id ON medidas_paciente (paciente_id, data_registo DESC);

ALTER TABLE medidas_paciente ENABLE ROW LEVEL SECURITY;

-- MEDICO: ler e registar medidas dos pacientes a que tem acesso
-- (associação activa ou janela de glass-break) — mesma função usada nas
-- restantes tabelas clínicas.
CREATE POLICY medidas_paciente_medico_select ON medidas_paciente
  FOR SELECT
  USING (medico_tem_acesso_a_paciente(paciente_id));

CREATE POLICY medidas_paciente_medico_insert ON medidas_paciente
  FOR INSERT
  WITH CHECK (medico_tem_acesso_a_paciente(paciente_id) AND registado_por = auth.uid());

-- PACIENTE: ler as suas próprias medidas (app mobile)
CREATE POLICY medidas_paciente_paciente_select ON medidas_paciente
  FOR SELECT
  USING (auth.uid() = paciente_id);

-- Append-only: bloquear UPDATE/DELETE
CREATE OR REPLACE FUNCTION bloquear_alteracao_medidas_paciente()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'medidas_paciente é append-only — UPDATE/DELETE não permitidos';
END;
$$;

CREATE TRIGGER trg_medidas_paciente_bloquear_update
  BEFORE UPDATE ON medidas_paciente
  FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao_medidas_paciente();

CREATE TRIGGER trg_medidas_paciente_bloquear_delete
  BEFORE DELETE ON medidas_paciente
  FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao_medidas_paciente();
