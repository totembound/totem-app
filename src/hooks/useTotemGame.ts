/**
 * useTotemGame - REST API totem game actions
 */

import apiClient from '../services/ApiClient';

export const useTotemGame = () => {

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
            return response.data;
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
            return response.data;
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
            return response.data;
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
            return response.data;
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
