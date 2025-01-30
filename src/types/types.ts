import { ethers } from 'ethers';

export interface UserContextType {
    // user state
    isSignedUp: boolean;
    checkSignupStatus: () => Promise<void>;
    totemBalance: string;
    polBalance: string;
    updateBalances: () => Promise<void>;
    // metamask state
    isConnected: boolean;
    address: string;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    // control state for updates
    totemUpdateCounter: number;
    lastUpdatedTotem: bigint;
    totemUpdated: (tokenId: bigint) => void;
}

export interface UserContextState {
    isSignedUp: boolean;
    totemBalance: string;
    polBalance: string;
    isConnected: boolean;
    address: string;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    totemUpdateCounter: number;
    lastUpdatedTotem: bigint;
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
    Speckled,
    Russet,
    Slate,
    Copper,
    Cream,
    Dappled,
    Golden,
    DarkPurple,
    LightBlue,
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
    id: string;
    tokenId: bigint;
    name: string;
    description: string;
    image: string;
    attributes: TotemAttributes;
    trackings: {
        [key in ActionType]?: ActionTracking
    }
}

export enum ActionType {
    Feed = 0,
    Train = 1,
    Treat = 2
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
export type TokenActionTrackings = {
    [key: string]: {
        [key in ActionType]?: ActionTracking
    }
};

export interface WindowTimes {
    currentWindow: 1 | 2 | 3;
    nextWindowStart: Date;
    currentWindowEnds: Date;
}

export {}