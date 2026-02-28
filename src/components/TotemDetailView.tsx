import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TotemData, ActionType, TotemAttributes, ActionTracking, ActionConfig } from '../types/types';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from '../contexts/AchievementsContext';
import { useTotemGameApi } from '../hooks/useTotemGameApi';
import CelebrationModal from './CelebrationModal';
import TotemDetailHeader from './TotemDetailHeader';
import TotemImageSection from './TotemImageSection';
import TotemStatsPanel from './TotemStatsPanel';
import TotemDetailsPanel from './TotemDetailsPanel';
import TotemActionBar from './TotemActionBar';
import ExperienceEffect from './effects/ExperienceEffect';
import { STAGE_THRESHOLDS } from '../config/constants';
import { getTotemImageUrl, getStageName, getStageDescription } from '../utils/species';
interface TotemDetailViewProps {
    totem: TotemData;
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
    onUpdateTotemAttributes?: (
        totemId: string,
        updates: {
            experience?: number;
            happiness?: number;
            stage?: number;
            nickname?: string | null;
            displayName?: string;
            strength?: number;
            agility?: number;
            wisdom?: number;
        }
    ) => void; // Update local totem state (SPA pattern)
}

const TotemDetailView: React.FC<TotemDetailViewProps> = ({
    totem,
    onClose,
    onPrev,
    onNext,
    totalTotems,
    currentIndex,
    canUseAction: externalCanUseAction,
    onUpdateTotemAttributes,
}) => {
    const { user, updateEssence } = useAuth();
    const gameApi = useTotemGameApi();
    const { isTotemAvailable, expeditionState, fetchTotemCooldowns, setTotemCooldowns, actionConfigs } = useGame();
    const { incrementAchievementProgress } = useAchievements();

    const [isLoading, setIsLoading] = useState<ActionType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showEvolutionCelebration, setShowEvolutionCelebration] = useState(false);
    const [evolvedTotemData, setEvolvedTotemData] = useState<{
        image: string;
        displayName: string;
        stage: number;
    } | null>(null);
    const [activeEffect, setActiveEffect] = useState<'treat' | 'feed' | 'train' | null>(null);
    const [activeTab, setActiveTab] = useState<'stats' | 'details'>('stats');
    const [showExpEffect, setShowExpEffect] = useState(false);
    const [cooldowns, setCooldowns] = useState<Record<string, { onCooldown: boolean; readyAt: Date | null; remainingMs: number }>>({});
    const [, setTick] = useState(0); // Force re-render for countdown timer
    const dialogRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    // Get stage-specific name and description (memoized)
    const stageName = useMemo(() => {
        return getStageName(
            totem.attributes.species,
            totem.attributes.color,
            evolvedTotemData?.stage ?? totem.attributes.stage
        );
    }, [totem.attributes.species, totem.attributes.color, totem.attributes.stage, evolvedTotemData?.stage]);

    const stageDescription = useMemo(() => {
        return getStageDescription(
            totem.attributes.species,
            totem.attributes.color,
            evolvedTotemData?.stage ?? totem.attributes.stage
        );
    }, [totem.attributes.species, totem.attributes.color, totem.attributes.stage, evolvedTotemData?.stage]);

    const essenceBalance = user?.currencies?.essence ?? 0;

    // Check cooldowns to determine if action can be used - dynamically checks readyAt
    const canUseAction = useCallback((
        attributes: TotemAttributes,
        actionType: ActionType,
        tracking: ActionTracking | undefined
    ): boolean => {
        if (externalCanUseAction) return externalCanUseAction(attributes, actionType, tracking);
        const actionName = ActionType[actionType].toLowerCase() as 'feed' | 'train' | 'treat';
        const cooldown = cooldowns[actionName];
        if (cooldown?.onCooldown) {
            // Check if cooldown has actually expired based on readyAt
            if (cooldown.readyAt && new Date(cooldown.readyAt).getTime() <= Date.now()) {
                return true; // Cooldown expired, action is available
            }
            return false;
        }
        return true;
    }, [cooldowns, externalCanUseAction]);

    // Get action status message - computes remaining time dynamically from readyAt
    const getActionStatus = useCallback((
        actionType: ActionType,
        _attributes: TotemAttributes,
        _tracking: ActionTracking,
        _config: ActionConfig
    ): string => {
        const actionName = ActionType[actionType].toLowerCase() as 'feed' | 'train' | 'treat';
        const cooldown = cooldowns[actionName];

        if (cooldown?.onCooldown && cooldown.readyAt) {
            const remainingMs = new Date(cooldown.readyAt).getTime() - Date.now();
            if (remainingMs > 0) {
                const hours = Math.floor(remainingMs / (1000 * 60 * 60));
                const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                return `Ready in ${hours}h ${mins}m`;
            }
        }
        return 'Available';
    }, [cooldowns]);

    // Get next available feeding window (shows when next window starts in local time)
    const getNextFeedWindow = useCallback((): string => {
        const now = new Date();
        const utcHour = now.getUTCHours();

        // Calculate next window start time in UTC
        let nextWindowUTC: number;
        if (utcHour < 8) {
            nextWindowUTC = 8; // Next is Window 2 at 08:00 UTC
        } else if (utcHour < 16) {
            nextWindowUTC = 16; // Next is Window 3 at 16:00 UTC
        } else {
            nextWindowUTC = 24; // Next is Window 1 at 00:00 UTC (tomorrow)
        }

        // Convert to local time for display
        const nextWindow = new Date(now);
        nextWindow.setUTCHours(nextWindowUTC % 24, 0, 0, 0);
        if (nextWindowUTC === 24) {
            nextWindow.setUTCDate(nextWindow.getUTCDate() + 1);
        }

        const localHour = nextWindow.getHours();
        const ampm = localHour >= 12 ? 'PM' : 'AM';
        const displayHour = localHour % 12 || 12;

        return `Next window: ${displayHour}:00 ${ampm}`;
    }, []);


    // Load cooldowns from context cache (fetches from API only on first access per totem)
    useEffect(() => {
        if (!totem.id) return;
        let cancelled = false;
        fetchTotemCooldowns(totem.id).then(result => {
            if (!cancelled && result) {
                setCooldowns({ feed: result.feed, train: result.train, treat: result.treat });
            }
        });
        return () => { cancelled = true; };
    }, [totem.id, fetchTotemCooldowns]);

    // Re-render every 60s so getActionStatus/canUseAction recompute from readyAt.
    // Only runs while an active cooldown exists. Display is hours+minutes so 60s is sufficient.
    useEffect(() => {
        const hasActiveCooldown = Object.values(cooldowns).some(
            cd => cd.onCooldown && cd.readyAt && new Date(cd.readyAt).getTime() > Date.now()
        );
        if (!hasActiveCooldown) return;

        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, [cooldowns]);

     // Check if totem is on expedition
     const tokenIsOnExpedition = !isTotemAvailable(totem.id);
     // Find expedition end time if totem is on expedition
    const expeditionEndTime = useMemo(() => {
        if (!tokenIsOnExpedition) return 0;
        
        // Find which expedition this totem is part of
        const activeExpedition = expeditionState.userExpeditions.find(exp => 
            !exp.completed && exp.totemIds.some(id => id.toString() === totem.id)
        );
        
        return activeExpedition ? activeExpedition.endTime : 0;
    }, [tokenIsOnExpedition, expeditionState.userExpeditions, totem.id]);

    // Calculate local cooldown state after an action succeeds (avoids extra API call)
    const updateCooldownsLocally = useCallback((action: ActionType, _result: any) => {
        setCooldowns(prev => {
            const updated = { ...prev };
            const now = Date.now();

            if (action === ActionType.Treat) {
                // Treat cooldown from game config
                const TREAT_COOLDOWN_MS = actionConfigs[ActionType.Treat].cooldown * 1000;
                updated.treat = {
                    onCooldown: true,
                    readyAt: new Date(now + TREAT_COOLDOWN_MS),
                    remainingMs: TREAT_COOLDOWN_MS,
                };
            } else if (action === ActionType.Feed) {
                // Feed uses 8hr windows - locked out until next window
                const utcHour = new Date().getUTCHours();
                let nextWindowStart: number;
                if (utcHour < 8) nextWindowStart = 8;
                else if (utcHour < 16) nextWindowStart = 16;
                else nextWindowStart = 24;

                const nextWindow = new Date();
                nextWindow.setUTCHours(nextWindowStart % 24, 0, 0, 0);
                if (nextWindowStart === 24) nextWindow.setUTCDate(nextWindow.getUTCDate() + 1);

                const remainingMs = nextWindow.getTime() - now;
                updated.feed = {
                    onCooldown: true,
                    readyAt: nextWindow,
                    remainingMs: Math.max(0, remainingMs),
                };
            }
            // Train has no cooldown - leave unchanged (already false)
            // Evolve has no cooldown

            // Update context cache (single source of truth)
            setTotemCooldowns(totem.id, updated as any);

            return updated;
        });
    }, [totem.id, setTotemCooldowns, actionConfigs]);

    // Action handler - calls REST API and updates local state (SPA pattern)
    const handleAction = async (action: ActionType, apiMethod: () => Promise<any>) => {
        setIsLoading(action);
        setError(null);
        setShowExpEffect(false); // Clear any existing animation
        try {
            const result = await apiMethod();
            if (!result.success) {
                throw new Error(result.error || 'Action failed');
            }

            // Update local totem state with API response (SPA pattern)
            if (onUpdateTotemAttributes) {
                const updates: {
                    experience?: number;
                    happiness?: number;
                    stage?: number;
                    displayName?: string;
                    strength?: number;
                    agility?: number;
                    wisdom?: number;
                } = {};

                // Use newExperience from API response
                if (result.newExperience !== undefined) {
                    updates.experience = result.newExperience;
                }

                // Apply happiness changes from statChanges
                // statChanges.happiness is the NEW value (already calculated by API)
                // statChanges.happinessChange is the delta (e.g., -10 for train)
                if (result.statChanges?.happiness !== undefined) {
                    updates.happiness = result.statChanges.happiness;
                }

                // Handle evolution stage change
                if (action === ActionType.Evolve && result.newStage !== undefined) {
                    updates.stage = result.newStage;
                    // Compute display name from species cache (per-color stage name)
                    updates.displayName = getStageName(
                        totem.attributes.species,
                        totem.attributes.color,
                        result.newStage
                    );
                    // Apply stat boosts from evolution
                    if (result.statBoosts) {
                        const attrs = totem.attributes;
                        if (result.statBoosts.strength) {
                            updates.strength = Math.min(100, (attrs.strength || 5) + result.statBoosts.strength);
                        }
                        if (result.statBoosts.agility) {
                            updates.agility = Math.min(100, (attrs.agility || 5) + result.statBoosts.agility);
                        }
                        if (result.statBoosts.wisdom) {
                            updates.wisdom = Math.min(100, (attrs.wisdom || 5) + result.statBoosts.wisdom);
                        }
                        if (result.statBoosts.happiness) {
                            updates.happiness = Math.min(100, (attrs.happiness || 50) + result.statBoosts.happiness);
                        }
                    }
                }

                onUpdateTotemAttributes(totem.id, updates);
            }

            // Update cooldowns locally from action configs (no extra API call)
            updateCooldownsLocally(action, result);

            if (action === ActionType.Evolve && result.newStage !== undefined) {
                // Compute the new image URL immediately using species config
                const newImage = getTotemImageUrl(
                    totem.attributes.species,
                    totem.attributes.color,
                    result.newStage
                );
                // Store evolved data for celebration modal and immediate display
                setEvolvedTotemData({
                    image: newImage,
                    displayName: getStageName(
                        totem.attributes.species,
                        totem.attributes.color,
                        result.newStage
                    ),
                    stage: result.newStage
                });
                setShowEvolutionCelebration(true);
            }

            if (result.xpGained) {
                setShowExpEffect(true);
                // Auto-hide XP animation after 2 seconds
                setTimeout(() => setShowExpEffect(false), 2000);
            }

            // Update Essence balance directly from action response (no extra API call)
            if (result.newEssenceBalance !== undefined) {
                updateEssence(result.newEssenceBalance);
            }

            // Optimistic achievement progress update (no API call)
            // So tutorial wizard checkmarks appear immediately after actions
            const ACTION_ACHIEVEMENT_MAP: Partial<Record<ActionType, string>> = {
                [ActionType.Feed]: 'ach_feed-progression',
                [ActionType.Train]: 'ach_train-progression',
                [ActionType.Treat]: 'ach_treat-progression',
                [ActionType.Evolve]: 'ach_evolution-progression',
            };
            const achievementId = ACTION_ACHIEVEMENT_MAP[action];
            if (achievementId) {
                incrementAchievementProgress(achievementId);
            }
        } catch (err) {
            console.error(`Error with ${ActionType[action]}:`, err);
            const errorMessage = err instanceof Error ? err.message : `Failed to ${ActionType[action].toLowerCase()}. Please try again.`;
            setError(errorMessage);

            // If the error mentions happiness, update local state so button disables correctly
            // Backend format: "Need 30 happiness (have 25)"
            const happinessMatch = errorMessage.match(/have\s+(\d+)/i) || errorMessage.match(/current:\s*(\d+)/i);
            if (happinessMatch && onUpdateTotemAttributes) {
                const currentHappiness = parseInt(happinessMatch[1], 10);
                onUpdateTotemAttributes(totem.id, { happiness: currentHappiness });
            }
        } finally {
            setIsLoading(null);
            setTimeout(() => {
                setActiveEffect(null);
            }, 1000);
        }
    };

    const handleTrain = () => {
        setActiveEffect('train');
        handleAction(ActionType.Train, () => gameApi.train(totem.id));
    };

    const handleFeed = () => {
        setActiveEffect('feed');
        handleAction(ActionType.Feed, () => gameApi.feed(totem.id));
    };

    const handleTreat = () => {
        setActiveEffect('treat');
        handleAction(ActionType.Treat, () => gameApi.treat(totem.id));
    };

    const handleEvolve = () => {
        handleAction(ActionType.Evolve, () => gameApi.evolve(totem.id));
    };

    const currentAttributes = totem.attributes;
    const currentTrackings = totem.trackings || {};

    const canEvolve = currentAttributes.experience >= STAGE_THRESHOLDS[currentAttributes.stage + 1];
    const trainExp = Number(actionConfigs[ActionType.Train]?.experienceGain);

    useEffect(() => {
        if (!totem) {
            onClose();
        }
    }, [totem, onClose]);

    // Clear error when totem changes (dialog reopened)
    useEffect(() => {
        setError(null);
    }, [totem.id]);

    // Swipe gesture handlers for prev/next navigation
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
        touchStartRef.current = null;

        // Only trigger if horizontal swipe is dominant and exceeds threshold
        if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX > 0) {
                onPrev();
            } else {
                onNext();
            }
        }
    }, [onPrev, onNext]);

    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]);

    return (
        <div 
            ref={dialogRef} 
            className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-full"
        >
            {showEvolutionCelebration && evolvedTotemData && (
                <CelebrationModal
                    type="evolution"
                    totem={{
                        name: totem.name,
                        image: evolvedTotemData.image,
                        attributes: {
                            ...currentAttributes,
                            displayName: evolvedTotemData.displayName,
                            stage: evolvedTotemData.stage
                        }
                    }}
                    onClose={() => {
                        setShowEvolutionCelebration(false);
                        setEvolvedTotemData(null);
                    }}
                />
            )}
            
            {/* Header - Show displayName (e.g., "Brown Pup") as title, nickname + mobile nav below */}
            <TotemDetailHeader
                totemId={totem.id}
                name={evolvedTotemData?.displayName || totem.displayName || stageName || totem.name || "Unnamed Totem"}
                displayName={currentAttributes.nickname || ''}
                rarity={currentAttributes.rarity}
                onClose={onClose}
                onNicknameUpdate={(nickname) => {
                    // Update local state so UI reflects change immediately
                    onUpdateTotemAttributes?.(totem.id, { nickname });
                }}
                onPrev={onPrev}
                onNext={onNext}
                totalTotems={totalTotems}
                currentIndex={currentIndex}
            />

            {/* Content - Stack on mobile, side-by-side on desktop. Swipe left/right to navigate totems. */}
            <div
                className="flex-1 overflow-y-auto pb-20 sm:pb-0"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex flex-col md:grid md:grid-cols-2">
                    {/* Left Column - Image and Actions */}
                    <div className="flex-shrink-0">
                        {/* Habitat Background with Image */}
                        <TotemImageSection
                            species={currentAttributes.species}
                            rarity={currentAttributes.rarity}
                            stage={evolvedTotemData?.stage ?? currentAttributes.stage}
                            prestigeLevel={currentAttributes.prestigeLevel}
                            imageUrl={evolvedTotemData?.image ?? totem.image}
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

                        {/* Action Buttons */}
                        <div className="mt-1 md:mt-2 px-2 sm:px-4 py-2">
                            <TotemActionBar
                                attributes={currentAttributes}
                                actionConfigs={actionConfigs}
                                actionTracking={currentTrackings}
                                essenceBalance={essenceBalance}
                                canUseAction={canUseAction}
                                getActionStatus={getActionStatus}
                                getNextFeedWindow={getNextFeedWindow}
                                isLoading={isLoading}
                                onTreat={handleTreat}
                                onFeed={handleFeed}
                                onTrain={handleTrain}
                                onEvolve={handleEvolve}
                                canEvolve={canEvolve}
                                isTotemOnExpedition={tokenIsOnExpedition}
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
                    <div className="px-2 sm:px-4 py-2 border-t border-gray-200 dark:border-gray-700 md:border-t-0 md:border-l">
                        {/* Brief Intro - Stage-specific description from IPFS metadata */}
                        <div className="mb-2 min-h-10">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {currentAttributes.nickname && <><span className="font-medium">Known as "{currentAttributes.nickname}"</span> by its companions. </>}
                                {stageDescription || `A ${totem.name} at stage ${currentAttributes.stage + 1}.`}
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
                        <div className="overflow-y-auto pb-4 sm:pb-2">
                            {activeTab === 'stats' ? (
                                <TotemStatsPanel attributes={currentAttributes} />
                            ) : (
                                <TotemDetailsPanel
                                    stage={currentAttributes.stage}
                                    species={currentAttributes.species}
                                    rarity={currentAttributes.rarity}
                                    color={currentAttributes.color}
                                    affinity={totem.affinity}
                                    domain={totem.domain}
                                    isStaked={currentAttributes.isStaked}
                                    isOnExpedition={tokenIsOnExpedition}
                                    expeditionEndTime={expeditionEndTime}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TotemDetailView;