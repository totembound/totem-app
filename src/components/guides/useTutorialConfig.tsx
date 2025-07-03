import { ethers } from 'ethers';
import { useUser } from '../../contexts/UserContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { Step, TutorialStep, Species } from '../../types/types';

// Pure configuration without function references
export interface TutorialStepConfig {
  stepId: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  rewardId: string;
  tokenReward: string;
  experienceReward: number;
  requiresTotem: boolean;
  steps: StepConfig[];
}

export interface StepConfig {
  label: string;
  checkType: 'isConnected' 
    | 'isSignedUp' 
    | 'isTokenApproved' 
    | 'hasAchievement' 
    | 'hasTotems' 
    | 'hasTotemName' 
    | 'hasAchievementProgress' 
    | 'hasClickedLink'
    | 'custom';
  checkParam?: string; // For achievement IDs, etc.
  checkParamNum?: number; // For achievement progress, etc.
  optional?: boolean;
  actionType?: 'link' | 'button' | 'external';
  actionId?: string;
  actionUrl?: string;
  linkState?: Record<string, any>;
  actionText?: string;
}

// Tutorial reward IDs
export const TUTORIAL_REWARDS = {
  STEP_1: ethers.id("tutorial_step_1_signup"),
  STEP_2: ethers.id("tutorial_step_2_mint"),
  STEP_3: ethers.id("tutorial_step_3_care"),
  STEP_4: ethers.id("tutorial_step_4_challenge"),
  STEP_5: ethers.id("tutorial_step_5_evolve"),
  STEP_6: ethers.id("tutorial_step_6_explore")
};

