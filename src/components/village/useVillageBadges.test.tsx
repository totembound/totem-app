import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Hoisted mocks so they're in scope when vi.mock factories run.
const mockUser = vi.hoisted(() => ({ totems: [] as any[] }));
const mockGame = vi.hoisted(() => ({
  rewardsState: {
    streakStatus: { canClaimToday: false, streakDays: 0, bestStreak: 0 },
    weeklyStatus: { canClaimWeekly: false },
    hasWeeklyUnlocked: false,
  },
  expeditionState: { userExpeditions: [] as any[] },
  challengeState: {},
  lootItems: [] as any[],
  dailyQuests: null as any,
}));
const mockTutorialClaims = vi.hoisted(() => ({
  claimStatus: {} as Record<string, boolean>,
}));

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => mockUser,
}));

vi.mock('../../contexts/GameContext', () => ({
  useGame: () => mockGame,
}));

vi.mock('../guides/useTutorialClaims', () => ({
  useTutorialClaims: () => mockTutorialClaims,
}));

import { useVillageBadges } from './useVillageBadges';

const totem = (rarity: number, stage = 0) => ({ attributes: { rarity, stage } });

describe('useVillageBadges', () => {
  beforeEach(() => {
    mockUser.totems = [];
    mockGame.rewardsState = {
      streakStatus: { canClaimToday: false, streakDays: 0, bestStreak: 0 },
      weeklyStatus: { canClaimWeekly: false },
      hasWeeklyUnlocked: false,
    };
    mockGame.expeditionState = { userExpeditions: [] };
    mockGame.challengeState = {};
    mockGame.lootItems = [];
    mockGame.dailyQuests = null;
    mockTutorialClaims.claimStatus = {};
  });

  describe('shrine badge', () => {
    it('shows no badge when nothing is claimable', () => {
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current.shrine.badge).toBeUndefined();
    });

    it('counts a claimable daily reward', () => {
      mockGame.rewardsState.streakStatus.canClaimToday = true;
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current.shrine.badge).toBe(1);
    });

    it('counts daily + weekly only when weekly is also unlocked', () => {
      mockGame.rewardsState.streakStatus.canClaimToday = true;
      mockGame.rewardsState.weeklyStatus.canClaimWeekly = true;
      mockGame.rewardsState.hasWeeklyUnlocked = true;
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current.shrine.badge).toBe(2);
    });

    it('suppresses the phantom weekly badge when canClaimWeekly is true but tier is locked', () => {
      // Regression: API returns canClaimWeekly=true before the player has
      // actually unlocked the weekly tier. Without the hasWeeklyUnlocked
      // gate, the badge falsely advertises a claim the user cannot make.
      mockGame.rewardsState.weeklyStatus.canClaimWeekly = true;
      mockGame.rewardsState.hasWeeklyUnlocked = false;
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current.shrine.badge).toBeUndefined();
    });
  });

  describe('trailhead badge', () => {
    it('counts only expeditions that are ready to claim', () => {
      mockGame.expeditionState.userExpeditions = [
        { canClaim: true },
        { canClaim: false },
        { canClaim: true },
      ];
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current.trailhead.badge).toBe(2);
    });

    it('omits the badge when no expedition is ready', () => {
      mockGame.expeditionState.userExpeditions = [{ canClaim: false }];
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current.trailhead.badge).toBeUndefined();
    });
  });

  describe('forge lock state', () => {
    it('is locked with no fusion-eligible rarity group', () => {
      mockUser.totems = [totem(0), totem(1), totem(2)]; // three different rarities
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current.forge.locked).toBe(true);
      expect(result.current.forge.lockMessage).toMatch(/3 totems of the same rarity/i);
      expect(result.current.forge.badge).toBeUndefined();
    });

    it('unlocks and counts eligible groups when ≥3 totems share a rarity', () => {
      mockUser.totems = [totem(0), totem(0), totem(0), totem(2), totem(2), totem(2)];
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current.forge.locked).toBe(false);
      expect(result.current.forge.badge).toBe(2);
    });

    it('treats undefined rarity as rarity 0', () => {
      mockUser.totems = [{ attributes: {} }, { attributes: {} }, { attributes: {} }] as any[];
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current.forge.locked).toBe(false);
      expect(result.current.forge.badge).toBe(1);
    });
  });

  describe('elder tower lock state', () => {
    it('is locked when no ascended totem exists', () => {
      mockUser.totems = [totem(0, 3), totem(2, 2)];
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current['elder-tower'].locked).toBe(true);
      expect(result.current['elder-tower'].lockMessage).toMatch(/Ascended totem/i);
    });

    it('unlocks once any totem reaches stage 4', () => {
      mockUser.totems = [totem(0, 1), totem(3, 4)];
      const { result } = renderHook(() => useVillageBadges());
      expect(result.current['elder-tower'].locked).toBe(false);
    });
  });

  describe('deferred buildings', () => {
    it('emits empty state for library, hall, bazaar, sanctuary, hearthstone, arena', () => {
      const { result } = renderHook(() => useVillageBadges());
      for (const id of ['library', 'hall-of-legends', 'bazaar', 'sanctuary', 'hearthstone', 'arena']) {
        expect(result.current[id]).toEqual({});
      }
    });
  });
});
