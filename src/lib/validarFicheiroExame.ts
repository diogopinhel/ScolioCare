/**
 * Validação de ficheiros de exame (radiografias) antes do upload.
 *
 * O atributo `accept` do input só filtra o file picker — o drag-and-drop
 * ignora-o por completo, por isso a validação tem de acontecer no handler.
 */

export const EXTENSOES_EXAME = ['.dcm', '.png', '.jpg', '.jpeg'] as const;
export const TAMANHO_MAX_EXAME_MB = 50;

export type ErroFicheiroExame = 'TIPO_INVALIDO' | 'DEMASIADO_GRANDE';

export function validarFicheiroExame(f: File): ErroFicheiroExame | null {
  const nome = f.name.toLowerCase();
  if (!EXTENSOES_EXAME.some((ext) => nome.endsWith(ext))) return 'TIPO_INVALIDO';
  if (f.size > TAMANHO_MAX_EXAME_MB * 1024 * 1024) return 'DEMASIADO_GRANDE';
  return null;
}
