import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import { useTutorialClaims } from '../guides/useTutorialClaims';

export interface BuildingStats {
  /** Primary stat line shown in the bottom strip — short, glanceable. */
  summary: string;
  /** When the building is gated, the unlock criteria + concrete progress. */
  lockReason?: string;
}

/**
 * Per-building stat selector for the village bottom strip. Reads from existing
 * contexts (no API calls). Each building returns a `summary` line; locked
 * buildings also include `lockReason` so the strip can show unlock progress
 * instead of stats. See plan/village-v2.md §Building-select state design.
 */
export function useBuildingStats(buildingId: string): BuildingStats {
  const { user } = useAuth();
  const { totems, essenceBalance, gemsBalance } = useUser();
  const { rewardsState, expeditionState, challengeState, lootItems, dailyQuests } = useGame();
  const { claimStatus } = useTutorialClaims();

  return useMemo<BuildingStats>(() => {
    switch (buildingId) {
      case 'library': {
        return { summary: 'Browse tutorials, codex, and lore' };
      }

      case 'shrine': {
        // Roll up everything actionable on the /rewards page so the strip
        // tells the player what's actually waiting, not just streak status.
        const dailyReady = rewardsState.streakStatus?.canClaimToday;
        // canClaimWeekly is true even when the weekly tier isn't unlocked yet —
        // gate on hasWeeklyUnlocked to match the badge logic.
        const weeklyReady =
          rewardsState.weeklyStatus?.canClaimWeekly && rewardsState.hasWeeklyUnlocked;
        const streak = rewardsState.streakStatus?.streakDays ?? 0;
        const questReady = dailyQuests
          ? dailyQuests.quests.filter(q => !q.claimed && q.progress >= q.goal).length +
            (dailyQuests.bonus?.unlocked && !dailyQuests.bonus?.claimed ? 1 : 0)
          : 0;
        const lootReady = lootItems.length;
        const tutorialReady = Object.values(claimStatus).filter(v => v === false).length;

        const parts: string[] = [];
        if (dailyReady && weeklyReady) parts.push('Daily + weekly ready');
        else if (dailyReady) parts.push('Daily reward ready');
        else if (weeklyReady) parts.push('Weekly reward ready');
        if (questReady > 0) parts.push(`${questReady} quest${questReady === 1 ? '' : 's'} ready`);
        if (lootReady > 0) parts.push(`${lootReady} loot box${lootReady === 1 ? '' : 'es'}`);
        if (tutorialReady > 0) parts.push(`${tutorialReady} tutorial step${tutorialReady === 1 ? '' : 's'}`);

        if (parts.length === 0) {
          return { summary: `Day ${streak} streak · Next reward tomorrow` };
        }
        return { summary: `Day ${streak} streak · ${parts.join(' · ')}` };
      }

      case 'hall-of-legends': {
        return { summary: 'Track achievements and milestones' };
      }

      case 'bazaar': {
        const essence = (Number(essenceBalance) || 0).toLocaleString();
        const gems = (Number(gemsBalance) || 0).toLocaleString();
        return { summary: `${essence} Essence · ${gems} Gems` };
      }

      case 'sanctuary': {
        const count = totems.length;
        if (count === 0) return { summary: 'No totems yet — claim your starter' };
        const highest = totems.reduce(
          (top, t) => ((t.attributes?.stage ?? 0) > (top.attributes?.stage ?? 0) ? t : top),
          totems[0]
        );
        const stageName = ['Hatchling', 'Juvenile', 'Adult', 'Elder', 'Ascended'][highest.attributes?.stage ?? 0];
        const topName = highest.displayName || highest.name;
        return { summary: `${count} totem${count === 1 ? '' : 's'} · Highest: ${topName} (${stageName})` };
      }

      case 'hearthstone': {
        const name = user?.displayName || user?.email?.split('@')[0] || 'Account';
        const tier = (user?.tier ?? 'free').replace(/^\w/, (c) => c.toUpperCase());
        return { summary: `${name} · ${tier} tier` };
      }

      case 'forge': {
        // Locked until ≥3 totems share a rarity. Show the rarity tally so the
        // user sees concrete progress toward the unlock condition.
        const rarityNames = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Limited'];
        const rarityGroups = totems.reduce<Record<number, number>>((acc, t) => {
          const r = t.attributes?.rarity ?? 0;
          acc[r] = (acc[r] ?? 0) + 1;
          return acc;
        }, {});
        const eligibleGroups = Object.entries(rarityGroups).filter(([, c]) => c >= 3).length;
        if (eligibleGroups > 0) {
          return { summary: `${eligibleGroups} fusion${eligibleGroups === 1 ? '' : 's'} eligible` };
        }
        // Locked — render top counts as concrete unlock progress.
        const tally = Object.entries(rarityGroups)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([r, c]) => `${c} ${rarityNames[Number(r)] ?? '?'}`)
          .join(', ');
        return {
          summary: 'Forge totems together to create stronger ones',
          lockReason: tally
            ? `Need 3 totems of the same rarity. You have: ${tally}.`
            : 'Need 3 totems of the same rarity. Collect more totems to unlock.',
        };
      }

      case 'elder-tower': {
        // Locked until at least one Ascended (stage 4) totem exists.
        const ascended = totems.some((t) => (t.attributes?.stage ?? 0) >= 4);
        if (ascended) {
          // Seat data lives on totem.attributes.sanctum.seated when present.
          const seated = totems.filter((t) => t.attributes?.sanctum?.seated).length;
          return { summary: `${seated}/3 elder seats filled` };
        }
        const highest = totems.reduce(
          (top, t) => ((t.attributes?.stage ?? 0) > (top.attributes?.stage ?? 0) ? t : top),
          totems[0]
        );
        const stageName = ['Hatchling', 'Juvenile', 'Adult', 'Elder', 'Ascended'][highest?.attributes?.stage ?? 0];
        const topName = highest?.displayName || highest?.name;
        return {
          summary: 'Seat your most powerful elders',
          lockReason: highest
            ? `Need an Ascended (stage 4) totem. Highest: ${topName} (${stageName}).`
            : 'Need an Ascended totem. Raise totems through evolution to unlock.',
        };
      }

      case 'arena': {
        const challengeCount = Object.keys(challengeState.challenges ?? {}).length;
        if (challengeCount === 0) return { summary: 'Test your totems in challenges' };
        const withAttempts = Object.values(challengeState.userStatus ?? {}).filter(
          (s) => (s?.attemptsRemaining ?? 0) > 0
        ).length;
        return { summary: `${challengeCount} challenges · ${withAttempts} available now` };
      }

      case 'trailhead': {
        const userExps = expeditionState.userExpeditions ?? [];
        const active = userExps.filter((e) => !e.canClaim && !e.completed).length;
        const claimable = userExps.filter((e) => e.canClaim).length;
        if (active === 0 && claimable === 0) return { summary: 'Send your totems on expeditions' };
        const parts: string[] = [];
        if (active > 0) parts.push(`${active} active`);
        if (claimable > 0) parts.push(`${claimable} ready to claim`);
        return { summary: parts.join(' · ') };
      }

      default:
        return { summary: '' };
    }
  }, [buildingId, totems, user, essenceBalance, gemsBalance, rewardsState, expeditionState, challengeState, lootItems, dailyQuests, claimStatus]);
}
