/**
 * OverlayCobb — SVG overlay com as vértebras detetadas e as linhas de medição
 * do ângulo de Cobb. Usa viewBox no espaço de pixels da imagem original;
 * preserveAspectRatio "xMidYMid meet" alinha com o `object-contain` do <img>.
 *
 * Usado no ExamViewerScreen e no ExamComparisonScreen.
 */
import type { VertebraDetetada, CobbMeasurementData } from '../../../data/types';

export interface OverlayCobbProps {
  natural: { w: number; h: number };
  vertebrae: VertebraDetetada[] | null;
  measurement: CobbMeasurementData | null;
  anguloCobb: number | null;
}

export function OverlayCobb({ natural, vertebrae, measurement, anguloCobb }: OverlayCobbProps) {
  const { w, h } = natural;
  const strokeBase = Math.max(2, Math.round(w * 0.002));
  const fontSize   = Math.max(18, Math.round(w * 0.025));

  const upperV = vertebrae && measurement
    ? vertebrae.find((v) => v.id === measurement.upperVertebraIndex)
    : null;
  const lowerV = vertebrae && measurement
    ? vertebrae.find((v) => v.id === measurement.lowerVertebraIndex)
    : null;

  function extendLine(x1: number, y1: number, x2: number, y2: number, factor = 0.4) {
    const dx = x2 - x1, dy = y2 - y1;
    return { x1: x1 - dx * factor, y1: y1 - dy * factor, x2: x2 + dx * factor, y2: y2 + dy * factor };
  }

  const upperLine = upperV?.polygon
    ? extendLine(upperV.polygon[0][0], upperV.polygon[0][1], upperV.polygon[1][0], upperV.polygon[1][1])
    : null;
  const lowerLine = lowerV?.polygon
    ? extendLine(lowerV.polygon[3][0], lowerV.polygon[3][1], lowerV.polygon[2][0], lowerV.polygon[2][1])
    : null;

  const labelX = w * 0.78;
  const labelY = upperV?.center && lowerV?.center
    ? (upperV.center[1] + lowerV.center[1]) / 2
    : h / 2;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ mixBlendMode: 'screen' }}
    >
      {/* Polígonos das vértebras */}
      {vertebrae?.map((v) => {
        if (!v.polygon || v.polygon.length < 4) return null;
        const isCobb  = measurement?.upperVertebraIndex === v.id || measurement?.lowerVertebraIndex === v.id;
        const stroke  = isCobb ? '#F59E0B' : '#1A6FAF';
        const fill    = isCobb ? 'rgba(245,158,11,0.18)' : 'rgba(26,111,175,0.08)';
        const points  = v.polygon.map(([x, y]) => `${x},${y}`).join(' ');
        return (
          <polygon
            key={v.id}
            points={points}
            stroke={stroke}
            strokeWidth={isCobb ? strokeBase * 1.8 : strokeBase}
            fill={fill}
          />
        );
      })}

      {/* Linhas de plate (Cobb) */}
      {upperLine && (
        <line
          x1={upperLine.x1} y1={upperLine.y1}
          x2={upperLine.x2} y2={upperLine.y2}
          stroke="#EF4444" strokeWidth={strokeBase * 1.6}
          strokeDasharray={`${strokeBase * 3} ${strokeBase * 2}`}
        />
      )}
      {lowerLine && (
        <line
          x1={lowerLine.x1} y1={lowerLine.y1}
          x2={lowerLine.x2} y2={lowerLine.y2}
          stroke="#EF4444" strokeWidth={strokeBase * 1.6}
          strokeDasharray={`${strokeBase * 3} ${strokeBase * 2}`}
        />
      )}

      {/* Etiqueta do ângulo */}
      {anguloCobb !== null && (
        <g>
          <rect
            x={labelX - fontSize * 1.6} y={labelY - fontSize * 0.9}
            width={fontSize * 3.2}      height={fontSize * 1.4}
            rx={fontSize * 0.2}
            fill="rgba(15,23,42,0.85)"
          />
          <text
            x={labelX} y={labelY + fontSize * 0.1}
            fill="#FBBF24"
            fontSize={fontSize}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {anguloCobb.toFixed(1)}°
          </text>
        </g>
      )}
    </svg>
  );
}
