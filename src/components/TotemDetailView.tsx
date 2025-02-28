import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NFTMetadata, TotemAttributes, Rarity, Species, Color, ActionTracking } from '../types/types';
import { ActionType } from '../types/types';
import { 
    ChevronLeft, 
    ChevronRight, 
    X, 
    Coffee, 
    Heart, 
    Dumbbell,
    Sparkles,
    Clock,
    Coins
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useGame } from '../contexts/GameContext';
import { useTotemGame } from '../hooks/useTotemGame';
import { Edit2 } from 'lucide-react';
import DisplayNameEditor from './DisplayNameEditor';
import ActionEffect from './effects/ActionEffect';
import CelebrationModal from './CelebrationModal';
import { getRarityBadgeColor } from '../utils/totems';

interface TotemDetailViewProps {
    totem: NFTMetadata;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    canUseAction: (
        attributes: TotemAttributes,
        actionType: ActionType,
        tracking: any
    ) => boolean;
}

interface XPProgress {
    type: string;
    progress: number;
    remaining: number;
    nextThreshold: number;
    prestigeLevel: number;
}

const STAGE_THRESHOLDS = [0, 500, 1500, 3500, 7500];
const PRESTIGE_XP_REQUIREMENT = 2500;
const BASE_ELDER_XP = 7500;

const calculatePrestigeLevel = (experience: number): number => {
    if (experience <= BASE_ELDER_XP) return 0;
    return Math.floor((experience - BASE_ELDER_XP) / PRESTIGE_XP_REQUIREMENT);
};

