import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  children, 
  disabled,
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[var(--scolio-primary-blue)] text-white hover:bg-[#155A8F] active:bg-[#124B77] disabled:bg-[var(--scolio-primary-blue)]',
    secondary: 'bg-[var(--scolio-page-surface)] text-[var(--scolio-text-primary)] border border-[var(--scolio-border-light)] hover:bg-[#ECEDEF] active:bg-[#E0E2E5]',
    ghost: 'bg-transparent text-[var(--scolio-primary-blue)] hover:bg-[var(--scolio-light-blue-surface)] active:bg-[#D6E7F7]',
    danger: 'bg-[var(--scolio-danger-coral)] text-white hover:bg-[#C24E28] active:bg-[#AB4523] disabled:bg-[var(--scolio-danger-coral)]'
  };

  const radiusStyles = 'rounded-[var(--radius-component)]';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${radiusStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
