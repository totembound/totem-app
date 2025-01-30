// gameActions.ts
import { ActionType, ActionTracking, TotemAttributes } from '../types/types';
import { useGame } from '../contexts/GameContext';

export function useGameActions() {
    const { actionConfigs, timeWindows, debugTimeWindow } = useGame();
    const SECONDS_PER_DAY = 86400;

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
            debugTimeWindow();
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

    // Helper to get human-readable action status
    function getActionStatus(
        actionType: ActionType,
        attributes: TotemAttributes,
        tracking: ActionTracking
    ): string {
        const config = actionConfigs[actionType];
        if (!config || !tracking)  return 'Action not configured';

        const currentTime = Math.floor(Date.now() / 1000);
        
        if (attributes.happiness < config.minHappiness) {
            return `Needs ${config.minHappiness} happiness (current: ${attributes.happiness})`;
        }

        if (config.cooldown > 0) {
            const cooldownRemaining = (tracking.lastUsed + config.cooldown) - currentTime;
            if (cooldownRemaining > 0) {
                const minutes = Math.ceil(cooldownRemaining / 60);
                return `Cooldown: ${minutes} minutes remaining`;
            }
        }

        if (config.maxDaily > 0) {
            const currentDay = Math.floor(currentTime / SECONDS_PER_DAY) * SECONDS_PER_DAY;
            if (currentDay === tracking.dayStartTime && tracking.dailyUses >= config.maxDaily) {
                return `Daily limit (${config.maxDaily}) reached`;
            }
        }

        if (config.useTimeWindows) {
            return canUseInTimeWindow(tracking.lastUsed) 
                ? 'Available in current time window' 
                : 'Wait for next time window';
        }

        return 'Available';
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
        } else if (currentDaySeconds < timeWindows?.window3Start!) {
            // In Window 2 (08:00-16:00)
            return lastUsedDaySeconds < timeWindows?.window2Start! || 
                lastUsedDaySeconds >= timeWindows?.window3Start!;
        } else {
            // In Window 3 (16:00-00:00)
            return lastUsedDaySeconds < timeWindows?.window3Start!;
        }
    }

    return {
        canUseAction,
        getActionStatus,
        actionConfigs,
        timeWindows
    };
}