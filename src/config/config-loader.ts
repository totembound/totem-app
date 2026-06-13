/**
 * Static game-config loader.
 *
 * The app bundles its static config at build time (TS modules + `resolveJsonModule`
 * JSON imports), so the bundled copy is the single frontend source of truth and is
 * available synchronously — no fetch, no cache-bust, no network fallback needed.
 *
 * Currently hosts the Challenge Mastery config; future bundled config JSONs can
 * follow the same import + typed-getter pattern here.
 */
import bundledMasteryConfig from './challenge-mastery.json';

export interface MasteryTier {
    tier: number;
    name: string;
    minCompletions: number;
    xpMult: number;
}

export interface MasteryTierUpBonus {
    lootBoxId: string | null;
    xp: number;
}

export interface MasteryConfig {
    version: string;
    tiers: MasteryTier[];
    tierUpBonus: Record<string, MasteryTierUpBonus>;
    raiseTier: number;
    maxDifficulty: number;
    essenceXpScalingEnabled: boolean;
    minMasteryScorePct: number;
}

// Bundled copy is the source of truth (mirrored by the backend constant block).
const MASTERY = bundledMasteryConfig as MasteryConfig;

/** Get the bundled mastery config. */
export function getMasteryConfig(): MasteryConfig {
    return MASTERY;
}

/**
 * Pure function — the tier index for a given completion count.
 * Mirrors the backend `tierForCompletions`.
 */
export function tierForCompletions(completions: number): number {
    const tiers = MASTERY.tiers;
    let tier = 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
        if (completions >= tiers[i].minCompletions) {
            tier = tiers[i].tier;
            break;
        }
    }
    return tier;
}

/** Get the full tier object (name, xpMult, threshold) for a completion count. */
export function getMasteryTier(completions: number): MasteryTier {
    const tierIndex = tierForCompletions(completions);
    return MASTERY.tiers.find((t) => t.tier === tierIndex) ?? MASTERY.tiers[0];
}

/** Get a tier object by its index, or undefined if out of range (e.g. next tier past Diamond). */
export function getMasteryTierByIndex(tier: number): MasteryTier | undefined {
    return MASTERY.tiers.find((t) => t.tier === tier);
}
