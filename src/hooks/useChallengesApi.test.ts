/**
 * useChallengesApi hook tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChallengesApi } from './useChallengesApi';

// Mock ApiClient
vi.mock('../services/ApiClient', () => ({
  default: {
    getChallenges: vi.fn(),
    completeChallenge: vi.fn(),
  },
}));

// Mock NotificationService
vi.mock('../services/NotificationService', () => ({
  notificationService: {
    showChallengeCompleted: vi.fn(),
    showHighScoreSet: vi.fn(),
    processAchievementsFromResponse: vi.fn(),
  },
}));

import apiClient from '../services/ApiClient';

const mockChallengeResponse = {
  success: true,
  data: {
    challenges: [
      {
        id: 'c-0',
        name: 'Memory Match',
        description: 'Test memory',
        type: 'memory',
        requirements: { stage: 1, strength: 0, agility: 0, wisdom: 0 },
        maxDailyAttempts: 3,
        maxScore: 100,
        daily: { attemptsRemaining: 2 },
        progress: { highScore: 85, totalAttempts: 5, totalXpEarned: 100 },
      },
    ],
  },
};

describe('useChallengesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChallenges', () => {
    it('should fetch and store challenges', async () => {
      (apiClient.getChallenges as ReturnType<typeof vi.fn>).mockResolvedValue(mockChallengeResponse);

      const { result } = renderHook(() => useChallengesApi());

      let challenges: any[];
      await act(async () => {
        challenges = await result.current.getChallenges();
      });

      expect(challenges!).toHaveLength(1);
      expect(challenges![0].id).toBe('c-0');
      expect(challenges![0].userStatus.highScore).toBe(85);
      expect(result.current.challenges).toHaveLength(1);
    });

    it('should return empty array on failure', async () => {
      (apiClient.getChallenges as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => useChallengesApi());

      let challenges: any[];
      await act(async () => {
        challenges = await result.current.getChallenges();
      });

      expect(challenges!).toEqual([]);
    });

    it('should handle exception', async () => {
      (apiClient.getChallenges as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useChallengesApi());

      let challenges: any[];
      await act(async () => {
        challenges = await result.current.getChallenges();
      });

      expect(challenges!).toEqual([]);
      expect(result.current.error).toBe('fail');
    });
  });

  describe('completeChallenge', () => {
    it('should complete and return result', async () => {
      (apiClient.completeChallenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          score: 90,
          challengeName: 'Memory Match',
          progress: { highScore: 90, totalAttempts: 6 },
          xpEarned: 50,
          essenceEarned: 100,
          achievements: [],
        },
      });
      (apiClient.getChallenges as ReturnType<typeof vi.fn>).mockResolvedValue(mockChallengeResponse);

      const { result } = renderHook(() => useChallengesApi());

      let completionResult: any;
      await act(async () => {
        completionResult = await result.current.completeChallenge('c-0', 'Memory Match', 'ttm_1', 90);
      });

      expect(completionResult.success).toBe(true);
      expect(completionResult.score).toBe(90);
      expect(completionResult.experienceGained).toBe(50);
      expect(apiClient.completeChallenge).toHaveBeenCalledWith('c-0', 'ttm_1', 90);
    });

    it('should return error on failure', async () => {
      (apiClient.completeChallenge as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'No attempts remaining' },
      });

      const { result } = renderHook(() => useChallengesApi());

      let completionResult: any;
      await act(async () => {
        completionResult = await result.current.completeChallenge('c-0', 'Memory Match', 'ttm_1', 50);
      });

      expect(completionResult.success).toBe(false);
      expect(completionResult.error).toBe('No attempts remaining');
    });
  });

  describe('canAttemptChallenge', () => {
    it('should return true when requirements met', () => {
      const challenge = {
        id: 'c-0',
        enabled: true,
        requirements: { stage: 1, strength: 5, agility: 5, wisdom: 5 },
        userStatus: { attemptsRemaining: 2, highScore: 0, totalAttempts: 0, totalScore: 0 },
      } as any;

      const totemAttrs = { stage: 2, strength: 10, agility: 10, wisdom: 10 };

      const { result } = renderHook(() => useChallengesApi());
      expect(result.current.canAttemptChallenge(challenge, totemAttrs)).toBe(true);
    });

    it('should return false when disabled', () => {
      const challenge = {
        id: 'c-0',
        enabled: false,
        requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
        userStatus: { attemptsRemaining: 3, highScore: 0, totalAttempts: 0, totalScore: 0 },
      } as any;

      const { result } = renderHook(() => useChallengesApi());
      expect(result.current.canAttemptChallenge(challenge, { stage: 5, strength: 10, agility: 10, wisdom: 10 })).toBe(false);
    });

    it('should return false when no attempts remaining', () => {
      const challenge = {
        id: 'c-0',
        enabled: true,
        requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 },
        userStatus: { attemptsRemaining: 0, highScore: 0, totalAttempts: 3, totalScore: 0 },
      } as any;

      const { result } = renderHook(() => useChallengesApi());
      expect(result.current.canAttemptChallenge(challenge, { stage: 5, strength: 10, agility: 10, wisdom: 10 })).toBe(false);
    });

    it('should return false when stage too low', () => {
      const challenge = {
        id: 'c-0',
        enabled: true,
        requirements: { stage: 3, strength: 0, agility: 0, wisdom: 0 },
        userStatus: { attemptsRemaining: 3, highScore: 0, totalAttempts: 0, totalScore: 0 },
      } as any;

      const { result } = renderHook(() => useChallengesApi());
      expect(result.current.canAttemptChallenge(challenge, { stage: 1, strength: 10, agility: 10, wisdom: 10 })).toBe(false);
    });

    it('should return false when stats too low', () => {
      const challenge = {
        id: 'c-0',
        enabled: true,
        requirements: { stage: 0, strength: 20, agility: 0, wisdom: 0 },
        userStatus: { attemptsRemaining: 3, highScore: 0, totalAttempts: 0, totalScore: 0 },
      } as any;

      const { result } = renderHook(() => useChallengesApi());
      expect(result.current.canAttemptChallenge(challenge, { stage: 5, strength: 10, agility: 10, wisdom: 10 })).toBe(false);
    });
  });
});
