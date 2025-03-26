import React from 'react';
import { Coffee, Heart, Dumbbell, Sparkles, Clock, Coins, Loader2 } from 'lucide-react';
import { TotemAttributes, ActionType, ActionTracking, ActionConfig } from '../types/types';

interface TotemActionBarProps {
    attributes: TotemAttributes;
    actionConfigs: Record<ActionType, ActionConfig>;
    actionTracking: Partial<Record<ActionType, ActionTracking>>;
    totemBalance: string;
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
    getNextAvailableWindow: (tracking: ActionTracking) => string;
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
    totemBalance,
    canUseAction,
    getActionStatus,
    getNextAvailableWindow,
    isLoading,
    onTreat,
    onFeed,
    onTrain,
    onEvolve,
    canEvolve
}) => {
    const formatTokenCost = (weiAmount: bigint | number): number => {
        // Assuming 18 decimal places (standard for ERC20 tokens)
        const bigIntAmount = BigInt(weiAmount);
        // Divide by 10^18 and convert back to number
        return Number(bigIntAmount / BigInt(10 ** 18));
    };

    // Render a single action button
    const renderActionButton = (
        type: ActionType, 
        icon: React.ReactNode, 
        label: string, 
        handler: () => void,
        canUse: boolean
    ) => {
        const actionCost = formatTokenCost(actionConfigs[type]?.cost || 0);
        const hasEnoughBalance = parseFloat(totemBalance) >= actionCost;
        const hasMinHappiness = attributes.happiness >= (actionConfigs[type]?.minHappiness || 0);
    
        // Safe access to tracking data with nullish default
        const tracking = actionTracking[type];
        
        // Safely call getActionStatus with null check
        const actionStatus = tracking ? getActionStatus(
            type, 
            attributes, 
            tracking, 
            actionConfigs[type]
        ) : 'No tracking data';
    
        const isDisabled = !canUse || isLoading !== null || !hasEnoughBalance || !hasMinHappiness;
    
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
            if (!hasEnoughBalance) {
                return `Requires ${actionCost} TOTEM`;
            }
            if (!hasMinHappiness) {
                return `Needs ${actionConfigs[type]?.minHappiness} happiness`;
            }
            if (!canUse && actionStatus !== 'Available') {
                return actionStatus;
            }
            return null;
        };
    
        const statusMessage = getStatusMessage();

        return (
            <div className="flex flex-col h-full">
                {/* Button container with fixed height */}
                <div className="flex-grow">
                    <button
                        onClick={handler}
                        disabled={isDisabled}
                        className={`
                            p-2 rounded-xl flex flex-col items-center gap-2 w-full
                            transition-all duration-200 ${getButtonVariant()}
                            ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                            shadow-sm hover:shadow-md
                        `}
                    >
                        {isLoading === type ? (
                            <Loader2 size={20} className="sm:w-6 sm:h-6 animate-spin" />
                        ) : icon}
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">{label}</span>
                            <span className="text-xs flex items-center gap-1">
                                <Coins size={12} /> {actionCost} TOTEM
                            </span>
                        </div>
                    </button>
                </div>
                
                {/* Fixed height message container */}
                <div className="h-14 flex items-start justify-center mt-2">
                    {statusMessage && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            <div className="flex flex-col items-center text-center justify-center gap-1">
                                {!hasEnoughBalance ? (
                                    <>
                                        <Coins size={16} className="text-yellow-500" />
                                        {statusMessage}
                                    </>
                                ) : (
                                    <>
                                        <Clock size={16} className="flex-shrink-0" />
                                        {statusMessage}
                                    </>
                                )}
                                {!canUse && type === ActionType.Feed && tracking && 
                                    <div>{getNextAvailableWindow(tracking)}</div>
                                }
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
            <div className="grid grid-cols-3 gap-3">
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
            {canEvolve && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onEvolve}
                        disabled={isLoading !== null}
                        className={`
                            w-full py-3 px-4 rounded-xl font-semibold 
                            flex items-center justify-center gap-2
                            transition-all duration-300
                            ${isLoading === ActionType.Evolve
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
                </div>
            )}
        </div>
    );
};

export default TotemActionBar;