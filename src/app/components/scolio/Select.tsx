import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full px-3 py-2 pr-10 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]
            focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent
            disabled:bg-[var(--scolio-neutral-surface)] disabled:cursor-not-allowed appearance-none
            ${error ? 'border-[var(--scolio-danger-coral)]' : ''} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
      </div>
      {error && (
        <span className="text-[var(--scolio-danger-coral)]" style={{ fontSize: 'var(--text-caption)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