// Pure configuration data
export const TUTORIAL_STEPS_CONFIG: TutorialStepConfig[] = [
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
      { 
        label: "Connect Wallet", 
        checkType: "isConnected", 
        actionType: "button", 
        actionId: "connectWallet", 
        actionText: "Connect" 
      },
      { 
        label: "Signup and Claim TOTEM", 
        checkType: "isSignedUp", 
        actionType: "link", 
        actionUrl: "/signup", 
        actionText: "Signup" 
      },
      { 
        label: "Approve Tokens", 
        checkType: "isTokenApproved", 
        actionType: "link", 
        actionUrl: "/rewards", 
        actionText: "Approve" 
      },
      { 
        label: "Claim Daily Reward", 
        checkType: "hasAchievement", 
        checkParam: "daily_login", 
        actionType: "link", 
        actionUrl: "/rewards", 
        actionText: "Claim" 
      }
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
      {
        label: "Explore the Available Totems",
        checkType: "hasClickedLink",
        checkParam: "codex_totem_link",
        actionType: "link",
        actionUrl: "/guides/codex/totems",
        actionText: "Explore"
      },
      { 
        label: "Purchase Your First Totem", 
        checkType: "hasTotems", 
        actionType: "link", 
        actionUrl: "/shop", 
        actionText: "Shop" 
      },
      { 
        label: "Become a Chosen Keeper", 
        checkType: "hasAchievement", 
        checkParam: "collector_progression"
      },
      { 
        label: "Give it a Nickname (optional)", 
        checkType: "hasTotemName", 
        optional: true, 
        actionType: "link", 
        actionUrl: "/totems", 
        actionText: "Name"
      },
    ]
  },
  {
    stepId: 3,
    title: "3. Care for Your Totem",
    subtitle: "Every Totem hungers, grows, and remembers. Begin the ritual of care.",
    imageUrl: "/guides/tutorial/tutorial-traintotem.jpg",
    rewardId: TUTORIAL_REWARDS.STEP_3,
    tokenReward: "20",
    experienceReward: 150,
    requiresTotem: true,
    steps: [
      {
        label: "Learn More About Your Chosen Totem",
        checkType: "hasClickedLink",
        checkParam: "habitat_totem_link",
        actionType: "link",
        actionUrl: "/guides/codex/totems/{species}",
        actionText: "Learn"
      },
      { 
        label: "Feed your Totem", 
        checkType: "hasAchievement", 
        checkParam: "feed_progression", 
        actionType: "link", 
        actionUrl: "/totems", 
        actionText: "Feed" 
      },
      { 
        label: "Train your Totem", 
        checkType: "hasAchievement", 
        checkParam: "train_progression", 
        actionType: "link", 
        actionUrl: "/totems", 
        actionText: "Train" 
      },
      { 
        label: "Raise Happiness above threshold", 
        checkType: "hasAchievement", 
        checkParam: "treat_progression", 
        actionType: "link", 
        actionUrl: "/totems", 
        actionText: "Treat" 
      }
    ]
  },
  {
    stepId: 4,
    title: "4. Prove Yourself in a Challenge",
    subtitle: "Test your bond. Step into the Trials and be seen.",
    imageUrl: "/guides/tutorial/tutorial-challenge.jpg",
    rewardId: TUTORIAL_REWARDS.STEP_4,
    tokenReward: "30",
    experienceReward: 200,
    requiresTotem: true,
    steps: [
      {
        label: "Learn How to do Challenges",
        checkType: "hasClickedLink",
        checkParam: "guides_challenge_link",
        actionType: "link",
        actionUrl: "/guides/how-to",
        linkState: {
          openSection: 6
        },
        actionText: "Learn"
      },
      { 
        label: "Complete Beginner Challenge", 
        checkType: "hasAchievement",
        checkParam: "challenge_initiate",
        actionType: "link",
        actionUrl: "/challenges",
        actionText: "Attempt"
      },
      { 
        label: "Complete all daily attempts", 
        checkType: "hasAchievementProgress",
        checkParam: "challenge_progression",
        checkParamNum: 5,
        actionType: "link",
        actionUrl: "/challenges",
        actionText: "Complete"
      }
    ]
  },
  {
    stepId: 5,
    title: "5. Evolve Your Totem",
    subtitle: "Only those who journey may grow. Let evolution mark your spirit.",
    imageUrl: "/guides/tutorial/tutorial-evolution.jpg",
    rewardId: TUTORIAL_REWARDS.STEP_5,
    tokenReward: "25",
    experienceReward: 250,
    requiresTotem: true,
    steps: [
      {
        label: "Learn How to Evolve Your Totems",
        checkType: "hasClickedLink",
        checkParam: "guides_evolve_link",
        actionType: "link",
        actionUrl: "/guides/how-to",
        linkState: {
          openSection: 7
        },
        actionText: "Learn"
      },
      { 
        label: "Trigger Stage Evolution", 
        checkType: "hasAchievement",
        checkParam: "evolution_progression",
        actionType: "link",
        actionUrl: "/totems",
        actionText: "Trigger"
      },
      { 
        label: "Reach Stage 2", 
        checkType: "hasAchievement",
        checkParam: "evolution_progression",
        actionType: "link",
        actionUrl: "/totems",
        actionText: "Evolve"
      }
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
      {
        label: "Learn How to Embark on a Expedition",
        checkType: "hasClickedLink",
        checkParam: "guides_expedition_link",
        actionType: "link",
        actionUrl: "/guides/how-to",
        linkState: {
          openSection: 8
        },
        actionText: "Learn"
      },
      {
        label: "Recruit the Rest of Your Team",
        checkType: "hasAchievementProgress",
        checkParam: "collector_progression",
        checkParamNum: 3,
        actionType: "link",
        actionUrl: "/shop",
        actionText: "Recruit"
      },
      { 
        label: "Begin an Expedition", 
        checkType: "hasAchievement",
        checkParam: "expedition_explorer",
        actionType: "link",
        actionUrl: "/expeditions",
        actionText: "Embark"
      },
      { 
        label: "Join Discord (optional)", 
        checkType: "hasClickedLink",
        checkParam: "discord_join",
        actionType: "external",
        actionUrl: "https://discord.gg/MhKQC5E6xe",
        actionText: "Join",
        optional: true
      },
    ]
  }
];

