/**
 * useAchievementRequirements tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Hoist mocks
const { mockHasAchievement, mockGetAchievementById } = vi.hoisted(() => ({
  mockHasAchievement: vi.fn(),
  mockGetAchievementById: vi.fn(),
}));

vi.mock('../contexts/AchievementsContext', () => ({
  useAchievements: () => ({
    hasAchievement: mockHasAchievement,
    getAchievementById: mockGetAchievementById,
  }),
}));

import { useAchievementRequirements } from './useAchievements';

describe('useAchievementRequirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkRequirements', () => {
    it('should return true when no requirements', () => {
      const { result } = renderHook(() => useAchievementRequirements());

      expect(result.current.checkRequirements(undefined)).toBe(true);
      expect(result.current.checkRequirements([])).toBe(true);
    });

    it('should return true when all requirements met', () => {
      mockHasAchievement.mockReturnValue(true);

      const { result } = renderHook(() => useAchievementRequirements());

      const reqs = [
        { achievementId: 'ach_1', milestoneIndex: 0 },
        { achievementId: 'ach_2', milestoneIndex: 0 },
      ];

      expect(result.current.checkRequirements(reqs)).toBe(true);
      expect(mockHasAchievement).toHaveBeenCalledTimes(2);
    });

    it('should return false when any requirement not met', () => {
      mockHasAchievement.mockImplementation((id: string) => id === 'ach_1');

      const { result } = renderHook(() => useAchievementRequirements());

      const reqs = [
        { achievementId: 'ach_1', milestoneIndex: 0 },
        { achievementId: 'ach_2', milestoneIndex: 0 },
      ];

      expect(result.current.checkRequirements(reqs)).toBe(false);
    });
  });

  describe('getMissingRequirements', () => {
    it('should return empty array when no requirements', () => {
      const { result } = renderHook(() => useAchievementRequirements());

      expect(result.current.getMissingRequirements(undefined)).toEqual([]);
      expect(result.current.getMissingRequirements([])).toEqual([]);
    });

    it('should return empty array when all requirements met', () => {
      mockHasAchievement.mockReturnValue(true);

      const { result } = renderHook(() => useAchievementRequirements());

      const reqs = [{ achievementId: 'ach_1', milestoneIndex: 0 }];
      expect(result.current.getMissingRequirements(reqs)).toEqual([]);
    });

    it('should return missing requirements with achievement data', () => {
      mockHasAchievement.mockImplementation((id: string) => id === 'ach_1');
      mockGetAchievementById.mockReturnValue({ id: 'ach_2', name: 'Missing One' });

      const { result } = renderHook(() => useAchievementRequirements());

      const reqs = [
        { achievementId: 'ach_1', milestoneIndex: 0 },
        { achievementId: 'ach_2', milestoneIndex: 1 },
      ];

      const missing = result.current.getMissingRequirements(reqs);
      expect(missing).toHaveLength(1);
      expect(missing[0].achievementId).toBe('ach_2');
      expect(missing[0].achievement).toEqual({ id: 'ach_2', name: 'Missing One' });
    });
  });
});
