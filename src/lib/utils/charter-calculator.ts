/**
 * 2026 Investment Charter Calculator
 * Morocco Investment Incentive Framework
 *
 * Reference: Charte de l'Investissement 2022 (Loi-cadre n° 03-22)
 * Updated for 2026 decree amendments
 *
 * AUDIT NOTE: These percentages must be verified against official
 * Bulletin Officiel publications. Use Perplexity to cross-reference
 * decree numbers before production deployment.
 */

import type {
  CharterCategory,
  CharterCalculationInput,
  CharterCalculationResult,
} from '@/types';

// =============================================================================
// CHARTER CONSTANTS - 2026 DECREE VALUES
// =============================================================================

/**
 * Base cashback percentages by category
 * Source: Décret n° 2-22-XXX (to be verified)
 */
const BASE_CASHBACK_PCT: Record<CharterCategory, number> = {
  A: 10, // Primary zones: Marrakech, Casablanca, Rabat, Tangier
  B: 15, // Secondary zones: Essaouira, Ouarzazate, Agadir, Fes
  C: 20, // Emerging zones: Other regions
};

/**
 * Zone classifications by city/region
 * Must be cross-referenced with official territorial mapping
 */
export const ZONE_CLASSIFICATION: Record<string, CharterCategory> = {
  // Category A - Primary Investment Zones
  marrakech: 'A',
  casablanca: 'A',
  rabat: 'A',
  tangier: 'A',
  tanger: 'A',

  // Category B - Secondary Investment Zones
  essaouira: 'B',
  ouarzazate: 'B',
  agadir: 'B',
  fes: 'B',
  fez: 'B',
  meknes: 'B',
  tetouan: 'B',

  // Category C - Emerging Zones (default for unlisted)
  errachidia: 'C',
  guelmim: 'C',
  laayoune: 'C',
  dakhla: 'C',
};

/**
 * Bonus percentages for specific conditions
 */
const BONUSES = {
  renovation: 5,           // Historic property renovation bonus
  employment_per_job: 0.5, // Per permanent job created (capped)
  employment_cap: 10,      // Maximum employment bonus
  sustainable: 3,          // Green/sustainable construction
};

/**
 * Minimum investment thresholds (MAD)
 */
const MIN_INVESTMENT_THRESHOLDS: Record<CharterCategory, number> = {
  A: 5_000_000,  // 5M MAD for Category A
  B: 2_500_000,  // 2.5M MAD for Category B
  C: 1_000_000,  // 1M MAD for Category C
};

// =============================================================================
// CALCULATOR FUNCTIONS
// =============================================================================

/**
 * Calculate 2026 Investment Charter incentives
 *
 * @param input - Calculation parameters
 * @returns Detailed breakdown of cashback incentives
 */
export function calculateCharterIncentives(
  input: CharterCalculationInput
): CharterCalculationResult {
  const {
    acquisition_price_mad,
    charter_category,
    is_renovation,
    renovation_cost_mad = 0,
    employment_created = 0,
  } = input;

  // Total eligible investment
  const eligible_investment_mad = acquisition_price_mad + renovation_cost_mad;

  // Base cashback percentage
  const base_cashback_pct = BASE_CASHBACK_PCT[charter_category];

  // Calculate bonuses
  let bonus_pct = 0;

  // Renovation bonus
  if (is_renovation && renovation_cost_mad > 0) {
    bonus_pct += BONUSES.renovation;
  }

  // Employment bonus (capped)
  if (employment_created > 0) {
    const employment_bonus = Math.min(
      employment_created * BONUSES.employment_per_job,
      BONUSES.employment_cap
    );
    bonus_pct += employment_bonus;
  }

  // Total cashback
  const total_cashback_pct = base_cashback_pct + bonus_pct;
  const estimated_cashback_mad = (eligible_investment_mad * total_cashback_pct) / 100;

  // Decree reference (placeholder - must be verified)
  const decree_reference = `Décret n° 2-22-XXX / Art. ${charter_category === 'A' ? '15' : charter_category === 'B' ? '16' : '17'}`;

  return {
    base_cashback_pct,
    bonus_pct,
    total_cashback_pct,
    estimated_cashback_mad,
    eligible_investment_mad,
    decree_reference,
  };
}

/**
 * Check if investment meets minimum threshold for charter eligibility
 */
export function isCharterEligible(
  investment_mad: number,
  category: CharterCategory
): boolean {
  return investment_mad >= MIN_INVESTMENT_THRESHOLDS[category];
}

/**
 * Get charter category from city/region name
 */
export function getCategoryFromLocation(location: string): CharterCategory {
  const normalized = location.toLowerCase().trim();
  return ZONE_CLASSIFICATION[normalized] ?? 'C';
}

/**
 * Get minimum investment threshold for a category
 */
export function getMinimumThreshold(category: CharterCategory): number {
  return MIN_INVESTMENT_THRESHOLDS[category];
}

/**
 * Format MAD currency
 */
export function formatMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate charter calculation input
 */
export function validateCharterInput(
  input: Partial<CharterCalculationInput>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.acquisition_price_mad || input.acquisition_price_mad <= 0) {
    errors.push('Acquisition price must be positive');
  }

  if (!input.charter_category) {
    errors.push('Charter category is required');
  }

  if (input.is_renovation && !input.renovation_cost_mad) {
    errors.push('Renovation cost required when is_renovation is true');
  }

  if (input.employment_created !== undefined && input.employment_created < 0) {
    errors.push('Employment created cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
