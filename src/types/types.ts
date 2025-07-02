import { ethers } from 'ethers';
import { MessageDialogState } from '../components/MessageDialog';

export interface UserContextType extends UserContextState {
    checkSignupStatus: () => Promise<void>;
    updateBalances: () => Promise<void>;
    connect: () => Promise<void>;
    disconnect: () => void;
    getTotem: (tokenId: bigint) => NFTMetadata | undefined;
    addTotem: (tokenId: bigint) => Promise<void>;
    removeTotem: (tokenId: bigint) => void;
    updateTotem: (tokenId: bigint, type: ActionType) => Promise<void>;
    updateTotemEvolved: (tokenId: bigint) => Promise<void>;
    checkTokenApproval: () => Promise<boolean>;
    approveTokens: () => Promise<boolean>;
    setApprovalMessageDismissed: (dismissed: boolean) => void;
    updateAchievementStatus: () => Promise<void>;
    showError: (title: string, message: string) => void;
    hideError: () => void;
    setGaslessEnabled: (enabled: boolean) => void;
    setGaslessApiKey: (apiKey: string) => void;
    updateAccountType: (providedApiKey?: string) => AccountType;
    canSpendTotem: (amount: number) => boolean;
    canSpendCurrency: (amount: number) => boolean;
    setTutorialWizardVisible: (visible: boolean) => void;
    trackLink: (linkId: string, metadata?: Record<string, any>) => void;
    hasClickedLink: (linkId: string) => boolean;
}

export interface TotemUpdate {
    tokenId: bigint;
    attributes?: Partial<TotemAttributes>;
    trackings?: {
        [key in ActionType]?: ActionTracking;
    };
}

export type AccountType = 'Free' | 'Premium' | 'Advanced';

export interface UserContextState {
    // user state
    isSignedUp: boolean;
    isTokenApproved: boolean;
    totemBalance: string;
    polBalance: string;
    // metamask state
    isConnected: boolean;
    address: string;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    // totems
    totems: NFTMetadata[];
    totemLoading: boolean;
    totemError: string | null;
    // control state for updates
    isApprovalMessageDismissed: boolean;
    messageDialog: MessageDialogState;
    isGaslessEnabled: boolean;
    gaslessApiKey: string;
    accountType: AccountType;
    comingSoon: boolean;
    tutorialWizardVisible: boolean;
    linkTracking: Record<string, boolean>;
}

export enum Species {
    Goose,
    Otter,
    Wolf,
    Falcon,
    Beaver,
    Deer,
    Woodpecker,
    Turtle,
    Bear,
    Raven,
    Snake,
    Owl,
    None
}

export enum Color {
    Brown,
    Gray,
    White,
    Tawny,
    Slate,
    Copper,
    Cream,
    Dappled,
    Golden,
    DarkPurple,
    Charcoal,
    EmeraldGreen,
    CrimsonRed,
    DeepSapphire,
    EtherealSilver,
    RadiantGold,
    FrostbiteBlue,
    RosyPink,
    VerdantGold,
    RaindropTeal,
    FloralViolet,
    SunsetOrange,
    EmberRed,
    OceanicAzure,
    HarvestGold,
    PhantomBlack,
    EmberwoodBrown,
    StarlitSilver,
    None
}

export enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Limited
}

export enum Domain {
    Air = 0,
    Earth = 1,
    Water = 2,
    Fire = 3,
    Spirit = 4,
    Shadow = 5
}

export enum Affinity {
    Strength = 0,
    Agility = 1,
    Wisdom = 2
}

export interface TotemAttributes {
    species: Species;
    color: Color;
    rarity: Rarity;
    happiness: number;
    experience: number;
    stage: number;
    strength: number;
    agility: number;
    wisdom: number;
    displayName: string;
    prestigeLevel: number;
    isStaked: boolean;
}

export interface NFTMetadata {
    displayName: string;
    id: string;
    tokenId: bigint;
    name: string;
    description: string;
    image: string;
    affinity: string;
    domain: string;
    attributes: TotemAttributes;
    trackings: {
        [key in ActionType]?: ActionTracking
    }
}

export enum ActionType {
    Feed = 0,
    Train = 1,
    Treat = 2,
    Evolve = 3,
    None = 99
}

