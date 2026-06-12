import { supabase } from '../../lib/supabase';
import { registarAcao } from './audit';
import type { MedidaPaciente } from '../types';

/** Histórico de medidas (peso/altura) do paciente, da mais recente para a mais antiga. */
export async function getMedidasPaciente(pacienteId: string): Promise<MedidaPaciente[]> {
  const { data, error } = await supabase
    .from('medidas_paciente')
    .select('id, peso, altura, data_registo, registado_por_nome')
    .eq('paciente_id', pacienteId)
    .order('data_registo', { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id as string,
    peso: Number(row.peso),
    altura: Number(row.altura),
    dataRegisto: row.data_registo as string,
    registadoPorNome: row.registado_por_nome as string,
  }));
}

/** Regista uma nova medição de peso/altura. O valor "atual" passa a ser este registo. */
export async function registarMedidaPaciente(
  pacienteId: string,
  peso: number,
  altura: number,
  registadoPorId: string,
  registadoPorNome: string,
): Promise<MedidaPaciente> {
  const { data, error } = await supabase
    .from('medidas_paciente')
    .insert({
      paciente_id: pacienteId,
      peso,
      altura,
      registado_por: registadoPorId,
      registado_por_nome: registadoPorNome,
    })
    .select('id, peso, altura, data_registo, registado_por_nome')
    .single();

  if (error || !data) throw error ?? new Error('Falha ao registar medidas.');

  registarAcao('REGISTAR_MEDIDAS', 'medidas_paciente', pacienteId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id as string,
    peso: Number(row.peso),
    altura: Number(row.altura),
    dataRegisto: row.data_registo as string,
    registadoPorNome: row.registado_por_nome as string,
  };
}
