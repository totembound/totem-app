/**
 * useAchievementsApi hook tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAchievementsApi } from './useAchievementsApi';

// Mock ApiClient
vi.mock('../services/ApiClient', () => ({
  default: {
    getAchievements: vi.fn(),
    checkAchievement: vi.fn(),
  },
}));

// Mock NotificationService
vi.mock('../services/NotificationService', () => ({
  notificationService: {
    showAchievementUnlocked: vi.fn(),
    showMilestoneUnlocked: vi.fn(),
    processAchievementsFromResponse: vi.fn(),
  },
}));

import apiClient from '../services/ApiClient';

describe('useAchievementsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAchievements', () => {
    it('should fetch and store achievements', async () => {
      const mockData = {
        'ach_first-evolve': [{ unlocked: true, progress: 1 }],
        'ach_collector-progression': [
          { unlocked: true, progress: 5 },
          { unlocked: false, progress: 5 },
        ],
      };

      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { achievements: mockData },
      });

      const { result } = renderHook(() => useAchievementsApi());

      let achievements: any;
      await act(async () => {
        achievements = await result.current.getAchievements();
      });

      expect(achievements).toEqual(mockData);
      expect(result.current.achievements).toEqual(mockData);
    });

    it('should return empty object on failure', async () => {
      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => useAchievementsApi());

      let achievements: any;
      await act(async () => {
        achievements = await result.current.getAchievements();
      });

      expect(achievements).toEqual({});
    });

    it('should handle exception', async () => {
      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useAchievementsApi());

      let achievements: any;
      await act(async () => {
        achievements = await result.current.getAchievements();
      });

      expect(achievements).toEqual({});
      expect(result.current.error).toBe('fail');
    });
  });

  describe('checkAchievement', () => {
    it('should return check result and refresh', async () => {
      (apiClient.checkAchievement as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { unlocked: true, achievement: { id: 'ach_first-evolve', name: 'First Evolve', badgeUri: '/badge.png' } },
      });
      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { achievements: {} },
      });

      const { result } = renderHook(() => useAchievementsApi());

      let checkResult: any;
      await act(async () => {
        checkResult = await result.current.checkAchievement('ach_first-evolve');
      });

      expect(checkResult).not.toBeNull();
      expect(checkResult.unlocked).toBe(true);
      // Should have refreshed achievements
      expect(apiClient.getAchievements).toHaveBeenCalled();
    });

    it('should return null on failure', async () => {
      (apiClient.checkAchievement as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => useAchievementsApi());

      let checkResult: any;
      await act(async () => {
        checkResult = await result.current.checkAchievement('ach_bad');
      });

      expect(checkResult).toBeNull();
    });
  });

  describe('hasAchievement', () => {
    it('should return true for completed one-time achievement', async () => {
      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          achievements: {
            'ach_first-evolve': [{ unlocked: true, progress: 1 }],
          },
        },
      });

      const { result } = renderHook(() => useAchievementsApi());

      await act(async () => {
        await result.current.getAchievements();
      });

      expect(result.current.hasAchievement('ach_first-evolve')).toBe(true);
    });

    it('should return false for incomplete achievement', async () => {
      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          achievements: {
            'ach_collector-progression': [
              { unlocked: true, progress: 5 },
              { unlocked: false, progress: 5 },
            ],
          },
        },
      });

      const { result } = renderHook(() => useAchievementsApi());

      await act(async () => {
        await result.current.getAchievements();
      });

      // Not all milestones unlocked
      expect(result.current.hasAchievement('ach_collector-progression')).toBe(false);
    });

    it('should return false for unknown achievement', () => {
      const { result } = renderHook(() => useAchievementsApi());
      expect(result.current.hasAchievement('ach_nonexistent')).toBe(false);
    });
  });

  describe('findAchievementById', () => {
    it('should find by exact id', async () => {
      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          achievements: {
            'ach_first-evolve': [{ unlocked: true, progress: 1 }],
          },
        },
      });

      const { result } = renderHook(() => useAchievementsApi());

      await act(async () => {
        await result.current.getAchievements();
      });

      expect(result.current.findAchievementById('ach_first-evolve')).toHaveLength(1);
    });

    it('should try with ach_ prefix', async () => {
      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          achievements: {
            'ach_first-evolve': [{ unlocked: true, progress: 1 }],
          },
        },
      });

      const { result } = renderHook(() => useAchievementsApi());

      await act(async () => {
        await result.current.getAchievements();
      });

      // Searching without prefix should try with prefix
      expect(result.current.findAchievementById('first-evolve')).toHaveLength(1);
    });

    it('should return undefined for missing', () => {
      const { result } = renderHook(() => useAchievementsApi());
      expect(result.current.findAchievementById('missing')).toBeUndefined();
    });
  });

  describe('getAchievementProgress', () => {
    it('should return milestone array', async () => {
      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          achievements: {
            'ach_trainer-progression': [
              { unlocked: true, progress: 20 },
              { unlocked: false, progress: 20 },
            ],
          },
        },
      });

      const { result } = renderHook(() => useAchievementsApi());

      await act(async () => {
        await result.current.getAchievements();
      });

      const progress = result.current.getAchievementProgress('ach_trainer-progression');
      expect(progress).toHaveLength(2);
      expect(progress[0].progress).toBe(20);
    });

    it('should return empty array for missing', () => {
      const { result } = renderHook(() => useAchievementsApi());
      expect(result.current.getAchievementProgress('missing')).toEqual([]);
    });
  });

  describe('loading state', () => {
    it('should track isLoading across actions', async () => {
      (apiClient.getAchievements as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { achievements: {} },
      });

      const { result } = renderHook(() => useAchievementsApi());
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.getAchievements();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
