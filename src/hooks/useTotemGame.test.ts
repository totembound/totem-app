/**
 * useTotemGame hook tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTotemGame } from './useTotemGame';

// Mock ApiClient
vi.mock('../services/ApiClient', () => ({
  default: {
    feedTotem: vi.fn(),
    trainTotem: vi.fn(),
    treatTotem: vi.fn(),
    evolveTotem: vi.fn(),
    setNickname: vi.fn(),
  },
}));

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
});
