import React from 'react';
import { Search, Calendar } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
          {label}
        </label>
      )}
      <input
        className={`px-3 py-2 border border-[var(--scolio-border-light)] rounded-[var(--radius-component)] 
          focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent
          disabled:bg-[var(--scolio-neutral-surface)] disabled:cursor-not-allowed
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

export function SearchBar({ placeholder = "Search...", className = '', ...props }: Omit<InputProps, 'label'>) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)]" />
      <input
        type="search"
        placeholder={placeholder}
        className={`pl-10 pr-3 py-2 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]
          focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent
          ${className}`}
        {...props}
      />
    </div>
  );
}

export function DatePicker({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          className={`pl-3 pr-10 py-2 w-full border border-[var(--scolio-border-light)] rounded-[var(--radius-component)]
            focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)] focus:border-transparent
            ${className}`}
          {...props}
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--scolio-neutral-gray)] pointer-events-none" />
      </div>
    </div>
  );
}
