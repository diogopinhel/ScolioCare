import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

export default function LanguageSwitcher() {
  const { i18n: i18nInstance } = useTranslation();

  const toggleLanguage = () => {
    const next = i18nInstance.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(next);
    localStorage.setItem('scolio-lang', next);
  };

  const label = i18nInstance.language === 'pt' ? 'PT' : 'EN';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-[var(--scolio-text-secondary)] hover:text-[var(--scolio-text-primary)] transition-colors"
    >
      <Globe className="w-5 h-5" />
      <span style={{ fontSize: 'var(--text-body)' }}>{label}</span>
      <ChevronDown className="w-4 h-4" />
    </button>
  );
}
