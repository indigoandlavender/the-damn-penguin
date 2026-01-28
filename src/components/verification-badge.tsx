'use client';

import type { LegalStatus } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface LegalStampProps {
  status: LegalStatus;
  confidenceScore?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

interface StampConfig {
  label: string;
  sublabel: string;
  style: 'certified' | 'pending' | 'unverified';
}

// =============================================================================
// CONFIGURATION — No Traffic Light Colors
// =============================================================================

const STAMP_CONFIG: Record<LegalStatus, StampConfig> = {
  Titled: {
    label: 'CERTIFIED',
    sublabel: 'Titre Foncier',
    style: 'certified',
  },
  'In-Process': {
    label: 'PENDING',
    sublabel: 'Réquisition',
    style: 'pending',
  },
  Melkia: {
    label: 'UNVERIFIED',
    sublabel: 'Traditional',
    style: 'unverified',
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
  lg: 'px-4 py-2 text-sm',
};

// =============================================================================
// LEGAL STAMP — Document Verification Aesthetic
// =============================================================================

export function LegalStamp({ status, confidenceScore, size = 'md' }: LegalStampProps) {
  const config = STAMP_CONFIG[status];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`
          stamp stamp--${config.style} ${sizeClass}
          font-mono font-semibold tracking-widest
        `}
      >
        {config.label}
      </span>
      {confidenceScore !== null && confidenceScore !== undefined && (
        <span className="font-mono text-[10px] tracking-wider opacity-50">
          {Math.round(confidenceScore)}% CONFIDENCE
        </span>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT STAMP — For Tables
// =============================================================================

export function LegalStampCompact({ status }: { status: LegalStatus }) {
  const config = STAMP_CONFIG[status];

  return (
    <span
      className={`
        inline-block font-mono text-[10px] font-semibold tracking-widest
        ${config.style === 'certified' ? 'text-black' : ''}
        ${config.style === 'pending' ? 'text-black opacity-70' : ''}
        ${config.style === 'unverified' ? 'text-black opacity-40' : ''}
      `}
    >
      {config.label}
    </span>
  );
}

// =============================================================================
// CONFIDENCE METER — Minimalist Bar
// =============================================================================

interface ConfidenceMeterProps {
  score: number;
}

export function ConfidenceMeter({ score }: ConfidenceMeterProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest opacity-60">
          Legal Confidence
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums">
          {Math.round(clampedScore)}%
        </span>
      </div>
      <div className="h-px w-full bg-[#EEEEEE]">
        <div
          className="h-px bg-black transition-all duration-500"
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// FULL VERIFICATION BLOCK — For Property Detail Pages
// =============================================================================

interface VerificationBlockProps {
  status: LegalStatus;
  confidenceScore?: number | null;
  titleNumber?: string | null;
  requisitionNumber?: string | null;
  melkiaReference?: string | null;
}

export function VerificationBlock({
  status,
  confidenceScore,
  titleNumber,
  requisitionNumber,
  melkiaReference,
}: VerificationBlockProps) {
  const config = STAMP_CONFIG[status];

  return (
    <div className="specimen-card">
      <div className="specimen-header">
        <h3>Legal Status</h3>
      </div>
      <div className="specimen-body space-y-6">
        {/* Main Stamp */}
        <div className="flex items-start justify-between">
          <div>
            <span
              className={`stamp stamp--${config.style} text-sm font-semibold tracking-widest`}
            >
              {config.label}
            </span>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider opacity-50">
              {config.sublabel}
            </p>
          </div>
        </div>

        {/* Confidence Meter */}
        {confidenceScore !== null && confidenceScore !== undefined && (
          <ConfidenceMeter score={confidenceScore} />
        )}

        {/* Reference Numbers */}
        <div className="space-y-3 border-t border-[#EEEEEE] pt-4">
          {titleNumber && (
            <div className="flex justify-between">
              <span className="font-mono text-xs uppercase tracking-wider opacity-50">
                Title Number
              </span>
              <span className="font-mono text-sm tabular-nums">{titleNumber}</span>
            </div>
          )}
          {requisitionNumber && (
            <div className="flex justify-between">
              <span className="font-mono text-xs uppercase tracking-wider opacity-50">
                Requisition
              </span>
              <span className="font-mono text-sm tabular-nums">{requisitionNumber}</span>
            </div>
          )}
          {melkiaReference && (
            <div className="flex justify-between">
              <span className="font-mono text-xs uppercase tracking-wider opacity-50">
                Melkia Ref
              </span>
              <span className="font-mono text-sm tabular-nums">{melkiaReference}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LEGACY EXPORTS — Backward Compatibility
// =============================================================================

export { LegalStamp as VerificationBadge };
export { ConfidenceMeter as LegalConfidenceMeter };
export { STAMP_CONFIG as BADGE_CONFIG };
