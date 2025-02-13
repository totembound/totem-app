// contexts/GameContext.tsx
import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { createGameContract } from '../config/contracts';
import { ActionType, ActionConfig, TimeWindows, GameParameters, TotemAttributes, ActionTracking } from '../types/types';

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
        actionTracking?: ActionTracking
    ) => boolean;

    // New methods for action status
    getActionStatus: (
        actionType: ActionType,
        attributes: TotemAttributes,
        tracking: ActionTracking,
        config: ActionConfig
    ) => string;

    getNextAvailableWindow: (tracking: ActionTracking) => string;
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
    getNextAvailableWindow: defaultGetNextAvailableWindow
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { provider } = useUser();
    const [actionConfigs, setActionConfigs] = useState<Record<ActionType, ActionConfig>>({} as Record<ActionType, ActionConfig>);
    const [timeWindows, setTimeWindows] = useState<TimeWindows | null>(null);
    const [gameParams, setGameParams] = useState<GameParameters | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadGameConfigs = useCallback(async () => {
        if (!provider) return;

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
        }
    }, [provider, loadGameConfigs]);

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
            getNextAvailableWindow
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
