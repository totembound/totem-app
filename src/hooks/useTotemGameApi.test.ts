/**
 * useTotemGameApi hook tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTotemGameApi } from './useTotemGameApi';

// Mock ApiClient
vi.mock('../services/ApiClient', () => ({
  default: {
    feedTotem: vi.fn(),
    trainTotem: vi.fn(),
    treatTotem: vi.fn(),
    evolveTotem: vi.fn(),
    getCooldowns: vi.fn(),
    getEvolutionStatus: vi.fn(),
    getTotemStatus: vi.fn(),
  },
}));

// Mock NotificationService
vi.mock('../services/NotificationService', () => ({
  notificationService: {
    processAchievementsFromResponse: vi.fn(),
    showTotemEvolved: vi.fn(),
  },
}));

// Mock context hooks — useTotemGameApi reads them for totem-name labelling
// and live achievement-state patching, but those wires aren't under test here.
vi.mock('../contexts/UserContext', () => ({
  useUser: () => ({ totems: [] }),
}));
vi.mock('../contexts/AchievementsContext', () => ({
  useAchievements: () => ({ applyUnlockedAchievements: vi.fn() }),
}));
vi.mock('../contexts/GameContext', () => ({
  useGame: () => ({ mergeQuestProgress: vi.fn() }),
}));

import apiClient from '../services/ApiClient';

describe('useTotemGameApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('feed', () => {
    it('should return success result', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 15, newExperience: 100, message: 'Fed!', achievements: [] },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let feedResult: any;
      await act(async () => {
        feedResult = await result.current.feed('ttm_1');
      });

      expect(feedResult.success).toBe(true);
      expect(feedResult.xpGained).toBe(15);
      expect(feedResult.newExperience).toBe(100);
      expect(result.current.error).toBeNull();
    });

    it('should return error on failure', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Window closed' },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let feedResult: any;
      await act(async () => {
        feedResult = await result.current.feed('ttm_1');
      });

      expect(feedResult.success).toBe(false);
      expect(feedResult.error).toBe('Window closed');
      expect(result.current.error).toBe('Window closed');
    });

    it('should handle thrown exception', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network'));

      const { result } = renderHook(() => useTotemGameApi());

      let feedResult: any;
      await act(async () => {
        feedResult = await result.current.feed('ttm_1');
      });

      expect(feedResult.success).toBe(false);
      expect(feedResult.error).toBe('Network');
    });

    it('should manage loading state', async () => {
      let resolvePromise: (v: any) => void;
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise(resolve => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useTotemGameApi());
      expect(result.current.isLoading).toBe(false);

      let feedPromise: Promise<any>;
      act(() => {
        feedPromise = result.current.feed('ttm_1');
      });
      expect(result.current.loading.feed).toBe(true);
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ success: true, data: {} });
        await feedPromise;
      });

      expect(result.current.loading.feed).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('train', () => {
    it('should return success result', async () => {
      (apiClient.trainTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 25, statChanges: { strength: 1 }, achievements: [] },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let trainResult: any;
      await act(async () => {
        trainResult = await result.current.train('ttm_1');
      });

      expect(trainResult.success).toBe(true);
      expect(trainResult.xpGained).toBe(25);
    });

    it('should return error on failure', async () => {
      (apiClient.trainTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Low happiness' },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let trainResult: any;
      await act(async () => {
        trainResult = await result.current.train('ttm_1');
      });

      expect(trainResult.success).toBe(false);
      expect(trainResult.error).toBe('Low happiness');
    });
  });

  describe('treat', () => {
    it('should return success result with cooldown info', async () => {
      (apiClient.treatTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 5, cooldown: { type: 'treat', duration: 7200 }, achievements: [] },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let treatResult: any;
      await act(async () => {
        treatResult = await result.current.treat('ttm_1');
      });

      expect(treatResult.success).toBe(true);
      expect(treatResult.cooldown.duration).toBe(7200);
    });
  });

  describe('evolve', () => {
    it('should return evolution result', async () => {
      (apiClient.evolveTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          evolution: { previousStage: 0, newStage: 1, newStageName: 'Juvenile', newDisplayName: 'Gray Juvenile' },
          statBoosts: { strength: 2 },
          achievements: [],
        },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let evolveResult: any;
      await act(async () => {
        evolveResult = await result.current.evolve('ttm_1');
      });

      expect(evolveResult.success).toBe(true);
      expect(evolveResult.previousStage).toBe(0);
      expect(evolveResult.newStage).toBe(1);
      expect(evolveResult.newStageName).toBe('Juvenile');
    });

    it('should return error on failure', async () => {
      (apiClient.evolveTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Not enough XP' },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let evolveResult: any;
      await act(async () => {
        evolveResult = await result.current.evolve('ttm_1');
      });

      expect(evolveResult.success).toBe(false);
      expect(evolveResult.error).toBe('Not enough XP');
    });
  });

  describe('getCooldowns', () => {
    it('should return cooldown status', async () => {
      (apiClient.getCooldowns as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          cooldowns: {
            feed: { onCooldown: false, readyAt: null, remainingMs: 0 },
            train: { onCooldown: true, readyAt: '2024-01-01T12:00:00Z', remainingMs: 3600000 },
            treat: { onCooldown: false, readyAt: null, remainingMs: 0 },
          },
        },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let cooldowns: any;
      await act(async () => {
        cooldowns = await result.current.getCooldowns('ttm_1');
      });

      expect(cooldowns).not.toBeNull();
      expect(cooldowns.feed.onCooldown).toBe(false);
      expect(cooldowns.train.onCooldown).toBe(true);
      expect(cooldowns.train.readyAt).toBeInstanceOf(Date);
    });

    it('should return null on failure', async () => {
      (apiClient.getCooldowns as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => useTotemGameApi());

      let cooldowns: any;
      await act(async () => {
        cooldowns = await result.current.getCooldowns('ttm_1');
      });

      expect(cooldowns).toBeNull();
    });

    it('should return null on exception', async () => {
      (apiClient.getCooldowns as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useTotemGameApi());

      let cooldowns: any;
      await act(async () => {
        cooldowns = await result.current.getCooldowns('ttm_1');
      });

      expect(cooldowns).toBeNull();
    });
  });

  describe('getEvolutionStatus', () => {
    it('should return evolution status', async () => {
      (apiClient.getEvolutionStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { canEvolve: true, currentStage: 2 },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let status: any;
      await act(async () => {
        status = await result.current.getEvolutionStatus('ttm_1');
      });

      expect(status.canEvolve).toBe(true);
    });

    it('should return null on failure', async () => {
      (apiClient.getEvolutionStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useTotemGameApi());

      let status: any;
      await act(async () => {
        status = await result.current.getEvolutionStatus('ttm_1');
      });

      expect(status).toBeNull();
    });
  });

  describe('getTotemStatus', () => {
    it('should return totem status', async () => {
      (apiClient.getTotemStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { happiness: 80, stage: 2 },
      });

      const { result } = renderHook(() => useTotemGameApi());

      let status: any;
      await act(async () => {
        status = await result.current.getTotemStatus('ttm_1');
      });

      expect(status.happiness).toBe(80);
    });

    it('should return null on failure', async () => {
      (apiClient.getTotemStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useTotemGameApi());

      let status: any;
      await act(async () => {
        status = await result.current.getTotemStatus('ttm_1');
      });

      expect(status).toBeNull();
    });
  });
});
