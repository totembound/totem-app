/**
 * useTutorialClaims - Web2 REST API version of tutorial reward claims
 *
 * Manages tutorial step reward claiming using the REST API instead of smart contracts.
 * Uses a shared React context so TutorialWizard and TutorialPanels share the same
 * claim state — claiming in one immediately disables the button in the other.
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useUser } from '../../contexts/UserContext';
import apiClient from '../../services/ApiClient';
import { TUTORIAL_STEPS_CONFIG } from './useTutorialConfig';
import { notificationService } from '../../services/NotificationService';
import { NotificationType } from '../../types/notifications';
import { CURRENCY_NAMES } from '../../config/constants';

const LAST_STEP_ID = TUTORIAL_STEPS_CONFIG[TUTORIAL_STEPS_CONFIG.length - 1]?.stepId;

// Add tutorial methods to apiClient if not already there
const getTutorialProgress = async () => {
  // Use rewards endpoint for tutorial progress
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/v1'}/rewards/tutorial/progress`, {
    headers: {
      'Authorization': apiClient.getAccessToken() || '',
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

const claimTutorialReward = async (rewardId: string, totemId: string) => {
  // Convert rewardId to step number (e.g., "tutorial_step_1_signup" -> 1)
  const stepMatch = rewardId.match(/tutorial_step_(\d+)/);
  const step = stepMatch ? parseInt(stepMatch[1], 10) : null;

  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/v1'}/rewards/tutorial`, {
    method: 'POST',
    headers: {
      'Authorization': apiClient.getAccessToken() || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ step, totemId })
  });
  return response.json();
};

// ============================================
// Context type and creation
// ============================================

interface TutorialClaimsContextType {
  claimStatus: Record<string, boolean>;
  loading: Record<string, boolean>;
  handleClaimReward: (rewardId: string, requiresTotem: boolean) => Promise<{ success: boolean } | undefined>;
  getClaimStatus: (rewardId: string) => { hasClaimed: boolean; isLoading: boolean };
  canClaim: (rewardId: string, isStepComplete: boolean, requiresTotem: boolean) => boolean;
  tutorialComplete: boolean;
  dismissTutorialComplete: () => void;
}

const TutorialClaimsContext = createContext<TutorialClaimsContextType | null>(null);

// ============================================
// Provider component
// ============================================

export const TutorialClaimsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useTutorialClaimsInternal();
  return (
    <TutorialClaimsContext.Provider value={value}>
      {children}
    </TutorialClaimsContext.Provider>
  );
};

// ============================================
// Consumer hook (shared state)
// ============================================

export const useTutorialClaims = (): TutorialClaimsContextType => {
  const context = useContext(TutorialClaimsContext);
  if (!context) {
    throw new Error('useTutorialClaims must be used within a TutorialClaimsProvider');
  }
  return context;
};

// ============================================
// Internal hook (state logic)
// ============================================

const useTutorialClaimsInternal = () => {
  const [claimStatus, setClaimStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [tutorialComplete, setTutorialComplete] = useState(false);

  const {
    updateBalances,
    fetchTotems,
    showError,
    totems,
    isSignedUp,
    setEssenceBalance,
    updateTotemAttributes
  } = useUser();

  // Check claim status on mount and when user/auth changes
  useEffect(() => {
    // Clear claim status when user logs out
    if (!isSignedUp || !apiClient.isAuthenticated()) {
      const defaultStatus: Record<string, boolean> = {};
      for (const step of TUTORIAL_STEPS_CONFIG) {
        defaultStatus[step.rewardId] = false;
      }
      setClaimStatus(defaultStatus);
      setLoading({});
      setTutorialComplete(false);
      return;
    }

    const checkClaimStatus = async () => {
      try {
        const response = await getTutorialProgress();

        if (response.success) {
          const newClaimStatus: Record<string, boolean> = {};
          // Backend returns completedSteps as array of step numbers [1, 2, 3...]
          const completedSteps: number[] = response.completedSteps || response.data?.completedSteps || [];

          for (const step of TUTORIAL_STEPS_CONFIG) {
            // Map step number to rewardId - stepId matches the step number
            newClaimStatus[step.rewardId] = completedSteps.includes(step.stepId);
          }

          setClaimStatus(newClaimStatus);
        }
      } catch (error) {
        console.error('Error checking tutorial claim status:', error);
        // Default to unclaimed
        const defaultStatus: Record<string, boolean> = {};
        for (const step of TUTORIAL_STEPS_CONFIG) {
          defaultStatus[step.rewardId] = false;
        }
        setClaimStatus(defaultStatus);
      }
    };

    checkClaimStatus();
  }, [isSignedUp]); // eslint-disable-line react-hooks/exhaustive-deps -- only re-check on auth change, not totem updates

  const handleClaimReward = async (rewardId: string, requiresTotem: boolean) => {
    if (loading[rewardId]) return;

    setLoading(prev => ({ ...prev, [rewardId]: true }));

    try {
      const totemId = requiresTotem && totems && totems.length > 0 ? totems[0].id : '';
      const response = await claimTutorialReward(rewardId, totemId);

      if (response.success) {
        setClaimStatus(prev => ({ ...prev, [rewardId]: true }));

        // Use inline balance from response (avoids GET /v1/user/profile)
        if (response.data?.newBalance !== undefined) {
          setEssenceBalance(response.data.newBalance);
        } else {
          await updateBalances();
        }

        // Use inline XP from response (avoids GET /v1/totems)
        if (totemId && response.data?.totemExperience !== undefined) {
          updateTotemAttributes(totemId, { experience: response.data.totemExperience });
        } else if (totemId) {
          await fetchTotems();
        }

        // Show descriptive tutorial step completion notification
        const stepConfig = TUTORIAL_STEPS_CONFIG.find(s => s.rewardId === rewardId);
        const amount = response.data?.reward?.amount || Number(stepConfig?.tokenReward || 0);
        if (amount > 0 && stepConfig) {
          const stepName = stepConfig.title.replace(/^\d+\.\s*/, '');
          notificationService.showNotification(
            NotificationType.REWARD_CLAIMED,
            `Tutorial Complete: ${stepName}! +${amount} ${CURRENCY_NAMES.SOFT}${stepConfig.experienceReward ? ` +${stepConfig.experienceReward} XP` : ''}`,
          );
        }

        // Show celebration when last tutorial step is claimed
        if (stepConfig && stepConfig.stepId === LAST_STEP_ID) {
          setTutorialComplete(true);
        }

        return { success: true };
      } else {
        throw new Error(response.error?.message || 'Claim failed');
      }
    } catch (error) {
      console.error('Failed to claim tutorial reward:', error);
      showError('Claim Failed', 'Failed to claim tutorial reward. Please try again.');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, [rewardId]: false }));
    }
  };

  const getClaimStatus = (rewardId: string) => ({
    hasClaimed: claimStatus[rewardId] || false,
    isLoading: loading[rewardId] || false
  });

  const canClaim = (rewardId: string, isStepComplete: boolean, requiresTotem: boolean) => {
    const { hasClaimed } = getClaimStatus(rewardId);
    return isStepComplete && !hasClaimed && (!requiresTotem || (totems && totems.length > 0));
  };

  return {
    claimStatus,
    loading,
    handleClaimReward,
    getClaimStatus,
    canClaim,
    tutorialComplete,
    dismissTutorialComplete: () => setTutorialComplete(false),
  };
};
