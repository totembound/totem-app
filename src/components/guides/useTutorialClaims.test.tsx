import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockUserContext = vi.hoisted(() => ({
  updateBalances: vi.fn().mockResolvedValue(undefined),
  fetchTotems: vi.fn().mockResolvedValue(undefined),
  showError: vi.fn(),
  totems: [{ id: 'ttm_001', attributes: { species: 2 } }],
  isSignedUp: true,
  setEssenceBalance: vi.fn(),
  updateTotemAttributes: vi.fn(),
}));

const mockApiClient = vi.hoisted(() => ({
  getAccessToken: vi.fn().mockReturnValue('test-token'),
  isAuthenticated: vi.fn().mockReturnValue(true),
}));

const mockNotificationService = vi.hoisted(() => ({
  showNotification: vi.fn(),
}));

// ============================================================================
// MODULE MOCKS
// ============================================================================

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => mockUserContext,
}));

vi.mock('../../services/ApiClient', () => ({
  default: mockApiClient,
}));

vi.mock('../../services/NotificationService', () => ({
  notificationService: mockNotificationService,
}));

vi.mock('../../config/constants', () => ({
  CURRENCY_NAMES: { SOFT: 'Essence', PREMIUM: 'Gems' },
}));

// Mock global fetch
const mockFetch = vi.fn();

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import { TutorialClaimsProvider, useTutorialClaims } from './useTutorialClaims';

// ============================================================================
// HELPERS
// ============================================================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TutorialClaimsProvider>{children}</TutorialClaimsProvider>
);

