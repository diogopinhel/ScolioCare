import React from 'react';
import { SearchX, ArrowLeft, Home, Users, FileText } from 'lucide-react';
import { Button } from '../../components/scolio';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function Error404Screen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--scolio-page-surface)] p-8">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-[var(--scolio-light-blue-surface)] flex items-center justify-center">
            <SearchX className="w-12 h-12 text-[var(--scolio-primary-blue)]" />
          </div>
        </div>

        {/* Error Code */}
        <div>
          <p
            className="text-[var(--scolio-primary-blue)] font-semibold mb-2"
            style={{ fontSize: '64px', lineHeight: 1 }}
          >
            404
          </p>
          <h1 className="text-[var(--scolio-text-primary)] mb-3">{t('errors.error404Title')}</h1>
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            {t('errors.error404Desc')}
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-card)] p-4 space-y-2 text-left">
          <p className="text-[var(--scolio-text-secondary)] mb-3" style={{ fontSize: 'var(--text-caption)' }}>
            {t('errors.suggestedPages')}
          </p>
          {[
            { icon: Home, label: t('errors.dashboard'), path: '/' },
            { icon: Users, label: t('errors.patientList'), path: '/patients' },
            { icon: FileText, label: t('errors.generateReport'), path: '/report-generation' },
          ].map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 w-full p-3 rounded-[var(--radius-component)] hover:bg-[var(--scolio-page-surface)] transition-colors text-left"
            >
              <Icon className="w-5 h-5 text-[var(--scolio-primary-blue)]" />
              <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)' }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.backPrev')}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            {t('common.home')}
          </Button>
        </div>

        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
          {t('common.errorCode')}
        </p>
      </div>
    </div>
  );
}