export interface ActionConfig {
    cost: bigint;            // TOTEM cost
    cooldown: number;        // Cooldown in seconds
    maxDaily: number;        // Max uses per day (0 for unlimited)
    minHappiness: number;    // Minimum happiness required
    happinessChange: number; // Positive or negative change to happiness
    experienceGain: number;  // Experience gained (0 for non-training actions)
    useTimeWindows: boolean; // Whether action uses time windows
    increasesHappiness: boolean; // Whether this action increases (true) or decreases (false) happiness
    enabled: boolean;        // Whether the action is currently enabled
}


export interface ActionTracking {
    lastUsed: number;
    dailyUses: number;
    dayStartTime: number;
}

export interface GameParameters {
    signupReward: bigint;    // Initial TOTEM reward
    mintPrice: bigint;       // TOTEM cost to mint
}

export interface TimeWindows {
    window1Start: number;    // UTC 00:00
    window2Start: number;    // UTC 08:00
    window3Start: number;    // UTC 16:00
}

export interface CategoryProgress {
    category: number;           // AchievementCategory enum as number
    totalAchievements: number;  // Total achievements in category
    completedAchievements: number; // Number of completed achievements
    totalMilestones: number;    // Total milestones across all achievements
    unlockedMilestones: number; // Number of unlocked milestones
}

export enum AchievementCategory {
    Evolution = 0,
    Collection = 1,
    Streak = 2,
    Action = 3,
    Challenge = 4,
    Expedition = 5
}

export interface AchievementState {
    achievements: Record<AchievementCategory, Achievement[]>;
    progress: Record<string, AchievementProgress>;
    loading: boolean;
    error: string | null;
  }
  
export interface AchievementRequirement {
    achievementId: string;
    milestoneIndex: bigint;
}

export interface AchievementNotification {
    id: string;
    type: 'achievement' | 'milestone';
    title: string;
    description: string;
    timestamp: number;
    badgeUri?: string;
}

// Enhanced Achievement interface
export interface Achievement {
    id: string;
    name: string;
    description: string;
    achievementType: number;
    subType: string;
    enabled: boolean;
    badgeUri: string;
    milestones: Milestone[];
    isCompleted: boolean;
    currentCount: bigint;
    category: AchievementCategory;
    requirements: AchievementRequirement[];
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    rewards?: {
        type: string;
        amount: number;
    }[];
}

export enum AchievementType {
    OneTime = 0,
    Progression = 1
}

// Contract view of Achievement (used in getAchievementsByCategory response)
export interface AchievementView {
    id: string;
    name: string;
    description: string;
    achievementType: AchievementType;
    subType: string;
    enabled: boolean;
    badgeUri: string;
    milestones: Milestone[];
    isCompleted: boolean;
    currentCount: bigint;
    category: AchievementCategory;
    requirements: AchievementRequirement[];
    requirementsMet : boolean;
}

// Utility types
export interface TokenActionTrackings {
    [key: string]: {
        [ActionType.Feed]?: ActionTracking;
        [ActionType.Train]?: ActionTracking;
        [ActionType.Treat]?: ActionTracking;
        [ActionType.Evolve]?: ActionTracking;
    };
}

export interface WindowTimes {
    currentWindow: 1 | 2 | 3;
    nextWindowStart: Date;
    currentWindowEnds: Date;
}

export interface StreakStatus {
    streakDays: number;
    canClaimToday: boolean;
    bestStreak: number;
    nextClaimTime: number;
    isProtected: boolean;
    protectionExpiry: number;
}

export interface WeeklyStatus {
    weeklyStreak: number;
    canClaimWeekly: boolean;
    bestWeeklyStreak: number;
    nextClaimTime: number;
    isProtected: boolean;
    protectionExpiry: number;
}

export interface Milestone {
    name: string;           // Display name of the milestone
    description: string;    // Description of the milestone
    badgeUri: string;      // IPFS URI for the badge
    requirement: bigint;    // Required count/value to unlock
}

export interface AchievementProgress {
    startTime: number;
    lastUpdate: number;
    count: bigint;
    achieved: boolean;
    unlockedMilestones: boolean[];
    requirementsMet : boolean;
}

export interface Attribute {
    trait_type: string;
    value: string | number;
}

