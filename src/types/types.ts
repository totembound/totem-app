/**
 * Types - Web2 version (pure REST API, no blockchain)
 */
import { MessageDialogState } from '../components/MessageDialog';

export interface UserContextType extends UserContextState {
    checkSignupStatus: () => Promise<void>;
    updateBalances: () => Promise<void>;
    setEssenceBalance: (balance: number) => void;
    getTotem: (totemId: string) => TotemData | undefined;
    addTotem: (totemId: string) => Promise<void>;
    removeTotem: (totemId: string) => void;
    updateTotem: (totemId: string, type: ActionType) => Promise<void>;
    updateTotemEvolved: (totemId: string) => Promise<void>;
    showError: (title: string, message: string, isRateLimit?: boolean) => void;
    showSuccess: (title: string, message: string) => void;
    hideError: () => void;
    updateAccountType: () => AccountType;
    canSpendEssence: (amount: number) => boolean;
    canSpendGems: (amount: number) => boolean;
    setTutorialWizardVisible: (visible: boolean) => void;
    handleRateLimitUpdate: (resetTime: string | null, currentUsage: number, dailyLimit: number, isExceeded: boolean) => void;
    handleRateLimitError: (error: RateLimitError) => void;
    trackLink: (linkId: string, metadata?: Record<string, any>) => void;
    hasClickedLink: (linkId: string) => boolean;
    fetchTotems: () => Promise<void>;
    updateTotemNickname: (totemId: string, nickname: string | null) => void;
    updateTotemAttributes: (totemId: string, updates: { experience?: number; happiness?: number; stage?: number; nickname?: string | null; }) => void;
}

export interface TotemUpdate {
    totemId: string;
    attributes?: Partial<TotemAttributes>;
    trackings?: {
        [key in ActionType]?: ActionTracking;
    };
}

export type AccountType = 'Free' | 'Premium' | 'Advanced';

export interface RateLimitState {
    isExceeded: boolean;
    resetTime: string | null;
    currentUsage: number;
    dailyLimit: number;
}

