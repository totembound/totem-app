/**
 * useAchievementsApi - Web2 REST API version of achievements functionality
 *
 * Provides achievement tracking using the REST API instead of smart contracts.
 * Use this hook for the Web2 migration.
 */

import { useState, useCallback } from 'react';
import apiClient from '../services/ApiClient';
import { notificationService } from '../services/NotificationService';

// Web2 API returns milestone progress, not full achievement definitions
export interface MilestoneProgress {
  unlocked: boolean;
  progress: number;
}

// Legacy type for backwards compatibility - not used by API
export interface AchievementMilestone {
  threshold: number;
  reward: number;
}

export interface AchievementInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  achievementType: number;
  subType: string;
  enabled: boolean;
  badgeUri: string;
  milestones: AchievementMilestone[];
  isCompleted: boolean;
  currentCount: number;
  requirementsMet: boolean;
}

export interface AchievementCheckResult {
  unlocked: boolean;
  achievement?: {
    id: string;
    name: string;
    badgeUri: string;
  };
  milestone?: {
    index: number;
    threshold: number;
    reward: number;
  };
}

export const useAchievementsApi = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  // Web2: API returns milestone progress arrays per achievement ID
  const [achievements, setAchievements] = useState<Record<string, MilestoneProgress[]>>({});

  const setActionLoading = (action: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [action]: isLoading }));
  };

  /**
   * Get all achievements with milestone progress
   * Web2 API returns: { "ach_id": [{ unlocked: bool, progress: number }, ...] }
   */
  const getAchievements = useCallback(async (): Promise<Record<string, MilestoneProgress[]>> => {
    setActionLoading('list', true);
    setError(null);

    try {
      const response = await apiClient.getAchievements();

      if (response.success && response.data) {
        setAchievements(response.data.achievements);
        return response.data.achievements;
      }

      return {};
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get achievements';
      setError(errorMsg);
      return {};
    } finally {
      setActionLoading('list', false);
    }
  }, []);

  /**
   * Check and potentially unlock an achievement
   */
  const checkAchievement = useCallback(async (
    achievementId: string
  ): Promise<AchievementCheckResult | null> => {
    setActionLoading(`check-${achievementId}`, true);
    setError(null);

    try {
      const response = await apiClient.checkAchievement(achievementId);

      if (response.success && response.data) {
        // Show achievement notification if unlocked
        if (response.data.unlocked && response.data.achievement) {
          notificationService.showAchievementUnlocked({
            achievementId: response.data.achievement.id,
            achievementName: response.data.achievement.name,
            badgeUri: response.data.achievement.badgeUri,
          });
        }

        // Show milestone notification if reached
        if (response.data.milestone) {
          // Web2: Achievement names come from static definitions, not API
          // The notification service will look up the name from static config
          notificationService.showMilestoneUnlocked({
            achievementId,
            achievementName: response.data.achievement?.name,
            milestoneIndex: response.data.milestone.index,
          });
        }

        // Refresh achievements
        await getAchievements();

        return response.data;
      }

      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check achievement';
      setError(errorMsg);
      return null;
    } finally {
      setActionLoading(`check-${achievementId}`, false);
    }
  }, [getAchievements]);

  /**
   * Find milestone progress for an achievement by ID
   * Web2: Achievement ID is the key, returns milestone progress array
   */
  const findAchievementById = useCallback((id: string): MilestoneProgress[] | undefined => {
    // Try with and without ach_ prefix
    return achievements[id] || achievements[`ach_${id}`];
  }, [achievements]);

  /**
   * Check if user has completed a specific achievement
   * Web2: For one-time achievements, checks first milestone unlocked
   * For progression achievements, checks all milestones unlocked
   */
  const hasAchievement = useCallback((id: string): boolean => {
    const milestones = findAchievementById(id);
    if (!milestones || milestones.length === 0) return false;

    // One-time achievements (single milestone) - check if unlocked
    if (milestones.length === 1) {
      return milestones[0].unlocked;
    }

    // Progression achievements - check if all milestones unlocked
    return milestones.every(m => m.unlocked);
  }, [findAchievementById]);

  /**
   * Get achievement progress by ID
   * Web2: Returns milestone progress array
   */
  const getAchievementProgress = useCallback((id: string): MilestoneProgress[] => {
    return achievements[id] || achievements[`ach_${id}`] || [];
  }, [achievements]);

  return {
    // Actions
    getAchievements,
    checkAchievement,

    // Helpers
    findAchievementById,
    hasAchievement,
    getAchievementProgress,

    // State
    achievements,
    loading,
    error,
    isLoading: Object.values(loading).some(Boolean),
  };
};

export default useAchievementsApi;
