// contexts/GameContext.tsx
import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { useUser } from './UserContext';
import { useAuth } from './AuthContext';
import { ActionType, ActionConfig, TimeWindows, GameParameters, TotemAttributes, ActionTracking, ChallengeState, ChallengeInfo, ChallengeStatus, TotemData, StreakStatus, WeeklyStatus, RewardsState, RuneBalances, ExpeditionState, ExpeditionRewardsData } from '../types/types';
import { CooldownStatus } from '../hooks/useTotemGameApi';
import { getTotemStage } from '../utils/totems';
import apiClient from '../services/ApiClient';
import notificationService from '../services/NotificationService';

export interface GameContextType {
    actionConfigs: Record<ActionType, ActionConfig>;
    timeWindows: {
        window1Start: number;
        window2Start: number;
        window3Start: number;
    } | null;
    gameParams: any; // Define a more specific type if possible
    isLoading: boolean;
    error: string | null;
    
    // Existing methods
    refreshGameConfig: () => Promise<void>;
    debugTimeWindow: () => void;
    getFormattedWindowTimes(): { [key: string]: string };

    canUseAction: (
        attributes: TotemAttributes, 
        actionType: ActionType, 
        actionTracking?: ActionTracking | undefined
    ) => boolean;

    // New methods for action status
    getActionStatus: (
        actionType: ActionType,
        attributes: TotemAttributes,
        tracking: ActionTracking,
        config: ActionConfig
    ) => string;

    getNextAvailableWindow: (tracking: ActionTracking) => string;

    // Challenge-related state and methods
    challengeState: ChallengeState;
    refreshChallenges: () => Promise<void>;
    getEligibleTotems: (challengeId: string) => TotemData[];
    canAttemptChallenge: (challengeId: string, totemId: string) => boolean;
    getChallengeStatus: (challengeId: string) => string;
    completeChallenge: (challengeId: string, tokenId: string, score: number) => Promise<void>;

    // rewards
    rewardsState: RewardsState;
    getUserStreak: () => Promise<StreakStatus | undefined>;
    claimDailyReward: () => Promise<boolean>;
    claimWeeklyReward: () => Promise<boolean>;
    purchaseProtection: (type: 'daily' | 'weekly', tier: number) => Promise<boolean>;
    refreshRewardStatus: () => Promise<void>;

    setNickname: (totemId: string, newName: string) => Promise<void>;

    runeBalances: RuneBalances;
    getUserRuneBalances: () => Promise<void>;
    
    // New expedition-related properties
    expeditionState: ExpeditionState;
    refreshExpeditions: () => Promise<void>;
    startExpedition: (expeditionId: string, totemIds: string[]) => Promise<boolean>;
    claimExpeditionRewards: (expeditionId: string) => Promise<boolean>;
    isTotemAvailable: (totemId: string) => boolean;
    activeExpeditionEffect: ExpeditionRewardsData | null;
    showExpeditionEffect: (data: ExpeditionRewardsData) => void;
    hideExpeditionEffect: () => void;

    // Loot box system
    lootItems: LootItem[];
    fetchLootItems: () => Promise<void>;
    claimLootItem: (lootItemId: string, options?: { speciesId?: number }) => Promise<unknown>;

    // Totem cooldown cache (single source of truth)
    getTotemCooldowns: (totemId: string) => CooldownStatus | null;
    setTotemCooldowns: (totemId: string, cooldowns: CooldownStatus) => void;
    fetchTotemCooldowns: (totemId: string) => Promise<CooldownStatus | null>;
}

export interface LootItem {
    id: string;
    boxId: string;
    source: string;
    status: string;
    grantedAt: string;
    box: {
        id: string;
        name: string;
        description: string;
        icon: string;
        rarity: string;
        type: string;
        config: {
            rarityId?: number;
            minAmount?: number;
            maxAmount?: number;
            userChooses: string[];
            randomized: string[];
        };
    };
}

// Module-level dedup for loot items fetch (prevents StrictMode double-fire)
let lootFetchPromise: Promise<void> | null = null;

const defaultGetFormattedWindowTimes = () => {
    return {
        window1: 'Loading...',
        window2: 'Loading...',
        window3: 'Loading...'
    };
};
const SECONDS_PER_DAY = 86400;

// Default implementation to match the context creation
const defaultCanUseAction = () => false;
const defaultGetActionStatus = () => 'Action not configured';
const defaultGetNextAvailableWindow = () => 'Available Now';
const defaultCanAttemptChallenge = () => false;
const defaultGetEligibleTotems = () => [];
const defaultGetChallengeStatus = () => 'Challenge not available';

