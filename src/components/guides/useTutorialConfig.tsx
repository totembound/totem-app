/**
 * Tutorial Configuration
 */
import { useUser } from '../../contexts/UserContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { useGame } from '../../contexts/GameContext';
import { Step, TutorialStep, Species } from '../../types/types';
import { CURRENCY_NAMES } from '../../config/constants';

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
    | 'hasAchievement'
    | 'hasClaimedDaily'
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
  isSelectedTotem?: boolean;
}

// Tutorial reward IDs - Web2 uses plain string IDs instead of hashed IDs
export const TUTORIAL_REWARDS = {
  STEP_1: "tutorial_step_1_signup",
  STEP_2: "tutorial_step_2_mint",
  STEP_3: "tutorial_step_3_care",
  STEP_4: "tutorial_step_4_challenge",
  STEP_5: "tutorial_step_5_evolve",
  STEP_6: "tutorial_step_6_explore"
};

// Pure configuration data
export const TUTORIAL_STEPS_CONFIG: TutorialStepConfig[] = [
  {
    stepId: 1,
    title: "1. Claim Your Spiritkeeper Reward",
    subtitle: "As your journey begins, a small gift awaits. The Ancients honor the brave.",
    imageUrl: "/guides/tutorial/tutorial-spiritkeeper.jpg",
    rewardId: TUTORIAL_REWARDS.STEP_1,
    tokenReward: "50",
    experienceReward: 0,
    requiresTotem: false,
    steps: [
      {
        label: `Create Account and Claim ${CURRENCY_NAMES.SOFT}`,
        checkType: "isSignedUp",
        actionType: "link",
        actionUrl: "/signup",
        actionText: "Sign Up"
      },
      {
        label: "Open Your Uncommon Totem Box",
        checkType: "hasTotems",
        actionType: "link",
        actionUrl: "/rewards",
        actionText: "Open"
      },
      {
        label: "Claim Daily Reward",
        // hasClaimedDaily reads streakStatus.streakDays which only increments
        // on actual daily-reward claim. The previous check (login-progression
        // achievement) was incremented at login time, so it falsely reported
        // "claimed" for fresh users who had only logged in.
        checkType: "hasClaimedDaily",
        actionType: "link",
        actionUrl: "/rewards",
        actionText: "Claim"
      }
    ]
  },
  {
    stepId: 2,
    title: "2. Step into the Spirit World",
    subtitle: "A strong team needs diversity. Try picking a totem from a different domain to cover more ground.",
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
        label: "Buy 2nd Totem",
        checkType: "hasAchievementProgress",
        checkParam: "collector_progression",
        checkParamNum: 2,
        actionType: "link",
        actionUrl: "/shop",
        actionText: "Shop"
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
    tokenReward: "50",
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
        isSelectedTotem: true,
        actionText: "Feed"
      },
      {
        label: "Train your Totem",
        checkType: "hasAchievement",
        checkParam: "train_progression",
        actionType: "link",
        actionUrl: "/totems",
        isSelectedTotem: true,
        actionText: "Train"
      },
      {
        label: "Raise Happiness above threshold",
        checkType: "hasAchievement",
        checkParam: "treat_progression",
        actionType: "link",
        actionUrl: "/totems",
        isSelectedTotem: true,
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
    tokenReward: "50",
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
          openSection: 4
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
    tokenReward: "50",
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
          openSection: 5
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
    tokenReward: "250",
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
          openSection: 6
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
        label: "Complete an Expedition",
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
    totems,
    comingSoon: _comingSoon,
    hasClickedLink
  } = useUser();
  const { getAchievementById } = useAchievements();
  const { rewardsState } = useGame();
  // AchievementsContext loads achievements on mount — no need to refresh here.
  // The tutorial reads from the same context so data is always up-to-date.

  // Convert achievement ID to format used by AchievementsContext
  const getAchievementKey = (id: string): string => {
    // In Web2, achievement IDs are prefixed with 'ach_' and use hyphens
    // Config uses underscores (e.g., 'collector_progression') but IDs use hyphens ('ach_collector-progression')
    const normalized = id.replace(/_/g, '-');
    return normalized.startsWith('ach-') ? normalized : `ach_${normalized}`;
  };

  const hasAchievement = (id: string) => {
    const ach = getAchievementById(getAchievementKey(id));
    if (!ach) return false;

    // For OneTime achievements, check isCompleted
    if (ach.achievementType == 0) { // AchievementType.OneTime = 0
      return ach.isCompleted;
    }

    // For Progression achievements, check currentCount
    return ach.currentCount > 0;
  };

  const hasAchievementProgress = (id: string, targetCount: number) => {
    const achievement = getAchievementById(getAchievementKey(id));

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
      case 'hasAchievement':
        return step.checkParam ? hasAchievement(step.checkParam) : false;
      case 'hasClaimedDaily':
        // streakDays > 0 means the user has claimed at least one daily reward
        // and is mid-streak. After a missed day the API resets to 0, but
        // bestStreak persists — fall back to that so a returning user who
        // already finished step 1 doesn't see it re-open.
        return (rewardsState?.streakStatus?.streakDays ?? 0) > 0
          || (rewardsState?.streakStatus?.bestStreak ?? 0) > 0;
      case 'hasTotems':
        return totems?.length! > 0;
      case 'hasTotemName':
        // Web2: Check for nickname (user-customizable name) on attributes
        return totems && totems.length > 0 && (totems[0]?.attributes?.nickname?.length ?? 0) > 0;
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
        isSelectedTotem: stepConfigItem.isSelectedTotem,
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
