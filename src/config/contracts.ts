import { Contract, BrowserProvider, EventFilter, TransactionResponse } from 'ethers';
import TotemAchievementsABI from '../contracts/TotemAchievements.abi.json';
import TotemGameABI from '../contracts/TotemGame.abi.json';
import TotemNFTABI from '../contracts/TotemNFT.abi.json';
import TotemTokenABI from '../contracts/TotemToken.abi.json';
import TotemShopABI from '../contracts/TotemShop.abi.json';
import TotemRewardsABI from '../contracts/TotemRewards.abi.json';
import TotemChallengesABI from '../contracts/TotemChallenges.abi.json';
import TotemExpeditionsABI from '../contracts/TotemExpeditions.abi.json';
import { Achievement, AchievementProgress, AchievementView, CategoryProgress, TotemAttributes } from '../types/types';

export const CONTRACT_ADDRESSES = {
    game: import.meta.env.VITE_GAME_ADDRESS as string,
    forwarder: import.meta.env.VITE_FORWARDER_ADDRESS as string,
    token: import.meta.env.VITE_TOKEN_ADDRESS as string,
    nft: import.meta.env.VITE_NFT_ADDRESS as string,
    shop: import.meta.env.VITE_SHOP_ADDRESS as string,
    rewards: import.meta.env.VITE_REWARDS_ADDRESS as string,
    achievements: import.meta.env.VITE_ACHIEVEMENTS_ADDRESS as string,
    challenges: import.meta.env.VITE_CHALLENGES_ADDRESS as string,
    expeditions: import.meta.env.VITE_EXPEDITIONS_ADDRESS as string,
};

// ABI snippets for the functions we need
export const FORWARDER_ABI = [
    "function getNonce(address from) public view returns (uint256)",
    "function verify(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) public view returns (bool)",
    "function relay(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) returns (bool, bytes)",
    "function targetContract() external view returns (address)",
    "function setTargetContract(address _targetContract) external"
];

// Define interface for contract functions
export type TotemGameContract = Contract & {
    signup: () => Promise<any>;
    hasAccount: (address: string) => Promise<boolean>;
    buyTokens: (overrides?: { value: bigint }) => Promise<TransactionResponse>;
    purchaseTotem: (speciesId: number) => Promise<TransactionResponse>;
    sellTotem: (tokenId: bigint) => Promise<TransactionResponse>; 
    feed: (tokenId: bigint) => Promise<TransactionResponse>;
    train: (tokenId: bigint) => Promise<TransactionResponse>;
    treat: (tokenId: bigint) => Promise<TransactionResponse>;
    canUseAction: (tokenId: bigint, actionType: Number) => Promise<boolean>;
    getUserRuneBalances: (user: string) => Promise<[bigint, bigint, bigint]>;
};

export type TotemTokenContract = Contract & {
    balanceOf: (address: string) => Promise<bigint>;
    approve: (spender: string, amount: bigint) => Promise<any>;
    allowance: (owner: string, spender: string) => Promise<any>;
};

export type TotemNFTContract = Contract & {
    tokensOfOwner: (owner: string) => Promise<bigint[]>;
    attributes: (tokenId: bigint | number) => Promise<TotemAttributes>;
    tokenURI: (tokenId: bigint | number) => Promise<string>;
    evolve: (tokenId: bigint | number) => Promise<any>;
    setDisplayName: (tokenId: bigint | number, displayName: string) => Promise<any>;

    // Add event filters
    filters: {
        Transfer: (
            from?: string | null,
            to?: string | null,
            tokenId?: bigint | null
        ) => EventFilter;
    };
    
    // Add event listeners
    on: (
        event: 'Transfer',
        listener: (from: string, to: string, tokenId: bigint, event: Event) => void
    ) => TotemNFTContract;
    
    // Add once listeners
    once: (
        event: 'Transfer',
        listener: (from: string, to: string, tokenId: bigint, event: Event) => void
    ) => TotemNFTContract;

    // Add queryFilter
    queryFilter: (
        event: EventFilter,
        fromBlockOrBlockHash?: string | number | undefined,
        toBlock?: string | number | undefined
    ) => Promise<Array<Event>>;
};

export type TotemShopContract = Contract & {
    buyTokens: (overrides?: { value: bigint }) => Promise<TransactionResponse>;
    purchaseTotem: (speciesId: number) => Promise<TransactionResponse>;
    sellTotem: (tokenId: bigint) => Promise<TransactionResponse>; 
};