const GameContext = createContext<GameContextType>({
    actionConfigs: {} as Record<ActionType, ActionConfig>,
    timeWindows: null,
    gameParams: null,
    isLoading: true,
    error: null,
    refreshGameConfig: async () => {},
    debugTimeWindow: () => {},
    getFormattedWindowTimes: defaultGetFormattedWindowTimes,
    canUseAction: defaultCanUseAction,
    getActionStatus: defaultGetActionStatus,
    getNextAvailableWindow: defaultGetNextAvailableWindow,
    // Challenge state and methods
    challengeState: {
        challenges: {},
        userStatus: {},
        loading: false,
        error: null
    },
    refreshChallenges: async () => {},
    canAttemptChallenge: defaultCanAttemptChallenge,
    getEligibleTotems: defaultGetEligibleTotems,
    getChallengeStatus: defaultGetChallengeStatus,
    completeChallenge: async () => { 
        throw new Error('Challenge system not initialized');
    },
    // Rewards state and methods
    rewardsState: {
        streakStatus: null,
        isClaimLoading: false,
        weeklyStatus: null,
        hasWeeklyUnlocked: false,
        hasStakingUnlocked: false
    },
    getUserStreak: async () => undefined,
    claimDailyReward: async () => false,
    claimWeeklyReward: async () => false,
    purchaseProtection: async () => false,
    refreshRewardStatus: async () => {},
    setNickname: async() => {},
    runeBalances: {
        lesser: 0,
        greater: 0,
        ancient: 0
      },
      getUserRuneBalances: async () => {},
      expeditionState: {
        expeditions: {},
        userExpeditions: [],
        loading: false,
        error: null
      },
      refreshExpeditions: async () => {},
      startExpedition: async () => false,
      claimExpeditionRewards: async () => false,
      isTotemAvailable: () => false,
      activeExpeditionEffect: null,
      showExpeditionEffect: () => undefined,
      hideExpeditionEffect: () => undefined,
      lootItems: [],
      fetchLootItems: async () => {},
      claimLootItem: async () => undefined,
      getTotemCooldowns: () => null,
      setTotemCooldowns: () => {},
      fetchTotemCooldowns: async () => null,
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { address, totems, updateBalances, updateTotem: _updateTotem, fetchTotems, updateTotemNickname, setEssenceBalance } = useUser();
    const [actionConfigs, setActionConfigs] = useState<Record<ActionType, ActionConfig>>({} as Record<ActionType, ActionConfig>);
    const [timeWindows, setTimeWindows] = useState<TimeWindows | null>(null);
    const [gameParams, setGameParams] = useState<GameParameters | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [challengeState, setChallengeState] = useState<ChallengeState>({
        challenges: {},
        userStatus: {},
        loading: false,
        error: null
    });
    const [rewardsState, setRewardsState] = useState<RewardsState>({
        streakStatus: null,
        isClaimLoading: false,
        weeklyStatus: null,
        hasWeeklyUnlocked: false,
        hasStakingUnlocked: false
    })

    // Web2: Transaction service not used in REST API mode

    const [runeBalances, setRuneBalances] = useState<RuneBalances>({ lesser: 0, greater: 0, ancient: 0 });
      
    const [expeditionState, setExpeditionState] = useState<ExpeditionState>({
        expeditions: {},
        userExpeditions: [],
        loading: false,
        error: null
    });

    const [activeExpeditionEffect, setActiveExpeditionEffect] = useState<ExpeditionRewardsData | null>(null);
    const [lootItems, setLootItems] = useState<LootItem[]>([]);

    // Per-totem cooldown cache - persists across navigation, single source of truth
    const cooldownCacheRef = useRef<Record<string, CooldownStatus>>({});
    const cooldownFetchRef = useRef<Record<string, Promise<CooldownStatus | null>>>({});

    const getTotemCooldowns = useCallback((totemId: string): CooldownStatus | null => {
        return cooldownCacheRef.current[totemId] || null;
    }, []);

    const setTotemCooldowns = useCallback((totemId: string, cooldowns: CooldownStatus) => {
        cooldownCacheRef.current[totemId] = cooldowns;
    }, []);

    const fetchTotemCooldowns = useCallback(async (totemId: string): Promise<CooldownStatus | null> => {
        // Return cached if available
        if (cooldownCacheRef.current[totemId]) {
            return cooldownCacheRef.current[totemId];
        }
        // Dedup: return in-flight promise for same totem
        if (totemId in cooldownFetchRef.current) {
            return cooldownFetchRef.current[totemId];
        }
        // Fetch from API and cache
        const promise = (async () => {
            try {
                const response = await apiClient.getCooldowns(totemId);
                if (response.success && response.data) {
                    const { cooldowns } = response.data;
                    const status: CooldownStatus = {
                        feed: {
                            onCooldown: cooldowns.feed.onCooldown,
                            readyAt: cooldowns.feed.readyAt ? new Date(cooldowns.feed.readyAt) : null,
                            remainingMs: cooldowns.feed.remainingMs,
                        },
                        train: {
                            onCooldown: cooldowns.train.onCooldown,
                            readyAt: cooldowns.train.readyAt ? new Date(cooldowns.train.readyAt) : null,
                            remainingMs: cooldowns.train.remainingMs,
                        },
                        treat: {
                            onCooldown: cooldowns.treat.onCooldown,
                            readyAt: cooldowns.treat.readyAt ? new Date(cooldowns.treat.readyAt) : null,
                            remainingMs: cooldowns.treat.remainingMs,
                        },
                    };
                    cooldownCacheRef.current[totemId] = status;
                    return status;
                }
            } catch { /* silently fail */ }
            return null;
        })();
        cooldownFetchRef.current[totemId] = promise;
        promise.finally(() => { delete cooldownFetchRef.current[totemId]; });
        return promise;
    }, []);

    const loadGameConfigs = useCallback(async () => {
        // Web2: Use static game configuration
        // In Web2, these configs are managed server-side and don't need to be fetched from contracts
        console.log('loading game config (Web2 static)');

        try {
            setIsLoading(true);
            setError(null);

            // Set game parameters (Web2 defaults)
            setGameParams({
                signupReward: 2000, // 2000 Essence signup bonus
                mintPrice: 0 // Free totems in Web2
            });

            // Set time windows (UTC hours for feeding windows)
            setTimeWindows({
                window1Start: 0,    // 00:00 UTC
                window2Start: 28800, // 08:00 UTC (8 * 3600)
                window3Start: 57600  // 16:00 UTC (16 * 3600)
            });

            // Web2 action configs (simplified - backend handles actual logic)
            const configMap: Record<ActionType, ActionConfig> = {
                [ActionType.Feed]: {
                    cost: 0,
                    cooldown: 0, // Uses time windows instead
                    maxDaily: 3,
                    minHappiness: 0,
                    happinessChange: 10,
                    experienceGain: 15,
                    useTimeWindows: true,
                    increasesHappiness: true,
                    enabled: true
                },
                [ActionType.Train]: {
                    cost: 10,
                    cooldown: 3600, // 1 hour
                    maxDaily: 3,
                    minHappiness: 20,
                    happinessChange: -5,
                    experienceGain: 25,
                    useTimeWindows: false,
                    increasesHappiness: false,
                    enabled: true
                },
                [ActionType.Treat]: {
                    cost: 25,
                    cooldown: 7200, // 2 hours
                    maxDaily: 2,
                    minHappiness: 0,
                    happinessChange: 30,
                    experienceGain: 5,
                    useTimeWindows: false,
                    increasesHappiness: true,
                    enabled: true
                },
                [ActionType.Evolve]: {
                    cost: 100,
                    cooldown: 0,
                    maxDaily: 0, // No daily limit
                    minHappiness: 50,
                    happinessChange: 0,
                    experienceGain: 0,
                    useTimeWindows: false,
                    increasesHappiness: false,
                    enabled: true
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
                    enabled: false
                }
            };

            setActionConfigs(configMap);
        } catch (err) {
            console.error('Error loading game configs:', err);
            setError('Failed to load game configuration');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const challengesLoadedRef = useRef(false);

    const loadChallenges = useCallback(async () => {
        // Web2: Use REST API instead of smart contracts
        if (!apiClient.isAuthenticated()) return;

        // SPA cache: only fetch once per session, updates happen client-side.
        // Set ref BEFORE await to prevent StrictMode / concurrent double-fires.
        if (challengesLoadedRef.current) return;
        challengesLoadedRef.current = true;

        console.log('loading challenges');

        try {
            setChallengeState(prev => ({ ...prev, loading: true, error: null }));

            const response = await apiClient.getChallenges();

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Failed to load challenges');
            }

            // Build challenge state from API response
            const challenges: Record<string, ChallengeInfo> = {};
            const userStatus: Record<string, ChallengeStatus> = {};

            // Handle both array format and object with challenges property
            const challengeList = Array.isArray(response.data)
                ? response.data
                : response.data.challenges || [];

            challengeList.forEach((challenge: any) => {
                const id = challenge.id;

                challenges[id] = {
                    id,
                    name: challenge.name,
                    description: challenge.description,
                    challengeType: challenge.challengeType || challenge.type,
                    attribute: challenge.attribute || challenge.affinity,
                    requirements: challenge.requirements || { stage: 0, strength: 0, agility: 0, wisdom: 0 },
                    maxDailyAttempts: challenge.maxDailyAttempts || 3,
                    maxScore: challenge.maxScore || 100,
                    enabled: challenge.enabled !== false
                };

                userStatus[id] = {
                    lastAttemptTime: challenge.progress?.lastAttemptAt
                        ? new Date(challenge.progress.lastAttemptAt).getTime() / 1000
                        : 0,
                    dailyAttempts: challenge.daily?.attemptsToday || 0,
                    attemptsRemaining: challenge.daily?.attemptsRemaining ?? challenge.maxDailyAttempts ?? 3,
                    highScore: challenge.progress?.highScore || challenge.userStatus?.highScore || 0,
                    totalAttempts: challenge.progress?.totalAttempts || challenge.userStatus?.totalAttempts || 0,
                    totalScore: challenge.progress?.totalXpEarned || challenge.userStatus?.totalScore || 0
                };
            });

            setChallengeState({
                challenges,
                userStatus,
                loading: false,
                error: null
            });
        } catch (err) {
            console.error('Error loading challenges:', err);
            challengesLoadedRef.current = false; // allow retry on error
            setChallengeState(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to load challenges'
            }));
        }
    }, []);

    // Check if a totem can attempt a challenge
    const canAttemptChallenge = useCallback((challengeId: string, tokenId: string) => {
        const challenge = challengeState.challenges[challengeId];
        const status = challengeState.userStatus[challengeId];
        if (!challenge || !status || !challenge.enabled) return false;

        // Check attempts remaining
        if (status.attemptsRemaining <= 0) return false;

        // Find totem
        const totem = totems.find(t => t.id === tokenId);
        if (!totem) return false;

        // Check requirements
        const reqs = challenge.requirements;
        return (
            totem.attributes.stage >= reqs.stage &&
            totem.attributes.strength >= reqs.strength &&
            totem.attributes.agility >= reqs.agility &&
            totem.attributes.wisdom >= reqs.wisdom
        );
    }, [challengeState, totems]);

    // Get eligible totems for a challenge
    const getEligibleTotems = useCallback((challengeId: string) => {
        // Web2: Use plain string IDs instead of hashed IDs
        const challenge = challengeState.challenges[challengeId];
        if (!challenge) return [];

        return totems
            .filter(totem => {
                const reqs = challenge.requirements;
                return getTotemStage(totem) >= Number(reqs.stage) &&
                       totem.attributes.strength >= Number(reqs.strength) &&
                       totem.attributes.agility >= Number(reqs.agility) &&
                       totem.attributes.wisdom >= Number(reqs.wisdom);
            });
    }, [challengeState, totems]);

    // Get user-friendly status message
    const getChallengeStatus = useCallback((challengeId: string) => {
        // Web2: Use plain string IDs instead of hashed IDs
        const challenge = challengeState.challenges[challengeId];
        const status = challengeState.userStatus[challengeId];

        if (!challenge) return 'Challenge not found';
        if (!challenge.enabled) return 'Challenge disabled';
        if (!status) return 'No attempts yet';
        if (status.attemptsRemaining <= 0) return 'No attempts remaining today';

        return `${status.attemptsRemaining} attempts remaining`;
    }, [challengeState]);

    // Complete a challenge attempt
    const completeChallenge = useCallback(async (
        challengeId: string,
        tokenId: string,
        score: number
    ) => {
        // Web2: Use REST API instead of smart contracts
        const challenge = challengeState.challenges[challengeId];

        if (!challenge) throw new Error('Challenge not found');
        if (!challenge.enabled) throw new Error('Challenge disabled');

        const response = await apiClient.completeChallenge(challengeId, tokenId, score);

        if (!response.success) {
            throw new Error(response.error?.message || 'Failed to complete challenge');
        }

        // Update Essence balance inline (no extra /user/profile call)
        if (response.data?.newEssenceBalance != null) {
            setEssenceBalance(response.data.newEssenceBalance);
        }

        // Update client-side challenge state from response (no re-fetch needed)
        const p = response.data?.progress;
        if (p) {
            setChallengeState(prev => ({
                ...prev,
                userStatus: {
                    ...prev.userStatus,
                    [challengeId]: {
                        ...prev.userStatus[challengeId],
                        lastAttemptTime: Date.now() / 1000,
                        dailyAttempts: p.attemptsToday,
                        attemptsRemaining: p.attemptsRemaining,
                        highScore: p.highScore,
                        totalAttempts: p.totalAttempts,
                        totalScore: p.totalXpEarned,
                    },
                },
            }));
        }
    }, [challengeState]);

    // Helper to convert UTC hours to seconds since day start
    function utcHoursToSeconds(hours: number): number {
        return hours * 3600;
    }

    // Helper to get human-readable window times
    function formatUTCTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        return hours.toString().padStart(2, '0') + ':00';
    }

    function getFormattedWindowTimes(): { [key: string]: string } {
        const window1Start = formatUTCTime(timeWindows?.window1Start!);
        const window2Start = formatUTCTime(timeWindows?.window2Start!);
        const window3Start = formatUTCTime(timeWindows?.window3Start!);
        const dayEnd = '24:00';
    
        return {
            window1: `UTC ${window1Start}-${window2Start}`,
            window2: `UTC ${window2Start}-${window3Start}`,
            window3: `UTC ${window3Start}-${dayEnd}`
        };
    }

    // Debug helper for time windows
    const debugTimeWindow = () => {
        const now = new Date();
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        const currentSeconds = utcHoursToSeconds(utcHours) + (utcMinutes * 60);
        
        console.log('Current UTC Time:', {
            time: now.toUTCString(),
            hoursUTC: utcHours,
            secondsSinceMidnight: currentSeconds,
            currentWindow: 
                currentSeconds < timeWindows?.window2Start! ? 'Window 1' :
                currentSeconds < timeWindows?.window3Start! ? 'Window 2' : 'Window 3'
        });
    }

    const refreshGameConfig = async () => {
        await loadGameConfigs();
    };

    useEffect(() => {
        // Load configs immediately, no provider needed
        loadGameConfigs();
    }, [loadGameConfigs]);

    function getActionStatus(
        actionType: ActionType,
        attributes: TotemAttributes,
        tracking: ActionTracking,
        config: ActionConfig
    ): string {
        if (!tracking || !config) return 'Action not configured';
    
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if action is enabled
        if (!config.enabled) return 'Action disabled';
    
        // Happiness check
        if (attributes.happiness < config.minHappiness) {
            return `Needs ${config.minHappiness} happiness (current: ${attributes.happiness})`;
        }
    
        // Cooldown check
        if (config.cooldown > 0) {
            const cooldownRemaining = (tracking.lastUsed + config.cooldown) - currentTime;
            if (cooldownRemaining > 0) {
                const minutes = Math.ceil(cooldownRemaining / 60);
                return `Cooldown: ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
            }
        }
    
        // Daily limit check
        if (config.maxDaily > 0 && actionType !== ActionType.Feed) {
            const currentDay = Math.floor(currentTime / SECONDS_PER_DAY) * SECONDS_PER_DAY;
            if (currentDay === tracking.dayStartTime && tracking.dailyUses >= config.maxDaily) {
                return `Daily limit (${config.maxDaily}) reached`;
            }
        }
    
        // Time windows check
        if (config.useTimeWindows) {
            return canUseInTimeWindow(tracking.lastUsed) 
                ? 'Available in current time window' 
                : 'Next time window';
        }
    
        return 'Available';
    }
    
    function canUseAction(
        attributes: TotemAttributes, 
        actionType: ActionType, 
        actionTracking?: ActionTracking
    ): boolean {
        const config = actionConfigs[actionType];
        if (!config || !timeWindows) return false;

        const currentTime = Math.floor(Date.now() / 1000);

        // Add debug info
        if (actionType === ActionType.Feed) {
            //debugTimeWindow();
        }

        // Basic validation
        if (!config.enabled) return false;
        if (attributes.happiness < config.minHappiness) return false;
        if (!actionTracking) return false;

        // Cooldown check
        if (config.cooldown > 0 && 
            currentTime < actionTracking.lastUsed + config.cooldown) {
            return false;
        }

        // Daily limit check
        if (config.maxDaily > 0) {
            const currentDay = Math.floor(currentTime / SECONDS_PER_DAY) * SECONDS_PER_DAY;
            if (currentDay === actionTracking.dayStartTime && 
                actionTracking.dailyUses >= config.maxDaily) {
                return false;
            }
        }

        // Time windows check
        if (config.useTimeWindows) {
            return canUseInTimeWindow(actionTracking.lastUsed);
        }
        
        return true;
    }

    function canUseInTimeWindow(lastUsed: number): boolean {
        const currentTime = Math.floor(Date.now() / 1000);
        const todayUTC = Math.floor(currentTime / SECONDS_PER_DAY) * SECONDS_PER_DAY;
        const lastUsedDay = Math.floor(lastUsed / SECONDS_PER_DAY) * SECONDS_PER_DAY;
        
        // Different day = always allowed
        if (todayUTC > lastUsedDay) return true;
        
        const currentDaySeconds = currentTime - todayUTC;
        const lastUsedDaySeconds = lastUsed - lastUsedDay;
        
        // Match the exact logic from the contract
        if (currentDaySeconds < timeWindows?.window2Start!) {
            // In Window 1 (00:00-08:00)
            return lastUsedDaySeconds >= timeWindows?.window2Start! || 
                lastUsedDaySeconds < timeWindows?.window1Start!;
        }
        else if (currentDaySeconds < timeWindows?.window3Start!) {
            // In Window 2 (08:00-16:00)
            return lastUsedDaySeconds < timeWindows?.window2Start! || 
                lastUsedDaySeconds >= timeWindows?.window3Start!;
        }
        else {
            // In Window 3 (16:00-00:00)
            return lastUsedDaySeconds < timeWindows?.window3Start!;
        }
    }

    function getNextAvailableWindow(tracking: ActionTracking): string {
        const SECONDS_PER_DAY = 86400;
        const currentTime = Math.floor(Date.now() / 1000);
        const todayUTC = Math.floor(currentTime / SECONDS_PER_DAY) * SECONDS_PER_DAY;
        const lastUsedDay = Math.floor(tracking.lastUsed / SECONDS_PER_DAY) * SECONDS_PER_DAY;
        
        // Different day = always allowed
        if (todayUTC > lastUsedDay) return 'Available Now';
        
        const currentDaySeconds = currentTime - todayUTC;
        
        if (currentDaySeconds < 8 * 3600) {
            // In Window 1 (00:00-08:00)
            return '08:00 UTC';
        } else if (currentDaySeconds < 16 * 3600) {
            // In Window 2 (08:00-16:00)
            return '16:00 UTC';
        } else {
            // In Window 3 (16:00-00:00)
            return '00:00 UTC (Next Day)';
        }
    }

    // Single API call to fetch both daily and weekly reward status
    const refreshAllRewardStatus = async (): Promise<{ streak?: StreakStatus; weekly?: WeeklyStatus }> => {
        try {
            console.log('[GameContext] Fetching reward status from API...');
            const response = await apiClient.getRewardStatus();

            if (!response.success || !response.data) {
                console.error("[GameContext] Error fetching reward status:", response.error);
                return {};
            }

            const { daily, weekly } = response.data;
            console.log('[GameContext] API response - canClaim:', daily.canClaim, 'streakDays:', daily.streakDays);

            const streakStatus: StreakStatus = {
                streakDays: daily.streakDays || 0,
                canClaimToday: daily.canClaim || false,
                bestStreak: daily.bestStreak || 0,
                nextClaimTime: daily.nextClaimTime ? new Date(daily.nextClaimTime).getTime() / 1000 : 0,
                isProtected: daily.isProtected || false,
                protectionExpiry: daily.protectionExpiry ? new Date(daily.protectionExpiry).getTime() / 1000 : 0
            };

            const weeklyStatus: WeeklyStatus = {
                weeklyStreak: weekly.weeklyStreak || 0,
                canClaimWeekly: weekly.canClaim || false,
                bestWeeklyStreak: weekly.bestStreak || 0,
                nextClaimTime: weekly.nextClaimTime ? new Date(weekly.nextClaimTime).getTime() / 1000 : 0,
                isProtected: weekly.isProtected || false,
                protectionExpiry: weekly.protectionExpiry ? new Date(weekly.protectionExpiry).getTime() / 1000 : 0
            };

            const hasWeeklyUnlocked = weekly.isUnlocked || false;

            console.log('[GameContext] Updating rewardsState with canClaimToday:', streakStatus.canClaimToday);
            setRewardsState(prev => ({
                ...prev,
                streakStatus,
                weeklyStatus,
                hasWeeklyUnlocked
            }));

            return { streak: streakStatus, weekly: weeklyStatus };
        } catch (error) {
            console.error("[GameContext] Error fetching reward status:", error);
            return {};
        }
    };

    // Stable callback for refreshing reward status (used by Rewards page useEffect).
    // Skips API call if data is already cached (SPA cache-until-action pattern).
    // Claim actions call refreshAllRewardStatus() directly to force-refresh.
    const rewardsLoadedRef = useRef(false);
    const refreshRewardStatus = useCallback(async () => {
        if (rewardsLoadedRef.current) return;
        rewardsLoadedRef.current = true;
        await refreshAllRewardStatus();
    }, []);

    const getUserStreak = async (): Promise<StreakStatus | undefined> => {
        if (rewardsState.streakStatus) return rewardsState.streakStatus;
        const result = await refreshAllRewardStatus();
        return result.streak;
    };

    const _getWeeklyStatus = async (): Promise<WeeklyStatus | undefined> => {
        if (rewardsState.weeklyStatus) return rewardsState.weeklyStatus;
        const result = await refreshAllRewardStatus();
        return result.weekly;
    };

    const claimDailyReward = async () => {
        setRewardsState(prev => ({ ...prev, isClaimLoading: true }));

        try {
            const response = await apiClient.claimDailyReward();

            if (!response.success) {
                console.error("Error claiming daily reward:", response.error);
                return false;
            }

            // Show notification
            if (response.data?.reward) {
                notificationService.showRewardClaimed({
                    rewardType: 'daily',
                    amount: response.data.reward.amount || 0,
                    streakDays: response.data.reward.streakDays,
                    streakBonus: response.data.reward.streakBonus || 0,
                });
            }
            notificationService.processAchievementsFromResponse((response.data as any)?.achievements);

            // Single call updates both daily and weekly status
            await Promise.all([
                updateBalances(),
                refreshAllRewardStatus()
            ]);

            return true;
        }
        catch (error) {
            console.error("Error claiming daily reward:", error);
            return false;
        }
        finally {
            setRewardsState(prev => ({ ...prev, isClaimLoading: false }));
        }
    };

    // Keep updateWeeklyStatus for backward compat (now delegates to single call)
    const updateWeeklyStatus = async (): Promise<WeeklyStatus | undefined> => {
        const result = await refreshAllRewardStatus();
        return result.weekly;
    };

    // Keep updateStreakStatus for backward compat
    const updateStreakStatus = async (): Promise<StreakStatus | undefined> => {
        const result = await refreshAllRewardStatus();
        return result.streak;
    };

    const claimWeeklyReward = async () => {
        // Web2: Use REST API instead of smart contracts
        try {
            // Call REST API to claim weekly reward
            const response = await apiClient.claimWeeklyReward();

            if (!response.success) {
                console.error("Error claiming weekly reward:", response.error);
                return false;
            }

            // Show notification
            if (response.data?.reward) {
                notificationService.showRewardClaimed({
                    rewardType: 'weekly',
                    amount: response.data.reward.totalAmount || response.data.reward.amount || 0,
                });
            }
            notificationService.processAchievementsFromResponse((response.data as any)?.achievements);

            // Update balances and status
            await Promise.all([
                updateBalances(),
                updateWeeklyStatus()
            ]);

            return true;
        }
        catch (error) {
            console.error("Error claiming weekly reward:", error);
            return false;
        }
    };

    const purchaseProtection = async (type: 'daily' | 'weekly', tier: number) => {
        try {
            const response = await apiClient.purchaseProtection(type, tier);

            if (!response.success) {
                console.error("Error purchasing protection:", response.error);
                throw new Error((response.error as any)?.message || 'Failed to purchase protection');
            }

            // Refresh balances and streak status to reflect protection
            await Promise.all([
                updateBalances(),
                type === 'daily' ? updateStreakStatus() : updateWeeklyStatus()
            ]);

            return true;
        } catch (error) {
            console.error("Error purchasing protection:", error);
            throw error;
        }
    };

    const setNickname = async (totemId: string, newName: string) => {
        // Web2: Call REST API to set nickname
        if (!apiClient.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const response = await apiClient.setNickname(totemId, newName.trim() || null);

        if (!response.success) {
            throw new Error(response.error?.message || 'Failed to set nickname');
        }

        // Update the nickname immediately in local state
        const newNickname = response.data?.nickname ?? null;
        updateTotemNickname(totemId, newNickname);
    };

    // Sync rune balances from auth user (already fetched by /auth/me — no extra API call)
    useEffect(() => {
        if (user?.currencies?.runes) {
            const runes = user.currencies.runes;
            setRuneBalances({
                lesser: runes.lesser || 0,
                greater: runes.greater || 0,
                ancient: runes.ancient || 0,
            });
        }
    }, [user?.currencies?.runes]);

    // No-op: rune balances are synced from auth user and updated inline after expedition claims.
    // Kept for API compatibility with components that call it.
    const getUserRuneBalances = useCallback(async () => {}, []);
      
    const refreshExpeditions = useCallback(async () => {
        // Only fetch active (dynamic) expeditions from API.
        // Static expedition definitions come from components/data/expeditions.json
        if (!apiClient.isAuthenticated()) return;

        try {
          setExpeditionState(prev => ({ ...prev, loading: true, error: null }));

          const response = await apiClient.getActiveExpeditions();

          if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to load expeditions');
          }

          const { expeditions } = response.data;

          // Transform active expeditions
          const userExpeditions = (expeditions || []).map((exp: any) => ({
            expeditionId: exp.expeditionId,
            captainId: exp.totemIds?.[0] || exp.totemId,
            totemIds: exp.totemIds || [exp.totemId],
            endTime: exp.endsAt ? new Date(exp.endsAt).getTime() / 1000 : (exp.endTime || 0),
            completed: false,
            canClaim: exp.canClaim || false
          }));

          setExpeditionState(prev => ({
            ...prev,
            userExpeditions,
            loading: false,
            error: null
          }));
        }
        catch (err) {
          console.error('Error loading expeditions:', err);
          setExpeditionState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load expeditions'
          }));
        }
    }, []);
      
    const startExpedition = useCallback(async (
        expeditionId: string,
        totemIds: string[]
      ) => {
        // Web2: Use REST API instead of smart contracts
        try {
          const response = await apiClient.startExpedition(expeditionId, totemIds);

          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to start expedition');
          }

          // Refresh data
          await Promise.all([
            refreshExpeditions(),
            updateBalances()
          ]);

          return true;
        }
        catch (error) {
          console.error('Error starting expedition:', error);
          return false;
        }
      }, [updateBalances, refreshExpeditions]);
      
    const claimExpeditionRewards = useCallback(async (expeditionId: string) => {
        // Web2: Use REST API instead of smart contracts
        try {
          const response = await apiClient.claimExpeditionRewards(expeditionId);

          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to claim expedition rewards');
          }

          // Show expedition rewards notification
          const rewards = response.data?.rewards;
          const expedition = response.data?.expedition;
          const scoreValue = response.data?.score?.value ?? 0;
          if (rewards) {
            notificationService.showExpeditionRewards({
              expeditionId,
              expeditionName: expedition?.name || expedition?.expeditionId,
              totemIds: expedition?.totemIds || (response.data?.totem?.id ? [response.data.totem.id] : []),
              experienceGained: rewards.experience,
              essenceGained: rewards.essence,
              runesGained: rewards.runes,
              score: scoreValue,
            });

            // Show the full-screen celebration modal
            setActiveExpeditionEffect({
              expeditionId,
              experienceGained: rewards.experience,
              runesGained: rewards.runes || { lesser: 0, greater: 0, ancient: 0 },
              score: scoreValue,
            });
          }

          // Process any achievements earned from the claim
          notificationService.processAchievementsFromResponse(response.data?.achievements);

          // Update rune balances — use authoritative balance from API if available, else accumulate
          if (rewards?.newRuneBalances) {
            setRuneBalances({
              lesser: rewards.newRuneBalances.lesser || 0,
              greater: rewards.newRuneBalances.greater || 0,
              ancient: rewards.newRuneBalances.ancient || 0,
            });
          } else if (rewards?.runes) {
            setRuneBalances(prev => ({
              lesser: prev.lesser + (rewards.runes.lesser || 0),
              greater: prev.greater + (rewards.runes.greater || 0),
              ancient: prev.ancient + (rewards.runes.ancient || 0),
            }));
          }

          // Refresh data
          await Promise.all([
            refreshExpeditions(),
            updateBalances()
          ]);

          return true;
        }
        catch (error) {
          console.error('Error claiming expedition rewards:', error);
          return false;
        }
    }, [refreshExpeditions, updateBalances]);

    const fetchLootItems = useCallback(async () => {
        if (!apiClient.isAuthenticated()) return;
        // Dedup: return in-flight promise (prevents StrictMode double-fire)
        if (lootFetchPromise) return lootFetchPromise;
        lootFetchPromise = (async () => {
            try {
                const response = await apiClient.getLootItems();
                if (response.success && response.data) {
                    setLootItems(response.data.items || []);
                }
            } catch (err) {
                console.error('Error fetching loot items:', err);
            } finally {
                lootFetchPromise = null;
            }
        })();
        return lootFetchPromise;
    }, []);

    const claimLootItemAction = useCallback(async (lootItemId: string, options?: { speciesId?: number }) => {
        if (!apiClient.isAuthenticated()) return;
        try {
            const response = await apiClient.claimLootItem(lootItemId, options);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to claim loot item');
            }
            const lootResult = response.data?.result;
            // Remove claimed item from local state
            setLootItems(prev => prev.filter(item => item.id !== lootItemId));
            // If totem box was claimed, refresh totems + balances (achievements may award Essence)
            if (lootResult?.type === 'totem') {
                await Promise.all([fetchTotems(), updateBalances()]);
            }
            // If essence box, refresh balances
            if (lootResult?.type === 'essence') {
                await updateBalances();
            }
            // Process achievements from loot claim
            notificationService.processAchievementsFromResponse((lootResult as any)?.achievements);
            return response.data;
        } catch (err) {
            console.error('Error claiming loot item:', err);
            throw err;
        }
    }, [fetchTotems, updateBalances]);

    const isTotemAvailable = useCallback((totemId: string): boolean => {
        if (!expeditionState.userExpeditions) return true;
        
        // Check if totem is on an active expedition
        // Web2: Compare string IDs directly
        return !expeditionState.userExpeditions.some(exp =>
          !exp.completed && exp.totemIds.some(id => id === totemId)
        );
      }, [expeditionState.userExpeditions]);

    const showExpeditionEffect = useCallback((data: ExpeditionRewardsData) => {
        setActiveExpeditionEffect(data);
    }, []);
    
    const hideExpeditionEffect = useCallback(() => {
        setActiveExpeditionEffect(null);
    }, []);

    useEffect(() => {
        // Initial load: only fetch expeditions (needed by /totems for "on expedition" badge).
        // Rewards, runes, and challenges are loaded lazily when their pages mount.
        if (!apiClient.isAuthenticated()) return;
        refreshExpeditions();
    }, [address, refreshExpeditions]);

    // Clear user-specific state when user logs out or changes
    useEffect(() => {
        if (!address || !apiClient.isAuthenticated()) {
            // Reset user-specific game state + cache flags
            challengesLoadedRef.current = false;
            rewardsLoadedRef.current = false;
            setChallengeState(prev => ({
                ...prev,
                userStatus: {}
            }));
            setRewardsState({
                streakStatus: null,
                isClaimLoading: false,
                weeklyStatus: null,
                hasWeeklyUnlocked: false,
                hasStakingUnlocked: false
            });
            setRuneBalances({ lesser: 0, greater: 0, ancient: 0 });
            setExpeditionState(prev => ({
                ...prev,
                userExpeditions: []
            }));
        }
    }, [address]);
    
    return (
        <GameContext.Provider value={{
            actionConfigs,
            timeWindows,
            gameParams,
            isLoading,
            error,
            debugTimeWindow,
            getFormattedWindowTimes,
            refreshGameConfig,
            canUseAction,
            getActionStatus,
            getNextAvailableWindow,
            challengeState,
            refreshChallenges: loadChallenges,
            canAttemptChallenge,
            getEligibleTotems,
            getChallengeStatus,
            completeChallenge,
            rewardsState,
            getUserStreak,
            claimDailyReward,
            claimWeeklyReward,
            purchaseProtection,
            refreshRewardStatus,
            setNickname,
            runeBalances,
            getUserRuneBalances,
            expeditionState,
            refreshExpeditions,
            startExpedition,
            claimExpeditionRewards,
            isTotemAvailable,
            activeExpeditionEffect,
            showExpeditionEffect,
            hideExpeditionEffect,
            lootItems,
            fetchLootItems,
            claimLootItem: claimLootItemAction,
            getTotemCooldowns,
            setTotemCooldowns,
            fetchTotemCooldowns,
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
