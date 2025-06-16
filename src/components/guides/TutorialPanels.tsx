import { ethers } from 'ethers';
import { useUser } from '../../contexts/UserContext';
import { useAchievements } from "../../contexts/AchievementsContext";
import { useEffect, useState } from 'react';
import { useTransactionService } from '../../hooks/useTransactionService';
import { ActionType, Step, TutorialStep } from '../../types/types';
import TutorialPanel from './TutorialPanel';

export default function TutorialPanels() {
    const { connect, isConnected, isSignedUp, isTokenApproved, isGaslessEnabled, showError, totems, address, updateBalances, updateTotem, comingSoon } = useUser();
    const { getAchievementById } = useAchievements();
    const [claimStatus, setClaimStatus] = useState<Record<string, boolean>>({});

    const txService = useTransactionService({
        gaslessEnabled: isGaslessEnabled,
        waitForConfirmation: true
    });

    const hasAchievement = (id: string) => {
      const ach = getAchievementById(ethers.id(id));
      return ach?.currentCount! > 0;
    }

    const areAllStepsComplete = (steps: Step[]) => {
      if (!Array.isArray(steps) || steps.length === 0) return false;

      return steps.every(step => {
        if (step.optional) {
          return true;
        }
        if (step.isStepComplete) {
          return step.isStepComplete();
        }
        return step.complete;
      });
    };

    const TUTORIAL_REWARDS = {
        STEP_1: ethers.id("tutorial_step_1_signup"),
        STEP_2: ethers.id("tutorial_step_2_mint"),
        STEP_3: ethers.id("tutorial_step_3_care"),
        STEP_4: ethers.id("tutorial_step_4_challenge"),
        STEP_5: ethers.id("tutorial_step_5_evolve"),
        STEP_6: ethers.id("tutorial_step_6_explore")
    };

    const tutorialSteps: TutorialStep[] = [
    {
      stepId: 1,
      title: "1. Claim Your Spiritkeeper Reward",
      subtitle: "As your journey begins, a small gift awaits. The Ancients honor the brave.",
      imageUrl: "/guides/tutorial/tutorial-spiritkeeper.jpg",
      rewardId: TUTORIAL_REWARDS.STEP_1,
      tokenReward: "25",
      experienceReward: 0,
      requiresTotem: false,
      steps: [
        { label: "Connect Wallet", complete: false, isStepComplete: function() {return isConnected;}, actionType: "button", actionId: "connectWallet", actionText: "Connect" },
        { label: "Signup and Claim TOTEM", complete: false, isStepComplete: function() {return isSignedUp;}, actionType: "link", actionUrl: "/signup", actionText: "Signup" },
        { label: "Approve Tokens", complete: false, isStepComplete: function() {return isTokenApproved;}, actionType: "link", actionUrl: "/rewards", actionText: "Approve" },
        { label: "Claim Daily Reward", complete: false, isStepComplete: function() {return hasAchievement('daily_login');}, actionType: "link", actionUrl: "/rewards", actionText: "Claim" }
      ]
    },
    {
      stepId: 2,
      title: "2. Step into the Spirit World",
      subtitle: "The veil thins. The Ancients call. But first… a Totem must be chosen.",
      imageUrl: "/guides/tutorial/tutorial-spiritworld.jpg",
      rewardId: TUTORIAL_REWARDS.STEP_2,
      tokenReward: "50",
      experienceReward: 100,
      requiresTotem: true,
      steps: [
        { label: "Purchase Your First Totem", complete: false, isStepComplete: function() {
          return totems?.length! > 0;}, actionType: "link", actionUrl: "/shop", actionText: "Shop" },
        { label: "Become a Chosen Keeper", complete: false, isStepComplete: function() {return hasAchievement('collector_progression');} },
        { label: "Give it a Nickname (optional)", complete: false, optional: true, isStepComplete: function() {return totems[0]?.attributes?.displayName?.length > 0;}, actionType: "link", actionUrl: "/totems", actionText: "Name"}
      ]
    },
    {
      stepId: 3,
      title: "3. Care for Your Totem",
      subtitle: "Every Totem hungers, grows, and remembers. Begin the ritual of care.",
      imageUrl: "/guides/tutorial/tutorial-traintotem.jpg",
      rewardId: TUTORIAL_REWARDS.STEP_3,
      tokenReward: "20",
      experienceReward: 50,
      requiresTotem: true,
      steps: [
        { label: "Feed your Totem", complete: false, isStepComplete: function() {return hasAchievement('feed_progression');}, actionType: "link", actionUrl: "/totems", actionText: "Feed" },
        { label: "Train your Totem", complete: false, isStepComplete: function() {return hasAchievement('train_progression');}, actionType: "link", actionUrl: "/totems", actionText: "Train" },
        { label: "Raise Happiness above threshold", complete: false, isStepComplete: function() {return hasAchievement('treat_progression');}, actionType: "link", actionUrl: "/totems", actionText: "Treat" }
      ]
    },
    {
      stepId: 4,
      title: "4. Prove Yourself in a Challenge",
      subtitle: "Test your bond. Step into the Trials and be seen.",
      imageUrl: "/guides/tutorial/tutorial-challenge.jpg",
      rewardId: TUTORIAL_REWARDS.STEP_4,
      tokenReward: "30",
      experienceReward: 75,
      requiresTotem: true,
      steps: [
        { label: "Complete Starter Challenge", complete: false },
        { label: "Complete all attempts", complete: false }
      ]
    },
    {
      stepId: 5,
      title: "5. Evolve Your Totem",
      subtitle: "Only those who journey may grow. Let evolution mark your spirit.",
      imageUrl: "/guides/tutorial/tutorial-evolution.jpg",
      rewardId: TUTORIAL_REWARDS.STEP_5,
      tokenReward: "25",
      experienceReward: 50,
      requiresTotem: true,
      steps: [
        { label: "Trigger Stage Evolution", complete: false },
        { label: "Reach Stage 2", complete: false }
      ]
    },
    {
      stepId: 6,
      title: "6. Explore the World",
      subtitle: "Beyond the veil lies discovery, Codex, Expeditions, and fellow Spiritkeepers await.",
      imageUrl: "/guides/tutorial/tutorial-explore.jpg",
      rewardId: TUTORIAL_REWARDS.STEP_6,
      tokenReward: "200",
      experienceReward: 0,
      requiresTotem: false,
      steps: [
        { label: "Join Discord", complete: false },
        { label: "Begin an Expedition", complete: false }
      ]
    }
  ];

  // Check claim status on mount and when user/totems change
  useEffect(() => {
      if (!address || !txService) return;
      console.log('check claim status');
      const checkClaimStatus = async () => {
          const newClaimStatus: Record<string, boolean> = {};

          for (const step of tutorialSteps) {
              try {
                  // Check if already claimed
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
  
  const handleClaimReward = async (rewardId: string, totemId: string) => {
      if (!txService) return;

      try {
          const result = await txService.claimTutorialStepReward(rewardId, totemId);
          
          if (result.success) {
              // Update claim status
              setClaimStatus(prev => ({ ...prev, [rewardId]: true }));
              
              // Update balances for token rewards
              await updateBalances();
              
              // Update totem for experience rewards (if totemId was provided and not "0")
              if (totemId) {
                  await updateTotem(BigInt(totemId), ActionType.None);
              }
          }
          else {
            throw new Error('Transaction failed');
          }
      } catch (error) {
          console.error('Failed to claim tutorial reward:', error);
          showError('Claim Failed', 'Failed to claim tutorial reward. Please try again.');
          throw error; // Re-throw so the card component can handle loading state
      }
  };
  
  const stepActions: Record<string, () => void> = {
    connectWallet: () => {
      if (comingSoon) {
        return;
      }
      connect();
      console.log("Connect Wallet");
    },
    startStarterChallenge: () => {
      // launch challenge modal, redirect, etc.
      console.log("Launching Starter Challenge");
    },
    shareChallengeResult: () => {
      console.log("Opening share dialog");
    }
    // Add more as needed
  };

  return (
    <div className="container mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
      {tutorialSteps.map((section, index) => {
        const completed = areAllStepsComplete(section.steps);
        const isPreviousCompleted = index === 0 || areAllStepsComplete(tutorialSteps[index-1]?.steps);

        return (
        <TutorialPanel
          key={index}
          title={section.title}
          subtitle={section.subtitle}
          imageUrl={section.imageUrl}
          steps={section.steps}
          stepActions={stepActions}
          isLocked={!isPreviousCompleted}
          isComplete={completed}
          rewardId={section.rewardId}
          tokenReward={section.tokenReward}
          experienceReward={section.experienceReward}
          requiresTotem={section.requiresTotem}
          onClaimReward={handleClaimReward}
          hasClaimed={claimStatus[section.rewardId]}
        />
      )})}
    </div>
  );
}
