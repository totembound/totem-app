import { BASE_ELDER_XP, PRESTIGE_XP_REQUIREMENT, STAGE_THRESHOLDS } from '../config/constants';

// Only Ascended (max-stage) totems accrue prestige. `stage` is the STORED 0-based
// value (0=Hatchling … 4=Ascended; the UI displays it +1 as "1/5"…"5/5"), so the
// max stage is the last STAGE_THRESHOLDS index — 4, not 5.
const MAX_STAGE = STAGE_THRESHOLDS.length - 1;

/**
 * Prestige level derived from XP — the single source of truth for prestige across
 * the app (totem detail HUD, stats panel, gallery card). Mirrors the server
 * (totem-api `get-public-profile.js`): a max-stage totem earns one prestige level
 * per `PRESTIGE_XP_REQUIREMENT` of XP beyond the Elder threshold. Returns 0 for any
 * non-Ascended totem, or one that hasn't crossed the threshold.
 *
 * NOTE: prestige is intentionally XP-derived, NOT read from the stored
 * `prestigeLevel` field — that field is seeded 0 and never maintained, which is
 * why the gallery card (its only consumer) used to render "P0" for a real P3 totem.
 */
export function computePrestigeLevel(experience: number, stage: number): number {
    if (stage < MAX_STAGE || experience <= BASE_ELDER_XP) return 0;
    return Math.floor((experience - BASE_ELDER_XP) / PRESTIGE_XP_REQUIREMENT);
}
