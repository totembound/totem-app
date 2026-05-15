import { useMemo } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';

export interface BuildingBadgeState {
  badge?: number;
  locked?: boolean;
  lockMessage?: string;
}

/**
 * Derives live badge counts and lock state for each village building from the
 * existing app contexts. KeepersVillage merges the result over the static
 * PLACEHOLDER_BUILDINGS so labels show real numbers — no API calls added.
 *
 * Badge sources are mapped per plan/village-v2.md §Badge sources research.
 * Hall of Legends (unseen achievements) and Bazaar (active specials) are
 * stubbed — they need a `lastSeen` field on AchievementsContext and a
 * Specials lookup respectively. Both deferred — labels just show no badge.
 */
export function useVillageBadges(): Record<string, BuildingBadgeState> {
  const { totems } = useUser();
  const { rewardsState, expeditionState, challengeState } = useGame();

  return useMemo(() => {
    // Badge UX rule: only show counts for ACTIONABLE state (claim available,
    // urgent attention). Pure stats (total totems, total challenge attempts)
    // belong inside the modal — they pollute the village view because they
    // never go to zero. See plan/village-v2.md §Badge UX research notes.

    // Shrine — claimable rewards (daily + weekly). Direct claim action ✓
    // Weekly: API returns canClaimWeekly=true even when the weekly tier isn't
    // yet unlocked for the player (gated by streak/tutorial progress). Gate on
    // hasWeeklyUnlocked too so we don't show a phantom "1 ready" before the
    // user can actually claim anything.
    const shrineCount =
      (rewardsState.streakStatus?.canClaimToday ? 1 : 0) +
      (rewardsState.weeklyStatus?.canClaimWeekly && rewardsState.hasWeeklyUnlocked ? 1 : 0);

    // Trailhead — expeditions ready to claim. Direct claim action ✓
    const trailheadCount = (expeditionState.userExpeditions ?? []).filter(
      (e) => e.canClaim
    ).length;

    // Forge — locked until ≥3 totems share a rarity. When unlocked, badge =
    // number of distinct rarity groups with 3+ members (eligible fusions).
    // Borderline actionable: hints at a new opportunity without screaming.
    const rarityGroups = totems.reduce<Record<number, number>>((acc, t) => {
      const r = t.attributes?.rarity ?? 0;
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {});
    const eligibleFusionGroups = Object.values(rarityGroups).filter((c) => c >= 3).length;
    const forgeUnlocked = eligibleFusionGroups > 0;

    // Elder Tower — locked until at least one Ascended (stage 4) totem exists.
    // Essence-claimable badge deferred until SanctumContext exposes that field.
    const elderUnlocked = totems.some((t) => (t.attributes?.stage ?? 0) >= 4);

    return {
      'library': {},          // browsing only — no badge
      'shrine': { badge: shrineCount > 0 ? shrineCount : undefined },
      'hall-of-legends': {},  // unseen achievements — needs lastSeen field, deferred
      'bazaar': {},           // active specials — needs ShopContext lookup, deferred
      'sanctuary': {},        // totem count is a stat, not an action — show inside modal
      'hearthstone': {},      // profile/settings — no badge
      'forge': {
        locked: !forgeUnlocked,
        lockMessage: 'Own 3 totems of the same rarity',
        badge: forgeUnlocked && eligibleFusionGroups > 0 ? eligibleFusionGroups : undefined,
      },
      'elder-tower': {
        locked: !elderUnlocked,
        lockMessage: 'Raise an Ascended totem',
      },
      'arena': {},            // raw attempts-remaining is confusing UX — show inside picker
      'trailhead': { badge: trailheadCount > 0 ? trailheadCount : undefined },
    };
  }, [totems, rewardsState, expeditionState, challengeState]);
}
