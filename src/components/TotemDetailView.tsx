import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TotemData, ActionType, TotemAttributes, ActionTracking, ActionConfig } from '../types/types';
import { useGame } from '../contexts/GameContext';
import { useUser } from '../contexts/UserContext';
import { useAchievements } from '../contexts/AchievementsContext';
import { useTotemGameApi } from '../hooks/useTotemGameApi';
import CelebrationModal from './CelebrationModal';
import TotemDetailHeader from './TotemDetailHeader';
import TotemImageSection from './TotemImageSection';
import TotemStatsPanel from './TotemStatsPanel';
import TotemDetailsPanel from './TotemDetailsPanel';
import TotemActionBar from './TotemActionBar';
import ExperienceEffect from './effects/ExperienceEffect';
import { STAGE_THRESHOLDS, BASE_ELDER_XP, PRESTIGE_XP_REQUIREMENT } from '../config/constants';
import { getTotemImageUrl, getStageName, getStageDescription } from '../utils/species';
import { Heart, TrendingUp } from 'lucide-react';

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
    ) => void;
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
    const { essenceBalance: essenceBalanceStr, setEssenceBalance } = useUser();
    const gameApi = useTotemGameApi();
    const { isTotemAvailable, expeditionState, fetchTotemCooldowns, setTotemCooldowns, actionConfigs } = useGame();
    const { incrementAchievementProgress, refreshAchievements } = useAchievements();

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

    const essenceBalance = Number(essenceBalanceStr) || 0;

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
                setEssenceBalance(result.newEssenceBalance);
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

            // Refresh achievement state from API when milestones were unlocked
            if (result.achievementsUnlocked) {
                refreshAchievements();
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

    // Compute XP progress for the HUD bar (switches to prestige at max stage)
    const isPrestige = currentAttributes.stage >= 4;
    const prestigeLevel = useMemo(() => {
        if (!isPrestige || currentAttributes.experience <= BASE_ELDER_XP) return 0;
        return Math.floor((currentAttributes.experience - BASE_ELDER_XP) / PRESTIGE_XP_REQUIREMENT);
    }, [isPrestige, currentAttributes.experience]);

    const xpProgressPercent = useMemo(() => {
        if (isPrestige) {
            const currentPrestigeThreshold = BASE_ELDER_XP + (prestigeLevel * PRESTIGE_XP_REQUIREMENT);
            return Math.min(100, ((currentAttributes.experience - currentPrestigeThreshold) / PRESTIGE_XP_REQUIREMENT) * 100);
        }
        const currentThreshold = STAGE_THRESHOLDS[currentAttributes.stage];
        const nextThreshold = STAGE_THRESHOLDS[currentAttributes.stage + 1];
        if (nextThreshold === currentThreshold) return 100;
        return Math.min(100, ((currentAttributes.experience - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
    }, [currentAttributes.experience, currentAttributes.stage, isPrestige, prestigeLevel]);

    const xpProgressLabel = useMemo(() => {
        if (isPrestige) return `P${prestigeLevel} · ${Math.round(xpProgressPercent)}%`;
        return `${Math.round(xpProgressPercent)}%`;
    }, [isPrestige, prestigeLevel, xpProgressPercent]);

    return (
        <div
            ref={dialogRef}
            className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-full"
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
                    onUpdateTotemAttributes?.(totem.id, { nickname });
                }}
                onPrev={onPrev}
                onNext={onNext}
                totalTotems={totalTotems}
                currentIndex={currentIndex}
            />

            {/* Content area - whole area scrolls as one block when content exceeds
                the modal cap. Previously had independent column scrolling at md+
                (md:overflow-hidden on this container, md:overflow-y-auto on each
                column, md:h-full on the grid) which required a fixed parent
                height. Switching to single-scroll lets the modal size to content
                on tall windows without leaving stretched whitespace inside columns. */}
            <div className="flex-1 min-h-0 overflow-y-auto pb-16 sm:pb-0 overscroll-contain">
                <div className="flex flex-col md:grid md:grid-cols-2">
                    {/* Left Column - Image, HUD, Actions */}
                    <div className="flex-shrink-0">
                        {/* Image - swipe handlers ONLY here, not on scroll container */}
                        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                            <TotemImageSection
                                species={currentAttributes.species}
                                rarity={currentAttributes.rarity}
                                stage={evolvedTotemData?.stage ?? currentAttributes.stage}
                                prestigeLevel={currentAttributes.prestigeLevel}
                                imageUrl={evolvedTotemData?.image ?? totem.image}
                                activeEffect={activeEffect}
                                onEffectComplete={() => setActiveEffect(null)}
                                isOnExpedition={tokenIsOnExpedition}
                                sanctum={currentAttributes.sanctum}
                            />
                        </div>

                        {showExpEffect && (
                            <ExperienceEffect
                                exp={trainExp}
                                onComplete={() => setShowExpEffect(false)}
                            />
                        )}

                        {/* Vital Stats HUD - Happiness + XP always visible between image and actions */}
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                {/* Happiness gauge */}
                                <div className="flex items-center gap-2 flex-1">
                                    <Heart
                                        size={16}
                                        className={`${currentAttributes.happiness >= 30 ? 'text-pink-500' : 'text-red-500 animate-pulse'}`}
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-0.5">
                                            <span className="text-gray-500 dark:text-gray-400">Happiness</span>
                                            <span className={`font-semibold ${currentAttributes.happiness < 30 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {currentAttributes.happiness}/100
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div
                                                className={`rounded-full h-1.5 transition-all duration-500 ${currentAttributes.happiness >= 30 ? 'bg-pink-500' : 'bg-red-500'}`}
                                                style={{ width: `${currentAttributes.happiness}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* XP gauge — switches to purple prestige bar at max stage */}
                                <div className="flex items-center gap-2 flex-1">
                                    <TrendingUp size={16} className={isPrestige ? 'text-purple-500' : 'text-blue-500'} />
                                    <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-0.5">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {isPrestige ? 'Prestige' : 'XP'}
                                            </span>
                                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                {xpProgressLabel}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div
                                                className={`rounded-full h-1.5 transition-all duration-500 ${isPrestige ? 'bg-purple-500' : 'bg-blue-500'}`}
                                                style={{ width: `${xpProgressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Warning if happiness too low for evolve */}
                            {canEvolve && currentAttributes.happiness < 30 && (
                                <div className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 text-center">
                                    Need 30 happiness to evolve (current: {currentAttributes.happiness})
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-1 px-2 sm:px-4 py-2">
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
                                busyReason={currentAttributes.sanctum?.onMission ? 'On Mission' : currentAttributes.sanctum?.seated ? 'Seated' : undefined}
                            />

                            {/* Error Display */}
                            {error && (
                                <div className="mt-3 p-2 text-red-600 text-center text-sm bg-red-100 dark:bg-red-900/20 rounded-lg">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Stats/Details */}
                    <div className="px-2 sm:px-4 py-2 border-t border-gray-200 dark:border-gray-700 md:border-t-0 md:border-l">
                        {/* Brief Intro - Stage-specific description */}
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
                        <div className="pb-4 sm:pb-2">
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
                                    sanctum={currentAttributes.sanctum}
                                    isOnExpedition={tokenIsOnExpedition}
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