export const ONETIME_REQUIREMENT = BigInt(ethers.MaxUint256);

export interface ChallengeRequirements {
    stage: number;
    strength: number;
    agility: number;
    wisdom: number;
    domain: string;
}

export enum ChallengeType {
    Trial,
    Arena
}

export enum ChallengeAttribute {
    Strength,
    Agility,
    Wisdom
}

export interface ChallengeInfo {
    id: string;
    name: string;
    description: string;
    challengeType: ChallengeType;
    attribute: ChallengeAttribute;
    requirements: ChallengeRequirements;
    maxDailyAttempts: number;
    maxScore: number;
    enabled: boolean;
}

export interface ChallengeStatus {
    lastAttemptTime: number;    // Last time challenge was attempted
    dailyAttempts: number;      // Current day's attempts
    attemptsRemaining: number;  // Remaining attempts today
    highScore: number;          // Personal best
    totalAttempts: number;      // Lifetime attempts
    totalScore: number;         // Cumulative score
}

export interface ChallengeState {
    challenges: Record<string, ChallengeInfo>;
    userStatus: Record<string, ChallengeStatus>;
    loading: boolean;
    error: string | null;
}

export interface RewardsState {
    streakStatus: StreakStatus | null;
    weeklyStatus: WeeklyStatus | null;
    hasWeeklyUnlocked: boolean;
    hasStakingUnlocked: boolean;
    isClaimLoading: boolean;
}

export type ContractType = 'game' | 'nft' | 'token' | 'shop' | 'rewards' | 'challenges' | 'expeditions';

export interface TransactionConfig {
  gaslessEnabled?: boolean;
  apiKey?: string;
  relayerUrl?: string;
  waitForConfirmation?: boolean;
  forwarderAddress?: string;
}

export interface ForwardRequest {
  from: string;
  to: string;
  value: bigint;
  gas: bigint;
  nonce: bigint;
  data: string;
}

export interface ContractEvent {
  contract: ethers.Contract;
  eventName: string;
  filter: any[];
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  events?: Array<{
    eventName: string;
    args: any[];
  }>;
  receipt?: ethers.TransactionReceipt;
  data?: any;
}

export type GameState = 'ready' | 'playing' | 'success' | 'failed';

export interface Notification {
    id: string;
    message: string;
    isRead?: boolean;
    timestamp?: number;
}

export enum RuneType {
    Lesser = 0,
    Greater = 1,
    Ancient = 2
}

export interface RuneBalances {
    lesser: number;
    greater: number;
    ancient: number;
}

export interface ExpeditionConfig {
    id: string;
    name: string;
    domain: Domain;
    duration: number;
    totemCost: string; // BigNumber represented as string
    happinessCost: number;
    baseExperience: number;
    affinityWeights: [number, number, number];
    runeDropChances: [number, number, number];
    minStage: number;
    enabled: boolean;
  }
  
export interface UserExpedition {
    expeditionId: string;
    captainId: bigint;
    totemIds: bigint[];
    endTime: number;
    completed: boolean;
    canClaim: boolean;
}

export interface ExpeditionState {
    expeditions: Record<string, ExpeditionConfig>;
    userExpeditions: UserExpedition[];
    loading: boolean;
    error: string | null;
}

export interface ExpeditionRewardsData {
    expeditionId: string;
    experienceGained: number;
    runesGained: {
      lesser: number;
      greater: number;
      ancient: number;
    };
    score: number;
}

export interface Location {
  id: number;
  name: string;
  desc: string;
  type: "Forest" | "Lake" | "Volcano" | "Desert" | "Ruins" | "Mountains" | "Mist" | "Marsh";
  coordinates: { x: number; y: number };
  details: string;
  image: string;
}

export interface Step {
  label: string;
  complete: boolean;
  optional?: boolean;
  isStepComplete?: () => {};
  actionId?: string;
  actionType?: "button" | "link" | "external";
  actionUrl?: string;
  actionText?: string;
  checkType?: string;
  checkParam?: string;
  imageUrl?: string;
}

export interface TutorialStep {
  stepId: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  steps: Step[];
  rewardId: string;
  tokenReward: string;
  experienceReward: number;
  requiresTotem: boolean;
}

export {}