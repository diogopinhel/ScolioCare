import React from 'react';

export type BadgeStatus = 'pending' | 'analyzed' | 'in-analysis' | 'archived' | 'rejected';

export interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pendente',
      bgColor: 'bg-[var(--scolio-warning-surface)]',
      textColor: 'text-[var(--scolio-warning-amber)]'
    },
    analyzed: {
      label: 'Analisado',
      bgColor: 'bg-[var(--scolio-success-surface)]',
      textColor: 'text-[var(--scolio-success-green)]'
    },
    'in-analysis': {
      label: 'Em análise',
      bgColor: 'bg-[var(--scolio-light-blue-surface)]',
      textColor: 'text-[var(--scolio-primary-blue)]'
    },
    archived: {
      label: 'Arquivado',
      bgColor: 'bg-[var(--scolio-neutral-surface)]',
      textColor: 'text-[var(--scolio-neutral-gray)]'
    },
    rejected: {
      label: 'Rejeitado',
      bgColor: 'bg-[var(--scolio-danger-surface)]',
      textColor: 'text-[var(--scolio-danger-coral)]'
    }
  };

  const config = statusConfig[status] || statusConfig['pending']; // Default to pending if status is invalid

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full ${config.bgColor} ${config.textColor} ${className}`}
      style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
    >
      {config.label}
    </span>
  );
}