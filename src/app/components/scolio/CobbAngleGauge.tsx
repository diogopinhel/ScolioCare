import React from 'react';

export interface CobbAngleGaugeProps {
  angle: number;
  size?: number;
  className?: string;
}

export function CobbAngleGauge({ angle, size = 200, className = '' }: CobbAngleGaugeProps) {
  // Color based on angle ranges
  const getColor = (angle: number) => {
    if (angle < 10) return 'var(--scolio-success-green)';
    if (angle < 25) return 'var(--scolio-warning-amber)';
    if (angle < 40) return '#E8843C'; // orange between amber and red
    return 'var(--scolio-danger-coral)';
  };

  const getSeverity = (angle: number) => {
    if (angle < 10) return 'Mild';
    if (angle < 25) return 'Moderate';
    if (angle < 40) return 'Severe';
    return 'Very severe';
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

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} className="overflow-visible">
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
        
        {/* Center text */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <p style={{ fontSize: `${size * 0.25}px`, fontWeight: 'var(--weight-semibold)', lineHeight: '1', color }}>
            {angle}°
          </p>
          <p className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)', marginTop: '4px' }}>
            {severity}
          </p>
        </div>
      </div>
      
      {/* Scale markers */}
      <div className="flex justify-between w-full mt-2 px-2" style={{ maxWidth: size }}>
        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>0°</span>
        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>25°</span>
        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>50°+</span>
      </div>
    </div>
  );
}
