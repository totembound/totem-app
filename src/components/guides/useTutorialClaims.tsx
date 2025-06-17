import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useTransactionService } from '../../hooks/useTransactionService';
import { ActionType } from '../../types/types';
import { TUTORIAL_STEPS_CONFIG } from './useTutorialConfig';

export const useTutorialClaims = () => {
  const [claimStatus, setClaimStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const { 
    address, 
    updateBalances, 
    updateTotem, 
    showError, 
    totems,
    isGaslessEnabled 
  } = useUser();

  const txService = useTransactionService({
    gaslessEnabled: isGaslessEnabled,
    waitForConfirmation: true
  });

  // Check claim status on mount and when user/totems change
  useEffect(() => {
    if (!address || !txService) return;
    
    const checkClaimStatus = async () => {
      const newClaimStatus: Record<string, boolean> = {};

      for (const step of TUTORIAL_STEPS_CONFIG) {
        try {
          const hasClaimed = await txService.query('rewards', 'hasClaimedOneTimeReward', [address, step.rewardId]);
          newClaimStatus[step.rewardId] = hasClaimed;
        } catch (error) {
          console.error(`Error checking claim status for ${step.rewardId}:`, error);
          newClaimStatus[step.rewardId] = false;
        }
      }

      setClaimStatus(newClaimStatus);
    };

    checkClaimStatus();
  }, [address, totems, txService]);

  const handleClaimReward = async (rewardId: string, requiresTotem: boolean) => {
    if (!txService || loading[rewardId]) return;

    setLoading(prev => ({ ...prev, [rewardId]: true }));
    
    try {
      const totemId = requiresTotem && totems && totems.length > 0 ? totems[0].tokenId : "0";
      const result = await txService.claimTutorialStepReward(rewardId, totemId as string);
      
      if (result.success) {
        setClaimStatus(prev => ({ ...prev, [rewardId]: true }));
        await updateBalances();
        
        if (totemId !== "0") {
          await updateTotem(BigInt(totemId), ActionType.None);
        }
        
        return { success: true };
      } else {
        throw new Error('Transaction failed');
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
    canClaim
  };
};