/**
 * Mapeia a língua actual do i18n para o locale BCP-47 usado por
 * Date.prototype.toLocale{,Date,Time}String.
 *
 * Uso:
 *   const dateLocale = useDateLocale();
 *   new Date(...).toLocaleDateString(dateLocale, { ... });
 *
 * Para contextos não-React (ex: passar locale a partir de um state de
 * idioma escolhido pelo utilizador, como no ReportGenerationScreen),
 * usar `getDateLocale(lang)`.
 */

import { useTranslation } from 'react-i18next';

export function getDateLocale(language: string | undefined): string {
  return language === 'en' ? 'en-US' : 'pt-PT';
}

export function useDateLocale(): string {
  const { i18n } = useTranslation();
  return getDateLocale(i18n.language);
}
