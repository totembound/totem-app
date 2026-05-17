/**
 * useRewardsApi - Web2 REST API version of rewards functionality
 *
 * Provides reward claiming using the REST API instead of smart contracts.
 * Use this hook for the Web2 migration.
 */

import { useState, useCallback } from 'react';
import apiClient from '../services/ApiClient';
import { notificationService } from '../services/NotificationService';

export interface RewardStatus {
  tier?: string;
  tierMultiplier?: number;
  tierBonusPercent?: number;
  daily: {
    canClaim: boolean;
    streakDays: number;
    bestStreak: number;
    nextClaimTime: Date | null;
    isProtected: boolean;
    protectionCharges: number;
  };
  weekly: {
    canClaim: boolean;
    weeklyStreak: number;
    bestStreak: number;
    nextClaimTime: Date | null;
    isProtected: boolean;
    protectionCharges: number;
    isUnlocked: boolean;
  };
}

export interface ClaimResult {
  success: boolean;
  amount?: number;
  streakDays?: number;
  message?: string;
  error?: string;
}

export const useRewardsApi = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [rewardStatus, setRewardStatus] = useState<RewardStatus | null>(null);

  const setActionLoading = (action: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [action]: isLoading }));
  };

  /**
   * Get current reward status
   */
  const getRewardStatus = useCallback(async (): Promise<RewardStatus | null> => {
    setActionLoading('status', true);
    setError(null);

    try {
      const response = await apiClient.getRewardStatus();

      if (response.success && response.data) {
        const status: RewardStatus = {
          tier: response.data.tier,
          tierMultiplier: response.data.tierMultiplier,
          tierBonusPercent: response.data.tierBonusPercent,
          daily: {
            canClaim: response.data.daily.canClaim,
            streakDays: response.data.daily.streakDays,
            bestStreak: response.data.daily.bestStreak,
            nextClaimTime: response.data.daily.nextClaimTime
              ? new Date(response.data.daily.nextClaimTime)
              : null,
            isProtected: response.data.daily.isProtected,
            protectionCharges: response.data.daily.protectionCharges || 0,
          },
          weekly: {
            canClaim: response.data.weekly.canClaim,
            weeklyStreak: response.data.weekly.weeklyStreak,
            bestStreak: response.data.weekly.bestStreak,
            nextClaimTime: response.data.weekly.nextClaimTime
              ? new Date(response.data.weekly.nextClaimTime)
              : null,
            isProtected: response.data.weekly.isProtected,
            protectionCharges: response.data.weekly.protectionCharges || 0,
            isUnlocked: response.data.weekly.isUnlocked,
          },
        };

        setRewardStatus(status);
        return status;
      }

      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get reward status';
      setError(errorMsg);
      return null;
    } finally {
      setActionLoading('status', false);
    }
  }, []);

  /**
   * Claim daily reward
   */
  const claimDailyReward = useCallback(async (): Promise<ClaimResult> => {
    setActionLoading('claimDaily', true);
    setError(null);

    try {
      const response = await apiClient.claimDailyReward();

      if (response.success && response.data) {
        // Show notification on success
        notificationService.showRewardClaimed({
          rewardType: 'daily',
          amount: response.data.reward.amount,
          streakDays: response.data.reward.streakDays,
        });
        notificationService.processAchievementsFromResponse((response.data as any).achievements);

        // Refresh status
        await getRewardStatus();

        return {
          success: true,
          amount: response.data.reward.amount,
          streakDays: response.data.reward.streakDays,
          message: response.data.message,
        };
      }

      const errorMsg = response.error?.message || 'Failed to claim daily reward';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to claim daily reward';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setActionLoading('claimDaily', false);
    }
  }, [getRewardStatus]);

  /**
   * Claim weekly reward
   */
  const claimWeeklyReward = useCallback(async (): Promise<ClaimResult> => {
    setActionLoading('claimWeekly', true);
    setError(null);

    try {
      const response = await apiClient.claimWeeklyReward();

      if (response.success && response.data) {
        // Show notification on success
        notificationService.showRewardClaimed({
          rewardType: 'weekly',
          amount: response.data.reward.totalAmount || response.data.reward.amount || 0,
          streakDays: response.data.reward.weeklyStreak,
        });
        notificationService.processAchievementsFromResponse((response.data as any).achievements);

        // Refresh status
        await getRewardStatus();

        return {
          success: true,
          amount: response.data.reward.totalAmount || response.data.reward.amount || 0,
          streakDays: response.data.reward.weeklyStreak,
          message: response.data.message,
        };
      }

      const errorMsg = response.error?.message || 'Failed to claim weekly reward';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to claim weekly reward';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setActionLoading('claimWeekly', false);
    }
  }, [getRewardStatus]);

  return {
    // Actions
    getRewardStatus,
    claimDailyReward,
    claimWeeklyReward,

    // State
    rewardStatus,
    loading,
    error,
    isLoading: Object.values(loading).some(Boolean),
  };
};

export default useRewardsApi;