export interface UserContextState {
    // user state
    isSignedUp: boolean;
    essenceBalance: string;
    gemsBalance: string;
    // auth state (Web2: session-based)
    isConnected: boolean;
    address: string;
    // totems
    totems: TotemData[];
    totemLoading: boolean;
    totemError: string | null;
    // control state for updates
    messageDialog: MessageDialogState;
    accountType: AccountType;
    comingSoon: boolean;
    tutorialWizardVisible: boolean;
    linkTracking: Record<string, boolean>;
    rateLimitState: RateLimitState;
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

// ---- Profile (bio / avatar / banner) ----

export type AvatarRef =
    | { kind: 'domain'; id: Domain }
    | { kind: 'totem'; speciesId: number; colorId: number; stage: number }
    | null;

export type BannerRef =
    | { kind: 'domain'; id: Domain }
    | null;

export interface UserProfile {
    bio: string | null;
    avatar: AvatarRef;
    banner: BannerRef;
}

export type PlayerTier = 'free' | 'premium' | 'vip';

export interface PublicPlayerProfile {
    id: string;
    displayName: string;
    createdAt: string;
    tier: PlayerTier;
    profile: UserProfile;
    stats: {
        totalTotems: number;
        totalChallengesCompleted: number;
        /** Longest daily-reward-claim streak (RewardsClaims.longestStreak). */
        bestDailyStreak: number;
        highestStageReached: number;
        /** Highest prestige across any stage-4 totem (0 if none, no upper bound). */
        highestPrestigeReached: number;
    };
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
    nickname: string | null;  // User-customizable name (optional)
    prestigeLevel: number;
    sanctum?: {
        seated: boolean;
        seatIndex: number;
        seatedAt: string;
        onMission: boolean;
        missionEndsAt?: string | null;
    };
}

export interface TotemData {
    displayName: string;
    id: string;              // Primary identifier (e.g., 'ttm_01HGW2BBG...')
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
    cost: number;            // Essence cost
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
    signupReward: number;    // Initial Essence reward
    mintPrice: number;       // Essence cost to mint
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
    Expedition = 5,
    Forge = 6,
    Sanctum = 7
}

export interface AchievementState {
    achievements: Record<AchievementCategory, Achievement[]>;
    progress: Record<string, AchievementProgress>;
    loading: boolean;
    error: string | null;
  }

export interface AchievementRequirement {
    achievementId: string;
    milestoneIndex: number;
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
    currentCount: number;
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

// Achievement view (used in getAchievementsByCategory response)
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
    currentCount: number;
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
    protectionCharges: number;
}

export interface WeeklyStatus {
    weeklyStreak: number;
    canClaimWeekly: boolean;
    bestWeeklyStreak: number;
    nextClaimTime: number;
    isProtected: boolean;
    protectionCharges: number;
}

export interface Milestone {
    name: string;           // Display name of the milestone
    description: string;    // Description of the milestone
    badgeUri: string;      // IPFS URI for the badge
    requirement: number;    // Required count/value to unlock
}

export interface AchievementProgress {
    startTime: number;
    lastUpdate: number;
    count: number;
    achieved: boolean;
    unlockedMilestones: boolean[];
    /**
     * Per-milestone progress count. Mirrors the API's per-milestone progress
     * field. For typical progression achievements every entry equals `count`;
     * for achievements like anti-meta-collector each milestone has its own
     * counter (e.g., commons / uncommons / rares).
     */
    milestoneProgress: number[];
    requirementsMet : boolean;
}

export interface Attribute {
    trait_type: string;
    value: string | number;
}

// Max value for one-time requirements
export const ONETIME_REQUIREMENT = Number.MAX_SAFE_INTEGER;

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

export interface TransactionResult {
  hash: string;
  success: boolean;
  events?: Array<{
    eventName: string;
    args: any[];
  }>;
  data?: any;
}

export class RateLimitError extends Error {
  public readonly resetTime: string | null;
  public readonly currentUsage: number;
  public readonly dailyLimit: number;

  constructor(message: string, resetTime: string | null = null, currentUsage = 0, dailyLimit = 0) {
    super(message);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
    this.currentUsage = currentUsage;
    this.dailyLimit = dailyLimit;
  }
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
    essenceCost: number;
    happinessCost: number;
    baseExperience: number;
    affinityWeights: [number, number, number];
    runeDropChances: [number, number, number];
    minStage: number;
    enabled: boolean;
  }

export interface UserExpedition {
    expeditionId: string;
    captainId: string;       // Totem ID (e.g., 'ttm_01HGW2BBG...')
    totemIds: string[];      // Totem IDs
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
  isStepComplete?: () => boolean;
  actionId?: string;
  actionType?: "button" | "link" | "external";
  actionUrl?: string;
  actionText?: string;
  checkType?: string;
  checkParam?: string;
  linkState?: Record<string, any>;
  imageUrl?: string;
  isSelectedTotem?: boolean;
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

export interface SanctumSeatInfo {
    seatIndex: number;
    totemId: string;
    totemName: string;
    species: string;
    seatedAt: string;
    lastClaimedAt: string;
    tenureDays: number;
    tenureMultiplier: number;
    accumulatedEssence: number;
    atCap: boolean;
    onMission: boolean;
    activeMission: ActiveCouncilMission | null;
}

export interface ActiveCouncilMission {
    missionType: string;
    name: string;
    startedAt: string;
    endsAt: string;
    canClaim: boolean;
}

export interface SanctumState {
    maxSeats: number;
    seats: SanctumSeatInfo[];
    totalAccumulated: number;
    lockedSeats: number[];
}

export interface SanctumClaimResult {
    totalClaimed: number;
    breakdown: { seatIndex: number; totemId: string; claimed: number; tenureMultiplier: number }[];
    newEssenceBalance: number;
    achievements: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
}

export {}
