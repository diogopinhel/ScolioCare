import React from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export function Toast({ type, title, message, onClose, className = '' }: ToastProps) {
  const config = {
    info: {
      Icon: Info,
      bgColor: 'bg-[var(--scolio-light-blue-surface)]',
      borderColor: 'border-[var(--scolio-primary-blue)]',
      iconColor: 'text-[var(--scolio-primary-blue)]'
    },
    success: {
      Icon: CheckCircle2,
      bgColor: 'bg-[var(--scolio-success-surface)]',
      borderColor: 'border-[var(--scolio-success-green)]',
      iconColor: 'text-[var(--scolio-success-green)]'
    },
    warning: {
      Icon: AlertTriangle,
      bgColor: 'bg-[var(--scolio-warning-surface)]',
      borderColor: 'border-[var(--scolio-warning-amber)]',
      iconColor: 'text-[var(--scolio-warning-amber)]'
    },
    error: {
      Icon: XCircle,
      bgColor: 'bg-[var(--scolio-danger-surface)]',
      borderColor: 'border-[var(--scolio-danger-coral)]',
      iconColor: 'text-[var(--scolio-danger-coral)]'
    }
  };

  const { Icon, bgColor, borderColor, iconColor } = config[type];

  return (
    <div 
      className={`flex items-start gap-3 p-4 ${bgColor} border-l-4 ${borderColor} rounded-[var(--radius-component)] 
        shadow-[var(--shadow-md)] min-w-[320px] max-w-[480px] ${className}`}
    >
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      
      <div className="flex-1 min-w-0">
        <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', marginBottom: message ? '4px' : '0' }}>
          {title}
        </p>
        {message && (
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            {message}
          </p>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-[var(--scolio-neutral-gray)] hover:text-[var(--scolio-text-primary)] transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
