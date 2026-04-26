/**
 * useTotemGame hook tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Hoist mocks so factories can reference them
const { mockApiClient, mockNotificationService, mockApplyUnlockedAchievements, mockTotems } = vi.hoisted(() => ({
  mockApiClient: {
    feedTotem: vi.fn(),
    trainTotem: vi.fn(),
    treatTotem: vi.fn(),
    evolveTotem: vi.fn(),
    setNickname: vi.fn(),
  },
  mockNotificationService: {
    processAchievementsFromResponse: vi.fn().mockResolvedValue(undefined),
  },
  mockApplyUnlockedAchievements: vi.fn(),
  mockTotems: [
    { id: 'ttm_1', name: 'Wolf', displayName: 'Dawnfang Stalker', attributes: { nickname: null } },
    { id: 'ttm_2', name: 'Goose', displayName: 'Brown Guardian', attributes: { nickname: 'Honky' } },
  ],
}));

vi.mock('../services/ApiClient', () => ({ default: mockApiClient }));
vi.mock('../services/NotificationService', () => ({
  notificationService: mockNotificationService,
  default: mockNotificationService,
}));
vi.mock('../contexts/AchievementsContext', () => ({
  useAchievements: () => ({
    applyUnlockedAchievements: mockApplyUnlockedAchievements,
    incrementAchievementProgress: vi.fn(),
  }),
}));
vi.mock('../contexts/UserContext', () => ({
  useUser: () => ({ totems: mockTotems }),
}));

import { useTotemGame } from './useTotemGame';
import apiClient from '../services/ApiClient';

describe('useTotemGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('feed', () => {
    it('should return data on success', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 15, message: 'Fed!' },
      });

      const { result } = renderHook(() => useTotemGame());
      const data = await result.current.feed('ttm_1');

      expect(data).toEqual({ xpGained: 15, message: 'Fed!' });
      expect(apiClient.feedTotem).toHaveBeenCalledWith('ttm_1');
    });

    it('should throw on API failure', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Not in feeding window' },
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useTotemGame());
      await expect(result.current.feed('ttm_1')).rejects.toThrow('Not in feeding window');
      consoleSpy.mockRestore();
    });

    it('should throw on network error', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useTotemGame());
      await expect(result.current.feed('ttm_1')).rejects.toThrow('Network error');
      consoleSpy.mockRestore();
    });
  });

  describe('train', () => {
    it('should return data on success', async () => {
      (apiClient.trainTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 25, statChanges: { strength: 1 } },
      });

      const { result } = renderHook(() => useTotemGame());
      const data = await result.current.train('ttm_1');

      expect(data!.xpGained).toBe(25);
    });

    it('should throw on failure', async () => {
      (apiClient.trainTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Not enough essence' },
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useTotemGame());
      await expect(result.current.train('ttm_1')).rejects.toThrow('Not enough essence');
      consoleSpy.mockRestore();
    });
  });

  describe('treat', () => {
    it('should return data on success', async () => {
      (apiClient.treatTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { statChanges: { happiness: 80 }, message: 'Treated!' },
      });

      const { result } = renderHook(() => useTotemGame());
      const data = await result.current.treat('ttm_1');

      expect(data!.statChanges.happiness).toBe(80);
    });

    it('should throw on cooldown error', async () => {
      (apiClient.treatTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'On cooldown' },
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useTotemGame());
      await expect(result.current.treat('ttm_1')).rejects.toThrow('On cooldown');
      consoleSpy.mockRestore();
    });
  });

  describe('evolve', () => {
    it('should return data on success', async () => {
      (apiClient.evolveTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { evolution: { newStage: 2 } },
      });

      const { result } = renderHook(() => useTotemGame());
      const data = await result.current.evolve('ttm_1');

      expect(data!.evolution.newStage).toBe(2);
    });

    it('should throw when requirements not met', async () => {
      (apiClient.evolveTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Requirements not met' },
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useTotemGame());
      await expect(result.current.evolve('ttm_1')).rejects.toThrow('Requirements not met');
      consoleSpy.mockRestore();
    });
  });

  describe('setNickname', () => {
    it('should set nickname successfully', async () => {
      (apiClient.setNickname as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { nickname: 'Wolfie' },
      });

      const { result } = renderHook(() => useTotemGame());
      const data = await result.current.setNickname('ttm_1', 'Wolfie');

      expect(data!.nickname).toBe('Wolfie');
      expect(apiClient.setNickname).toHaveBeenCalledWith('ttm_1', 'Wolfie');
    });

    it('should send null for empty nickname', async () => {
      (apiClient.setNickname as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { nickname: null },
      });

      const { result } = renderHook(() => useTotemGame());
      await result.current.setNickname('ttm_1', '');

      expect(apiClient.setNickname).toHaveBeenCalledWith('ttm_1', null);
    });
  });

  describe('Batch 1: action result wire-up — notify + live update', () => {
    const sampleAch = [
      { achievementId: 'ach_balanced-care', milestone: 0, rewards: { essence: 25, xp: 0 } },
    ];

    it('feed: passes achievements + totem label to NotificationService and context', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 0, totemId: 'ttm_1', achievements: sampleAch },
      });

      const { result } = renderHook(() => useTotemGame());
      await result.current.feed('ttm_1');

      expect(mockNotificationService.processAchievementsFromResponse)
        .toHaveBeenCalledWith(sampleAch, 'Dawnfang Stalker');
      expect(mockApplyUnlockedAchievements).toHaveBeenCalledWith(sampleAch);
    });

    it('feed: uses nickname when set', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 0, totemId: 'ttm_2', achievements: sampleAch },
      });
      const { result } = renderHook(() => useTotemGame());
      await result.current.feed('ttm_2');
      expect(mockNotificationService.processAchievementsFromResponse)
        .toHaveBeenCalledWith(sampleAch, 'Honky');
    });

    it('train: same wire-up', async () => {
      (apiClient.trainTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 50, totemId: 'ttm_1', achievements: sampleAch },
      });
      const { result } = renderHook(() => useTotemGame());
      await result.current.train('ttm_1');
      expect(mockNotificationService.processAchievementsFromResponse)
        .toHaveBeenCalledWith(sampleAch, 'Dawnfang Stalker');
      expect(mockApplyUnlockedAchievements).toHaveBeenCalledWith(sampleAch);
    });

    it('treat: same wire-up', async () => {
      (apiClient.treatTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { totemId: 'ttm_1', achievements: sampleAch },
      });
      const { result } = renderHook(() => useTotemGame());
      await result.current.treat('ttm_1');
      expect(mockNotificationService.processAchievementsFromResponse)
        .toHaveBeenCalledWith(sampleAch, 'Dawnfang Stalker');
      expect(mockApplyUnlockedAchievements).toHaveBeenCalledWith(sampleAch);
    });

    it('evolve: same wire-up', async () => {
      (apiClient.evolveTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { evolution: { newStage: 3 }, totemId: 'ttm_1', achievements: sampleAch },
      });
      const { result } = renderHook(() => useTotemGame());
      await result.current.evolve('ttm_1');
      expect(mockNotificationService.processAchievementsFromResponse)
        .toHaveBeenCalledWith(sampleAch, 'Dawnfang Stalker');
      expect(mockApplyUnlockedAchievements).toHaveBeenCalledWith(sampleAch);
    });

    it('falls back gracefully when totem not in context', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { totemId: 'ttm_unknown', achievements: sampleAch },
      });
      const { result } = renderHook(() => useTotemGame());
      await result.current.feed('ttm_unknown');
      // Second arg is undefined — service falls back to "You" subject
      expect(mockNotificationService.processAchievementsFromResponse)
        .toHaveBeenCalledWith(sampleAch, undefined);
    });

    it('does NOT call notify or apply when achievements is missing', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 0 }, // no achievements field
      });
      const { result } = renderHook(() => useTotemGame());
      await result.current.feed('ttm_1');
      expect(mockNotificationService.processAchievementsFromResponse).not.toHaveBeenCalled();
      expect(mockApplyUnlockedAchievements).not.toHaveBeenCalled();
    });

    it('does NOT call notify or apply when achievements is empty array', async () => {
      (apiClient.feedTotem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { xpGained: 0, achievements: [] },
      });
      const { result } = renderHook(() => useTotemGame());
      await result.current.feed('ttm_1');
      expect(mockNotificationService.processAchievementsFromResponse).not.toHaveBeenCalled();
      expect(mockApplyUnlockedAchievements).not.toHaveBeenCalled();
    });
  });
});
