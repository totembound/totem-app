/**
 * AchievementsContext tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Hoist mock variables so vi.mock factories can reference them
const { mockUseAuth, mockApiClient } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockApiClient: {
    getAchievements: vi.fn(),
    checkAchievement: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ApiClient
vi.mock('../services/ApiClient', () => ({
  default: mockApiClient,
}));

// Mock bundled achievements config
vi.mock('../config/achievements', () => ({
  ACHIEVEMENT_CATEGORIES: [
    { id: 0, name: 'Evolution' },
    { id: 1, name: 'Collection' },
    { id: 2, name: 'Streak' },
    { id: 3, name: 'Action' },
    { id: 4, name: 'Challenge' },
    { id: 5, name: 'Expedition' },
  ],
  ACHIEVEMENT_TYPES: [
    { id: 0, name: 'OneTime' },
    { id: 1, name: 'Progression' },
  ],
  ACHIEVEMENTS: [
    {
      id: 'ach_first_feed',
      name: 'First Feed',
      description: 'Feed a totem for the first time',
      category: 3,
      type: 0,
      subType: 'first_feed',
      badgeUri: '/badges/first-feed.png',
      milestones: [
        { index: 0, name: 'First Feed', description: 'Feed once', requirement: 1, badgeUri: '/badges/first-feed-m0.png' },
      ],
    },
    {
      id: 'ach_evolution_progression',
      name: 'Evolution Master',
      description: 'Evolve totems multiple times',
      category: 0,
      type: 1,
      subType: 'evolution_progression',
      badgeUri: '/badges/evolution.png',
      milestones: [
        { index: 0, name: 'First Evolution', description: 'Evolve once', requirement: 1, badgeUri: '/badges/evo-1.png' },
        { index: 1, name: 'Evolve 5', description: 'Evolve 5 times', requirement: 5, badgeUri: '/badges/evo-5.png' },
        { index: 2, name: 'Evolve 10', description: 'Evolve 10 times', requirement: 10, badgeUri: '/badges/evo-10.png' },
      ],
    },
    {
      id: 'ach_requires_evo',
      name: 'Advanced Feeder',
      description: 'Requires evolution achievement first',
      category: 3,
      type: 0,
      subType: 'requires_evo',
      badgeUri: '/badges/advanced.png',
      requires: ['ach_evolution_progression'],
      milestones: [
        { index: 0, name: 'Advanced', description: 'Feed after evolving', requirement: 1, badgeUri: '/badges/advanced-m0.png' },
      ],
    },
  ],
  getAchievementById: (id: string) => {
    const achs = [
      { id: 'ach_first_feed', name: 'First Feed', subType: 'first_feed' },
      { id: 'ach_evolution_progression', name: 'Evolution Master', subType: 'evolution_progression' },
      { id: 'ach_requires_evo', name: 'Advanced Feeder', subType: 'requires_evo' },
    ];
    return achs.find(a => a.id === id || a.subType === id);
  },
}));

import { AchievementsProvider, useAchievements } from './AchievementsContext';

// Achievement data is now mocked via vi.mock('../config/achievements') above

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AchievementsProvider>{children}</AchievementsProvider>
);

describe('AchievementsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default: authenticated
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    // Default: API returns empty achievements
    mockApiClient.getAchievements.mockResolvedValue({
      success: true,
      data: { achievements: {} },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAchievements', () => {
    it('should throw when used outside AchievementsProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useAchievements());
      }).toThrow('useAchievements must be used within an AchievementsProvider');
      consoleSpy.mockRestore();
    });

    it('should start with loading true', () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });
      expect(result.current.isLoading).toBe(true);
    });

    it('should load achievements from config and API', async () => {
      mockApiClient.getAchievements.mockResolvedValue({
        success: true,
        data: {
          achievements: {
            ach_first_feed: [{ unlocked: true, progress: 1 }],
          },
        },
      });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have achievements organized by category
      expect(result.current.achievementsById['ach_first_feed']).toBeDefined();
      expect(result.current.achievementsById['ach_first_feed'].isCompleted).toBe(true);
      expect(result.current.achievementsById['ach_first_feed'].currentCount).toBe(1);
    });

    it('should handle unauthenticated state (empty progress)', async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Config still loads but no user progress
      expect(result.current.achievementsById['ach_first_feed']).toBeDefined();
      expect(result.current.achievementsById['ach_first_feed'].isCompleted).toBe(false);
      expect(result.current.achievementsById['ach_first_feed'].currentCount).toBe(0);
    });

    it('should have no error after successful load', async () => {
      // Config is cached at module level after first successful load,
      // so subsequent renders always get cached config
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(Object.keys(result.current.achievementsById).length).toBeGreaterThan(0);
    });

    it('should handle API error gracefully', async () => {
      mockApiClient.getAchievements.mockRejectedValue(new Error('API down'));

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still have config-based achievements with empty progress
      expect(result.current.achievementsById['ach_first_feed']).toBeDefined();
      expect(result.current.achievementsById['ach_first_feed'].isCompleted).toBe(false);
    });
  });

  describe('progression achievements', () => {
    it('should track milestone progress for progression achievements', async () => {
      mockApiClient.getAchievements.mockResolvedValue({
        success: true,
        data: {
          achievements: {
            ach_evolution_progression: [
              { unlocked: true, progress: 3 },
              { unlocked: false, progress: 3 },
              { unlocked: false, progress: 3 },
            ],
          },
        },
      });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const evo = result.current.achievementsById['ach_evolution_progression'];
      expect(evo).toBeDefined();
      expect(evo.currentCount).toBe(3);
      expect(evo.isCompleted).toBe(false); // Not all milestones unlocked
    });

    it('should mark progression as completed when all milestones unlocked', async () => {
      mockApiClient.getAchievements.mockResolvedValue({
        success: true,
        data: {
          achievements: {
            ach_evolution_progression: [
              { unlocked: true, progress: 10 },
              { unlocked: true, progress: 10 },
              { unlocked: true, progress: 10 },
            ],
          },
        },
      });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const evo = result.current.achievementsById['ach_evolution_progression'];
      expect(evo.isCompleted).toBe(true);
      expect(evo.currentCount).toBe(10);
    });
  });

  describe('requirements', () => {
    it('should mark requirements as not met when dependency not achieved', async () => {
      mockApiClient.getAchievements.mockResolvedValue({
        success: true,
        data: { achievements: {} },
      });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reqAch = result.current.achievementsById['ach_requires_evo'];
      expect(reqAch).toBeDefined();
      expect(reqAch.requirementsMet).toBe(false);
    });

    it('should mark requirements as met when dependency achieved', async () => {
      mockApiClient.getAchievements.mockResolvedValue({
        success: true,
        data: {
          achievements: {
            ach_evolution_progression: [
              { unlocked: true, progress: 10 },
              { unlocked: true, progress: 10 },
              { unlocked: true, progress: 10 },
            ],
          },
        },
      });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const reqAch = result.current.achievementsById['ach_requires_evo'];
      expect(reqAch.requirementsMet).toBe(true);
    });
  });

  describe('getAchievementById', () => {
    it('should find achievement by id', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.getAchievementById('ach_first_feed');
      expect(found).toBeDefined();
      expect(found?.name).toBe('First Feed');
    });

    it('should find achievement by subType', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // subType is id without 'ach_' prefix
      const found = result.current.getAchievementById('first_feed');
      expect(found).toBeDefined();
      expect(found?.id).toBe('ach_first_feed');
    });

    it('should return undefined for unknown id', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getAchievementById('nonexistent')).toBeUndefined();
    });
  });

  describe('hasAchievement', () => {
    it('should return true for completed achievement', async () => {
      mockApiClient.getAchievements.mockResolvedValue({
        success: true,
        data: {
          achievements: {
            ach_first_feed: [{ unlocked: true, progress: 1 }],
          },
        },
      });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasAchievement('ach_first_feed')).toBe(true);
    });

    it('should return false for incomplete achievement', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasAchievement('ach_first_feed')).toBe(false);
    });

    it('should return false for unknown achievement', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasAchievement('nonexistent')).toBe(false);
    });
  });

  describe('incrementAchievementProgress', () => {
    it('should increment currentCount optimistically', async () => {
      mockApiClient.getAchievements.mockResolvedValue({
        success: true,
        data: {
          achievements: {
            ach_first_feed: [{ unlocked: false, progress: 0 }],
          },
        },
      });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.achievementsById['ach_first_feed'].currentCount).toBe(0);

      act(() => {
        result.current.incrementAchievementProgress('ach_first_feed');
      });

      expect(result.current.achievementsById['ach_first_feed'].currentCount).toBe(1);
    });

    it('should not crash for unknown achievement id', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not throw
      act(() => {
        result.current.incrementAchievementProgress('unknown_id');
      });
    });
  });

  describe('showAchievementEffect / hideAchievementEffect', () => {
    it('should toggle activeAchievementEffect', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeAchievementEffect).toBeNull();

      act(() => {
        result.current.showAchievementEffect('ach_first_feed');
      });
      expect(result.current.activeAchievementEffect).toBe('ach_first_feed');

      act(() => {
        result.current.hideAchievementEffect();
      });
      expect(result.current.activeAchievementEffect).toBeNull();
    });
  });

  describe('checkSpecificAchievement', () => {
    it('should return true when API confirms achievement unlocked', async () => {
      mockApiClient.checkAchievement.mockResolvedValue({
        success: true,
        data: { unlocked: true },
      });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let unlocked = false;
      await act(async () => {
        unlocked = await result.current.checkSpecificAchievement('ach_first_feed');
      });

      expect(unlocked).toBe(true);
      expect(mockApiClient.checkAchievement).toHaveBeenCalledWith('ach_first_feed');
    });

    it('should return false when API says not unlocked', async () => {
      mockApiClient.checkAchievement.mockResolvedValue({
        success: true,
        data: { unlocked: false },
      });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let unlocked = true;
      await act(async () => {
        unlocked = await result.current.checkSpecificAchievement('ach_first_feed');
      });

      expect(unlocked).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false });

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let unlocked = true;
      await act(async () => {
        unlocked = await result.current.checkSpecificAchievement('ach_first_feed');
      });

      expect(unlocked).toBe(false);
      expect(mockApiClient.checkAchievement).not.toHaveBeenCalled();
    });

    it('should return false on API error', async () => {
      mockApiClient.checkAchievement.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let unlocked = true;
      await act(async () => {
        unlocked = await result.current.checkSpecificAchievement('ach_first_feed');
      });

      expect(unlocked).toBe(false);
    });
  });

  describe('refreshAchievements', () => {
    it('should reload data from config and API', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Now refresh with updated API data
      mockApiClient.getAchievements.mockResolvedValue({
        success: true,
        data: {
          achievements: {
            ach_first_feed: [{ unlocked: true, progress: 1 }],
          },
        },
      });

      await act(async () => {
        await result.current.refreshAchievements();
      });

      expect(result.current.achievementsById['ach_first_feed'].isCompleted).toBe(true);
    });
  });

  describe('achievement view structure', () => {
    it('should build correct AchievementView shape', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const view = result.current.achievementsById['ach_first_feed'];
      expect(view.id).toBe('ach_first_feed');
      expect(view.name).toBe('First Feed');
      expect(view.description).toBe('Feed a totem for the first time');
      expect(view.category).toBe(3); // Action
      expect(view.achievementType).toBe(0); // OneTime
      expect(view.subType).toBe('first_feed');
      expect(view.enabled).toBe(true);
      expect(view.badgeUri).toBe('/badges/first-feed.png');
      expect(view.milestones).toHaveLength(1);
      expect(view.milestones[0].requirement).toBe(1);
      expect(view.requirements).toEqual([]);
    });

    it('should populate requirements array for dependent achievements', async () => {
      const { result } = renderHook(() => useAchievements(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const view = result.current.achievementsById['ach_requires_evo'];
      expect(view.requirements).toHaveLength(1);
      expect(view.requirements[0].achievementId).toBe('ach_evolution_progression');
    });
  });
});
