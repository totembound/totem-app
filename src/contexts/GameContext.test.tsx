/**
 * GameContext tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ActionType } from '../types/types';

// Hoist mock variables so vi.mock factories can reference them
const { mockUseUser, mockUseAuth, mockApiClient, mockNotificationService } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockUseAuth: vi.fn(),
  mockApiClient: {
    isAuthenticated: vi.fn(),
    getChallenges: vi.fn(),
    completeChallenge: vi.fn(),
    getRewardStatus: vi.fn(),
    claimDailyReward: vi.fn(),
    claimWeeklyReward: vi.fn(),
    purchaseProtection: vi.fn(),
    setNickname: vi.fn(),
    getActiveExpeditions: vi.fn(),
    startExpedition: vi.fn(),
    claimExpeditionRewards: vi.fn(),
    getLootItems: vi.fn(),
    claimLootItem: vi.fn(),
    getCooldowns: vi.fn(),
    getProfile: vi.fn(),
  },
  mockNotificationService: {
    showRewardClaimed: vi.fn(),
    showExpeditionRewards: vi.fn(),
    processAchievementsFromResponse: vi.fn(),
  },
}));

// Mock UserContext
vi.mock('./UserContext', () => ({
  useUser: () => mockUseUser(),
}));

// Mock AuthContext
vi.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ApiClient
vi.mock('../services/ApiClient', () => ({
  default: mockApiClient,
}));

// Mock NotificationService
vi.mock('../services/NotificationService', () => ({
  default: mockNotificationService,
}));

// Mock totems util
vi.mock('../utils/totems', () => ({
  getTotemStage: vi.fn((totem: any) => (totem?.attributes?.stage || 0) + 1),
}));

import { GameProvider, useGame } from './GameContext';

const mockTotem = (overrides: any = {}) => ({
  id: 'totem-1',
  name: 'Test Totem',
  displayName: 'Stage 0 Goose',
  description: 'A test totem',
  image: '/test.png',
  affinity: 'Water',
  domain: 'Lake',
  attributes: {
    species: 0,
    color: 0,
    rarity: 0,
    happiness: 50,
    experience: 100,
    stage: 0,
    strength: 10,
    agility: 10,
    wisdom: 10,
    nickname: null,
    prestigeLevel: 0,
    ...overrides.attributes,
  },
  trackings: overrides.trackings || {},
  ...overrides,
});

const defaultUserState = {
  address: 'user-1',
  totems: [mockTotem()],
  updateBalances: vi.fn().mockResolvedValue(undefined),
  updateTotem: vi.fn().mockResolvedValue(undefined),
  fetchTotems: vi.fn().mockResolvedValue(undefined),
  updateTotemNickname: vi.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

// Helpers — challenges & rewards are lazy-loaded, so tests must trigger the fetch explicitly
const loadChallenges = async (result: { current: ReturnType<typeof useGame> }) => {
  await act(async () => { await result.current.refreshChallenges(); });
};

const loadRewards = async (result: { current: ReturnType<typeof useGame> }) => {
  await act(async () => { await result.current.refreshRewardStatus(); });
};

describe('GameContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockUseUser.mockReturnValue(defaultUserState);
    mockUseAuth.mockReturnValue({ user: { currencies: { essence: 1000, gems: 0 } }, isAuthenticated: true, isLoading: false });
    mockApiClient.isAuthenticated.mockReturnValue(true);

    // Default API responses
    mockApiClient.getChallenges.mockResolvedValue({ success: true, data: { challenges: [] } });
    mockApiClient.getRewardStatus.mockResolvedValue({
      success: true,
      data: {
        daily: { canClaim: true, streakDays: 3, bestStreak: 5 },
        weekly: { canClaim: false, weeklyStreak: 1, bestStreak: 2, isUnlocked: true },
      },
    });
    mockApiClient.getActiveExpeditions.mockResolvedValue({
      success: true,
      data: { expeditions: [] },
    });
    mockApiClient.getLootItems.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useGame', () => {
    it('should return working default implementations for all context functions', async () => {
      // Render without GameProvider to exercise default context values
      const { result } = renderHook(() => useGame());
      const ctx = result.current;

      // Default getFormattedWindowTimes
      const windowTimes = ctx.getFormattedWindowTimes();
      expect(windowTimes).toEqual({
        window1: 'Loading...',
        window2: 'Loading...',
        window3: 'Loading...',
      });

      // Default canUseAction
      expect(ctx.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 0, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.Feed,
      )).toBe(false);

      // Default getActionStatus
      expect(ctx.getActionStatus(
        ActionType.Feed,
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 0, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 },
        {} as any,
      )).toBe('Action not configured');

      // Default getNextAvailableWindow
      expect(ctx.getNextAvailableWindow({ lastUsed: 0, dailyUses: 0, dayStartTime: 0 }))
        .toBe('Available Now');

      // Default canAttemptChallenge
      expect(ctx.canAttemptChallenge('ch-1', 'totem-1')).toBe(false);

      // Default getEligibleTotems
      expect(ctx.getEligibleTotems('ch-1')).toEqual([]);

      // Default getChallengeStatus
      expect(ctx.getChallengeStatus('ch-1')).toBe('Challenge not available');

      // Default completeChallenge should throw
      await expect(ctx.completeChallenge('ch-1', 'totem-1', 50))
        .rejects.toThrow('Challenge system not initialized');

      // Default debugTimeWindow (no-op)
      ctx.debugTimeWindow();

      // Default refreshChallenges (no-op)
      await ctx.refreshChallenges();

      // Default getUserStreak
      const streak = await ctx.getUserStreak();
      expect(streak).toBeUndefined();

      // Default claimDailyReward
      const dailyResult = await ctx.claimDailyReward();
      expect(dailyResult).toBe(false);

      // Default claimWeeklyReward
      const weeklyResult = await ctx.claimWeeklyReward();
      expect(weeklyResult).toBe(false);

      // Default purchaseProtection
      const protectionResult = await ctx.purchaseProtection('daily', 1);
      expect(protectionResult).toBe(false);

      // Default refreshRewardStatus (no-op)
      await ctx.refreshRewardStatus();

      // Default setNickname (no-op)
      await ctx.setNickname('totem-1', 'test');

      // Default getUserRuneBalances (no-op)
      await ctx.getUserRuneBalances();

      // Default refreshExpeditions (no-op)
      await ctx.refreshExpeditions();

      // Default startExpedition
      const startResult = await ctx.startExpedition('exp-1', ['totem-1']);
      expect(startResult).toBe(false);

      // Default claimExpeditionRewards
      const claimResult = await ctx.claimExpeditionRewards('exp-1');
      expect(claimResult).toBe(false);

      // Default isTotemAvailable
      expect(ctx.isTotemAvailable('totem-1')).toBe(false);

      // Default showExpeditionEffect (no-op, returns undefined)
      expect(ctx.showExpeditionEffect({} as any)).toBeUndefined();

      // Default hideExpeditionEffect (no-op, returns undefined)
      expect(ctx.hideExpeditionEffect()).toBeUndefined();

      // Default fetchLootItems (no-op)
      await ctx.fetchLootItems();

      // Default claimLootItem
      const lootResult = await ctx.claimLootItem('loot-1');
      expect(lootResult).toBeUndefined();

      // Default getTotemCooldowns
      expect(ctx.getTotemCooldowns('t1')).toBeNull();

      // Default setTotemCooldowns (no-op)
      ctx.setTotemCooldowns('t1', {} as any);

      // Default fetchTotemCooldowns
      const cooldownResult = await ctx.fetchTotemCooldowns('t1');
      expect(cooldownResult).toBeNull();

      // Default state properties
      expect(ctx.challengeState).toEqual({
        challenges: {},
        userStatus: {},
        loading: false,
        error: null,
      });
      expect(ctx.rewardsState.streakStatus).toBeNull();
      expect(ctx.runeBalances).toEqual({ lesser: 0, greater: 0, ancient: 0 });
      expect(ctx.expeditionState.userExpeditions).toEqual([]);
      expect(ctx.activeExpeditionEffect).toBeNull();
      expect(ctx.lootItems).toEqual([]);
    });
  });

  describe('game config loading', () => {
    it('should load static game configs on mount', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      expect(result.current.gameParams).toEqual({
        signupReward: 2000,
        mintPrice: 0,
      });
      expect(result.current.timeWindows).toEqual({
        window1Start: 0,
        window2Start: 28800,
        window3Start: 57600,
      });
    });

    it('should set action configs for all action types', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const configs = result.current.actionConfigs;
      expect(configs[ActionType.Feed]).toBeDefined();
      expect(configs[ActionType.Feed].useTimeWindows).toBe(true);
      expect(configs[ActionType.Feed].enabled).toBe(true);

      expect(configs[ActionType.Train]).toBeDefined();
      expect(configs[ActionType.Train].cost).toBe(20);

      expect(configs[ActionType.Treat]).toBeDefined();
      expect(configs[ActionType.Treat].cooldown).toBe(14400);

      expect(configs[ActionType.Evolve]).toBeDefined();
      expect(configs[ActionType.Evolve].cost).toBe(0);

      expect(configs[ActionType.None]).toBeDefined();
      expect(configs[ActionType.None].enabled).toBe(false);
    });
  });

  describe('canUseAction', () => {
    it('should return false for ActionType.None (always disabled)', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.None,
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 }
      );
      expect(canUse).toBe(false);
    });

    it('should return false for disabled actions', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.None,
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 }
      );
      expect(canUse).toBe(false);
    });

    it('should return false when happiness too low', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      // Train requires minHappiness: 20
      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 10, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.Train,
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 }
      );
      expect(canUse).toBe(false);
    });

    it('should return false without tracking data', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.Train
      );
      expect(canUse).toBe(false);
    });

    it('should return false when on cooldown', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const now = Math.floor(Date.now() / 1000);

      // Treat has 4 hour cooldown (14400s), last used just now
      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.Treat,
        { lastUsed: now, dailyUses: 0, dayStartTime: 0 }
      );
      expect(canUse).toBe(false);
    });

    it('should return true when cooldown expired', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const now = Math.floor(Date.now() / 1000);

      // Treat has 4 hour cooldown (14400s), last used 5 hours ago
      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.Treat,
        { lastUsed: now - 18000, dailyUses: 0, dayStartTime: 0 }
      );
      expect(canUse).toBe(true);
    });

    it('should return false when daily limit reached', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const now = Math.floor(Date.now() / 1000);
      const today = Math.floor(now / 86400) * 86400;

      // Feed has maxDaily: 3
      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.Feed,
        { lastUsed: now - 7200, dailyUses: 3, dayStartTime: today }
      );
      expect(canUse).toBe(false);
    });
  });

  describe('getActionStatus', () => {
    it('should return "Action not configured" for null tracking', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      expect(result.current.getActionStatus(
        ActionType.Train,
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 0, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        null as any,
        result.current.actionConfigs[ActionType.Train]
      )).toBe('Action not configured');
    });

    it('should return happiness message when too low', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const status = result.current.getActionStatus(
        ActionType.Train,
        { species: 0, color: 0, rarity: 0, happiness: 10, experience: 0, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 },
        result.current.actionConfigs[ActionType.Train]
      );
      expect(status).toContain('Needs 20 happiness');
    });

    it('should return cooldown message when on cooldown', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const now = Math.floor(Date.now() / 1000);
      const status = result.current.getActionStatus(
        ActionType.Treat,
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 0, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        { lastUsed: now, dailyUses: 0, dayStartTime: 0 },
        result.current.actionConfigs[ActionType.Treat]
      );
      expect(status).toContain('Cooldown');
      expect(status).toContain('minute');
    });

    it('should return Available when action is ready', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const now = Math.floor(Date.now() / 1000);
      const status = result.current.getActionStatus(
        ActionType.Train,
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 0, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        { lastUsed: now - 7200, dailyUses: 0, dayStartTime: 0 },
        result.current.actionConfigs[ActionType.Train]
      );
      expect(status).toBe('Available');
    });
  });

  describe('getFormattedWindowTimes', () => {
    it('should return formatted UTC window times', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const times = result.current.getFormattedWindowTimes();
      expect(times.window1).toBe('UTC 00:00-08:00');
      expect(times.window2).toBe('UTC 08:00-16:00');
      expect(times.window3).toBe('UTC 16:00-24:00');
    });
  });

  describe('getNextAvailableWindow', () => {
    it('should return "Available Now" for different day', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const yesterday = Math.floor(Date.now() / 1000) - 86400;
      expect(result.current.getNextAvailableWindow({ lastUsed: yesterday, dailyUses: 0, dayStartTime: 0 }))
        .toBe('Available Now');
    });
  });

  describe('challenges', () => {
    it('should load challenges when refreshChallenges is called', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [
            {
              id: 'ch-1',
              name: 'Speed Run',
              description: 'Complete quickly',
              challengeType: 'speed',
              attribute: 'agility',
              requirements: { stage: 0, strength: 0, agility: 5, wisdom: 0 },
              maxDailyAttempts: 3,
              maxScore: 100,
              enabled: true,
              daily: { attemptsToday: 1, attemptsRemaining: 2 },
              progress: { highScore: 50, totalAttempts: 5, totalXpEarned: 200 },
            },
          ],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-1']).toBeDefined();
      });

      expect(result.current.challengeState.challenges['ch-1'].name).toBe('Speed Run');
      expect(result.current.challengeState.userStatus['ch-1'].highScore).toBe(50);
      expect(result.current.challengeState.userStatus['ch-1'].attemptsRemaining).toBe(2);
    });

    it('should handle challenge load failure', async () => {
      mockApiClient.getChallenges.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.error).toBe('Failed to load challenges');
      });
    });

    it('canAttemptChallenge should check requirements', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-1',
            name: 'Hard',
            challengeType: 'speed',
            requirements: { stage: 2, strength: 20, agility: 20, wisdom: 20 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 3 },
          }],
        },
      });

      // Totem doesn't meet requirements (stage 0, stats 10)
      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-1']).toBeDefined();
      });

      expect(result.current.canAttemptChallenge('ch-1', 'totem-1')).toBe(false);
    });

    it('getChallengeStatus should return status messages', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-1',
            name: 'Test',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 2 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-1']).toBeDefined();
      });

      expect(result.current.getChallengeStatus('ch-1')).toBe('2 attempts remaining');
      expect(result.current.getChallengeStatus('nonexistent')).toBe('Challenge not found');
    });

    it('completeChallenge should call API and refresh', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-1',
            name: 'Test',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 3 },
          }],
        },
      });

      const achievements = [{ achievementId: 'ach_first_challenge' }];
      mockApiClient.completeChallenge.mockResolvedValue({
        success: true,
        data: { achievements },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-1']).toBeDefined();
      });

      await act(async () => {
        await result.current.completeChallenge('ch-1', 'totem-1', 85);
      });

      expect(mockApiClient.completeChallenge).toHaveBeenCalledWith('ch-1', 'totem-1', 85);
      expect(mockNotificationService.processAchievementsFromResponse).toHaveBeenCalledWith(achievements);
    });

    it('completeChallenge should throw for unknown challenge', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await expect(
        act(async () => {
          await result.current.completeChallenge('nonexistent', 'totem-1', 50);
        })
      ).rejects.toThrow('Challenge not found');
    });
  });

  describe('rewards', () => {
    it('should load reward status when refreshRewardStatus is called', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await loadRewards(result);

      await waitFor(() => {
        expect(result.current.rewardsState.streakStatus).not.toBeNull();
      });

      expect(result.current.rewardsState.streakStatus?.canClaimToday).toBe(true);
      expect(result.current.rewardsState.streakStatus?.streakDays).toBe(3);
      expect(result.current.rewardsState.weeklyStatus?.canClaimWeekly).toBe(false);
      expect(result.current.rewardsState.hasWeeklyUnlocked).toBe(true);
    });

    it('claimDailyReward should call API and show notification', async () => {
      mockApiClient.claimDailyReward.mockResolvedValue({
        success: true,
        data: {
          reward: { amount: 100, streakDays: 4 },
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadRewards(result);

      await waitFor(() => {
        expect(result.current.rewardsState.streakStatus).not.toBeNull();
      });

      let success = false;
      await act(async () => {
        success = await result.current.claimDailyReward();
      });

      expect(success).toBe(true);
      expect(mockNotificationService.showRewardClaimed).toHaveBeenCalledWith({
        rewardType: 'daily',
        amount: 100,
        streakDays: 4,
        streakBonus: 0,
      });
      expect(defaultUserState.updateBalances).toHaveBeenCalled();
    });

    it('claimDailyReward should return false on API failure', async () => {
      mockApiClient.claimDailyReward.mockResolvedValue({
        success: false,
        error: 'Already claimed',
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = true;
      await act(async () => {
        success = await result.current.claimDailyReward();
      });

      expect(success).toBe(false);
    });

    it('claimWeeklyReward should call API and show notification', async () => {
      mockApiClient.claimWeeklyReward.mockResolvedValue({
        success: true,
        data: {
          reward: { essence: 500, amount: 500 },
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = false;
      await act(async () => {
        success = await result.current.claimWeeklyReward();
      });

      expect(success).toBe(true);
      expect(mockNotificationService.showRewardClaimed).toHaveBeenCalledWith({
        rewardType: 'weekly',
        amount: 500,
      });
    });

    it('purchaseProtection should call API and refresh', async () => {
      mockApiClient.purchaseProtection.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = false;
      await act(async () => {
        success = await result.current.purchaseProtection('daily', 1);
      });

      expect(success).toBe(true);
      expect(mockApiClient.purchaseProtection).toHaveBeenCalledWith('daily', 1);
      expect(defaultUserState.updateBalances).toHaveBeenCalled();
    });

    it('purchaseProtection should throw on failure', async () => {
      mockApiClient.purchaseProtection.mockResolvedValue({
        success: false,
        error: { message: 'Insufficient funds' },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await expect(
        act(async () => {
          await result.current.purchaseProtection('daily', 1);
        })
      ).rejects.toThrow('Insufficient funds');
    });
  });

  describe('setNickname', () => {
    it('should call API and update local state', async () => {
      mockApiClient.setNickname.mockResolvedValue({
        success: true,
        data: { nickname: 'Fluffy' },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        await result.current.setNickname('totem-1', 'Fluffy');
      });

      expect(mockApiClient.setNickname).toHaveBeenCalledWith('totem-1', 'Fluffy');
      expect(defaultUserState.updateTotemNickname).toHaveBeenCalledWith('totem-1', 'Fluffy');
    });

    it('should throw when not authenticated', async () => {
      mockApiClient.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useGame(), { wrapper });

      await expect(
        act(async () => {
          await result.current.setNickname('totem-1', 'Fluffy');
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw on API failure', async () => {
      mockApiClient.setNickname.mockResolvedValue({
        success: false,
        error: { message: 'Name too long' },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await expect(
        act(async () => {
          await result.current.setNickname('totem-1', 'A very long name that exceeds limits');
        })
      ).rejects.toThrow('Name too long');
    });
  });

  describe('expeditions', () => {
    it('should load active expeditions on mount', async () => {
      mockApiClient.getActiveExpeditions.mockResolvedValue({
        success: true,
        data: {
          expeditions: [
            {
              expeditionId: 'exp-1',
              totemIds: ['totem-1'],
              endsAt: '2025-01-01T12:00:00Z',
              canClaim: false,
            },
          ],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.expeditionState.userExpeditions).toHaveLength(1);
      });

      expect(result.current.expeditionState.userExpeditions[0].expeditionId).toBe('exp-1');
      expect(result.current.expeditionState.userExpeditions[0].totemIds).toEqual(['totem-1']);
    });

    it('startExpedition should call API and refresh', async () => {
      mockApiClient.startExpedition.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = false;
      await act(async () => {
        success = await result.current.startExpedition('exp-1', ['totem-1']);
      });

      expect(success).toBe(true);
      expect(mockApiClient.startExpedition).toHaveBeenCalledWith('exp-1', ['totem-1']);
    });

    it('startExpedition should return false on failure', async () => {
      mockApiClient.startExpedition.mockResolvedValue({
        success: false,
        error: { message: 'Totem busy' },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = true;
      await act(async () => {
        success = await result.current.startExpedition('exp-1', ['totem-1']);
      });

      expect(success).toBe(false);
    });

    it('claimExpeditionRewards should call API and show notification', async () => {
      mockApiClient.claimExpeditionRewards.mockResolvedValue({
        success: true,
        data: {
          rewards: { experience: 100, essence: 50, runes: { lesser: 1 }, score: 85 },
          expedition: { name: 'Forest Run', expeditionId: 'exp-1', totemIds: ['totem-1'] },
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = false;
      await act(async () => {
        success = await result.current.claimExpeditionRewards('exp-1');
      });

      expect(success).toBe(true);
      expect(mockNotificationService.showExpeditionRewards).toHaveBeenCalled();
      expect(mockNotificationService.processAchievementsFromResponse).toHaveBeenCalled();
    });

    it('isTotemAvailable should return false when on expedition', async () => {
      mockApiClient.getActiveExpeditions.mockResolvedValue({
        success: true,
        data: {
          expeditions: [{
            expeditionId: 'exp-1',
            totemIds: ['totem-1'],
            endsAt: '2099-01-01T00:00:00Z',
            canClaim: false,
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.expeditionState.userExpeditions).toHaveLength(1);
      });

      expect(result.current.isTotemAvailable('totem-1')).toBe(false);
      expect(result.current.isTotemAvailable('totem-2')).toBe(true);
    });
  });

  describe('expedition effects', () => {
    it('should show and hide expedition effect', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      expect(result.current.activeExpeditionEffect).toBeNull();

      const effectData = {
        expeditionId: 'exp-1',
        expeditionName: 'Forest Run',
        totemIds: ['t1'],
        experienceGained: 100,
        essenceGained: 50,
      };

      act(() => {
        result.current.showExpeditionEffect(effectData as any);
      });
      expect(result.current.activeExpeditionEffect).toEqual(effectData);

      act(() => {
        result.current.hideExpeditionEffect();
      });
      expect(result.current.activeExpeditionEffect).toBeNull();
    });
  });

  describe('loot items', () => {
    it('should fetch loot items', async () => {
      mockApiClient.getLootItems.mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: 'loot-1', boxId: 'box-1', source: 'expedition', status: 'pending', grantedAt: '2025-01-01', box: { id: 'box-1', name: 'Common Box', description: 'A box', icon: '/box.png', rarity: 'common', type: 'totem', config: { userChooses: [], randomized: ['species'] } } },
          ],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        await result.current.fetchLootItems();
      });

      expect(result.current.lootItems).toHaveLength(1);
      expect(result.current.lootItems[0].id).toBe('loot-1');
    });

    it('claimLootItem should remove from local state', async () => {
      mockApiClient.getLootItems.mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: 'loot-1', boxId: 'box-1', source: 'expedition', status: 'pending', grantedAt: '2025-01-01', box: { id: 'box-1', name: 'Box', description: '', icon: '', rarity: 'common', type: 'essence', config: { userChooses: [], randomized: [] } } },
          ],
        },
      });

      mockApiClient.claimLootItem.mockResolvedValue({
        success: true,
        data: { result: { type: 'essence', amount: 100 } },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        await result.current.fetchLootItems();
      });

      expect(result.current.lootItems).toHaveLength(1);

      await act(async () => {
        await result.current.claimLootItem('loot-1');
      });

      expect(result.current.lootItems).toHaveLength(0);
      expect(defaultUserState.updateBalances).toHaveBeenCalled();
    });

    it('claimLootItem should refresh totems for totem type', async () => {
      mockApiClient.claimLootItem.mockResolvedValue({
        success: true,
        data: { result: { type: 'totem', totemId: 'new-totem' } },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        await result.current.claimLootItem('loot-1');
      });

      expect(defaultUserState.fetchTotems).toHaveBeenCalled();
    });
  });

  describe('cooldown cache', () => {
    it('should get/set cooldowns from cache', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      expect(result.current.getTotemCooldowns('t1')).toBeNull();

      const cooldowns = {
        feed: { onCooldown: false, readyAt: null, remainingMs: 0 },
        train: { onCooldown: true, readyAt: new Date(), remainingMs: 3600000 },
        treat: { onCooldown: false, readyAt: null, remainingMs: 0 },
      };

      act(() => {
        result.current.setTotemCooldowns('t1', cooldowns);
      });

      expect(result.current.getTotemCooldowns('t1')).toEqual(cooldowns);
    });

    it('fetchTotemCooldowns should call API and cache result', async () => {
      const readyAt = '2025-01-01T12:00:00Z';
      mockApiClient.getCooldowns.mockResolvedValue({
        success: true,
        data: {
          cooldowns: {
            feed: { onCooldown: false, readyAt: null, remainingMs: 0 },
            train: { onCooldown: true, readyAt, remainingMs: 3600000 },
            treat: { onCooldown: false, readyAt: null, remainingMs: 0 },
          },
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      let cooldowns: any;
      await act(async () => {
        cooldowns = await result.current.fetchTotemCooldowns('t1');
      });

      expect(cooldowns).not.toBeNull();
      expect(cooldowns.train.onCooldown).toBe(true);
      expect(cooldowns.train.readyAt).toEqual(new Date(readyAt));

      // Cached - should not call API again
      mockApiClient.getCooldowns.mockClear();
      await act(async () => {
        cooldowns = await result.current.fetchTotemCooldowns('t1');
      });
      expect(mockApiClient.getCooldowns).not.toHaveBeenCalled();
    });

    it('fetchTotemCooldowns should return null on API failure', async () => {
      mockApiClient.getCooldowns.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useGame(), { wrapper });

      let cooldowns: any;
      await act(async () => {
        cooldowns = await result.current.fetchTotemCooldowns('t-fail');
      });

      expect(cooldowns).toBeNull();
    });
  });

  describe('state cleanup on logout', () => {
    it('should clear user-specific state when address changes to empty', async () => {
      const { result, rerender } = renderHook(() => useGame(), { wrapper });

      // Simulate logout
      mockUseUser.mockReturnValue({ ...defaultUserState, address: '' });
      mockApiClient.isAuthenticated.mockReturnValue(false);
      rerender();

      await waitFor(() => {
        expect(result.current.rewardsState.streakStatus).toBeNull();
      });
    });
  });

  describe('debugTimeWindow', () => {
    it('should log current UTC time window info', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      // Call debugTimeWindow - it only logs, so just verify it doesn't throw
      act(() => {
        result.current.debugTimeWindow();
      });

      expect(console.log).toHaveBeenCalledWith(
        'Current UTC Time:',
        expect.objectContaining({
          time: expect.any(String),
          hoursUTC: expect.any(Number),
          secondsSinceMidnight: expect.any(Number),
          currentWindow: expect.stringMatching(/Window [123]/),
        })
      );
    });
  });

  describe('refreshChallenges', () => {
    it('should reload challenges from API when called directly', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: { challenges: [] },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      // Now set up a new challenge response
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-new',
            name: 'New Challenge',
            challengeType: 'wisdom',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 5,
            enabled: true,
            daily: { attemptsRemaining: 5 },
          }],
        },
      });

      await act(async () => {
        await result.current.refreshChallenges();
      });

      expect(result.current.challengeState.challenges['ch-new']).toBeDefined();
      expect(result.current.challengeState.challenges['ch-new'].name).toBe('New Challenge');
    });

    it('should not fetch challenges when not authenticated', async () => {
      mockApiClient.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useGame(), { wrapper });

      mockApiClient.getChallenges.mockClear();

      await act(async () => {
        await result.current.refreshChallenges();
      });

      expect(mockApiClient.getChallenges).not.toHaveBeenCalled();
    });

    it('should handle non-success API response', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: false,
        error: { message: 'Server error' },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.error).toBe('Failed to load challenges');
      });
    });
  });

  describe('getEligibleTotems', () => {
    it('should return totems that meet challenge requirements', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-easy',
            name: 'Easy',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 3 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-easy']).toBeDefined();
      });

      const eligible = result.current.getEligibleTotems('ch-easy');
      // Default totem should be eligible (stage 0, all stats 10, getTotemStage returns stage+1=1 >= 0)
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe('totem-1');
    });

    it('should return empty array when no totems meet requirements', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-hard',
            name: 'Hard',
            challengeType: 'speed',
            requirements: { stage: 5, strength: 100, agility: 100, wisdom: 100 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 3 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-hard']).toBeDefined();
      });

      const eligible = result.current.getEligibleTotems('ch-hard');
      expect(eligible).toHaveLength(0);
    });

    it('should return empty array for nonexistent challenge', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const eligible = result.current.getEligibleTotems('nonexistent');
      expect(eligible).toHaveLength(0);
    });
  });

  describe('getUserStreak', () => {
    it('should return cached streak status if available', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await loadRewards(result);

      await waitFor(() => {
        expect(result.current.rewardsState.streakStatus).not.toBeNull();
      });

      // streakStatus is already loaded from the initial mount
      let streak: any;
      await act(async () => {
        streak = await result.current.getUserStreak();
      });

      expect(streak).toBeDefined();
      expect(streak.streakDays).toBe(3);
      expect(streak.canClaimToday).toBe(true);
    });

    it('should fetch from API when no cached streak exists', async () => {
      // Return no initial reward status (so streakStatus stays null)
      mockApiClient.getRewardStatus.mockResolvedValue({
        success: false,
        error: 'Not available',
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      // Now set up a successful response for getUserStreak call
      mockApiClient.getRewardStatus.mockResolvedValue({
        success: true,
        data: {
          daily: { canClaim: false, streakDays: 7, bestStreak: 10 },
          weekly: { canClaim: true, weeklyStreak: 2, bestStreak: 3, isUnlocked: true },
        },
      });

      let streak: any;
      await act(async () => {
        streak = await result.current.getUserStreak();
      });

      expect(streak).toBeDefined();
      expect(streak.streakDays).toBe(7);
    });
  });

  describe('refreshRewardStatus', () => {
    it('should skip API call when reward status is already cached', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await loadRewards(result);

      await waitFor(() => {
        expect(result.current.rewardsState.streakStatus).not.toBeNull();
      });

      const callCountBefore = mockApiClient.getRewardStatus.mock.calls.length;

      // Second call should be a cache hit — no new API call
      await act(async () => {
        await result.current.refreshRewardStatus();
      });

      expect(mockApiClient.getRewardStatus.mock.calls.length).toBe(callCountBefore);
      // Data unchanged (still from first load)
      expect(result.current.rewardsState.streakStatus?.streakDays).toBe(3);
    });

    it('should handle API failure gracefully', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      mockApiClient.getRewardStatus.mockResolvedValue({
        success: false,
        error: 'Server error',
      });

      // Should not throw
      await act(async () => {
        await result.current.refreshRewardStatus();
      });
    });
  });

  describe('runeBalances from auth user', () => {
    it('should sync rune balances from auth user currencies', async () => {
      mockUseAuth.mockReturnValue({
        user: { currencies: { essence: 1000, gems: 0, runes: { lesser: 3, greater: 1, ancient: 0 } } },
        isAuthenticated: true,
        isLoading: false,
      });
      const { result } = renderHook(() => useGame(), { wrapper });

      expect(result.current.runeBalances).toEqual({ lesser: 3, greater: 1, ancient: 0 });
    });
  });

  describe('refreshExpeditions', () => {
    it('should reload active expeditions from API when called directly', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      // Set up new expedition data
      mockApiClient.getActiveExpeditions.mockResolvedValue({
        success: true,
        data: {
          expeditions: [
            {
              expeditionId: 'exp-new',
              totemIds: ['totem-2'],
              endsAt: '2099-01-01T00:00:00Z',
              canClaim: true,
            },
          ],
        },
      });

      await act(async () => {
        await result.current.refreshExpeditions();
      });

      expect(result.current.expeditionState.userExpeditions).toHaveLength(1);
      expect(result.current.expeditionState.userExpeditions[0].expeditionId).toBe('exp-new');
      expect(result.current.expeditionState.userExpeditions[0].canClaim).toBe(true);
    });

    it('should not fetch when not authenticated', async () => {
      mockApiClient.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useGame(), { wrapper });

      mockApiClient.getActiveExpeditions.mockClear();

      await act(async () => {
        await result.current.refreshExpeditions();
      });

      expect(mockApiClient.getActiveExpeditions).not.toHaveBeenCalled();
    });

    it('should handle expedition load failure', async () => {
      mockApiClient.getActiveExpeditions.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.expeditionState.error).toBe('Failed to load expeditions');
      });
    });
  });

  describe('additional getActionStatus branches', () => {
    it('should return "Action disabled" for disabled config', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const status = result.current.getActionStatus(
        ActionType.None,
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 0, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 },
        result.current.actionConfigs[ActionType.None]
      );
      expect(status).toBe('Action disabled');
    });

    it('should return time window status for Feed when all windows used', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const now = Math.floor(Date.now() / 1000);
      const today = Math.floor(now / 86400) * 86400;

      // Feed uses time windows, not daily limit — status reflects window availability
      const status = result.current.getActionStatus(
        ActionType.Feed,
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 0, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        { lastUsed: now, dailyUses: 3, dayStartTime: today },
        result.current.actionConfigs[ActionType.Feed]
      );
      // Feed returns time window status, not daily limit
      expect(status).toMatch(/time window/i);
    });

    it('should return time window status for Feed action', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      const _now = Math.floor(Date.now() / 1000);
      const status = result.current.getActionStatus(
        ActionType.Feed,
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 0, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 },
        result.current.actionConfigs[ActionType.Feed]
      );
      // Feed uses time windows, should return one of the window statuses
      expect(status).toMatch(/Available in current time window|Next time window/);
    });
  });

  describe('additional getNextAvailableWindow branches', () => {
    it('should return next window time for same-day tracking', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      // Use lastUsed = now (same day, same second), to test non-"Available Now" branches
      const now = Math.floor(Date.now() / 1000);
      const windowResult = result.current.getNextAvailableWindow({
        lastUsed: now,
        dailyUses: 1,
        dayStartTime: 0,
      });

      // Should return a specific window time depending on current UTC hour
      expect(windowResult).toMatch(/08:00 UTC|16:00 UTC|00:00 UTC \(Next Day\)/);
    });
  });

  describe('additional canAttemptChallenge branches', () => {
    it('should return true when totem meets all requirements', async () => {
      mockUseUser.mockReturnValue({
        ...defaultUserState,
        totems: [mockTotem({
          attributes: { stage: 2, strength: 20, agility: 20, wisdom: 20, happiness: 50, experience: 500 },
        })],
      });

      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-1',
            name: 'Medium',
            challengeType: 'speed',
            requirements: { stage: 1, strength: 15, agility: 15, wisdom: 15 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 2 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-1']).toBeDefined();
      });

      expect(result.current.canAttemptChallenge('ch-1', 'totem-1')).toBe(true);
    });

    it('should return false when no attempts remaining', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-1',
            name: 'Done',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 0 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-1']).toBeDefined();
      });

      expect(result.current.canAttemptChallenge('ch-1', 'totem-1')).toBe(false);
    });

    it('should return false for nonexistent challenge', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      expect(result.current.canAttemptChallenge('nonexistent', 'totem-1')).toBe(false);
    });

    it('should return false for nonexistent totem', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-1',
            name: 'Test',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 3 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-1']).toBeDefined();
      });

      expect(result.current.canAttemptChallenge('ch-1', 'nonexistent-totem')).toBe(false);
    });

    it('should return false for disabled challenge', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-disabled',
            name: 'Disabled',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: false,
            daily: { attemptsRemaining: 3 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-disabled']).toBeDefined();
      });

      expect(result.current.canAttemptChallenge('ch-disabled', 'totem-1')).toBe(false);
    });
  });

  describe('additional getChallengeStatus branches', () => {
    it('should return "Challenge disabled" for disabled challenge', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-off',
            name: 'Off',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: false,
            daily: { attemptsRemaining: 0 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-off']).toBeDefined();
      });

      expect(result.current.getChallengeStatus('ch-off')).toBe('Challenge disabled');
    });

    it('should return "No attempts remaining today" when exhausted', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-exhausted',
            name: 'Exhausted',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 0 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-exhausted']).toBeDefined();
      });

      expect(result.current.getChallengeStatus('ch-exhausted')).toBe('No attempts remaining today');
    });
  });

  describe('additional completeChallenge branches', () => {
    it('should throw for disabled challenge', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-dis',
            name: 'Disabled',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: false,
            daily: { attemptsRemaining: 3 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-dis']).toBeDefined();
      });

      await expect(
        act(async () => {
          await result.current.completeChallenge('ch-dis', 'totem-1', 50);
        })
      ).rejects.toThrow('Challenge disabled');
    });

    it('should throw on API failure from completeChallenge', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-1',
            name: 'Test',
            challengeType: 'speed',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 3,
            enabled: true,
            daily: { attemptsRemaining: 3 },
          }],
        },
      });

      mockApiClient.completeChallenge.mockResolvedValue({
        success: false,
        error: { message: 'Score too low' },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-1']).toBeDefined();
      });

      await expect(
        act(async () => {
          await result.current.completeChallenge('ch-1', 'totem-1', 50);
        })
      ).rejects.toThrow('Score too low');
    });
  });

  describe('additional claimDailyReward branches', () => {
    it('should return false on thrown error', async () => {
      mockApiClient.claimDailyReward.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = true;
      await act(async () => {
        success = await result.current.claimDailyReward();
      });

      expect(success).toBe(false);
    });

    it('should handle claimDailyReward with no reward data in response', async () => {
      mockApiClient.claimDailyReward.mockResolvedValue({
        success: true,
        data: {},
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = false;
      await act(async () => {
        success = await result.current.claimDailyReward();
      });

      expect(success).toBe(true);
      // Notification should NOT be shown when no reward data
      expect(mockNotificationService.showRewardClaimed).not.toHaveBeenCalled();
    });
  });

  describe('additional claimWeeklyReward branches', () => {
    it('should return false on API failure', async () => {
      mockApiClient.claimWeeklyReward.mockResolvedValue({
        success: false,
        error: 'Already claimed',
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = true;
      await act(async () => {
        success = await result.current.claimWeeklyReward();
      });

      expect(success).toBe(false);
    });

    it('should return false on thrown error', async () => {
      mockApiClient.claimWeeklyReward.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = true;
      await act(async () => {
        success = await result.current.claimWeeklyReward();
      });

      expect(success).toBe(false);
    });
  });

  describe('additional claimExpeditionRewards branches', () => {
    it('should return false on API failure', async () => {
      mockApiClient.claimExpeditionRewards.mockResolvedValue({
        success: false,
        error: { message: 'Not ready' },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = true;
      await act(async () => {
        success = await result.current.claimExpeditionRewards('exp-1');
      });

      expect(success).toBe(false);
    });

    it('should return false on thrown error', async () => {
      mockApiClient.claimExpeditionRewards.mockRejectedValue(new Error('Network'));

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = true;
      await act(async () => {
        success = await result.current.claimExpeditionRewards('exp-1');
      });

      expect(success).toBe(false);
    });
  });

  describe('additional claimLootItem branches', () => {
    it('should not call API when not authenticated', async () => {
      mockApiClient.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useGame(), { wrapper });

      mockApiClient.claimLootItem.mockClear();

      await act(async () => {
        await result.current.claimLootItem('loot-1');
      });

      expect(mockApiClient.claimLootItem).not.toHaveBeenCalled();
    });

    it('should throw on API failure', async () => {
      mockApiClient.claimLootItem.mockResolvedValue({
        success: false,
        error: { message: 'Item expired' },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await expect(
        act(async () => {
          await result.current.claimLootItem('loot-1');
        })
      ).rejects.toThrow('Item expired');
    });

    it('should pass speciesId option when claiming', async () => {
      mockApiClient.claimLootItem.mockResolvedValue({
        success: true,
        data: { result: { type: 'totem', totemId: 't-new' } },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        await result.current.claimLootItem('loot-1', { speciesId: 5 });
      });

      expect(mockApiClient.claimLootItem).toHaveBeenCalledWith('loot-1', { speciesId: 5 });
    });
  });

  describe('additional fetchLootItems branches', () => {
    it('should not fetch when not authenticated', async () => {
      mockApiClient.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useGame(), { wrapper });

      mockApiClient.getLootItems.mockClear();

      await act(async () => {
        await result.current.fetchLootItems();
      });

      expect(mockApiClient.getLootItems).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully', async () => {
      mockApiClient.getLootItems.mockRejectedValue(new Error('Network'));

      const { result } = renderHook(() => useGame(), { wrapper });

      // Should not throw
      await act(async () => {
        await result.current.fetchLootItems();
      });

      expect(result.current.lootItems).toHaveLength(0);
    });
  });

  describe('additional canUseAction branches', () => {
    it('should handle Feed action with time windows', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      // Feed uses time windows; lastUsed = 0 means different day, so should be true
      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 50, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.Feed,
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 }
      );
      expect(canUse).toBe(true);
    });

    it('should return true for Evolve when happiness meets min requirement', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      // Evolve requires minHappiness: 50, no cooldown, no daily limit
      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 60, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.Evolve,
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 }
      );
      expect(canUse).toBe(true);
    });

    it('should return false for Evolve when happiness below minimum', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      // Evolve requires minHappiness: 30
      const canUse = result.current.canUseAction(
        { species: 0, color: 0, rarity: 0, happiness: 20, experience: 100, stage: 0, strength: 10, agility: 10, wisdom: 10, nickname: null, prestigeLevel: 0 },
        ActionType.Evolve,
        { lastUsed: 0, dailyUses: 0, dayStartTime: 0 }
      );
      expect(canUse).toBe(false);
    });
  });

  describe('challenge loading with array format', () => {
    it('should handle challenges returned as top-level array', async () => {
      // Test the Array.isArray branch
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'ch-arr',
            name: 'Array Challenge',
            challengeType: 'wisdom',
            attribute: 'wisdom',
            requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
            maxDailyAttempts: 2,
            maxScore: 80,
            enabled: true,
            daily: { attemptsToday: 0, attemptsRemaining: 2 },
            progress: { lastAttemptAt: '2025-06-01T12:00:00Z', highScore: 70, totalAttempts: 3, totalXpEarned: 150 },
          },
        ],
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-arr']).toBeDefined();
      });

      expect(result.current.challengeState.challenges['ch-arr'].name).toBe('Array Challenge');
      expect(result.current.challengeState.challenges['ch-arr'].maxDailyAttempts).toBe(2);
      expect(result.current.challengeState.userStatus['ch-arr'].highScore).toBe(70);
      expect(result.current.challengeState.userStatus['ch-arr'].totalScore).toBe(150);
    });

    it('should handle challenges with userStatus fallback fields', async () => {
      mockApiClient.getChallenges.mockResolvedValue({
        success: true,
        data: {
          challenges: [{
            id: 'ch-fallback',
            name: 'Fallback',
            type: 'speed',       // uses 'type' instead of 'challengeType'
            affinity: 'fire',    // uses 'affinity' instead of 'attribute'
            maxDailyAttempts: 3,
            enabled: true,
            userStatus: { highScore: 42, totalAttempts: 7, totalScore: 300 },
          }],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await loadChallenges(result);

      await waitFor(() => {
        expect(result.current.challengeState.challenges['ch-fallback']).toBeDefined();
      });

      expect(result.current.challengeState.challenges['ch-fallback'].challengeType).toBe('speed');
      expect(result.current.challengeState.challenges['ch-fallback'].attribute).toBe('fire');
      expect(result.current.challengeState.userStatus['ch-fallback'].highScore).toBe(42);
      expect(result.current.challengeState.userStatus['ch-fallback'].totalAttempts).toBe(7);
      expect(result.current.challengeState.userStatus['ch-fallback'].totalScore).toBe(300);
    });
  });

  describe('setNickname empty string', () => {
    it('should trim and pass null for empty nickname', async () => {
      mockApiClient.setNickname.mockResolvedValue({
        success: true,
        data: { nickname: null },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await act(async () => {
        await result.current.setNickname('totem-1', '   ');
      });

      // Trimmed empty string should pass null
      expect(mockApiClient.setNickname).toHaveBeenCalledWith('totem-1', null);
      expect(defaultUserState.updateTotemNickname).toHaveBeenCalledWith('totem-1', null);
    });
  });

  describe('expedition load with totemId fallback', () => {
    it('should use totemId fallback when totemIds not provided', async () => {
      mockApiClient.getActiveExpeditions.mockResolvedValue({
        success: true,
        data: {
          expeditions: [
            {
              expeditionId: 'exp-legacy',
              totemId: 'totem-legacy',
              endTime: 1700000000,
              canClaim: true,
            },
          ],
        },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.expeditionState.userExpeditions).toHaveLength(1);
      });

      expect(result.current.expeditionState.userExpeditions[0].captainId).toBe('totem-legacy');
      expect(result.current.expeditionState.userExpeditions[0].totemIds).toEqual(['totem-legacy']);
      expect(result.current.expeditionState.userExpeditions[0].endTime).toBe(1700000000);
    });
  });

  describe('expedition non-success API response', () => {
    it('should handle non-success response from getActiveExpeditions', async () => {
      mockApiClient.getActiveExpeditions.mockResolvedValue({
        success: false,
        error: { message: 'Unauthorized' },
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.expeditionState.error).toBe('Failed to load expeditions');
      });
    });
  });

  describe('claimExpeditionRewards with no rewards data', () => {
    it('should succeed without showing notification when no rewards', async () => {
      mockApiClient.claimExpeditionRewards.mockResolvedValue({
        success: true,
        data: {},
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = false;
      await act(async () => {
        success = await result.current.claimExpeditionRewards('exp-1');
      });

      expect(success).toBe(true);
      expect(mockNotificationService.showExpeditionRewards).not.toHaveBeenCalled();
    });
  });

  describe('purchaseProtection weekly type', () => {
    it('should refresh weekly status for weekly protection', async () => {
      mockApiClient.purchaseProtection.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useGame(), { wrapper });

      let success = false;
      await act(async () => {
        success = await result.current.purchaseProtection('weekly', 1);
      });

      expect(success).toBe(true);
      expect(mockApiClient.purchaseProtection).toHaveBeenCalledWith('weekly', 1);
    });
  });

  describe('fetchTotemCooldowns dedup', () => {
    it('should dedup concurrent fetches for same totem', async () => {
      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise((resolve) => { resolveFirst = resolve; });

      mockApiClient.getCooldowns.mockImplementation(() => firstPromise);

      const { result } = renderHook(() => useGame(), { wrapper });

      // Start two concurrent fetches for the same totem
      let _cooldowns1: any, _cooldowns2: any;
      const p1 = act(async () => {
        _cooldowns1 = await result.current.fetchTotemCooldowns('t-dedup');
      });
      const p2 = act(async () => {
        _cooldowns2 = await result.current.fetchTotemCooldowns('t-dedup');
      });

      // Resolve the API call
      resolveFirst!({
        success: true,
        data: {
          cooldowns: {
            feed: { onCooldown: false, readyAt: null, remainingMs: 0 },
            train: { onCooldown: false, readyAt: null, remainingMs: 0 },
            treat: { onCooldown: false, readyAt: null, remainingMs: 0 },
          },
        },
      });

      await p1;
      await p2;

      // API should only be called once despite two concurrent requests
      expect(mockApiClient.getCooldowns).toHaveBeenCalledTimes(1);
    });
  });
});
