/**
 * useTotemGameApi - Web2 REST API version of useTotemGame
 *
 * Provides game actions using the REST API instead of smart contracts.
 * Use this hook for the Web2 migration.
 */

import { useState, useCallback } from 'react';
import apiClient from '../services/ApiClient';
import { notificationService } from '../services/NotificationService';
import { useUser } from '../contexts/UserContext';
import { useAchievements } from '../contexts/AchievementsContext';

export interface GameActionResult {
  success: boolean;
  xpGained?: number;
  newExperience?: number;
  statChanges?: Record<string, number>;
  message?: string;
  error?: string;
  cooldown?: { type: string; duration: number; readyAt: string };
  feedsToday?: number;
  maxDaily?: number;
  newEssenceBalance?: number;
  achievementsUnlocked?: boolean;
}

export interface EvolutionResult {
  success: boolean;
  previousStage?: number;
  newStage?: number;
  newStageName?: string;
  newDisplayName?: string;
  statBoosts?: Record<string, number>;
  message?: string;
  error?: string;
  achievementsUnlocked?: boolean;
}

export interface CooldownStatus {
  feed: { onCooldown: boolean; readyAt: Date | null; remainingMs: number };
  train: { onCooldown: boolean; readyAt: Date | null; remainingMs: number };
  treat: { onCooldown: boolean; readyAt: Date | null; remainingMs: number };
}

