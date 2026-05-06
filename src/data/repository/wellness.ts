import { supabase } from '../../lib/supabase';
import type { WellnessLogEntry } from '../types';

export async function getWellnessLogDoPaciente(pacienteId: string): Promise<WellnessLogEntry[]> {
  const { data, error } = await supabase
    .from('wellness_log')
    .select('id, data_registo, nivel_dor, desconforto, notas')
    .eq('paciente_id', pacienteId)
    .order('data_registo', { ascending: false })
    .limit(20);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id as string,
    dataRegisto: row.data_registo as string,
    nivelDor: row.nivel_dor as number,
    desconforto: row.desconforto as string | null,
    notas: row.notas as string | null,
  }));
}
