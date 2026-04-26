import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ progress, label = 'AI analysis in progress', showLabel = true, className = '' }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={`${className}`}>
      {showLabel && label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)' }}>
            {label}
          </span>
          <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-body)' }}>
            {clampedProgress}%
          </span>
        </div>
      )}
      
      <div className="w-full h-2 bg-[var(--scolio-neutral-surface)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--scolio-primary-blue)] transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
