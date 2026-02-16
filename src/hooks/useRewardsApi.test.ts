/**
 * useRewardsApi hook tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRewardsApi } from './useRewardsApi';

// Mock ApiClient
vi.mock('../services/ApiClient', () => ({
  default: {
    getRewardStatus: vi.fn(),
    claimDailyReward: vi.fn(),
    claimWeeklyReward: vi.fn(),
  },
}));

// Mock NotificationService
vi.mock('../services/NotificationService', () => ({
  notificationService: {
    showRewardClaimed: vi.fn(),
    processAchievementsFromResponse: vi.fn(),
  },
}));

import apiClient from '../services/ApiClient';

const mockRewardStatusResponse = {
  success: true,
  data: {
    daily: {
      canClaim: true,
      streakDays: 5,
      bestStreak: 10,
      nextClaimTime: '2024-01-16T00:00:00Z',
      isProtected: false,
      protectionExpiry: null,
    },
    weekly: {
      canClaim: false,
      weeklyStreak: 2,
      bestStreak: 4,
      nextClaimTime: '2024-01-22T00:00:00Z',
      isProtected: false,
      protectionExpiry: null,
      isUnlocked: true,
    },
  },
};

describe('useRewardsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRewardStatus', () => {
    it('should fetch and store reward status', async () => {
      (apiClient.getRewardStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockRewardStatusResponse);

      const { result } = renderHook(() => useRewardsApi());

      let status: any;
      await act(async () => {
        status = await result.current.getRewardStatus();
      });

      expect(status).not.toBeNull();
      expect(status.daily.canClaim).toBe(true);
      expect(status.daily.streakDays).toBe(5);
      expect(status.daily.nextClaimTime).toBeInstanceOf(Date);
      expect(status.weekly.canClaim).toBe(false);
      expect(status.weekly.weeklyStreak).toBe(2);
      expect(status.weekly.isUnlocked).toBe(true);
      expect(result.current.rewardStatus).toEqual(status);
    });

    it('should return null on failure', async () => {
      (apiClient.getRewardStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => useRewardsApi());

      let status: any;
      await act(async () => {
        status = await result.current.getRewardStatus();
      });

      expect(status).toBeNull();
    });

    it('should handle exception', async () => {
      (apiClient.getRewardStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useRewardsApi());

      let status: any;
      await act(async () => {
        status = await result.current.getRewardStatus();
      });

      expect(status).toBeNull();
      expect(result.current.error).toBe('fail');
    });
  });

  describe('claimDailyReward', () => {
    it('should claim and return result', async () => {
      (apiClient.claimDailyReward as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          reward: { amount: 100, streakDays: 6 },
          message: 'Daily reward claimed!',
        },
      });
      (apiClient.getRewardStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockRewardStatusResponse);

      const { result } = renderHook(() => useRewardsApi());

      let claimResult: any;
      await act(async () => {
        claimResult = await result.current.claimDailyReward();
      });

      expect(claimResult.success).toBe(true);
      expect(claimResult.amount).toBe(100);
      expect(claimResult.streakDays).toBe(6);
      // Should refresh status after claim
      expect(apiClient.getRewardStatus).toHaveBeenCalled();
    });

    it('should return error on failure', async () => {
      (apiClient.claimDailyReward as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Already claimed today' },
      });

      const { result } = renderHook(() => useRewardsApi());

      let claimResult: any;
      await act(async () => {
        claimResult = await result.current.claimDailyReward();
      });

      expect(claimResult.success).toBe(false);
      expect(claimResult.error).toBe('Already claimed today');
    });

    it('should handle exception', async () => {
      (apiClient.claimDailyReward as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network'));

      const { result } = renderHook(() => useRewardsApi());

      let claimResult: any;
      await act(async () => {
        claimResult = await result.current.claimDailyReward();
      });

      expect(claimResult.success).toBe(false);
      expect(claimResult.error).toBe('Network');
    });
  });

  describe('claimWeeklyReward', () => {
    it('should claim weekly and return result', async () => {
      (apiClient.claimWeeklyReward as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          reward: { amount: 500, weeklyStreak: 3 },
          message: 'Weekly reward claimed!',
        },
      });
      (apiClient.getRewardStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockRewardStatusResponse);

      const { result } = renderHook(() => useRewardsApi());

      let claimResult: any;
      await act(async () => {
        claimResult = await result.current.claimWeeklyReward();
      });

      expect(claimResult.success).toBe(true);
      expect(claimResult.amount).toBe(500);
    });

    it('should return error on failure', async () => {
      (apiClient.claimWeeklyReward as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Weekly not available' },
      });

      const { result } = renderHook(() => useRewardsApi());

      let claimResult: any;
      await act(async () => {
        claimResult = await result.current.claimWeeklyReward();
      });

      expect(claimResult.success).toBe(false);
      expect(claimResult.error).toBe('Weekly not available');
    });
  });

  describe('loading state', () => {
    it('should manage loading state for status', async () => {
      (apiClient.getRewardStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockRewardStatusResponse);

      const { result } = renderHook(() => useRewardsApi());
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.getRewardStatus();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