describe('useTutorialClaims', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserContext.updateBalances.mockResolvedValue(undefined);
    mockUserContext.fetchTotems.mockResolvedValue(undefined);
    mockUserContext.isSignedUp = true;
    mockUserContext.totems = [{ id: 'ttm_001', attributes: { species: 2 } }] as any;
    mockApiClient.getAccessToken.mockReturnValue('test-token');
    mockApiClient.isAuthenticated.mockReturnValue(true);

    // Default: tutorial progress returns no completed steps
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, completedSteps: [] }),
    });
    global.fetch = mockFetch as any;
  });

  // =========================================================================
  // CONTEXT REQUIREMENT
  // =========================================================================

  it('throws when used outside TutorialClaimsProvider', () => {
    // Suppress React error boundary logs
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useTutorialClaims());
    }).toThrow('useTutorialClaims must be used within a TutorialClaimsProvider');
    spy.mockRestore();
  });

  // =========================================================================
  // INITIAL STATE
  // =========================================================================

  it('loads claim status on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, completedSteps: [1, 2] }),
    });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      expect(result.current.getClaimStatus('tutorial_step_1_signup').hasClaimed).toBe(true);
      expect(result.current.getClaimStatus('tutorial_step_2_mint').hasClaimed).toBe(true);
      expect(result.current.getClaimStatus('tutorial_step_3_care').hasClaimed).toBe(false);
    });
  });

  it('defaults all steps to unclaimed when not signed up', async () => {
    mockUserContext.isSignedUp = false;
    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      expect(result.current.getClaimStatus('tutorial_step_1_signup').hasClaimed).toBe(false);
    });
    // Should not have called fetch for progress
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/v1/rewards/tutorial/progress'),
      expect.anything()
    );
  });

  it('defaults all steps to unclaimed on API error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      expect(result.current.getClaimStatus('tutorial_step_1_signup').hasClaimed).toBe(false);
    });
  });

  // =========================================================================
  // getClaimStatus
  // =========================================================================

  it('returns hasClaimed=false and isLoading=false for unclaimed step', async () => {
    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      const status = result.current.getClaimStatus('tutorial_step_3_care');
      expect(status.hasClaimed).toBe(false);
      expect(status.isLoading).toBe(false);
    });
  });

  // =========================================================================
  // canClaim
  // =========================================================================

  it('returns true when step is complete, not claimed, and has totem (when required)', async () => {
    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      expect(result.current.canClaim('tutorial_step_3_care', true, true)).toBe(true);
    });
  });

  it('returns false when step is not complete', async () => {
    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      expect(result.current.canClaim('tutorial_step_3_care', false, false)).toBe(false);
    });
  });

  it('returns false when already claimed', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, completedSteps: [3] }),
    });
    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      expect(result.current.canClaim('tutorial_step_3_care', true, false)).toBe(false);
    });
  });

  it('returns false when requires totem but user has none', async () => {
    mockUserContext.totems = [] as any;
    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      expect(result.current.canClaim('tutorial_step_3_care', true, true)).toBe(false);
    });
  });

  it('returns true when requires totem=false and no totems', async () => {
    mockUserContext.totems = [] as any;
    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      expect(result.current.canClaim('tutorial_step_1_signup', true, false)).toBe(true);
    });
  });

  // =========================================================================
  // handleClaimReward
  // =========================================================================

  it('claims reward and updates balance from inline response', async () => {
    // First call is progress check, second is claim
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { newBalance: 2025, reward: { amount: 25 } },
        }),
      });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });

    await waitFor(() => {
      expect(result.current.getClaimStatus('tutorial_step_1_signup').hasClaimed).toBe(false);
    });

    await act(async () => {
      await result.current.handleClaimReward('tutorial_step_1_signup', false);
    });

    expect(mockUserContext.setEssenceBalance).toHaveBeenCalledWith(2025);
    expect(result.current.getClaimStatus('tutorial_step_1_signup').hasClaimed).toBe(true);
  });

  it('falls back to updateBalances when no inline balance', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: {} }),
      });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBeDefined());

    await act(async () => {
      await result.current.handleClaimReward('tutorial_step_1_signup', false);
    });

    expect(mockUserContext.updateBalances).toHaveBeenCalled();
  });

  it('updates totem attributes when inline XP returned', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { newBalance: 2050, totemExperience: 250 },
        }),
      });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBeDefined());

    await act(async () => {
      await result.current.handleClaimReward('tutorial_step_2_mint', true);
    });

    expect(mockUserContext.updateTotemAttributes).toHaveBeenCalledWith(
      'ttm_001',
      { experience: 250 }
    );
  });

  it('falls back to fetchTotems when no inline XP', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { newBalance: 100 } }),
      });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBeDefined());

    await act(async () => {
      await result.current.handleClaimReward('tutorial_step_2_mint', true);
    });

    expect(mockUserContext.fetchTotems).toHaveBeenCalled();
  });

  it('shows notification on successful claim', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { newBalance: 2025, reward: { amount: 25 } },
        }),
      });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBeDefined());

    await act(async () => {
      await result.current.handleClaimReward('tutorial_step_1_signup', false);
    });

    expect(mockNotificationService.showNotification).toHaveBeenCalledWith(
      'reward_claimed',
      expect.stringContaining('Claim Your Spiritkeeper Reward')
    );
  });

  it('shows error and rethrows when claim fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: { message: 'Already claimed' } }),
      });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBeDefined());

    let caughtError: Error | null = null;
    try {
      await act(async () => {
        await result.current.handleClaimReward('tutorial_step_1_signup', false);
      });
    } catch (e) {
      caughtError = e as Error;
    }

    expect(caughtError?.message).toBe('Already claimed');
    expect(mockUserContext.showError).toHaveBeenCalledWith(
      'Claim Failed',
      'Failed to claim tutorial reward. Please try again.'
    );
  });

  it('does not double-claim while loading', async () => {
    // Slow claim response
    let resolveClaimFn: (v: any) => void;
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockImplementationOnce(() => new Promise(resolve => { resolveClaimFn = resolve; }));

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBeDefined());

    // First call starts loading
    act(() => {
      result.current.handleClaimReward('tutorial_step_1_signup', false);
    });

    // Second call should be no-op while loading
    const secondResult = await act(async () => {
      return result.current.handleClaimReward('tutorial_step_1_signup', false);
    });
    expect(secondResult).toBeUndefined();

    // Resolve the first call
    resolveClaimFn!({
      json: () => Promise.resolve({ success: true, data: { newBalance: 100 } }),
    });
  });

  // =========================================================================
  // TUTORIAL COMPLETE
  // =========================================================================

  it('sets tutorialComplete when last step claimed', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { newBalance: 2200, reward: { amount: 200 } },
        }),
      });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBeDefined());

    expect(result.current.tutorialComplete).toBe(false);

    await act(async () => {
      await result.current.handleClaimReward('tutorial_step_6_explore', false);
    });

    expect(result.current.tutorialComplete).toBe(true);
  });

  it('dismissTutorialComplete resets the flag', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { newBalance: 2200, reward: { amount: 200 } },
        }),
      });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBeDefined());

    await act(async () => {
      await result.current.handleClaimReward('tutorial_step_6_explore', false);
    });

    expect(result.current.tutorialComplete).toBe(true);

    act(() => {
      result.current.dismissTutorialComplete();
    });

    expect(result.current.tutorialComplete).toBe(false);
  });

  // =========================================================================
  // CLAIM SENDS CORRECT STEP NUMBER
  // =========================================================================

  it('parses step number from rewardId and sends to API', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, completedSteps: [] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { newBalance: 100 } }),
      });

    const { result } = renderHook(() => useTutorialClaims(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBeDefined());

    await act(async () => {
      await result.current.handleClaimReward('tutorial_step_3_care', true);
    });

    // Second fetch call is the claim
    const claimCall = mockFetch.mock.calls[1];
    const body = JSON.parse(claimCall[1].body);
    expect(body.step).toBe(3);
    expect(body.totemId).toBe('ttm_001');
  });
});
