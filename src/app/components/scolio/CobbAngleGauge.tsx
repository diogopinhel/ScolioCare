import React from 'react';
import { useTranslation } from 'react-i18next';

export interface CobbAngleGaugeProps {
  angle: number;
  size?: number;
  className?: string;
}

// ── Stops de cor (hex) para interpolação contínua ──────────────────
// Mapeia t ∈ [0,1] (0° → 50°) para uma cor ao longo do espectro
const COLOR_STOPS = [
  { t: 0.00, rgb: [0x1D, 0x9E, 0x75] as [number, number, number] }, // verde
  { t: 0.40, rgb: [0xBA, 0x75, 0x17] as [number, number, number] }, // âmbar
  { t: 0.72, rgb: [0xD8, 0x5A, 0x30] as [number, number, number] }, // coral
  { t: 1.00, rgb: [0x99, 0x1b, 0x1b] as [number, number, number] }, // vermelho escuro
];

function interpolarCor(pct: number): string {
  const t = Math.max(0, Math.min(1, pct));
  let i = 0;
  while (i < COLOR_STOPS.length - 2 && t > COLOR_STOPS[i + 1].t) i++;
  const a = COLOR_STOPS[i];
  const b = COLOR_STOPS[i + 1];
  const local = (t - a.t) / (b.t - a.t);
  const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * local);
  const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * local);
  const bl = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * local);
  return `rgb(${r},${g},${bl})`;
}

// ── Thresholds clínicos (para label i18n e escala) ──────────────────
interface Threshold { max: number; severityKey: string; color: string; range: string; }

const THRESHOLDS: Threshold[] = [
  { max: 10,       severityKey: 'none',     color: '#1D9E75', range: '0–9°'   },
  { max: 25,       severityKey: 'mild',     color: '#BA7517', range: '10–24°' },
  { max: 40,       severityKey: 'moderate', color: '#D85A30', range: '25–39°' },
  { max: Infinity, severityKey: 'severe',   color: '#991b1b', range: '40°+'   },
];

function getThreshold(angle: number): Threshold {
  return THRESHOLDS.find((th) => angle < th.max) ?? THRESHOLDS[THRESHOLDS.length - 1];
}

// ───────────────────────────────────────────────────────────────────

export function CobbAngleGauge({ angle, size = 200, className = '' }: CobbAngleGaugeProps) {
  const { t } = useTranslation();

  const maxDeg = 50;
  const pct    = Math.min(angle / maxDeg, 1);
  const color  = interpolarCor(pct);   // cor sólida interpolada pelo ângulo

  const th    = getThreshold(angle);
  const label = t(`severity.${th.severityKey}`);
  const desc  = t(`severity.${th.severityKey}Desc`);

  // Geometria do arco
  const strokeWidth   = Math.max(10, Math.round(size * 0.075));
  const cx            = size / 2;
  const cy            = size / 2;
  const radius        = cx - strokeWidth;
  const circumference = Math.PI * radius;
  const dashOffset    = circumference * (1 - pct);
  const svgH          = cy + Math.ceil(strokeWidth / 2) + 2;

  // Posição vertical do valor dentro do arco
  const textCy = cy - (4 * radius) / (3 * Math.PI) + size * 0.07;

  const displayAngle = Number.isInteger(angle) ? `${angle}°` : `${angle.toFixed(1)}°`;

  return (
    <div className={`flex flex-col items-center ${className}`}>

      {/* ── Arco + valor ── */}
      <div className="relative" style={{ width: size, height: svgH }}>
        <svg width={size} height={svgH} className="overflow-visible">
          {/* Track */}
          <path
            d={`M ${strokeWidth} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${cy}`}
            fill="none"
            stroke="var(--scolio-neutral-surface)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress — cor sólida interpolada */}
          <path
            d={`M ${strokeWidth} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.6s ease-out' }}
          />
        </svg>

        {/* Valor centrado dentro do arco */}
        <div
          style={{
            position:  'absolute',
            top:       textCy,
            left:      '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: size * 0.22, fontWeight: 700, color, lineHeight: 1 }}>
            {displayAngle}
          </div>
        </div>
      </div>

      {/* ── Badge de severidade ── */}
      <div
        className="mt-3 w-full rounded-[var(--radius-component)] px-3 py-2"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
      >
        <span style={{ color, fontWeight: 600, fontSize: 'var(--text-body)' }}>
          {label}
        </span>
        <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
          {' · '}{desc}
        </span>
      </div>

      {/* ── Escala de referência ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 w-full">
        {THRESHOLDS.map((th) => (
          <div key={th.range} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: th.color }} />
            <span className="text-[var(--scolio-text-secondary)]" style={{ fontSize: 'var(--text-caption)' }}>
              {th.range}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
