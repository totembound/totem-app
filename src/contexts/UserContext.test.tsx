/**
 * UserContext tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Hoist mock variables so vi.mock factories can reference them
const { mockUseAuth, mockApiClient, mockGetUserStorage, mockSetUserStorage } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockApiClient: {
    isAuthenticated: vi.fn(),
    getTotems: vi.fn(),
    getTotem: vi.fn(),
    getProfile: vi.fn(),
    getAchievements: vi.fn(),
  },
  mockGetUserStorage: vi.fn().mockReturnValue({}),
  mockSetUserStorage: vi.fn(),
}));

// Mock AuthContext
vi.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ApiClient
vi.mock('../services/ApiClient', () => ({
  default: mockApiClient,
}));

// Mock species utils
vi.mock('../utils/species', () => ({
  getTotemImageUrl: vi.fn((species: number, color: number, stage: number) => `/img/${species}-${color}-${stage}.png`),
  getStageName: vi.fn((species: number, color: number, stage: number) => `Stage ${stage} Name`),
}));

// Mock localStorage utils
vi.mock('../utils/localStorage', () => ({
  getUserStorage: (...args: any[]) => mockGetUserStorage(...args),
  setUserStorage: (...args: any[]) => mockSetUserStorage(...args),
}));

import { UserProvider, useUser } from './UserContext';

const defaultAuthState = {
  isAuthenticated: true,
  user: {
    id: 'user-1',
    email: 'test@test.com',
    displayName: 'Test User',
    tier: 'free',
    currencies: { essence: 5000, gems: 100 },
  },
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>{children}</UserProvider>
);

describe('UserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockUseAuth.mockReturnValue(defaultAuthState);
    mockApiClient.isAuthenticated.mockReturnValue(true);

    // Default API responses
    mockApiClient.getTotems.mockResolvedValue({
      success: true,
      data: [],
    });
    mockApiClient.getProfile.mockResolvedValue({
      success: true,
      data: { currencies: { essence: 5000, gems: 100 } },
    });
    mockApiClient.getAchievements.mockResolvedValue({
      success: true,
      data: { achievements: {} },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useUser', () => {
    it('should throw when used outside UserProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useUser());
      }).toThrow('useUser must be used within a UserProvider');
      consoleSpy.mockRestore();
    });
  });

  describe('initial state', () => {
    it('should sync with auth state on mount', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.isSignedUp).toBe(true);
      expect(result.current.address).toBe('user-1');
      expect(result.current.essenceBalance).toBe('5000');
      expect(result.current.gemsBalance).toBe('100');
    });

    it('should handle unauthenticated state', async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
      mockApiClient.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useUser(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isSignedUp).toBe(false);
      expect(result.current.essenceBalance).toBe('0');
    });
  });

  describe('fetchTotems', () => {
    it('should fetch and transform totems', async () => {
      mockApiClient.getTotems.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'totem-1',
            name: 'My Goose',
            description: 'A fine goose',
            image: '/fallback.png',
            affinity: 'Water',
            domain: 'Lake',
            attributes: {
              species: 0,
              color: 1,
              rarity: 2,
              happiness: 75,
              experience: 500,
              stage: 1,
              strength: 15,
              agility: 12,
              wisdom: 18,
              nickname: 'Goosie',
              prestigeLevel: 0,
            },
            trackings: { lastFed: '2024-01-01' },
          },
        ],
      });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totems).toHaveLength(1);
      });

      const totem = result.current.totems[0];
      expect(totem.id).toBe('totem-1');
      expect(totem.displayName).toBe('Stage 1 Name');
      expect(totem.image).toBe('/img/0-1-1.png');
      expect(totem.attributes.happiness).toBe(75);
      expect(totem.attributes.nickname).toBe('Goosie');
      expect(totem.trackings).toEqual({ lastFed: '2024-01-01' });
    });

    it('should set empty totems when API returns success:false', async () => {
      mockApiClient.getTotems.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totemLoading).toBe(false);
      });

      expect(result.current.totems).toEqual([]);
    });

    it('should handle API error', async () => {
      mockApiClient.getTotems.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totemLoading).toBe(false);
      });

      expect(result.current.totemError).toBe('Failed to load your Totems. Please try again.');
    });

    it('should skip fetch when not authenticated', async () => {
      mockApiClient.isAuthenticated.mockReturnValue(false);
      mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });

      renderHook(() => useUser(), { wrapper });

      // Give it time to not call
      await new Promise(r => setTimeout(r, 50));
      expect(mockApiClient.getTotems).not.toHaveBeenCalled();
    });

    it('should clear totems on logout', async () => {
      mockApiClient.getTotems.mockResolvedValue({
        success: true,
        data: [{ id: 't1', name: 'T', attributes: { species: 0, color: 0, stage: 0 }, trackings: {} }],
      });

      const { result, rerender } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totems).toHaveLength(1);
      });

      // Simulate logout
      mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
      mockApiClient.isAuthenticated.mockReturnValue(false);
      rerender();

      await waitFor(() => {
        expect(result.current.totems).toEqual([]);
      });
    });
  });

  describe('getTotem', () => {
    it('should find totem by id', async () => {
      mockApiClient.getTotems.mockResolvedValue({
        success: true,
        data: [
          { id: 'totem-1', name: 'T1', attributes: { species: 0, color: 0, stage: 0 }, trackings: {} },
          { id: 'totem-2', name: 'T2', attributes: { species: 1, color: 1, stage: 1 }, trackings: {} },
        ],
      });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totems).toHaveLength(2);
      });

      const found = result.current.getTotem('totem-2');
      expect(found).toBeDefined();
      expect(found?.id).toBe('totem-2');
    });

    it('should return undefined for unknown totem', async () => {
      mockApiClient.getTotems.mockResolvedValue({
        success: true,
        data: [{ id: 'totem-1', name: 'T1', attributes: { species: 0, color: 0, stage: 0 }, trackings: {} }],
      });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totems).toHaveLength(1);
      });

      expect(result.current.getTotem('nonexistent')).toBeUndefined();
    });
  });

  describe('removeTotem', () => {
    it('should remove totem from state', async () => {
      mockApiClient.getTotems.mockResolvedValue({
        success: true,
        data: [
          { id: 't1', name: 'T1', attributes: { species: 0, color: 0, stage: 0 }, trackings: {} },
          { id: 't2', name: 'T2', attributes: { species: 1, color: 1, stage: 1 }, trackings: {} },
        ],
      });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totems).toHaveLength(2);
      });

      act(() => {
        result.current.removeTotem('t1');
      });

      expect(result.current.totems).toHaveLength(1);
      expect(result.current.totems[0].id).toBe('t2');
    });
  });

  describe('updateTotemNickname', () => {
    it('should update nickname in local state', async () => {
      mockApiClient.getTotems.mockResolvedValue({
        success: true,
        data: [
          { id: 't1', name: 'T1', attributes: { species: 0, color: 0, stage: 0, nickname: null }, trackings: {} },
        ],
      });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totems).toHaveLength(1);
      });

      act(() => {
        result.current.updateTotemNickname('t1', 'Fluffy');
      });

      expect(result.current.totems[0].attributes.nickname).toBe('Fluffy');
    });
  });

  describe('updateTotemAttributes', () => {
    it('should update attributes locally', async () => {
      mockApiClient.getTotems.mockResolvedValue({
        success: true,
        data: [
          {
            id: 't1',
            name: 'T1',
            image: '/old.png',
            attributes: { species: 0, color: 0, stage: 0, happiness: 50, experience: 100 },
            trackings: {},
          },
        ],
      });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totems).toHaveLength(1);
      });

      act(() => {
        result.current.updateTotemAttributes('t1', {
          happiness: 60,
          experience: 200,
        });
      });

      expect(result.current.totems[0].attributes.happiness).toBe(60);
      expect(result.current.totems[0].attributes.experience).toBe(200);
    });

    it('should recalculate image and displayName on stage change', async () => {
      mockApiClient.getTotems.mockResolvedValue({
        success: true,
        data: [
          {
            id: 't1',
            name: 'T1',
            image: '/old.png',
            attributes: { species: 0, color: 1, stage: 0, happiness: 50, experience: 500 },
            trackings: {},
          },
        ],
      });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.totems).toHaveLength(1);
      });

      act(() => {
        result.current.updateTotemAttributes('t1', { stage: 1 });
      });

      expect(result.current.totems[0].image).toBe('/img/0-1-1.png');
      expect(result.current.totems[0].displayName).toBe('Stage 1 Name');
    });
  });

  describe('balance management', () => {
    it('should set essence balance directly', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.setEssenceBalance(9999);
      });

      expect(result.current.essenceBalance).toBe('9999');
    });

    it('canSpendEssence should check balance', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.canSpendEssence(100)).toBe(true);
      expect(result.current.canSpendEssence(999999)).toBe(false);
    });

    it('canSpendGems should check balance', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.canSpendGems(50)).toBe(true);
      expect(result.current.canSpendGems(999)).toBe(false);
    });
  });

  describe('message dialog', () => {
    it('should show error dialog', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.showError('Error Title', 'Something went wrong');
      });

      expect(result.current.messageDialog.isOpen).toBe(true);
      expect(result.current.messageDialog.title).toBe('Error Title');
      expect(result.current.messageDialog.message).toBe('Something went wrong');
    });

    it('should show success dialog', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.showSuccess('Success', 'It worked!');
      });

      expect(result.current.messageDialog.isOpen).toBe(true);
      expect(result.current.messageDialog.title).toBe('Success');
    });

    it('should hide dialog', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.showError('E', 'M');
      });
      expect(result.current.messageDialog.isOpen).toBe(true);

      act(() => {
        result.current.hideError();
      });
      expect(result.current.messageDialog.isOpen).toBe(false);
    });
  });

  describe('link tracking', () => {
    it('should track and check links', async () => {
      // getUserStorage returns {} for linkTracking initial value
      mockGetUserStorage.mockReturnValue({});

      const { result } = renderHook(() => useUser(), { wrapper });

      // Wait for effects to settle (linkTracking initializes via useEffect)
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.hasClickedLink('tutorial-1')).toBeFalsy();

      act(() => {
        result.current.trackLink('tutorial-1');
      });

      expect(result.current.hasClickedLink('tutorial-1')).toBe(true);
      expect(mockSetUserStorage).toHaveBeenCalled();
    });
  });

  describe('tutorial wizard', () => {
    it('should set tutorial visibility', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.setTutorialWizardVisible(false);
      });

      expect(result.current.tutorialWizardVisible).toBe(false);
      expect(mockSetUserStorage).toHaveBeenCalled();
    });
  });

  describe('rate limit handling', () => {
    it('should update rate limit state', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.handleRateLimitUpdate('2024-01-01T00:00:00Z', 95, 100, true);
      });

      expect(result.current.rateLimitState.isExceeded).toBe(true);
      expect(result.current.rateLimitState.currentUsage).toBe(95);
      expect(result.current.rateLimitState.dailyLimit).toBe(100);
    });

    it('should handle rate limit error with dialog', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.handleRateLimitError({
          name: 'RateLimitError',
          message: 'Rate limited',
          resetTime: '2024-01-01T00:00:00Z',
          currentUsage: 100,
          dailyLimit: 100,
        } as any);
      });

      expect(result.current.rateLimitState.isExceeded).toBe(true);
      expect(result.current.messageDialog.isOpen).toBe(true);
      expect(result.current.messageDialog.title).toBe('API Limit Reached');
    });
  });

  describe('account type', () => {
    it('should return Free for non-premium users', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      let accountType = '';
      act(() => {
        accountType = result.current.updateAccountType();
      });

      expect(accountType).toBe('Free');
    });

    it('should return Premium for premium users', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { ...defaultAuthState.user, tier: 'premium' },
      });

      const { result } = renderHook(() => useUser(), { wrapper });

      let accountType = '';
      act(() => {
        accountType = result.current.updateAccountType();
      });

      expect(accountType).toBe('Premium');
    });
  });

  describe('web2 compat methods', () => {
    it('connect should be a no-op', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });
      // Should not throw
    });

    it('disconnect should clear state', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isSignedUp).toBe(false);
    });

  });

  describe('checkSignupStatus', () => {
    it('should sync with isAuthenticated', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });

      await act(async () => {
        await result.current.checkSignupStatus();
      });

      expect(result.current.isSignedUp).toBe(true);
    });
  });
});
