/**
 * useChallengesApi - Web2 REST API version of challenges functionality
 *
 * Provides challenge completion using the REST API instead of smart contracts.
 * Use this hook for the Web2 migration.
 */

import { useState, useCallback } from 'react';
import apiClient from '../services/ApiClient';
import { notificationService } from '../services/NotificationService';

export interface ChallengeInfo {
  id: string;
  name: string;
  description: string;
  challengeType: number;
  attribute: number;
  requirements: {
    stage: number;
    strength: number;
    agility: number;
    wisdom: number;
  };
  maxDailyAttempts: number;
  maxScore: number;
  enabled: boolean;
  userStatus: {
    attemptsRemaining: number;
    highScore: number;
    totalAttempts: number;
    totalScore: number;
  };
}

export interface ChallengeResult {
  success: boolean;
  score?: number;
  isHighScore?: boolean;
  experienceGained?: number;
  essenceGained?: number;
  newEssenceBalance?: number;
  message?: string;
  error?: string;
}

export const useChallengesApi = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<ChallengeInfo[]>([]);

  const setActionLoading = (action: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [action]: isLoading }));
  };

  /**
   * Get all challenges
   */
  const getChallenges = useCallback(async (): Promise<ChallengeInfo[]> => {
    setActionLoading('list', true);
    setError(null);

    try {
      const response = await apiClient.getChallenges();

      if (response.success && response.data) {
        // Extract challenges array from response
        const challengeList = response.data.challenges.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          challengeType: 0, // Map from c.type if needed
          attribute: 0,
          requirements: c.requirements,
          maxDailyAttempts: c.maxDailyAttempts,
          maxScore: c.maxScore,
          enabled: true,
          userStatus: {
            attemptsRemaining: c.daily?.attemptsRemaining || 0,
            highScore: c.progress?.highScore || 0,
            totalAttempts: c.progress?.totalAttempts || 0,
            totalScore: c.progress?.totalXpEarned || 0,
          }
        }));
        setChallenges(challengeList);
        return challengeList;
      }

      return [];
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get challenges';
      setError(errorMsg);
      return [];
    } finally {
      setActionLoading('list', false);
    }
  }, []);

  /**
   * Complete a challenge
   */
  const completeChallenge = useCallback(async (
    challengeId: string,
    challengeName: string,
    totemId: string,
    score: number
  ): Promise<ChallengeResult> => {
    setActionLoading(`complete-${challengeId}`, true);
    setError(null);

    try {
      const response = await apiClient.completeChallenge(challengeId, totemId, score);

      if (response.success && response.data) {
        const data = response.data;
        const previousHighScore = data.progress.highScore - (data.score === data.progress.highScore ? data.score : 0);
        const isHighScore = data.score > previousHighScore;

        // Show challenge completed notification
        notificationService.showChallengeCompleted({
          challengeId,
          challengeName: data.challengeName || challengeName,
          totemId,
          score: data.score,
          isHighScore,
        });

        // Show high score notification if applicable
        if (isHighScore) {
          notificationService.showHighScoreSet({
            challengeId,
            challengeName: data.challengeName || challengeName,
            totemId,
            score: data.score,
          });
        }

        // Show achievement notifications
        notificationService.processAchievementsFromResponse(data.achievements);

        // Refresh challenges list
        await getChallenges();

        return {
          success: true,
          score: data.score,
          isHighScore,
          experienceGained: data.xpEarned,
          essenceGained: data.essenceEarned,
          newEssenceBalance: data.newEssenceBalance || undefined,
          message: data.message,
        };
      }

      const errorMsg = response.error?.message || 'Failed to complete challenge';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to complete challenge';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setActionLoading(`complete-${challengeId}`, false);
    }
  }, [getChallenges]);

  /**
   * Check if a totem can attempt a challenge
   */
  const canAttemptChallenge = useCallback((
    challenge: ChallengeInfo,
    totemAttributes: { stage: number; strength: number; agility: number; wisdom: number }
  ): boolean => {
    if (!challenge.enabled) return false;
    if (challenge.userStatus.attemptsRemaining <= 0) return false;

    const reqs = challenge.requirements;
    return (
      totemAttributes.stage >= reqs.stage &&
      totemAttributes.strength >= reqs.strength &&
      totemAttributes.agility >= reqs.agility &&
      totemAttributes.wisdom >= reqs.wisdom
    );
  }, []);

  return {
    // Actions
    getChallenges,
    completeChallenge,
    canAttemptChallenge,

    // State
    challenges,
    loading,
    error,
    isLoading: Object.values(loading).some(Boolean),
  };
};

export default useChallengesApi;