export const useTotemGameApi = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { totems } = useUser();
  const { applyUnlockedAchievements } = useAchievements();

  const setActionLoading = (action: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [action]: isLoading }));
  };

  // Resolve "Your <name>" label for notifications. Prefers nickname.
  const resolveTotemLabel = useCallback((totemId: string): string | undefined => {
    const t = totems.find(t => t.id === totemId);
    if (!t) return undefined;
    return t.attributes?.nickname || t.displayName || t.name;
  }, [totems]);

  // Centralized: notify + live-update context for any action result with achievements.
  const handleAchievementResult = useCallback((totemId: string, achievements?: any[]) => {
    if (!achievements || achievements.length === 0) return;
    const label = resolveTotemLabel(totemId);
    notificationService.processAchievementsFromResponse(achievements, label).catch(err => {
      console.error('Failed to process achievement notifications:', err);
    });
    applyUnlockedAchievements(achievements);
  }, [applyUnlockedAchievements, resolveTotemLabel]);

  /**
   * Feed a totem
   */
  const feed = useCallback(async (totemId: string): Promise<GameActionResult> => {
    setActionLoading('feed', true);
    setError(null);

    try {
      const response = await apiClient.feedTotem(totemId);

      if (response.success && response.data) {
        handleAchievementResult(totemId, response.data.achievements);

        return {
          success: true,
          xpGained: response.data.xpGained,
          newExperience: response.data.newExperience,
          statChanges: response.data.statChanges,
          message: response.data.message,
          feedsToday: response.data.feedsToday,
          maxDaily: response.data.maxDaily,
          newEssenceBalance: response.data.newEssenceBalance,
          achievementsUnlocked: !!(response.data.achievements && response.data.achievements.length > 0),
        };
      }

      const errorMsg = response.error?.message || 'Failed to feed totem';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to feed totem';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setActionLoading('feed', false);
    }
  }, []);

  /**
   * Train a totem
   */
  const train = useCallback(async (totemId: string): Promise<GameActionResult> => {
    setActionLoading('train', true);
    setError(null);

    try {
      const response = await apiClient.trainTotem(totemId);

      if (response.success && response.data) {
        handleAchievementResult(totemId, response.data.achievements);

        return {
          success: true,
          xpGained: response.data.xpGained,
          newExperience: response.data.newExperience,
          statChanges: response.data.statChanges,
          message: response.data.message,
          newEssenceBalance: response.data.newEssenceBalance,
          achievementsUnlocked: !!(response.data.achievements && response.data.achievements.length > 0),
        };
      }

      const errorMsg = response.error?.message || 'Failed to train totem';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to train totem';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setActionLoading('train', false);
    }
  }, []);

  /**
   * Treat a totem
   */
  const treat = useCallback(async (totemId: string): Promise<GameActionResult> => {
    setActionLoading('treat', true);
    setError(null);

    try {
      const response = await apiClient.treatTotem(totemId);

      if (response.success && response.data) {
        handleAchievementResult(totemId, response.data.achievements);

        return {
          success: true,
          xpGained: response.data.xpGained,
          newExperience: response.data.newExperience,
          statChanges: response.data.statChanges,
          message: response.data.message,
          cooldown: response.data.cooldown,
          newEssenceBalance: response.data.newEssenceBalance,
          achievementsUnlocked: !!(response.data.achievements && response.data.achievements.length > 0),
        };
      }

      const errorMsg = response.error?.message || 'Failed to treat totem';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to treat totem';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setActionLoading('treat', false);
    }
  }, []);

  /**
   * Evolve a totem to the next stage
   */
  const evolve = useCallback(async (totemId: string): Promise<EvolutionResult> => {
    setActionLoading('evolve', true);
    setError(null);

    try {
      const response = await apiClient.evolveTotem(totemId);

      if (response.success && response.data) {
        // Show notification on success
        notificationService.showTotemEvolved({
          totemId,
          previousStage: response.data.evolution.previousStage,
          newStage: response.data.evolution.newStage,
          newStageName: response.data.evolution.newStageName,
          newDisplayName: response.data.evolution.newDisplayName,
          totemLabel: resolveTotemLabel(totemId),
        });
        handleAchievementResult(totemId, response.data.achievements);

        return {
          success: true,
          previousStage: response.data.evolution.previousStage,
          newStage: response.data.evolution.newStage,
          newStageName: response.data.evolution.newStageName,
          newDisplayName: response.data.evolution.newDisplayName,
          statBoosts: response.data.statBoosts,
          message: response.data.message,
          achievementsUnlocked: !!(response.data.achievements && response.data.achievements.length > 0),
        };
      }

      const errorMsg = response.error?.message || 'Failed to evolve totem';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to evolve totem';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setActionLoading('evolve', false);
    }
  }, []);

  /**
   * Get cooldown status for all actions
   */
  const getCooldowns = useCallback(async (totemId: string): Promise<CooldownStatus | null> => {
    try {
      const response = await apiClient.getCooldowns(totemId);

      if (response.success && response.data) {
        const { cooldowns } = response.data;
        return {
          feed: {
            onCooldown: cooldowns.feed.onCooldown,
            readyAt: cooldowns.feed.readyAt ? new Date(cooldowns.feed.readyAt) : null,
            remainingMs: cooldowns.feed.remainingMs,
          },
          train: {
            onCooldown: cooldowns.train.onCooldown,
            readyAt: cooldowns.train.readyAt ? new Date(cooldowns.train.readyAt) : null,
            remainingMs: cooldowns.train.remainingMs,
          },
          treat: {
            onCooldown: cooldowns.treat.onCooldown,
            readyAt: cooldowns.treat.readyAt ? new Date(cooldowns.treat.readyAt) : null,
            remainingMs: cooldowns.treat.remainingMs,
          },
        };
      }

      return null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Get evolution status for a totem
   */
  const getEvolutionStatus = useCallback(async (totemId: string) => {
    try {
      const response = await apiClient.getEvolutionStatus(totemId);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Get full totem status (for dashboard)
   */
  const getTotemStatus = useCallback(async (totemId: string) => {
    try {
      const response = await apiClient.getTotemStatus(totemId);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch {
      return null;
    }
  }, []);

  return {
    // Actions
    feed,
    train,
    treat,
    evolve,

    // Status queries
    getCooldowns,
    getEvolutionStatus,
    getTotemStatus,

    // State
    loading,
    error,
    isLoading: Object.values(loading).some(Boolean),
  };
};

export default useTotemGameApi;
