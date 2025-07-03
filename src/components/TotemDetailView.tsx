import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NFTMetadata, ActionType, TotemAttributes, ActionTracking, RateLimitError } from '../types/types';
import { useUser } from '../contexts/UserContext';
import { useGame } from '../contexts/GameContext';
import { useTransactionService } from '../hooks/useTransactionService';
import CelebrationModal from './CelebrationModal';
import { useAchievements } from '../contexts/AchievementsContext';
// Import modular components
import TotemDetailHeader from './TotemDetailHeader';
import TotemImageSection from './TotemImageSection';
import TotemStatsPanel from './TotemStatsPanel';
import TotemDetailsPanel from './TotemDetailsPanel';
import TotemActionBar from './TotemActionBar';
import TotemNavigation from './TotemNavigation';
import ExperienceEffect from './effects/ExperienceEffect';
import { STAGE_THRESHOLDS } from '../config/constants';

interface TotemDetailViewProps {
    totem: NFTMetadata;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    totalTotems?: number;
    currentIndex?: number;
    canUseAction?: (
        attributes: TotemAttributes,
        actionType: ActionType,
        tracking: ActionTracking | undefined
    ) => boolean;
}

const TotemDetailView: React.FC<TotemDetailViewProps> = ({
    totem,
    onClose,
    onPrev,
    onNext,
    totalTotems,
    currentIndex,
    canUseAction: externalCanUseAction,
}) => {
    const { totems, updateTotem, updateTotemEvolved, totemBalance, isGaslessEnabled, handleRateLimitError } = useUser();
    const { actionConfigs, canUseAction: gameCanUseAction, getActionStatus, getNextAvailableWindow, isTotemAvailable, expeditionState } = useGame();
    const [isLoading, setIsLoading] = useState<ActionType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showEvolutionCelebration, setShowEvolutionCelebration] = useState(false);
    const [activeEffect, setActiveEffect] = useState<'treat' | 'feed' | 'train' | null>(null);
    const [activeTab, setActiveTab] = useState<'stats' | 'details'>('stats');
    const [showExpEffect, setShowExpEffect] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const { refreshAchievements } = useAchievements();

    // Use either the externally provided canUseAction function or the one from the game context
    const canUseAction = externalCanUseAction || gameCanUseAction;
    
    const txService = useTransactionService({
        gaslessEnabled: isGaslessEnabled,
        waitForConfirmation: true
    });
    
    const currentTotem = useMemo(() => 
        totems.find(t => t.tokenId === totem.tokenId) ?? totem,
        [totems, totem.tokenId, totem]
    );

     // Check if totem is on expedition
     const tokenIsOnExpedition = !isTotemAvailable(currentTotem.id);
     // Find expedition end time if totem is on expedition
    const expeditionEndTime = useMemo(() => {
        if (!tokenIsOnExpedition) return 0;
        
        // Find which expedition this totem is part of
        const activeExpedition = expeditionState.userExpeditions.find(exp => 
            !exp.completed && exp.totemIds.some(id => id.toString() === currentTotem.id)
        );
        
        return activeExpedition ? activeExpedition.endTime : 0;
    }, [tokenIsOnExpedition, expeditionState.userExpeditions, currentTotem.id]);

    // Action handlers
    const handleAction = async (action: ActionType, handler: () => Promise<any>) => {
        setIsLoading(action);
        setError(null);
        try {
            const result = await handler();
            if (!result) {
                throw new Error('Transaction failed');
            }

            if (action == ActionType.Evolve) {
                await updateTotemEvolved(totem.tokenId);
                setShowEvolutionCelebration(true);
            }
            else {
                await updateTotem(totem.tokenId, action);
            }
            refreshAchievements();
        }
        catch (err) {
            console.error(`Error with ${ActionType[action]}:`, err);
            
            if (err instanceof RateLimitError) {
                handleRateLimitError(err);
            } else {
                setError(`Failed to ${ActionType[action].toLowerCase()}. Please try again.`);
            }
        }
        finally {
            setIsLoading(null);
             // Clear the effect after a delay
            setTimeout(() => {
                setActiveEffect(null);
            }, 1000);
        }
    };

    const handleTrain = () => {
        if (!txService) throw new Error('Transaction service not initialized');
        handleAction(ActionType.Train, async () => {
            setActiveEffect('train');
            const tx = await txService.train(totem.tokenId);
            setShowExpEffect(true);
            return tx;
        });
    };

    const handleFeed = () => {
        if (!txService) throw new Error('Transaction service not initialized');
        handleAction(ActionType.Feed, async () => {
            setActiveEffect('feed');
            return await txService.feed(totem.tokenId);
        });
    }

    const handleTreat = () => {
        if (!txService) throw new Error('Transaction service not initialized');
        handleAction(ActionType.Treat, async () => {
            setActiveEffect('treat');
            return await txService.treat(totem.tokenId);
        });
    }

    const handleEvolve = async () => {
        if (!txService) throw new Error('Transaction service not initialized');
        handleAction(ActionType.Evolve, async () => {
            return await txService.evolveTotem(totem.tokenId);
        });
    };

    const currentAttributes = currentTotem?.attributes || totem.attributes;
    const currentTrackings = currentTotem?.trackings || {};

    const canEvolve = currentAttributes.experience >= STAGE_THRESHOLDS[currentAttributes.stage + 1];
    const trainExp = Number(actionConfigs[ActionType.Train]?.experienceGain);

    useEffect(() => {
        if (!currentTotem) {
            onClose();
        }
    }, [currentTotem, onClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]);

    return (
        <div 
            ref={dialogRef} 
            className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-full"
        >
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
            <TotemDetailHeader 
                tokenId={currentTotem.tokenId}
                name={currentTotem.name || "Unnamed Totem"}
                displayName={currentAttributes.displayName}
                rarity={currentAttributes.rarity}
                onClose={onClose}
                onUpdateTotem={updateTotem}
            />

            {/* Content - Stack on mobile, side-by-side on desktop */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col md:grid md:grid-cols-2">
                    {/* Left Column - Image and Actions */}
                    <div className="flex-shrink-0">
                        {/* Habitat Background with Image */}
                        <TotemImageSection 
                            species={currentAttributes.species}
                            rarity={currentAttributes.rarity}
                            stage={currentAttributes.stage}
                            prestigeLevel={currentAttributes.prestigeLevel}
                            imageUrl={currentTotem.image}
                            activeEffect={activeEffect}
                            onEffectComplete={() => setActiveEffect(null)}
                            isOnExpedition={tokenIsOnExpedition}
                            expeditionEndTime={expeditionEndTime}
                        />

                        {showExpEffect && (
                            <ExperienceEffect 
                                exp={trainExp}
                                onComplete={() => setShowExpEffect(false)}
                            />
                        )}

                        {/* Mobile Navigation - Appears only on mobile, scrolls with content */}
                        <div className="block md:hidden">
                            <TotemNavigation 
                                onPrev={onPrev} 
                                onNext={onNext}
                                totalTotems={totalTotems}
                                currentIndex={currentIndex}
                                mobileView={true}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-1 md:mt-2 px-2 sm:px-4 py-2">
                            <TotemActionBar 
                                attributes={currentAttributes}
                                actionConfigs={actionConfigs}
                                actionTracking={currentTrackings}
                                totemBalance={totemBalance}
                                canUseAction={canUseAction}
                                getActionStatus={getActionStatus}
                                getNextAvailableWindow={getNextAvailableWindow}
                                isLoading={isLoading}
                                onTreat={handleTreat}
                                onFeed={handleFeed}
                                onTrain={handleTrain}
                                onEvolve={handleEvolve}
                                canEvolve={canEvolve}
                                isTotemOnExpedition={tokenIsOnExpedition}
                                expeditionEndTime={expeditionEndTime}
                            />
                            
                            {/* Error Display */}
                            {error && (
                                <div className="mt-3 p-2 text-red-600 text-center text-sm bg-red-100 dark:bg-red-900/20 rounded-lg">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Details and Statistics */}
                    <div className="px-2 sm:px-4 py-2 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
                        {/* Description */}
                        <div className="mb-2 min-h-10">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {/* Description from the selected species */}
                                {currentTotem.description}
                                {currentAttributes.displayName && ` Known as "${currentAttributes.displayName}" by its companions.`}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3">
                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === 'stats'
                                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                Stats
                            </button>
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === 'details'
                                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                Details
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="overflow-y-auto pb-2">
                            {activeTab === 'stats' ? (
                                <TotemStatsPanel attributes={currentAttributes} />
                            ) : (
                                <TotemDetailsPanel 
                                    stage={currentAttributes.stage}
                                    species={currentAttributes.species}
                                    rarity={currentAttributes.rarity}
                                    color={currentAttributes.color}
                                    affinity={currentTotem.affinity}
                                    domain={currentTotem.domain}
                                    isStaked={currentAttributes.isStaked}
                                    isOnExpedition={tokenIsOnExpedition}
                                    expeditionEndTime={expeditionEndTime}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

             {/* Desktop Navigation - Only visible on desktop, fixed at bottom */}
            <div className="hidden md:block flex-shrink-0">
                <TotemNavigation 
                    onPrev={onPrev} 
                    onNext={onNext}
                    totalTotems={totalTotems}
                    currentIndex={currentIndex}
                />
            </div>
        </div>
    );
};

export default TotemDetailView;