export type TotemRewardsContract = Contract & {
    getStreak: (rewardId: bigint, address: string) => Promise<bigint>;
    getLastClaimed: (rewardId: bigint, address: string) => Promise<bigint>;
    claimReward: (rewardId: bigint) => Promise<boolean>;
};

export type TotemAchievementsContract = Contract & {
    hasAchievement(achievementId: string, user: string): Promise<boolean>;
    getAchievement(id: string): Promise<Achievement>;
    getAchievementsByCategory(category: number): Promise<Achievement[]>;
    getUserCategoriesProgress(user: string): Promise<CategoryProgress[]>;
    getDetailedProgress(id: string, user: string): Promise<AchievementProgress>;
    // Event listeners
    on(
        event: 'AchievementUnlocked',
        listener: (id: string, user: string, badgeUri: string) => void
    ): TotemAchievementsContract;

    on(
        event: 'MilestoneUnlocked',
        listener: (id: string, milestone: number, user: string, badgeUri: string) => void
    ): TotemAchievementsContract;

    on(
        event: 'ProgressUpdated',
        listener: (id: string, user: string, count: bigint) => void
    ): TotemAchievementsContract;
};

export type TotemChallengesContract = Contract & {
    getChallengeIds: () => Promise<string[]>;
    getChallengeInfo: (challengeId: string) => Promise<{
        name: string;
        description: string;
        challengeType: number;
        attribute: number;
        requirements: {
            stage: number;
            strength: number;
            agility: number;
            wisdom: number;
            domain: string;
        };
        maxDailyAttempts: number;
        maxScore: number;
        enabled: boolean;
    }>;
    getUserChallengeStatus: (challengeId: string, user: string) => Promise<{
        lastAttemptTime: bigint;
        dailyAttempts: number;
        attemptsRemaining: number;
        highScore: number;
        totalAttempts: number;
        totalScore: number;
    }>;
    completeChallenge: (
        challengeId: string,
        user: string,
        tokenId: bigint,
        score: number
    ) => Promise<any>;
};

export type TotemExpeditionsContract = Contract & {
    getExpeditions: () => Promise<string[]>;
    getExpeditionConfig: (expeditionId: string) => Promise<{
      name: string;
      domain: number;
      duration: bigint;
      totemCost: bigint;
      happinessCost: bigint;
      baseExperience: bigint;
      affinityWeights: [number, number, number];
      runeDropChances: [number, number, number];
      enabled: boolean;
    }>;
    getUserExpeditions: (user: string) => Promise<{
      ids: string[];
      totemIds: bigint[][];
      endTimes: bigint[];
      completed: boolean[];
      canClaim: boolean[];
    }>;
    getUserActiveExpeditions: (user: string) => Promise<{
      ids: string[];
      totemIds: bigint[][];
      endTimes: bigint[];
      completed: boolean[];
      canClaim: boolean[];
    }>;
    startExpedition: (expeditionId: string, totemIds: [bigint, bigint, bigint]) => Promise<TransactionResponse>;
    claimExpeditionRewards: (expeditionIndex: number) => Promise<TransactionResponse>;
    isTotemOnExpedition: (tokenId: bigint) => Promise<[boolean, bigint]>;
};

export const createAchievementsContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.achievements,
        TotemAchievementsABI,
        provider
    ) as TotemAchievementsContract;
};

export const createGameContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.game,
        TotemGameABI,
        provider
    ) as TotemGameContract;
};

export const createTokenContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.token,
        TotemTokenABI,
        provider
    ) as TotemTokenContract;
};

export const createTotemNFTContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.nft,
        TotemNFTABI,
        provider
    ) as TotemNFTContract;
};

export const createShopContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.shop,
        TotemShopABI,
        provider
    ) as TotemShopContract;
};

export const createRewardsContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.rewards,
        TotemRewardsABI,
        provider
    ) as TotemRewardsContract;
};

export const createChallengesContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.challenges,
        TotemChallengesABI,
        provider
    ) as TotemChallengesContract;
};

export const createExpeditionsContract = (provider: BrowserProvider) => {
    return new Contract(
      CONTRACT_ADDRESSES.expeditions,
      TotemExpeditionsABI,
      provider
    ) as TotemExpeditionsContract;
};
