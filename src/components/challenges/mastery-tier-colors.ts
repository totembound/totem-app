/**
 * Medal/icon tint per mastery tier — the single source for the Bronze→Diamond
 * color ramp used by the challenge cards (MasteryFrame/ChallengePanel), the
 * Codex Trial Mastery ladder, and the public-profile medal strip.
 * Index 0 = Novice (muted).
 */
export const MASTERY_TIER_COLOR: Record<number, string> = {
    0: 'text-gray-400 dark:text-gray-500',
    1: 'text-amber-600 dark:text-amber-500',   // Bronze
    2: 'text-gray-400 dark:text-gray-300',      // Silver
    3: 'text-yellow-500',                        // Gold
    4: 'text-slate-400 dark:text-slate-300',    // Platinum
    5: 'text-cyan-500 dark:text-cyan-400',      // Diamond
};
