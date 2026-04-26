import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
          {label}
        </label>
      )}
      <textarea
        className={`px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]
          focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent
          disabled:bg-[var(--scolio-neutral-surface)] disabled:cursor-not-allowed resize-y min-h-[100px]
          ${error ? 'border-[var(--scolio-danger-coral)]' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-caption)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
