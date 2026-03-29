/**
 * Elder Sanctum Configuration
 *
 * Static config for the sanctum feature - seats, passive earning rates,
 * tenure bonuses, and council mission definitions.
 */

export const SANCTUM_CONFIG = {
  maxSeats: 3,
  requiredStage: 3, // Internal stage 3 = UI Stage 4 (Adult, 3500+ XP)

  passiveEarning: {
    baseRatePerHour: 0.5,
    capHours: 168, // 7 days
  },

  tenureBonuses: [
    { minHours: 0, multiplier: 1.0, label: 'New' },
    { minHours: 24, multiplier: 1.1, label: 'Settled' },
    { minHours: 72, multiplier: 1.2, label: 'Established' },
    { minHours: 168, multiplier: 1.3, label: 'Respected' },
    { minHours: 336, multiplier: 1.4, label: 'Revered' },
    { minHours: 720, multiplier: 1.5, label: 'Ancient' },
  ],

  seatRequirements: [
    { seatIndex: 0, type: 'stage4_count' as const, count: 1, label: 'Own any Stage 4+ totem' },
    { seatIndex: 1, type: 'stage4_count_or_vip' as const, count: 5, vipTier: 1, label: 'VIP Tier 1 or own 5 Stage 4+ totems' },
    { seatIndex: 2, type: 'stage4_count_or_vip' as const, count: 10, vipTier: 2, label: 'VIP Tier 2 or own 10 Stage 4+ totems' },
  ],
} as const;

export interface CouncilMissionDef {
  id: string;
  name: string;
  tier: 'governance' | 'diplomacy' | 'legacy';
  requiredStage: number; // internal stage (3 = UI Stage 4, 4 = UI Stage 5)
  duration: number; // seconds
  cost: { essence: number; happiness: number };
  rewards: { xp: number; runes?: Record<string, number> }; // runes: { lesser/greater/ancient: % chance }
  description: string;
}

export const COUNCIL_MISSIONS: CouncilMissionDef[] = [
  // Governance Tier (2-4 hours) — Stage 4+ (Adult). Rewards: XP + Lesser Rune (50%)
  { id: 'cm_decree-of-wisdom', name: 'Decree of Wisdom', tier: 'governance', requiredStage: 3, duration: 7200, cost: { essence: 10, happiness: 5 }, rewards: { xp: 20, runes: { lesser: 50 } }, description: 'Meditate on an ancient law and issue guidance to the realm' },
  { id: 'cm_territorial-survey', name: 'Territorial Survey', tier: 'governance', requiredStage: 3, duration: 10800, cost: { essence: 12, happiness: 5 }, rewards: { xp: 30, runes: { lesser: 50 } }, description: 'Personally inspect the boundaries of your domain' },
  { id: 'cm_spirit-audience', name: 'Spirit Audience', tier: 'governance', requiredStage: 3, duration: 14400, cost: { essence: 15, happiness: 8 }, rewards: { xp: 40, runes: { lesser: 50 } }, description: 'Hold court and hear petitions from lesser spirits' },
  // Diplomacy Tier (6-8 hours) — Stage 5 (Ascended) only. Rewards: XP + Greater Rune (50%)
  { id: 'cm_peace-summit', name: 'Peace Summit', tier: 'diplomacy', requiredStage: 4, duration: 21600, cost: { essence: 20, happiness: 10 }, rewards: { xp: 30, runes: { greater: 50 } }, description: 'Negotiate a truce between rival spirit clans' },
  { id: 'cm_alliance-forging', name: 'Alliance Forging', tier: 'diplomacy', requiredStage: 4, duration: 28800, cost: { essence: 25, happiness: 12 }, rewards: { xp: 45, runes: { greater: 50 } }, description: 'Establish a lasting pact with a distant council' },
  { id: 'cm_elder-exchange', name: 'Elder Exchange', tier: 'diplomacy', requiredStage: 4, duration: 28800, cost: { essence: 25, happiness: 12 }, rewards: { xp: 45, runes: { greater: 50 } }, description: 'Visit a foreign sanctum to share knowledge' },
  // Legacy Tier (12-24 hours) — Stage 5 (Ascended) only. Rewards: XP + Greater Rune (75%) + Ancient Rune chance
  { id: 'cm_rite-of-passage', name: 'Rite of Passage', tier: 'legacy', requiredStage: 4, duration: 43200, cost: { essence: 30, happiness: 15 }, rewards: { xp: 60, runes: { greater: 75, ancient: 10 } }, description: 'Guide a young spirit through their first trial' },
  { id: 'cm_ancient-convocation', name: 'Ancient Convocation', tier: 'legacy', requiredStage: 4, duration: 64800, cost: { essence: 40, happiness: 18 }, rewards: { xp: 90, runes: { greater: 75, ancient: 15 } }, description: 'Attend a once-rare gathering of all elder spirits' },
  { id: 'cm_founding-ritual', name: 'Founding Ritual', tier: 'legacy', requiredStage: 4, duration: 86400, cost: { essence: 50, happiness: 20 }, rewards: { xp: 120, runes: { greater: 75, ancient: 20 } }, description: 'Consecrate a new sanctum at the world\'s edge' },
];

/** Get tenure multiplier for given hours */
export function getTenureMultiplier(tenureHours: number): number {
  const bonuses = SANCTUM_CONFIG.tenureBonuses;
  for (let i = bonuses.length - 1; i >= 0; i--) {
    if (tenureHours >= bonuses[i].minHours) return bonuses[i].multiplier;
  }
  return 1.0;
}

/** Get tenure label for given hours */
export function getTenureLabel(tenureHours: number): string {
  const bonuses = SANCTUM_CONFIG.tenureBonuses;
  for (let i = bonuses.length - 1; i >= 0; i--) {
    if (tenureHours >= bonuses[i].minHours) return bonuses[i].label;
  }
  return 'New';
}

/** Calculate accumulated essence for a seat (frontend display) */
export function calculateSeatEssence(seatedAt: string, lastClaimedAt: string): number {
  const now = Date.now();
  const seatedAtMs = new Date(seatedAt).getTime();
  const lastClaimedMs = new Date(lastClaimedAt).getTime();

  const tenureHours = (now - seatedAtMs) / 3_600_000;
  const multiplier = getTenureMultiplier(tenureHours);
  const hoursSinceClaim = (now - lastClaimedMs) / 3_600_000;
  const cappedHours = Math.min(hoursSinceClaim, SANCTUM_CONFIG.passiveEarning.capHours);

  return Math.floor(SANCTUM_CONFIG.passiveEarning.baseRatePerHour * multiplier * cappedHours);
}

/** Get mission definition by ID */
export function getMissionById(missionId: string): CouncilMissionDef | undefined {
  return COUNCIL_MISSIONS.find(m => m.id === missionId);
}