const calculateXPProgress = (attributes: TotemAttributes): XPProgress => {
    const { experience, stage } = attributes;
    
    // For non-Elder stages
    if (stage < 4) { // Remember stage is 0-based
        const nextThreshold = STAGE_THRESHOLDS[stage + 1];
        const currentThreshold = STAGE_THRESHOLDS[stage];
        const progress = ((experience - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
        const remaining = nextThreshold - experience;
        return {
            progress: Math.min(100, progress),
            remaining,
            nextThreshold,
            type: 'stage',
            prestigeLevel: 0
        };
    }
    
    // For Elder stage (Prestige calculations)
    const prestigeLevel = calculatePrestigeLevel(experience);
    const nextPrestigeThreshold = BASE_ELDER_XP + ((prestigeLevel + 1) * PRESTIGE_XP_REQUIREMENT);
    const currentPrestigeThreshold = BASE_ELDER_XP + (prestigeLevel * PRESTIGE_XP_REQUIREMENT);
    const progress = ((experience - currentPrestigeThreshold) / PRESTIGE_XP_REQUIREMENT) * 100;
    const remaining = nextPrestigeThreshold - experience;
    
    return {
        progress: Math.min(100, progress),
        remaining,
        nextThreshold: nextPrestigeThreshold,
        type: 'prestige',
        prestigeLevel
    };
};

const TotemDetailView: React.FC<TotemDetailViewProps> = ({
    totem,
    onClose,
    onPrev,
    onNext
}) => {
    const { totems, updateTotem, updateTotemEvolved, totemBalance } = useUser();
    const { actionConfigs, canUseAction, getActionStatus, getNextAvailableWindow } = useGame();
    const { feed, train, treat, evolve } = useTotemGame();
    const [isLoading, setIsLoading] = useState<ActionType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [showEvolutionCelebration, setShowEvolutionCelebration] = useState(false);
    const [activeEffect, setActiveEffect] = useState<'treat' | 'feed' | 'train' | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    
    const currentTotem = useMemo(() => 
        totems.find(t => t.tokenId === totem.tokenId) ?? totem,
        [totems, totem.tokenId, totem]
    );

    // Action handlers
    const handleAction = async (action: ActionType, handler: () => Promise<void>) => {
        setIsLoading(action);
        setError(null);
        try {
            await handler();

            if (action == ActionType.Evolve) {
                await updateTotemEvolved(totem.tokenId);
                setShowEvolutionCelebration(true);
            }
            else {
                await updateTotem(totem.tokenId, action);
            }
        }
        catch (err) {
            console.error(`Error with ${ActionType[action]}:`, err);
            setError(`Failed to ${ActionType[action].toLowerCase()}. Please try again.`);
        }
        finally {
            setIsLoading(null);
             // Clear the effect after a delay
            setTimeout(() => {
                setActiveEffect(null);
            }, 2000);
        }
    };
    
    const handleTrain = () => {
        setActiveEffect('train');
        return handleAction(ActionType.Train, () => train(totem.tokenId));
    };
    const handleFeed = () => {
        setActiveEffect('feed');
        return handleAction(ActionType.Feed, () => feed(totem.tokenId));
    }
    const handleTreat = () => {
        setActiveEffect('treat');
        return handleAction(ActionType.Treat, () => treat(totem.tokenId));
    }
    const handleEvolve = async () => {
        await handleAction(ActionType.Evolve, () => evolve(totem.tokenId));
    };

    const currentAttributes = currentTotem?.attributes || totem.attributes;
    const currentTrackings = currentTotem?.trackings || totem.trackings;

    const feedTracking = currentTrackings[ActionType.Feed];
    const trainTracking = currentTrackings[ActionType.Train];
    const treatTracking = currentTrackings[ActionType.Treat];

    const canFeed = canUseAction(currentAttributes, ActionType.Feed, feedTracking);
    const canTrain = canUseAction(currentAttributes, ActionType.Train, trainTracking);
    const canTreat = canUseAction(currentAttributes, ActionType.Treat, treatTracking);
    const canEvolve = currentAttributes.experience >= STAGE_THRESHOLDS[currentAttributes.stage + 1];
    const xpProgress = calculateXPProgress(currentAttributes);

    useEffect(() => {
        if (!currentTotem) {
            onClose();
        }
    }, [currentTotem, onClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if the click was outside the dialog
            if (
                dialogRef.current && 
                !dialogRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Add event listeners
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);

        // Cleanup event listeners
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]); // Depend on onClose to avoid stale closure

    const formatTokenCost = (weiAmount: bigint | number): number => {
        // Assuming 18 decimal places (standard for ERC20 tokens)
        const bigIntAmount = BigInt(weiAmount);
        // Divide by 10^18 and convert back to number
        return Number(bigIntAmount / BigInt(10 ** 18));
    };

    // Render action buttons with loading states
    const renderActionButton = (
        type: ActionType, 
        icon: React.ReactNode, 
        label: string, 
        handler: () => Promise<void>,
        canUse: boolean
    ) => {
        const actionCost = formatTokenCost(actionConfigs[type]?.cost || 0);
        const hasEnoughBalance = parseFloat(totemBalance) >= actionCost;
        const hasMinHappiness = currentAttributes.happiness >= (actionConfigs[type]?.minHappiness || 0);
    
        const actionStatus = getActionStatus(
            type, 
            currentAttributes, 
            currentTrackings?.[type] || { lastUsed: 0, dailyUses: 0, dayStartTime: 0 },
            actionConfigs[type]
        );
    
        const isDisabled = !canUse || isLoading !== null || !hasEnoughBalance || !hasMinHappiness;
    
        const getButtonVariant = () => {
            if (isLoading === type) return 'bg-gray-100 dark:bg-gray-700';
            if (isDisabled) return 'bg-gray-100 dark:bg-gray-800 text-gray-400';
            
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
            if (!canUse && actionStatus !== 'Available') {
                return actionStatus;
            }
            return null;
        };
    
        const statusMessage = getStatusMessage();

        return (
            <div className="flex flex-col space-y-2 h-full">
                <button
                    onClick={handler}
                    disabled={isDisabled}
                    className={`
                        p-4 rounded-lg flex flex-col items-center gap-2 w-full
                        transition-all duration-200 ${getButtonVariant()}
                        ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    {isLoading === type ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current" />
                    ) : icon}
                    <span className="text-sm font-medium">{label}</span>
                </button>
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
                            {!canUse && type === ActionType.Feed && 
                                <div>{getNextAvailableWindow(feedTracking!)}</div>
                            }
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const formatDisplayName = (name: any) => {
        // If name is null, undefined, or not a string, return default
        if (name == null || typeof name !== 'string') {
            return 'Set nickname...';
        }
        
        // If name contains only special characters/boxes, treat as empty
        if (/^[\u{FFF0}-\u{FFFF}\u{10FFFF}]+$/u.test(name)) {
            return 'Set nickname...';
        }
    
        // If it's just spaces or invisible characters
        if (!name.trim()) return 'Set nickname...';
    
        // Otherwise show the name with quotes
        return `"${name}"`;
    };

    return (
        <div ref={dialogRef} className="max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {showEvolutionCelebration && (
                <CelebrationModal
                    type="evolution"
                    totem={{
                        name: currentTotem.name,
                        image: currentTotem.image,
                        attributes: currentAttributes
                    }}
                    onClose={() => setShowEvolutionCelebration(false)}
                />
            )}
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-bold truncate">
                        {currentTotem.name || Species[currentAttributes.species]}
                    </h2>
                    {isEditingName ? (
                    <DisplayNameEditor
                        tokenId={BigInt(currentTotem.tokenId)}
                        currentName={currentAttributes.displayName || ''}
                        onClose={async () => {
                            await updateTotem(currentTotem.tokenId, ActionType.None);
                            setIsEditingName(false);
                        }}
                    />
                    ) : (<>
                        <p className="ml-2 text-lg sm:text-md text-gray-400 italic">
                            {formatDisplayName(currentAttributes.displayName || null)}
                        </p>
                        <button
                            onClick={() => setIsEditingName(true)}
                            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                        >
                            <Edit2 size={14} />
                        </button>
                    </>)}
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                    <X size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            {/* Content - Stack on mobile, side-by-side on desktop */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col md:grid md:grid-cols-2 gap-4 p-4 sm:p-6">
                    {/* Left Column - Image and Stats */}
                    <div className="space-y-4">
                        {/* Image - Smaller padding on mobile */}
                        <div className="aspect-square rounded-lg overflow-hidden relative">
                            <img 
                                src={currentTotem.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                alt={currentTotem.name}
                                className="w-full h-full object-cover sticky"
                            />
                            <ActionEffect 
                                action={activeEffect}
                                onComplete={() => setActiveEffect(null)}
                            />
                        </div>

                        {/* Quick Stats - 2 columns on all screens */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Stage', value: `${currentAttributes.stage + 1}/5` },
                                { label: 'Happiness', value: `${currentAttributes.happiness}/100` },
                                { label: 'Affinity', value: totem.affinity },
                                { label: 'Domain', value: totem.domain }
                            ].map(({ label, value }) => (
                                <div 
                                    key={label} 
                                    className="p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{label}</div>
                                    <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column - Details and Actions */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Totem Details */}
                        <div className="space-y-3">
                            {[
                                { label: 'Species', value: Species[currentAttributes.species] },
                                { label: 'Color', value: Color[currentAttributes.color] },
                                { 
                                    label: 'Rarity', 
                                    value: Rarity[currentAttributes.rarity],
                                    render: () => (
                                        <span className={`text-sm font-medium px-2.5 py-1 rounded-full border ${
                                            getRarityBadgeColor(currentAttributes.rarity)
                                        }`}>
                                            {Rarity[currentAttributes.rarity]}
                                        </span>
                                    )
                                },
                                { 
                                    label: 'Status', 
                                    value: currentAttributes.isStaked ? '🔒 Staked' : '🔓 Unstaked' 
                                }
                            ].map(({ label, value, render }) => (
                                <div 
                                    key={label} 
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                                    {render ? render() : (
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {value}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Experience Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    {xpProgress.type === 'prestige' ? 'Prestige Progress' : 'Experience Progress'}
                                </span>
                                <span className="text-gray-900 dark:text-gray-100">
                                    {currentAttributes.experience.toLocaleString()} XP
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className={`rounded-full h-2 transition-all ${
                                        xpProgress.type === 'prestige' 
                                            ? 'bg-purple-600 dark:bg-purple-500'
                                            : 'bg-blue-600 dark:bg-blue-500'
                                    }`}
                                    style={{ width: `${xpProgress.progress}%` }}
                                />
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {xpProgress.type === 'prestige'
                                    ? `${xpProgress.remaining.toLocaleString()} XP to Prestige ${xpProgress.prestigeLevel + 1}`
                                    : `${xpProgress.remaining.toLocaleString()} XP to next stage`}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-2 sm:p-4">
                                {renderActionButton(
                                    ActionType.Treat, 
                                    <Heart size={20} className="sm:w-6 sm:h-6" />,
                                    'Treat', 
                                    handleTreat, 
                                    canTreat
                                )}
                                {renderActionButton(
                                    ActionType.Feed, 
                                    <Coffee size={20} className="sm:w-6 sm:h-6" />, 
                                    'Feed', 
                                    handleFeed, 
                                    canFeed
                                )}
                                {renderActionButton(
                                    ActionType.Train, 
                                    <Dumbbell size={20} className="sm:w-6 sm:h-6" />, 
                                    'Train', 
                                    handleTrain, 
                                    canTrain
                                )}
                            </div>
                        </div>
                        {/* Evolution Button */}
                        {canEvolve && (
                            <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleEvolve}
                                    disabled={isLoading !== null}
                                    className={`
                                        w-full py-2.5 sm:py-3 rounded-lg font-semibold 
                                        flex items-center justify-center gap-2
                                        text-sm sm:text-base
                                        transition-all duration-300
                                        ${isLoading === ActionType.Evolve
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'
                                        }
                                    `}
                                >
                                    {isLoading === ActionType.Evolve ? (
                                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-current" />
                                    ) : (
                                        <Sparkles size={20} />
                                    )}
                                    Evolve to Next Stage
                                </button>
                            </div>
                        )}
                        {/* Error Display */}
                        {error && (
                            <div className="p-2 sm:p-4 text-red-600 text-center text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-4 flex justify-between">
                <button
                    onClick={onPrev}
                    className="
                        px-3 sm:px-4 py-2 
                        text-gray-600 dark:text-gray-300 
                        hover:bg-gray-100 dark:hover:bg-gray-800 
                        rounded-lg 
                        flex items-center gap-1 sm:gap-2
                        text-sm sm:text-base
                        transition-all duration-300
                    "
                >
                    <ChevronLeft size={20} />
                    Previous <span className="hidden sm:inline">Totem</span>
                </button>
                <button
                    onClick={onNext}
                    className="
                        px-3 sm:px-4 py-2 
                        text-gray-600 dark:text-gray-300 
                        hover:bg-gray-100 dark:hover:bg-gray-800 
                        rounded-lg 
                        flex items-center gap-1 sm:gap-2
                        text-sm sm:text-base
                        transition-all duration-300
                    "
                >
                    Next <span className="hidden sm:inline">Totem</span> 
                    <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );
};

export default TotemDetailView;