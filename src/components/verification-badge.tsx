'use client';

import type { LegalStatus } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface VerificationBadgeProps {
  status: LegalStatus;
  confidenceScore?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

interface BadgeConfig {
  label: string;
  shortLabel: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  description: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const BADGE_CONFIG: Record<LegalStatus, BadgeConfig> = {
  Titled: {
    label: 'Titled',
    shortLabel: 'TF',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    description: 'Full freehold title (Titre Foncier)',
  },
  'In-Process': {
    label: 'In Process',
    shortLabel: 'REQ',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Title registration in progress (Réquisition)',
  },
  Melkia: {
    label: 'Melkia',
    shortLabel: 'MLK',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    dotColor: 'bg-rose-500',
    description: 'Traditional ownership - requires conversion',
  },
};

const SIZE_CLASSES = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    dot: 'h-1.5 w-1.5',
    score: 'text-[10px]',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm',
    dot: 'h-2 w-2',
    score: 'text-xs',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base',
    dot: 'h-2.5 w-2.5',
    score: 'text-sm',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function VerificationBadge({
  status,
  confidenceScore,
  size = 'md',
  showLabel = true,
}: VerificationBadgeProps) {
  const config = BADGE_CONFIG[status];
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses.badge}
      `}
      title={config.description}
    >
      {/* Status indicator dot */}
      <span
        className={`
          rounded-full ${config.dotColor} ${sizeClasses.dot}
          animate-pulse
        `}
        aria-hidden="true"
      />

      {/* Label */}
      {showLabel && (
        <span>{config.label}</span>
      )}

      {/* Confidence score */}
      {confidenceScore !== undefined && confidenceScore !== null && (
        <span
          className={`
            ml-0.5 font-mono ${sizeClasses.score}
            opacity-75
          `}
        >
          {Math.round(confidenceScore)}%
        </span>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

interface CompactBadgeProps {
  status: LegalStatus;
}

export function VerificationBadgeCompact({ status }: CompactBadgeProps) {
  const config = BADGE_CONFIG[status];

  return (
    <span
      className={`
        inline-flex h-6 w-6 items-center justify-center
        rounded-full text-[10px] font-bold
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        border
      `}
      title={config.description}
    >
      {config.shortLabel}
    </span>
  );
}

// =============================================================================
// LEGAL CONFIDENCE METER
// =============================================================================

interface LegalConfidenceMeterProps {
  score: number;
  status: LegalStatus;
}

export function LegalConfidenceMeter({ score, status }: LegalConfidenceMeterProps) {
  const config = BADGE_CONFIG[status];
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">
          Legal Confidence
        </span>
        <span className={`text-xs font-mono font-bold ${config.textColor}`}>
          {Math.round(clampedScore)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${config.dotColor}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { BADGE_CONFIG };
export type { VerificationBadgeProps, BadgeConfig };
