// contexts/GameContext.tsx
import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { createAchievementsContract, createChallengesContract, createGameContract, createRewardsContract, TotemGameContract, TotemRewardsContract } from '../config/contracts';
import { ActionType, ActionConfig, TimeWindows, GameParameters, TotemAttributes, ActionTracking, ChallengeState, ChallengeInfo, ChallengeStatus, NFTMetadata, StreakStatus, WeeklyStatus, RewardsState } from '../types/types';
import { ethers } from 'ethers';
import { getTotemStage } from '../utils/totems';
import { useTransactionService } from '../hooks/useTransactionService';

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
    getEligibleTotems: (challengeId: string) => NFTMetadata[];
    canAttemptChallenge: (challengeId: string, tokenId: string) => boolean;
    getChallengeStatus: (challengeId: string) => string;
    completeChallenge: (challengeId: string, tokenId: string, score: number) => Promise<void>;

    // rewards
    rewardsState: RewardsState;
    getUserStreak: () => Promise<StreakStatus | undefined>;
    claimDailyReward: () => Promise<boolean>;
    claimWeeklyReward: () => Promise<boolean>;
    purchaseProtection: (type: 'daily' | 'weekly', tier: number) => Promise<boolean>;

    setDisplayName: (tokenId: bigint, newName: string) => Promise<void>;
}

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
    setDisplayName: async() => {}
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { provider, address, signer, totems, updateBalances, isGaslessEnabled } = useUser();
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

    const txService = useTransactionService({
        gaslessEnabled: isGaslessEnabled,
        waitForConfirmation: true
    });

    const loadGameConfigs = useCallback(async () => {
        if (!provider) return;
        console.log('loading game config');

        try {
            setIsLoading(true);
            setError(null);
            const gameContract = createGameContract(provider);

            // Get all configuration in one call to reduce RPC requests
            const [params, windows, configs] = await gameContract.getGameConfiguration();

            // Set game parameters
            setGameParams({
                signupReward: params.signupReward,
                mintPrice: params.mintPrice
            });

            // Set time windows
            setTimeWindows({
                window1Start: Number(windows.window1Start),
                window2Start: Number(windows.window2Start),
                window3Start: Number(windows.window3Start)
            });

            // Load all action configs
            const actionTypes = [ActionType.Feed, ActionType.Train, ActionType.Treat];
            const configMap: Record<ActionType, ActionConfig> = {} as Record<ActionType, ActionConfig>;

            configs.forEach((config: ActionConfig, index: number) => {
                const actionType = actionTypes[index];
                configMap[actionType] = {
                    cost: config.cost,
                    cooldown: Number(config.cooldown),
                    maxDaily: Number(config.maxDaily),
                    minHappiness: Number(config.minHappiness),
                    happinessChange: Number(config.happinessChange),
                    experienceGain: Number(config.experienceGain),
                    useTimeWindows: config.useTimeWindows,
                    increasesHappiness: config.increasesHappiness,
                    enabled: config.enabled
                };
            });

            setActionConfigs(configMap);
        } catch (err) {
            console.error('Error loading game configs:', err);
            setError('Failed to load game configuration');
        } finally {
            setIsLoading(false);
        }
    }, [provider]);

    const loadChallenges = useCallback(async () => {
        if (!provider || !address) return;
        console.log('loading challenges');

        try {
            setChallengeState(prev => ({ ...prev, loading: true, error: null }));
            const challengesContract = createChallengesContract(provider);

            // Get all challenge IDs
            const challengeIds = await challengesContract.getChallengeIds();

            // Fetch challenge info and user status for each challenge
            const challengeInfoPromises = challengeIds.map(id => 
                challengesContract.getChallengeInfo(id)
            );
            const userStatusPromises = challengeIds.map(id =>
                challengesContract.getUserChallengeStatus(id, address)
            );

            const [challengeInfos, userStatuses] = await Promise.all([
                Promise.all(challengeInfoPromises),
                Promise.all(userStatusPromises)
            ]);

            // Build challenge state
            const challenges: Record<string, ChallengeInfo> = {};
            const userStatus: Record<string, ChallengeStatus> = {};

            challengeIds.forEach((id, index) => {
                const info = challengeInfos[index];
                const status = userStatuses[index];

                challenges[id] = {
                    id,
                    name: info.name,
                    description: info.description,
                    challengeType: info.challengeType,
                    attribute: info.attribute,
                    requirements: info.requirements,
                    maxDailyAttempts: info.maxDailyAttempts,
                    maxScore: info.maxScore,
                    enabled: info.enabled
                };

                userStatus[id] = {
                    lastAttemptTime: Math.floor(Date.now() / 1000), // Current timestamp for new attempts
                    dailyAttempts: status.dailyAttempts,
                    attemptsRemaining: status.attemptsRemaining,
                    highScore: status.highScore,
                    totalAttempts: status.totalAttempts,
                    totalScore: status.totalScore
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
            setChallengeState(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to load challenges'
            }));
        }
    }, [provider, address]);

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
        const id = ethers.id(challengeId);
        const challenge = challengeState.challenges[id];
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
        const id = ethers.id(challengeId);
        const challenge = challengeState.challenges[id];
        const status = challengeState.userStatus[id];
        
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
        if (!provider || !address) throw new Error('Not connected');
        if (!txService) throw new Error('Transaction service not initialized');

        const id = ethers.id(challengeId);
        const challenge = challengeState.challenges[id];

        if (!challenge) throw new Error('Challenge not found');
        if (!challenge.enabled) throw new Error('Challenge disabled');

        const gameContract = createGameContract(provider);
        const connectedGame = gameContract.connect(signer) as TotemGameContract;

        const result = await txService.completeChallenge(id, BigInt(tokenId), score);

        //const tx = await connectedGame.attemptChallenge(id, tokenId, score);
        //await tx.wait();

        // Refresh challenge state
        await loadChallenges();
    }, [provider, address, challengeState, loadChallenges]);

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
        if (provider) {
            loadGameConfigs();
            loadChallenges();
        }
    }, [provider, address, loadGameConfigs, loadChallenges]);

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
                : 'Already fed, wait for next time window';
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

    const updateStreakStatus = async (): Promise<StreakStatus | undefined> => {
        if (!provider || !address) return undefined;

        try {
            const rewardsContract = createRewardsContract(provider);
            const dailyRewardId = ethers.id("daily_login");
            const status = await rewardsContract.getStreakStatus(dailyRewardId, address);
            const newStatus: StreakStatus = {
                streakDays: Number(status.currentStreak),
                canClaimToday: status.canClaim,
                bestStreak: Number(status.bestStreak),
                nextClaimTime: Number(status.nextClaimTime),
                isProtected: status.isProtected,
                protectionExpiry: Number(status.protectionExpiry)
            };

            setRewardsState(prev => ({
                ...prev,
                streakStatus: newStatus
            }));

            return newStatus;
        } catch (error) {
            console.error("Error fetching streak data:", error);
            return undefined;
        }
    };

    const getUserStreak = async (): Promise<StreakStatus | undefined> => {
        return rewardsState.streakStatus || await updateStreakStatus();
    };

    const getWeeklyStatus = async (): Promise<WeeklyStatus | undefined> => {
        return rewardsState.weeklyStatus || await updateWeeklyStatus();
    };

    const claimDailyReward = async () => {
        if (!provider || !signer || !address) return false;

        setRewardsState(prev => ({ ...prev, isClaimLoading: true }));

        try {
            if (!txService) throw new Error('Transaction service not initialized');

            // Check if claiming is allowed first
            const dailyRewardId = ethers.id("daily_login");
            const rewardsContract = createRewardsContract(provider);
            const canClaim = await rewardsContract.isClaimingAllowed(dailyRewardId, address);
            if (!canClaim) return false;

            // Attempt to claim
            const result = await txService.claimDailyReward();

            // Update balances and streak status after successful claim
            await Promise.all([
                updateBalances(),
                updateStreakStatus()
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

    const updateWeeklyStatus = async (): Promise<WeeklyStatus | undefined> => {
        if (!provider || !address) return undefined;

        try {
            const rewardsContract = createRewardsContract(provider);
            const weeklyRewardId = ethers.id("weekly_bonus");

            // Get streak status from contract
            const status = await rewardsContract.getStreakStatus(weeklyRewardId, address);

            // Get user info for additional details
            const userInfo = await rewardsContract.getUserInfo(weeklyRewardId, address);

            const newStatus: WeeklyStatus = {
                weeklyStreak: Number(status.currentStreak),
                canClaimWeekly: status.canClaim,
                bestWeeklyStreak: Number(status.bestStreak),
                nextClaimTime: Number(status.nextClaimTime),
                isProtected: status.isProtected,
                protectionExpiry: Number(status.protectionExpiry)
            };

            // Check for Week Warrior achievement
            const achievementsContract = createAchievementsContract(provider);
            const loginProgressionId = ethers.id("login_progression");
            const progress = await achievementsContract.getDetailedProgress(loginProgressionId, address);
            const hasWeeklyUnlocked = progress.count >= 7;

            setRewardsState(prev => ({
                ...prev,
                weeklyStatus: newStatus,
                hasWeeklyUnlocked
            }));

            return newStatus;
        }
        catch (error) {
            console.error("Error fetching weekly streak data:", error);
            return undefined;
        }
    };

    const claimWeeklyReward = async () => {
        if (!provider || !signer || !address) return false;
        if (!txService) throw new Error('Transaction service not initialized');

        try {
            // Check if claiming is allowed
            const weeklyRewardId = ethers.id("weekly_bonus");
            const rewardsContract = createRewardsContract(provider);
            const canClaim = await rewardsContract.isClaimingAllowed(weeklyRewardId, address);
            if (!canClaim) return false;

            // Attempt to claim
            const result = await txService.claimWeeklyReward();

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
        if (!provider || !signer || !address) return false;
        if (!txService) throw new Error('Transaction service not initialized');

        // Check streak requirements
        const requiredStreak = type === 'daily'
            ? (tier === 0 ? 7 : 14)   // Daily: Tier 1 = 7 days, Tier 2 = 14 days
            : 28;                     // Weekly: 4 weeks required

        const currentStreak = type === 'daily'
            ? rewardsState.streakStatus?.streakDays || 0
            : rewardsState.weeklyStatus?.weeklyStreak || 0;

        if (currentStreak < requiredStreak) {
            throw new Error(`Insufficient streak. Required: ${requiredStreak}`);
        }

        try {
            const rewardsContract = createRewardsContract(provider);
            const rewardId = type === 'daily' ? ethers.id("daily_login") : ethers.id("weekly_bonus");

            // Check if protection is already active
            const status = await rewardsContract.getStreakStatus(rewardId, address);
            if (status.isProtected) {
                throw new Error('Protection is already active');
            }

            const result = await txService.purchaseProtection(rewardId, tier);

            // Update status
            await Promise.all([
                updateStreakStatus(),
                updateWeeklyStatus()
            ]);

            return true;
        }
        catch (error) {
            console.error("Error purchasing protection:", error);
            throw error;
        }
    };

    const setDisplayName = async (tokenId: bigint, newName: string) => {
        if (!provider || !signer) throw new Error('Not connected');
        if (!txService) throw new Error('Transaction service not initialized');

        try {
            const result = await txService.setDisplayName(tokenId, newName);
        }
        catch (error: any) {
            console.error('Name update failed:', error);
            throw new Error(error.message.includes('user rejected') 
                ? 'User rejected transaction' 
                : 'Failed to update name');
        }
    };

    useEffect(() => {
        updateStreakStatus();
        updateWeeklyStatus();
    }, [provider, address]);
    
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
            setDisplayName
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
