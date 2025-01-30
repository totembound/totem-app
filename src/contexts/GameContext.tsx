// contexts/GameContext.tsx
import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { createGameContract } from '../config/contracts';
import { ActionType, ActionConfig, TimeWindows, GameParameters } from '../types/types';

interface GameContextType {
    actionConfigs: Record<ActionType, ActionConfig>;
    timeWindows: TimeWindows | null;
    gameParams: GameParameters | null;
    isLoading: boolean;
    error: string | null;
    refreshGameConfig: () => Promise<void>;
    debugTimeWindow: () => void;
    getFormattedWindowTimes(): { [key: string]: string };
}

const defaultGetFormattedWindowTimes = () => {
    return {
        window1: 'Loading...',
        window2: 'Loading...',
        window3: 'Loading...'
    };
};

const GameContext = createContext<GameContextType>({
    actionConfigs: {} as Record<ActionType, ActionConfig>,
    timeWindows: null,
    gameParams: null,
    isLoading: true,
    error: null,
    refreshGameConfig: async () => {},
    debugTimeWindow: () => {},
    getFormattedWindowTimes: defaultGetFormattedWindowTimes
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

    return (
        <GameContext.Provider value={{
            actionConfigs,
            timeWindows,
            gameParams,
            isLoading,
            error,
            debugTimeWindow,
            getFormattedWindowTimes,
            refreshGameConfig
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
