-- RPC: get_medicos_dos_pacientes
-- Devolve, para uma lista de IDs de pacientes, o médico responsável ativo
-- (associação em paciente_medico com data_fim IS NULL) e o respetivo nome.
--
-- Usada por TecnicoPatientsScreen / getPacientesTecnico para preencher a
-- coluna "Médico responsável" sem precisar de uma query por paciente.
--
-- SECURITY DEFINER: bypassa RLS de paciente_medico e utilizadores
-- (TECNICO não tem permissão direta para ler rows de MEDICO).
--
-- Aplicar no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION get_medicos_dos_pacientes(p_ids UUID[])
RETURNS TABLE (
  paciente_id UUID,
  medico_id   UUID,
  medico_nome TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      pm.paciente_id,
      pm.medico_id,
      u.nome_completo::TEXT AS medico_nome
    FROM paciente_medico pm
    JOIN utilizadores u ON u.id = pm.medico_id
    WHERE pm.paciente_id = ANY(p_ids)
      AND pm.data_fim IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_medicos_dos_pacientes(UUID[]) TO authenticated;
