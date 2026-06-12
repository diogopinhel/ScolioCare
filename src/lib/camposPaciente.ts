/**
 * Sanitização dos campos de identificação do paciente, partilhada pelos
 * formulários de edição (médico, técnico e admin) para os formatos não
 * divergirem entre ecrãs.
 */

/** Nº de utente SNS: exatamente 9 dígitos. */
export const sanitizarNumeroUtente = (v: string): string =>
  v.replace(/\D/g, '').slice(0, 9);

/** Cartão de cidadão: alfanumérico maiúsculo (ex: "12345678 9 ZZ4"), máx. 14. */
export const sanitizarCartaoCidadao = (v: string): string =>
  v.toUpperCase().replace(/[^0-9A-Z ]/g, '').slice(0, 14);

/** Contacto telefónico: dígitos, "+" e espaços, máx. 16 (cobre +351 ...). */
export const sanitizarContacto = (v: string): string =>
  v.replace(/[^\d+ ]/g, '').slice(0, 16);

/**
 * Data de hoje em formato YYYY-MM-DD na hora LOCAL — para atributos `max` de
 * inputs date. `toISOString()` daria a data UTC, que perto da meia-noite
 * difere um dia da data local.
 */
export function hojeLocalISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}
