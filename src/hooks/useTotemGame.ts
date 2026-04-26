/**
 * useTotemGame - REST API totem game actions
 *
 * After every action, if the response includes an `achievements` array:
 *   - Toast/notify each unlock via the singleton NotificationService.
 *   - Patch the AchievementsContext so the Achievements UI updates live
 *     without an extra GET /api/achievements round-trip.
 */

import apiClient from '../services/ApiClient';
import notificationService from '../services/NotificationService';
import { useAchievements, ActionAchievementUnlock } from '../contexts/AchievementsContext';
import { useUser } from '../contexts/UserContext';

interface ActionResultWithAchievements {
    achievements?: ActionAchievementUnlock[];
    totemId?: string;
    [key: string]: any;
}

export const useTotemGame = () => {
    const { applyUnlockedAchievements } = useAchievements();
    const { totems } = useUser();

    // Resolve a friendly label like "Dawnfang Phantom" (nickname overrides).
    const resolveTotemLabel = (totemId?: string): string | undefined => {
        if (!totemId) return undefined;
        const t = totems.find(t => t.id === totemId);
        if (!t) return undefined;
        return t.attributes?.nickname || t.displayName || t.name;
    };

    const handleResult = <T extends ActionResultWithAchievements | undefined>(data: T): T => {
        if (data?.achievements && data.achievements.length > 0) {
            const totemLabel = resolveTotemLabel(data.totemId);
            // Fire-and-forget; notifications are non-critical.
            notificationService.processAchievementsFromResponse(data.achievements, totemLabel).catch(err => {
                console.error('Failed to process achievement notifications:', err);
            });
            applyUnlockedAchievements(data.achievements);
        }
        return data;
    };

    /**
     * Feed a totem - Increases happiness and XP
     * Uses time windows (3 per day, one per 8-hour window)
     */
    const feed = async (totemId: string) => {
        try {
            const response = await apiClient.feedTotem(totemId);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to feed totem');
            }
            return handleResult(response.data);
        } catch (error: any) {
            console.error('Feed failed:', error);
            throw new Error(error.message || 'Failed to feed totem');
        }
    };

    /**
     * Train a totem - Increases stats and XP, costs Essence
     */
    const train = async (totemId: string) => {
        try {
            const response = await apiClient.trainTotem(totemId);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to train totem');
            }
            return handleResult(response.data);
        } catch (error: any) {
            console.error('Train failed:', error);
            throw new Error(error.message || 'Failed to train totem');
        }
    };

    /**
     * Treat a totem - Large happiness boost, costs Essence
     */
    const treat = async (totemId: string) => {
        try {
            const response = await apiClient.treatTotem(totemId);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to treat totem');
            }
            return handleResult(response.data);
        } catch (error: any) {
            console.error('Treat failed:', error);
            throw new Error(error.message || 'Failed to treat totem');
        }
    };

    /**
     * Evolve a totem - Advance to next stage when requirements are met
     */
    const evolve = async (totemId: string) => {
        try {
            const response = await apiClient.evolveTotem(totemId);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to evolve totem');
            }
            return handleResult(response.data);
        } catch (error: any) {
            console.error('Evolve totem failed:', error);
            throw new Error(error.message || 'Failed to evolve totem');
        }
    };

    /**
     * Set totem nickname
     */
    const setNickname = async (totemId: string, newName: string) => {
        try {
            const response = await apiClient.setNickname(totemId, newName.trim() || null);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to set nickname');
            }
            return response.data;
        } catch (error: any) {
            console.error('Set nickname failed:', error);
            throw new Error(error.message || 'Failed to set nickname');
        }
    };

    return {
        feed,
        train,
        treat,
        evolve,
        setNickname,
    };
};
