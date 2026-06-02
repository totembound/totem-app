import React from 'react';
import { Coffee, Heart, Dumbbell, Sparkles, Clock, Loader2, Drumstick } from 'lucide-react';
import { TotemAttributes, ActionType, ActionTracking, ActionConfig } from '../types/types';
import { CURRENCY_NAMES, HUNGER_TRAIN_MIN, HUNGER_HAPPINESS_PENALTY_BELOW } from '../config/constants';
import { TotemTraits } from '../config/traits';
import { resolveTraitBonusesForTotem } from '../utils/traitBonuses';
import { deriveHunger, useFocusNow } from '../utils/hunger';

interface TotemActionBarProps {
    attributes: TotemAttributes;
    actionConfigs: Record<ActionType, ActionConfig>;
    actionTracking: Partial<Record<ActionType, ActionTracking>>;
    essenceBalance: number;
    /** Trait IDs on the acting totem — drives the effective-cost preview. */
    traits?: TotemTraits | null;
    isTotemOnExpedition?: boolean;
    busyReason?: string;
    canUseAction: (
        attributes: TotemAttributes,
        actionType: ActionType,
        tracking: ActionTracking | undefined
    ) => boolean;
    getActionStatus: (
        actionType: ActionType,
        attributes: TotemAttributes,
        tracking: ActionTracking,
        config: ActionConfig
    ) => string;
    getNextFeedWindow: () => string;
    isLoading: ActionType | null;
    onTreat: () => void;
    onFeed: () => void;
    onTrain: () => void;
    onEvolve: () => void;
    canEvolve: boolean;
}

