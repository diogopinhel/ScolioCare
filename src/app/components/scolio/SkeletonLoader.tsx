import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  style?: React.CSSProperties;
}

function SkeletonBlock({ className = '', width, height, rounded = 'md', style }: SkeletonProps) {
  const roundedMap = {
    sm: 'rounded',
    md: 'rounded-[var(--radius-component)]',
    lg: 'rounded-[var(--radius-card)]',
    full: 'rounded-full',
  };
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-[#E8E8E8] via-[#F0F0F0] to-[#E8E8E8] bg-[length:200%_100%] ${roundedMap[rounded]} ${className}`}
      style={{
        width: width,
        height: height,
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

// AI Metrics Skeleton — for ExamViewerScreen right panel
export function AIMetricsSkeleton() {
  return (
    <div className="space-y-5">
      {/* Title */}
      <SkeletonBlock height={20} width={120} />

      <div className="bg-[var(--scolio-page-surface)] rounded-[var(--radius-card)] p-5 space-y-5">
        {/* Cobb Angle area */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonBlock height={14} width={80} />
            <SkeletonBlock height={48} width={100} />
            <SkeletonBlock height={12} width={130} />
          </div>
          {/* Gauge circle */}
          <SkeletonBlock width={120} height={120} rounded="full" />
        </div>

        {/* Apical vertebra row */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--scolio-border-light)]">
          <SkeletonBlock height={14} width={100} />
          <SkeletonBlock height={20} width={40} />
        </div>

        {/* Confidence score */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <SkeletonBlock height={14} width={80} />
            <SkeletonBlock height={14} width={40} />
          </div>
          <SkeletonBlock height={8} className="w-full" rounded="full" />
        </div>

        {/* Processing label */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-[var(--scolio-primary-blue)] border-t-transparent rounded-full animate-spin" />
          <span
            className="text-[var(--scolio-primary-blue)]"
            style={{ fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)' }}
          >
            IA a analisar exame...
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-3">
          <SkeletonBlock height={40} className="flex-1" />
          <SkeletonBlock height={40} className="flex-1" />
        </div>
      </div>
    </div>
  );
}

// Exam List Skeleton — for lists of exams
export function ExamListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-4 flex items-center gap-4"
        >
          <SkeletonBlock width={60} height={60} rounded="md" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock height={14} width="60%" />
            <SkeletonBlock height={12} width="40%" />
          </div>
          <SkeletonBlock height={24} width={70} rounded="sm" />
        </div>
      ))}
    </div>
  );
}

// Patient Card Skeleton
export function PatientCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-[var(--radius-card)] border border-[var(--scolio-border-light)] p-4 flex items-center gap-4"
        >
          <SkeletonBlock width={44} height={44} rounded="full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock height={15} width="50%" />
            <SkeletonBlock height={12} width="35%" />
          </div>
          <SkeletonBlock height={12} width={60} />
        </div>
      ))}
    </div>
  );
}

// Generic Table Row Skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 py-3 border-b border-[var(--scolio-border-light)]">
          {Array.from({ length: cols }).map((_, ci) => (
            <SkeletonBlock key={ci} height={14} className="flex-1" style={{ opacity: 1 - ri * 0.1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export { SkeletonBlock };
export default SkeletonBlock;
