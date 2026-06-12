-- Sincroniza utilizadores.peso/altura com o registo mais recente de
-- medidas_paciente.
--
-- A app mobile lê utilizadores.peso/altura para mostrar o peso/altura ao
-- paciente (colunas já existentes, antigamente preenchidas pelo próprio
-- paciente). Agora é o médico que regista estes valores via web, em
-- medidas_paciente (histórico completo, append-only). Este trigger mantém
-- utilizadores.peso/altura como espelho do registo mais recente, sem
-- necessidade de alterações na app mobile. Mesmas unidades em ambas as
-- tabelas (kg e cm).
--
-- Aplicar no Supabase SQL Editor (depois de 20260612_medidas_paciente.sql).

CREATE OR REPLACE FUNCTION sincronizar_medidas_utilizador()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE utilizadores
  SET peso = NEW.peso, altura = NEW.altura
  WHERE id = NEW.paciente_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_medidas_paciente_sync_utilizador
  AFTER INSERT ON medidas_paciente
  FOR EACH ROW EXECUTE FUNCTION sincronizar_medidas_utilizador();
