import { Contract, BrowserProvider, EventFilter } from 'ethers';
import { Achievement, AchievementProgress, TotemAttributes } from '../types/types';

export const CONTRACT_ADDRESSES = {
    game: process.env.REACT_APP_GAME_ADDRESS as string,
    forwarder: process.env.REACT_APP_FORWARDER_ADDRESS as string,
    token: process.env.REACT_APP_TOKEN_ADDRESS as string,
    nft: process.env.REACT_APP_NFT_ADDRESS as string,
    rewards: process.env.REACT_APP_REWARDS_ADDRESS as string,
    achievements: process.env.REACT_APP_ACHIEVEMENTS_ADDRESS as string,
};

// ABI snippets for the functions we need
export const FORWARDER_ABI = [
    "function getNonce(address from) public view returns (uint256)",
    "function verify(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) public view returns (bool)",
    "function relay(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) returns (bool, bytes)",
    "function targetContract() external view returns (address)",
    "function setTargetContract(address _targetContract) external"
];

export const GAME_ABI = [
    "function signup() external",
    "function hasSignedUp(address) external view returns (bool)",
    "function buyTokens() external payable",
    "function purchaseTotem(uint8 speciesId) external",
    "function feed(uint256 tokenId) external",
    "function train(uint256 tokenId) external",
    "function treat(uint256 tokenId) external",
    "function canUseAction(uint256 tokenId, uint8 actionType) external view returns (bool)",
    "function getActionTracking(uint256 tokenId, uint8 actionType) external view returns (tuple(uint256 lastUsed, uint256 dailyUses, uint256 dayStartTime))",
    "function getGameConfiguration() external view returns ((uint256 signupReward, uint256 mintPrice) params, (uint256 window1Start, uint256 window2Start, uint256 window3Start) windows, (uint256 cost, uint256 cooldown, uint256 maxDaily, uint256 minHappiness, uint256 happinessChange, uint256 experienceGain, bool useTimeWindows, bool increasesHappiness, bool enabled)[] configs)",

    // Events
    "event UserSignedUp(address indexed user)",
    "event GameParametersUpdated(tuple(uint256 signupReward, uint256 mintPrice) params)",
    "event TimeWindowsUpdated(tuple(uint256 window1Start, uint256 window2Start, uint256 window3Start) windows)"
];

export const TOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

export const TOTEM_NFT_ABI = [
    'function tokensOfOwner(address owner) view returns (uint256[])',
    'function attributes(uint256 tokenId) view returns (uint8 species, uint8 color, uint8 rarity, uint256 happiness, uint256 experience, uint256 stage, bool isStaked, string displayName)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function evolve(uint256 tokenId) external',
    'function setDisplayName(uint256 tokenId, string memory newName) external'
];

export const REWARDS_ABI = [
    // Core reward functions
    "function claim(bytes32 rewardId) external returns (uint256)",
    "function isClaimingAllowed(bytes32 rewardId, address user) external view returns (bool)",
    
    // Streak and status getters
    "function getStreakStatus(bytes32 rewardId, address user) external view returns (tuple(uint256 currentStreak, uint256 bestStreak, uint256 nextClaimTime, uint256 gracePeriodEnd, bool canClaim, bool isProtected, uint256 protectionExpiry))",
    "function getTimeUntilClaim(bytes32 rewardId, address user) external view returns (uint256)",
    
    // Protection related functions
    "function purchaseProtection(bytes32 rewardId, uint8 tier) external",
    "function getProtectionStatus(bytes32 rewardId, address user, uint8 tier) external view returns (bool canPurchase, bool isActive, uint256 remainingTime)",
    "function getProtectionTier(bytes32 rewardId, uint8 tier) external view returns (tuple(uint256 cost, uint256 duration, uint256 requiredStreak, bool enabled))",
    
    // Reward configuration getters
    "function getRewardInfo(bytes32 rewardId) external view returns (string memory name, string memory description, string memory iconURI, tuple(uint256 baseAmount, uint256 interval, uint256 streakBonus, uint256 maxStreakBonus, uint256 minStreak, uint256 gracePeriod, bool allowProtection, bool enabled, uint8 protectionTierCount) config)",
    "function getRewardIds() external view returns (bytes32[])",
    "function getUserInfo(bytes32 rewardId, address user) external view returns (tuple(uint256 lastClaim, uint256 currentStreak, uint256 bestStreak, uint256 totalClaims, uint256 protectionExpiry, uint8 activeTier))",
    
    // Events
    "event RewardClaimed(bytes32 indexed rewardId, address indexed user, uint256 amount, uint256 streak)",
    "event ProtectionPurchased(bytes32 indexed rewardId, address indexed user, uint8 tier, uint256 expiry)",
    "event ProtectionUsed(bytes32 indexed rewardId, address indexed user, uint8 tier)"
];

export const ACHIEVEMENTS_ABI = [
    "function hasAchievement(bytes32 achievementId, address user) external view returns (bool)",
    "function getAchievementProgress(bytes32 id, address user) external view returns (bool isCompleted, uint256 currentCount, bool[] memory unlockedMilestones)",
    "function getAchievementsByCategory(uint8 category, address user) external view returns (tuple(bytes32 id, string name, string description, uint8 achievementType, bytes32 subType, bool enabled, string badgeUri, tuple(string name, string description, string badgeUri, uint256 requirement)[] milestones, bool isCompleted, uint256 currentCount)[] memory)",
    "function getDetailedProgress(bytes32 id, address user) external view returns (tuple(uint256 startTime, uint256 lastUpdate, uint256 count, bool achieved, bool[] unlockedMilestones))",
    "function getUserCategoriesProgress(address user) external view returns (tuple(uint8 category, uint256 totalAchievements, uint256 completedAchievements, uint256 totalMilestones, uint256 unlockedMilestones)[] memory)"
];

// Define interface for contract functions
export type TotemGameContract = Contract & {
    signup: () => Promise<any>;
    hasAccount: (address: string) => Promise<boolean>;
    buyTokens: (overrides?: { value: bigint }) => Promise<any>;
    purchaseTotem: (speciesId: number) => Promise<any>;
    feed: (tokenId: bigint) => Promise<any>;
    train: (tokenId: bigint) => Promise<any>;
    treat: (tokenId: bigint) => Promise<any>;
    canUseAction: (tokenId: bigint, actionType: Number) => Promise<boolean>;
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

export type TotemRewardsContract = Contract & {
    getStreak: (rewardId: bigint, address: string) => Promise<bigint>;
    getLastClaimed: (rewardId: bigint, address: string) => Promise<bigint>;
    claimReward: (rewardId: bigint) => Promise<boolean>;
};

export type TotemAchievementsContract = Contract & {
    getAchievementsByCategory(
        category: number,
        user: string
    ): Promise<Achievement[]>;
    hasAchievement(
        achievementId: string,
        user: string
    ): Promise<boolean>;
    
    getAchievementProgress(
        id: string,
        user: string
    ): Promise<AchievementProgress>;
};

export const createGameContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.game,
        GAME_ABI,
        provider
    ) as TotemGameContract;
};

export const createTokenContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.token,
        TOKEN_ABI,
        provider
    ) as TotemTokenContract;
};

export const createTotemNFTContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.nft,
        TOTEM_NFT_ABI,
        provider
    ) as TotemNFTContract;
};

export const createRewardsContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.rewards,
        REWARDS_ABI,
        provider
    ) as TotemRewardsContract;
};

export const createAchievementsContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.achievements,
        ACHIEVEMENTS_ABI,
        provider
    ) as TotemAchievementsContract;
};
