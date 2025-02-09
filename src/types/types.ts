import { ethers } from 'ethers';

export interface UserContextType extends UserContextState {
    checkSignupStatus: () => Promise<void>;
    updateBalances: () => Promise<void>;
    connect: () => Promise<void>;
    disconnect: () => void;
    totemUpdated: (tokenId: bigint) => void;
    updateTotem: (tokenId: bigint, type: ActionType) => Promise<void>;
    getUserStreak: () => Promise<StreakStatus | undefined>;
    claimDailyReward: () => Promise<boolean | undefined>;
    claimWeeklyReward: () => Promise<boolean | undefined>;
    purchaseProtection: (type: 'daily' | 'weekly', tier: number) => Promise<boolean>;
    checkTokenApproval: () => Promise<boolean>;
    approveTokens: () => Promise<boolean>;
    setApprovalMessageDismissed: (dismissed: boolean) => void;
    updateStreakStatus: () => Promise<StreakStatus | undefined>;
    updateWeeklyStatus: () => Promise<WeeklyStatus | undefined>;
    updateAchievementStatus: () => Promise<void>;
}

export interface TotemUpdate {
    tokenId: bigint;
    attributes?: Partial<TotemAttributes>;
    trackings?: {
        [key in ActionType]?: ActionTracking;
    };
}

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
    // control state for updates
    totemUpdateCounter: number;
    lastUpdatedTotem: bigint;
    totemUpdates: Map<string, TotemUpdate>;
    isApprovalMessageDismissed: boolean;
    streakStatus: StreakStatus | null;
    weeklyStatus: WeeklyStatus | null;
    hasWeeklyUnlocked: boolean;
    hasStakingUnlocked: boolean;
    isClaimLoading: boolean;
    comingSoon: boolean;
}

export enum Species {
    Goose,
    Otter,
    Wolf,
    Falcon,
    Beaver,
    Deer,
    Woodpecker,
    Salmon,
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
    RadiantGold,
    EtherealSilver,
    None
}

export enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary
}

export interface TotemAttributes {
    species: Species;
    color: Color;
    rarity: Rarity;
    happiness: number;
    experience: number;
    stage: number;
    displayName: string;
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
    requirement: number;    // Required count/value to unlock
}

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
}

export interface AchievementProgress {
    startTime: number;
    lastUpdate: number;
    count: number;
    achieved: boolean;
    unlockedMilestones: boolean[];
}

export {}