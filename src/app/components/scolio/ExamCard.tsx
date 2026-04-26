import React from 'react';
import { StatusBadge, BadgeStatus } from './StatusBadge';

export interface ExamCardProps {
  imageSrc?: string;
  date: string;
  cobbAngle: number;
  apicalVertebra?: string;
  status: BadgeStatus;
  className?: string;
  onClick?: () => void;
}

export function ExamCard({ imageSrc, date, cobbAngle, apicalVertebra, status, className = '', onClick }: ExamCardProps) {
  return (
    <div 
      className={`bg-white border border-[var(--scolio-border-light)] rounded-[var(--radius-card)] 
        hover:shadow-[var(--shadow-md)] transition-shadow duration-200 cursor-pointer overflow-hidden ${className}`}
      onClick={onClick}
    >
      {/* Image thumbnail */}
      <div className="aspect-[4/3] bg-[var(--scolio-neutral-surface)] overflow-hidden">
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={`Exame de ${date}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            Sem pré-visualização
          </div>
        )}
      </div>
      
      {/* Exam info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            {date}
          </p>
          <StatusBadge status={status} />
        </div>
        
        <div className="flex items-baseline gap-1">
          <span className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--weight-semibold)' }}>
            {cobbAngle}°
          </span>
          <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
            Ângulo de Cobb
          </span>
        </div>

        {apicalVertebra && (
          <p className="text-[var(--scolio-text-secondary)] mt-1" style={{ fontSize: 'var(--text-caption)' }}>
            Vértebra apical: <span className="text-[var(--scolio-text-primary)]">{apicalVertebra}</span>
          </p>
        )}
      </div>
    </div>
  );
}
