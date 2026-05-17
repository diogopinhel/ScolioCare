import React from 'react';
import { useTranslation } from 'react-i18next';

export interface CobbAngleGaugeProps {
  angle: number;
  size?: number;
  className?: string;
}

export function CobbAngleGauge({ angle, size = 200, className = '' }: CobbAngleGaugeProps) {
  const { t } = useTranslation();

  // Color and severity based on standard clinical thresholds for Cobb angle:
  //   <10°   Sem escoliose  (verde)
  //   10-24° Leve           (amarelo)
  //   25-39° Moderada       (laranja)
  //   >=40°  Grave          (vermelho)
  const getColor = (angle: number) => {
    if (angle < 10) return 'var(--scolio-success-green)';
    if (angle < 25) return 'var(--scolio-warning-amber)';
    if (angle < 40) return '#E8843C';
    return 'var(--scolio-danger-coral)';
  };

  const getSeverity = (angle: number): string => {
    if (angle < 10) return t('severity.none');
    if (angle < 25) return t('severity.mild');
    if (angle < 40) return t('severity.moderate');
    return t('severity.severe');
  };

  const color = getColor(angle);
  const severity = getSeverity(angle);
  
  // Calculate arc percentage (max angle is 50° for display purposes)
  const maxAngle = 50;
  const percentage = Math.min(angle / maxAngle, 1);
  
  // SVG circle parameters
  const strokeWidth = 12;
  const radius = (size / 2) - (strokeWidth * 2);
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference * (1 - percentage);

  // Altura do SVG: apenas o suficiente para o arco com round caps
  // (centro do arco em y = size/2, raio do stroke em strokeWidth/2)
  const svgHeight = size / 2 + strokeWidth / 2;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* Arco (semicírculo) */}
      <svg width={size} height={svgHeight} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${strokeWidth * 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth * 2} ${size / 2}`}
          fill="none"
          stroke="var(--scolio-neutral-surface)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth * 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth * 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>

      {/* Texto por baixo do arco (próximo, sem sobreposição) */}
      <div className="flex flex-col items-center" style={{ marginTop: '-6px' }}>
        <p style={{ fontSize: `${size * 0.22}px`, fontWeight: 'var(--weight-semibold)', lineHeight: '1', color }}>
          {angle}°
        </p>
        <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', marginTop: '2px' }}>
          {severity}
        </p>
      </div>

      {/* Escala */}
      <div className="flex justify-between w-full mt-2 px-2" style={{ maxWidth: size }}>
        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>0°</span>
        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>25°</span>
        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>50°+</span>
      </div>
    </div>
  );
}
