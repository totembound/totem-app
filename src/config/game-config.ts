/**
 * Game Configuration (bundled at build time)
 *
 * Source of truth for game rules on the frontend.
 * Values here match the contract-derived rules in totem-contracts/.
 * API server has its own copy in totem-api/src/data/business-rules.json.
 */

import { ActionType, ActionConfig } from '../types/types';

// --- Stages ---

export interface StageConfig {
    stage: number;
    name: string;
    experienceRequired: number;
}

export const STAGES: StageConfig[] = [
    { stage: 0, name: 'Hatchling', experienceRequired: 0 },
    { stage: 1, name: 'Juvenile', experienceRequired: 500 },
    { stage: 2, name: 'Adult', experienceRequired: 1500 },
    { stage: 3, name: 'Elder', experienceRequired: 3500 },
    { stage: 4, name: 'Ascended', experienceRequired: 7500 },
];

// --- Prestige ---

export const PRESTIGE = {
    baseThreshold: 7500,
    levelIncrement: 2500,
} as const;

// --- Rarities ---

export interface RarityConfig {
    id: number;
    name: string;
    statBonus: number;
    dropChance: number;
}

export const RARITIES: RarityConfig[] = [
    { id: 0, name: 'Common', statBonus: 0, dropChance: 75 },
    { id: 1, name: 'Uncommon', statBonus: 0, dropChance: 15 },
    { id: 2, name: 'Rare', statBonus: 1, dropChance: 7 },
    { id: 3, name: 'Epic', statBonus: 2, dropChance: 2.5 },
    { id: 4, name: 'Legendary', statBonus: 4, dropChance: 0.5 },
    { id: 5, name: 'Limited', statBonus: 2, dropChance: 0 },
];

// --- Colors ---

export interface ColorConfig {
    id: number;
    name: string;
}

export const COLORS: Record<string, ColorConfig[]> = {
    common: [
        { id: 0, name: 'Brown' },
        { id: 1, name: 'Gray' },
        { id: 2, name: 'White' },
        { id: 3, name: 'Tawny' },
    ],
    uncommon: [
        { id: 4, name: 'Slate' },
        { id: 5, name: 'Copper' },
        { id: 6, name: 'Cream' },
        { id: 7, name: 'Dappled' },
    ],
    rare: [
        { id: 8, name: 'Golden' },
        { id: 9, name: 'DarkPurple' },
        { id: 10, name: 'Charcoal' },
    ],
    epic: [
        { id: 11, name: 'EmeraldGreen' },
        { id: 12, name: 'CrimsonRed' },
        { id: 13, name: 'DeepSapphire' },
    ],
    legendary: [
        { id: 14, name: 'EtherealSilver' },
        { id: 15, name: 'RadiantGold' },
    ],
    limited: [
        { id: 16, name: 'FrostbiteBlue' },
        { id: 17, name: 'RosyPink' },
        { id: 18, name: 'VerdantGold' },
        { id: 19, name: 'RaindropTeal' },
        { id: 20, name: 'FloralViolet' },
        { id: 21, name: 'SunsetOrange' },
        { id: 22, name: 'EmberRed' },
        { id: 23, name: 'OceanicAzure' },
        { id: 24, name: 'HarvestGold' },
        { id: 25, name: 'PhantomBlack' },
        { id: 26, name: 'EmberwoodBrown' },
        { id: 27, name: 'StarlitSilver' },
    ],
};

// Derived: flat lookup by color ID → name
export const COLOR_BY_ID: Record<string, string> = Object.fromEntries(
    Object.values(COLORS).flat().map(c => [String(c.id), c.name])
);

// --- Affinities ---

export interface AffinityConfig {
    id: string;
    name: string;
    speciesIds: number[];
}

export const AFFINITIES: AffinityConfig[] = [
    { id: 'strength', name: 'Strength', speciesIds: [2, 4, 7, 8] },
    { id: 'agility', name: 'Agility', speciesIds: [1, 3, 5, 6] },
    { id: 'wisdom', name: 'Wisdom', speciesIds: [0, 9, 10, 11] },
];

// --- Domains ---

export interface DomainConfig {
    id: number;            // matches the Domain enum in types.ts
    name: string;
    speciesIds: number[];  // empty for sleeping domains (Fire, Spirit, Shadow)
    image: string;         // public path for avatar/banner picker thumbnails
}

export const DOMAINS: DomainConfig[] = [
    { id: 0, name: 'Air',    speciesIds: [3, 6, 9, 11],  image: '/domains/air-domain.jpg' },
    { id: 1, name: 'Earth',  speciesIds: [2, 5, 8, 10],  image: '/domains/earth-domain.jpg' },
    { id: 2, name: 'Water',  speciesIds: [0, 1, 4, 7],   image: '/domains/water-domain.jpg' },
    { id: 3, name: 'Fire',   speciesIds: [],             image: '/domains/fire-domain.jpg' },
    { id: 4, name: 'Spirit', speciesIds: [],             image: '/domains/spirit-domain.jpg' },
    { id: 5, name: 'Shadow', speciesIds: [],             image: '/domains/shadow-domain.jpg' },
];

// --- Actions ---

export const ACTION_CONFIGS: Record<ActionType, ActionConfig> = {
    [ActionType.Feed]: {
        cost: 10,
        cooldown: 0,
        maxDaily: 3,
        minHappiness: 0,
        happinessChange: 10,
        experienceGain: 0,
        useTimeWindows: true,
        increasesHappiness: true,
        enabled: true,
    },
    [ActionType.Train]: {
        cost: 20,
        cooldown: 0,
        maxDaily: 0,
        minHappiness: 20,
        happinessChange: -10,
        experienceGain: 50,
        useTimeWindows: false,
        increasesHappiness: false,
        enabled: true,
    },
    [ActionType.Treat]: {
        cost: 20,
        cooldown: 14400, // 4 hours
        maxDaily: 0,
        minHappiness: 0,
        happinessChange: 10,
        experienceGain: 0,
        useTimeWindows: false,
        increasesHappiness: true,
        enabled: true,
    },
    [ActionType.Evolve]: {
        cost: 0,
        cooldown: 0,
        maxDaily: 0,
        minHappiness: 30,
        happinessChange: 0,
        experienceGain: 0,
        useTimeWindows: false,
        increasesHappiness: false,
        enabled: true,
    },
    [ActionType.None]: {
        cost: 0,
        cooldown: 0,
        maxDaily: 0,
        minHappiness: 0,
        happinessChange: 0,
        experienceGain: 0,
        useTimeWindows: false,
        increasesHappiness: false,
        enabled: false,
    },
};

// --- Feed Time Windows (UTC seconds since midnight) ---

export const TIME_WINDOWS = {
    window1Start: 0,      // 00:00 UTC
    window2Start: 28800,  // 08:00 UTC
    window3Start: 57600,  // 16:00 UTC
} as const;

// --- Game Parameters ---

export const GAME_PARAMS = {
    signupReward: 2000,  // Initial Essence reward
    mintPrice: 0,        // Free totems in Web2
} as const;

// --- Shop ---

export const SHOP_CONFIG = {
    listingFee: 100,
    purchaseFee: 100,
    totalFeePerTransaction: 200,
    minAskingPrice: 1,
    maxAskingPrice: 1000000,
} as const;
