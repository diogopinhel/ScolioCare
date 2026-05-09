import React from 'react';
import { ShieldOff, ArrowLeft, Mail, Home } from 'lucide-react';
import { Button } from '../../components/scolio';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function Error403Screen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--scolio-page-surface)] p-8">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-[var(--scolio-danger-surface)] flex items-center justify-center">
            <ShieldOff className="w-12 h-12 text-[var(--scolio-danger-coral)]" />
          </div>
        </div>

        {/* Error Code */}
        <div>
          <p
            className="text-[var(--scolio-danger-coral)] font-semibold mb-2"
            style={{ fontSize: '64px', lineHeight: 1 }}
          >
            403
          </p>
          <h1 className="text-[var(--scolio-text-primary)] mb-3">{t('errors.error403Title')}</h1>
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            {t('errors.error403Desc')}
          </p>
        </div>

        {/* Role info */}
        <div className="bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-card)] p-5 text-left space-y-3">
          <p className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-body)' }}>
            {t('errors.errorDetails')}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                {t('errors.yourProfile')}
              </span>
              <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                {t('errors.profileTechnician')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                {t('errors.requiredProfile')}
              </span>
              <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                {t('errors.profileAdmin')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
                {t('errors.requestedResource')}
              </span>
              <span className="text-[var(--scolio-text-primary)] font-medium" style={{ fontSize: 'var(--text-caption)' }}>
                /admin
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            {t('common.homeDash')}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.backPrev')}
          </Button>
          <button
            className="flex items-center justify-center gap-2 w-full text-[var(--scolio-primary-blue)] hover:underline"
            style={{ fontSize: 'var(--text-body)' }}
          >
            <Mail className="w-4 h-4" />
            {t('common.contactAdmin')}
          </button>
        </div>

        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
          {t('errors.error403Note')}
        </p>
      </div>
    </div>
  );
}