// Hook to convert config to runtime tutorial steps with functions
export const useTutorialConfig = () => {
  const { 
    isConnected, 
    isSignedUp, 
    isTokenApproved, 
    totems, 
    connect, 
    comingSoon,
    hasClickedLink
  } = useUser();
  const { getAchievementById } = useAchievements();

  const hasAchievement = (id: string) => {
    const ach = getAchievementById(ethers.id(id));
    if (!ach) return false;

    // For OneTime achievements, check isCompleted
    if (ach.achievementType == 0) { // AchievementType.OneTime = 0
      return ach.isCompleted;
    }

    // For Progression achievements, check currentCount
    return ach.currentCount > 0;
  };

  const hasAchievementProgress = (id: string, targetCount: number) => {
    const achievement = getAchievementById(ethers.id(id));

    if (!achievement) {
      return false;
    }

    return achievement.currentCount >= targetCount;
  };

  const checkStep = (step: StepConfig): boolean => {
    switch (step.checkType) {
      case 'isConnected':
        return isConnected;
      case 'isSignedUp':
        return isSignedUp;
      case 'isTokenApproved':
        return isTokenApproved;
      case 'hasAchievement':
        return step.checkParam ? hasAchievement(step.checkParam) : false;
      case 'hasTotems':
        return totems?.length! > 0;
      case 'hasTotemName':
        return totems && totems.length > 0 && totems[0]?.attributes?.displayName?.length > 0;
      case 'hasAchievementProgress':
        return step.checkParam && step.checkParamNum !== undefined
          ? hasAchievementProgress(step.checkParam, step.checkParamNum)
          : false;
      case 'hasClickedLink':
        return step.checkParam ? hasClickedLink(step.checkParam) : false;
      case 'custom':
        // For custom checks, return false by default
        // These can be overridden in specific implementations
        return false;
      default:
        return false;
    }
  };

  const getSpeciesName = (species: Species): string => {
  // Convert enum to string and make it lowercase/URL-friendly
  return Species[species].toLowerCase();
};

  const convertConfigToSteps = (config: TutorialStepConfig[]): TutorialStep[] => {
  return config.map(stepConfig => ({
    ...stepConfig,
    steps: stepConfig.steps.map(stepConfigItem => {
      let actionUrl = stepConfigItem.actionUrl;
      
      // Process {species} placeholder
      if (actionUrl && actionUrl.includes('{species}')) {
        if (totems && totems.length > 0) {
          const speciesName = getSpeciesName(totems[0].attributes.species);
          actionUrl = actionUrl.replace('{species}', speciesName);
        } 
      }

      return {
        label: stepConfigItem.label,
        complete: false,
        optional: stepConfigItem.optional,
        actionType: stepConfigItem.actionType,
        actionId: stepConfigItem.actionId,
        actionUrl: actionUrl, // This is now the processed URL
        actionText: stepConfigItem.actionText,
        checkType: stepConfigItem.checkType,
        checkParam: stepConfigItem.checkParam,
        linkState: stepConfigItem.linkState,
        isStepComplete: () => checkStep(stepConfigItem)
      } as Step;
    })
  }));
};

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

  const stepActions: Record<string, () => void> = {
    connectWallet: () => {
      if (comingSoon) return;
      connect();
    },
    startStarterChallenge: () => {
      console.log("Launching Starter Challenge");
    },
    shareChallengeResult: () => {
      console.log("Opening share dialog");
    }
  };

  const tutorialSteps = convertConfigToSteps(TUTORIAL_STEPS_CONFIG);

  return {
    tutorialSteps,
    areAllStepsComplete,
    stepActions,
    checkStep,
    TUTORIAL_REWARDS
  };
};