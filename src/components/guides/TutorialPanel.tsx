import { ethers } from 'ethers';
import { CheckCircle, Gift, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from '../../contexts/UserContext';
import { useAchievements } from "../../contexts/AchievementsContext";
import { useEffect, useState } from 'react';
import { useTransactionService } from '../../hooks/useTransactionService';
import { ActionType, Step } from '../../types/types';

interface TutorialPanelProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  steps: Step[];
  stepActions: Record<string, () => void>;
  isLocked: boolean;
  isComplete: boolean;
  rewardId: string;
  tokenReward: string;
  experienceReward: number;
  requiresTotem: boolean;
  hasClaimed: boolean;
  onClaimReward: (rewardId: string, totemId: string) => void;
}

export default function TutorialPanel({
  title,
  subtitle,
  imageUrl,
  steps,
  stepActions,
  isLocked,
  isComplete,
  rewardId,
  tokenReward,
  experienceReward,
  requiresTotem,
  hasClaimed,
  onClaimReward
}: TutorialPanelProps) {
  const { comingSoon, totems } = useUser();
  const [loading, setLoading] = useState(false);
  const current = !isComplete && !isLocked;

  const handleClaim = async () => {
      if (loading || hasClaimed) return;

      setLoading(true);
      try {
          // For rewards that require totem, use first totem ID, otherwise use "0"
          const totemId = requiresTotem && totems && totems.length > 0 ? totems[0].tokenId : "0";
          await onClaimReward(rewardId, totemId as string);
      } catch (error) {
          // Error is already handled in parent component, just reset loading here
          console.error('Claim failed:', error);
      } finally {
          setLoading(false);
      }
  };
  
  // Determine if user can claim this reward
  const canClaim = isComplete && !hasClaimed && (!requiresTotem || (totems && totems.length > 0));

  return (
    <div className={`
      group rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 flex flex-col overflow-hidden border 
      ${isComplete ? "border-gray-300 dark:border-gray-700 bg-zinc-200 dark:bg-zinc-900" : isLocked ? "border-red-400/50" : "bg-zinc-300 dark:bg-zinc-800 border-purple-300 dark:border-purple-500"}`}
    >
      {imageUrl && (
        <div className="h-64 w-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
      )}

      <div className="flex items-center justify-between p-4">
        <h3 className={`text-lg font-semibold ${current ? "text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`}>{title}</h3>
        {isComplete ? (
          <CheckCircle className="text-green-500" />
        ) : isLocked ? (
          <Lock className="text-red-400" />
        ) : null}
      </div>
      <p className="text-sm px-4 text-gray-600 dark:text-gray-400">{subtitle}</p>
      <ul className="space-y-2 p-4 flex-grow">
        {steps.map((step, idx) => {
          const complete = step.isStepComplete ? step.isStepComplete() : step.complete;

          return (
          <li
            key={idx}
            className={`flex justify-between items-center text-sm h-6
              ${complete ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}
          >
            <span>
              {complete 
              ? <CheckCircle className="w-4 h-4 mr-2" />
              : <span className="inline-block w-4 h-4 rounded-full border border-gray-400 dark:border-gray-600 mr-2" />}
            </span>

            <span className="mr-auto">
              {step.label}
            </span>
            
            {!complete && step.actionType === 'link' && step.actionUrl && (
              <Link className="ml-2 text-purple-500 hover:text-purple-400 hover:underline font-bold" to={step.actionUrl!}>
                {step.actionText}
              </Link>
            )}

            {!complete && step.actionType === 'button' && step.actionId && (
              <button
                disabled={comingSoon}
                className={`ml-2 px-2 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700
                    ${comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => stepActions[step.actionId!]?.()}
              >
                {step.actionText}
              </button>
            )}

            {!complete && step.actionType === 'external' && step.actionUrl && (
                <a 
                    href={step.actionUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-purple-500 hover:text-purple-400 hover:underline font-bold"
                >
                    {step.actionText}
                </a>
            )}

          </li>
        )})}
      </ul>

      {/* Reward Claim Section */}
      <div className="px-4 pb-4">
          <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <div className="flex items-center gap-2 justify-between h-7">
                  <div className="flex items-center space-x-2">
                      <Gift className="w-5 h-5 text-purple-500" />
                      <span className="text-sm font-medium">
                          Reward: {tokenReward} TOTEM
                          {experienceReward > 0 && ` + ${experienceReward} XP`}
                      </span>
                  </div>
                  
                  {hasClaimed ? (
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          ✓ Claimed
                      </span>
                  ) : canClaim ? (
                      <button
                          onClick={handleClaim}
                          disabled={loading || comingSoon}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {loading ? "Claiming..." : "Claim Reward"}
                      </button>
                  ) : isComplete ? (
                      <span className="text-sm text-gray-500">
                          {requiresTotem && (!totems || totems.length === 0) ? "Need Totem to claim" : "Available to claim"}
                      </span>
                  ) : (
                      <span className="text-sm text-gray-500">
                          Complete steps to unlock
                      </span>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}