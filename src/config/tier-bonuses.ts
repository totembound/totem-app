/**
 * Tier Bonuses
 *
 * Mirror of totem-api/src/services/tier-bonuses.js. Subscription tier
 * multipliers applied to recurring rewards (daily/weekly). Multiplier
 * scales the base reward before the streak bonus is applied.
 *
 *   free    → 1x  (no chip)
 *   premium → 2x  (+100%, purple chip — matches Plans page)
 *   vip     → 3x  (+200%, amber/gold chip — matches Plans page)
 */

export type Tier = 'free' | 'premium' | 'vip';

export const TIER_MULTIPLIERS: Record<Tier, number> = {
  free: 1,
  premium: 2,
  vip: 3,
};

export function getTierMultiplier(tier?: string | null): number {
  if (!tier) return 1;
  return TIER_MULTIPLIERS[tier as Tier] ?? 1;
}

export function getTierBonusPercent(tier?: string | null): number {
  return (getTierMultiplier(tier) - 1) * 100;
}

/** Tailwind color classes for the tier bonus chip. Returns null for free. */
export function getTierChipColorClass(tier?: string | null): string | null {
  if (tier === 'vip') return 'text-amber-500 dark:text-amber-400';
  if (tier === 'premium') return 'text-purple-600 dark:text-purple-400';
  return null;
}