const TotemActionBar: React.FC<TotemActionBarProps> = ({
    attributes,
    actionConfigs,
    actionTracking,
    essenceBalance,
    traits = null,
    isTotemOnExpedition = false,
    busyReason,
    canUseAction,
    getActionStatus,
    getNextFeedWindow,
    isLoading,
    onTreat,
    onFeed,
    onTrain,
    onEvolve,
    canEvolve,
}) => {
    // Hunger decays ~1/hour; derive the live value so the Train gate reacts
    // without a refetch. Below HUNGER_TRAIN_MIN the totem is too hungry to train.
    const now = useFocusNow();
    const currentHunger = deriveHunger(attributes, now);

    // Map ActionType → resolver scope. Returns base + effective cost so we can
    // strike through the original when a trait (e.g. Thrifty) discounts it.
    const ACTION_SCOPE: Record<number, 'feed' | 'train' | 'treat' | null> = {
        [ActionType.Feed]: 'feed',
        [ActionType.Train]: 'train',
        [ActionType.Treat]: 'treat',
        [ActionType.Evolve]: null,
        [ActionType.None]: null,
    };
    const getEffectiveCost = (type: ActionType, baseCost: number) => {
        const scope = ACTION_SCOPE[type];
        if (!scope || baseCost <= 0) return { baseCost, effectiveCost: baseCost, discounted: false };
        const bonuses = resolveTraitBonusesForTotem(traits, { action: scope });
        const effectiveCost = Math.floor(baseCost * bonuses.essenceCostMultiplier);
        return { baseCost, effectiveCost, discounted: effectiveCost < baseCost };
    };

    // Get busy status message
    const expeditionStatusMessage = isTotemOnExpedition
        ? (busyReason || 'On Expedition')
        : '';

    // Render a single action button
    const renderActionButton = (
        type: ActionType,
        icon: React.ReactNode,
        label: string,
        handler: () => void,
        canUse: boolean
    ) => {
        const { baseCost, effectiveCost, discounted } = getEffectiveCost(type, actionConfigs[type]?.cost || 0);
        const actionCost = effectiveCost;
        const hasEnoughBalance = essenceBalance >= actionCost;
        const hasMinHappiness = attributes.happiness >= (actionConfigs[type]?.minHappiness || 0);
        // Train is blocked while the totem is too hungry (feed restores it).
        const tooHungry = type === ActionType.Train && currentHunger < HUNGER_TRAIN_MIN;
        // "Cranky" band: training is allowed but costs 2× happiness (server-side).
        const cranky = type === ActionType.Train && !tooHungry && currentHunger < HUNGER_HAPPINESS_PENALTY_BELOW;
    
        // Safe access to tracking data with nullish default
        const tracking = actionTracking[type];

        // Get action status from cooldowns API (via getActionStatus)
        // Use default tracking if none exists to allow getActionStatus to check cooldowns
        const defaultTracking = { lastUsed: 0, dailyUses: 0, dayStartTime: 0 };
        const actionStatus = getActionStatus(
            type,
            attributes,
            tracking || defaultTracking,
            actionConfigs[type]
        );

        // Use canUse from cooldowns API - this properly checks API-based cooldowns
        const isDisabled = isTotemOnExpedition || !canUse || isLoading !== null || !hasEnoughBalance || !hasMinHappiness || tooHungry;
    
        const getButtonVariant = () => {
            if (isLoading === type) return 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500';
            if (isDisabled) return 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
            
            switch (type) {
                case ActionType.Treat: return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50';
                case ActionType.Feed: return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50';
                case ActionType.Train: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50';
                default: return 'bg-gray-100 dark:bg-gray-800';
            }
        };
    
        // Get the status message to display
        const getStatusMessage = () => {
            if (isTotemOnExpedition) {
                return expeditionStatusMessage;
            }
            if (!hasEnoughBalance) {
                return `Requires ${actionCost} ${CURRENCY_NAMES.SOFT}`;
            }
            if (tooHungry) {
                return 'Too hungry — feed first';
            }
            if (!hasMinHappiness) {
                return `Needs ${actionConfigs[type]?.minHappiness} happiness`;
            }
            if (!canUse && actionStatus !== 'Available') {
                return actionStatus;
            }
            // Informational (button stays enabled): hungry totems lose 2× happiness from training.
            if (cranky) {
                return '2× happiness loss while hungry';
            }
            return null;
        };
    
        const statusMessage = getStatusMessage();

        return (
            <div className="flex flex-col h-full border-0 ring-0 outline-none">
                {/* Button container with fixed height */}
                <div className="flex-grow border-0 ring-0 outline-none">
                    <button
                        onClick={handler}
                        disabled={isDisabled}
                        className={`
                            p-2 rounded-xl flex flex-col items-center gap-2 w-full
                            transition-all duration-200 ${getButtonVariant()}
                            ${isDisabled ? 'cursor-not-allowed shadow-none' : 'cursor-pointer shadow-sm hover:shadow-md'}
                            border-0 outline-none focus:outline-none
                            ${!isDisabled ? 'focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-900' : ''}
                        `}
                    >
                        {isLoading === type ? (
                            <Loader2 size={20} className="sm:w-6 sm:h-6 animate-spin" />
                        ) : icon}
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">{label}</span>
                            <span className="text-xs flex items-center gap-1">
                                <Sparkles size={12} className="text-yellow-500" />
                                {discounted && (
                                    <span className="text-stone-400 dark:text-stone-500 line-through mr-0.5">{baseCost}</span>
                                )}
                                <span className={discounted ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>{actionCost}</span>
                                <span>{CURRENCY_NAMES.SOFT}</span>
                            </span>
                        </div>
                    </button>
                </div>
                
                {/* Status message container - fixed height for alignment across columns */}
                <div className="h-12 sm:h-14 flex items-start justify-center mt-1 sm:mt-2">
                    {statusMessage && (
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">
                            <div className="flex flex-col items-center text-center justify-center gap-0.5">
                                {!hasEnoughBalance ? (
                                    <>
                                        <Sparkles size={14} className="text-yellow-500 sm:w-4 sm:h-4" />
                                        {statusMessage}
                                    </>
                                ) : tooHungry ? (
                                    <>
                                        <Drumstick size={14} className="flex-shrink-0 text-red-500 sm:w-4 sm:h-4" />
                                        {statusMessage}
                                    </>
                                ) : cranky ? (
                                    <>
                                        <Drumstick size={14} className="flex-shrink-0 text-amber-500 sm:w-4 sm:h-4" />
                                        {statusMessage}
                                    </>
                                ) : (
                                    <>
                                        <Clock size={14} className="flex-shrink-0 sm:w-4 sm:h-4" />
                                        {statusMessage}
                                    </>
                                )}
                                {/* Show next feed window for Feed action when on cooldown */}
                                {type === ActionType.Feed && !canUse && !isTotemOnExpedition && (
                                    <div className="opacity-75 whitespace-nowrap">{getNextFeedWindow()}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Determine if the Totem can use each action
    const canTreat = canUseAction(attributes, ActionType.Treat, actionTracking[ActionType.Treat]);
    const canFeed = canUseAction(attributes, ActionType.Feed, actionTracking[ActionType.Feed]);
    const canTrain = canUseAction(attributes, ActionType.Train, actionTracking[ActionType.Train]);
    
    return (
        <div className="space-y-4">
            {/* Action Buttons with consistent heights */}
            <div className="grid grid-cols-3 gap-3 [&>*]:border-0 [&>*]:outline-none [&>*]:ring-0">
                {renderActionButton(
                    ActionType.Treat, 
                    <Heart size={20} className="sm:w-6 sm:h-6" />,
                    'Treat', 
                    onTreat, 
                    canTreat
                )}
                {renderActionButton(
                    ActionType.Feed, 
                    <Coffee size={20} className="sm:w-6 sm:h-6" />, 
                    'Feed', 
                    onFeed, 
                    canFeed
                )}
                {renderActionButton(
                    ActionType.Train, 
                    <Dumbbell size={20} className="sm:w-6 sm:h-6" />, 
                    'Train', 
                    onTrain, 
                    canTrain
                )}
            </div>
            
            {/* Evolution Button */}
            {canEvolve && (() => {
                const evolveMinHappiness = actionConfigs[ActionType.Evolve]?.minHappiness || 30;
                const hasEnoughHappiness = attributes.happiness >= evolveMinHappiness;
                const isEvolveDisabled = isTotemOnExpedition || isLoading !== null || !hasEnoughHappiness;
                return (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onEvolve}
                            disabled={isEvolveDisabled}
                            className={`
                                w-full py-3 px-4 rounded-xl font-semibold
                                flex items-center justify-center gap-2
                                transition-all duration-300
                                ${isEvolveDisabled
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 transform hover:scale-[1.02] active:scale-100'
                                }
                                shadow-sm hover:shadow-md
                            `}
                        >
                            {isLoading === ActionType.Evolve ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Sparkles size={20} />
                            )}
                            Evolve to Next Stage
                        </button>
                        {!hasEnoughHappiness && !isTotemOnExpedition && (
                            <p className="text-xs text-center text-amber-600 dark:text-amber-400 mt-2">
                                Needs {evolveMinHappiness} happiness to evolve (current: {attributes.happiness})
                            </p>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

export default TotemActionBar;