import React from 'react';
import { useTranslation } from 'react-i18next';

export type BadgeStatus = 'pending' | 'analyzed' | 'in-analysis' | 'archived' | 'rejected';

export interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

const STATUS_STYLES: Record<BadgeStatus, { i18nKey: string; bgColor: string; textColor: string }> = {
  'pending':     { i18nKey: 'status.pending',    bgColor: 'bg-[var(--scolio-warning-surface)]',    textColor: 'text-[var(--scolio-warning-amber)]'  },
  'analyzed':    { i18nKey: 'status.analyzed',   bgColor: 'bg-[var(--scolio-success-surface)]',    textColor: 'text-[var(--scolio-success-green)]'  },
  'in-analysis': { i18nKey: 'status.inAnalysis', bgColor: 'bg-[var(--scolio-light-blue-surface)]', textColor: 'text-[var(--scolio-primary-blue)]'   },
  'archived':    { i18nKey: 'status.archived',   bgColor: 'bg-[var(--scolio-neutral-surface)]',    textColor: 'text-[var(--scolio-neutral-gray)]'   },
  'rejected':    { i18nKey: 'status.rejected',   bgColor: 'bg-[var(--scolio-danger-surface)]',     textColor: 'text-[var(--scolio-danger-coral)]'   },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_STYLES[status] ?? STATUS_STYLES['pending'];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full ${config.bgColor} ${config.textColor} ${className}`}
      style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
    >
      {t(config.i18nKey)}
    </span>
  );
}
