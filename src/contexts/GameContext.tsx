// contexts/GameContext.tsx
import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { useUser } from './UserContext';
import { useAuth } from './AuthContext';
import { ActionType, ActionConfig, TotemAttributes, ActionTracking, ChallengeState, ChallengeInfo, ChallengeMasteryInfo, ChallengeStatus, TotemData, StreakStatus, WeeklyStatus, RewardsState, RuneBalances, ExpeditionState, ExpeditionRewardsData } from '../types/types';
import type { DailyQuestSet, QuestProgressUpdate, QuestRunesAwarded } from '../types/quests';
import { CooldownStatus } from '../hooks/useTotemGameApi';
import { getTotemStage } from '../utils/totems';
import apiClient from '../services/ApiClient';
import notificationService from '../services/NotificationService';
import { ACTION_CONFIGS, TIME_WINDOWS, GAME_PARAMS } from '../config/game-config';
import { isAvailableForAction } from '../utils/totem-availability';
import { getMasteryConfig, getMasteryTier, getMasteryTierByIndex } from '../config/config-loader';

// Build the per-challenge mastery block. Prefers the backend `mastery` block;
// falls back to a client-derived tier from completionCount so the frame renders
// correctly before the backend ships the block (and for veteran/backfilled data).
function buildMasteryInfo(challenge: any): ChallengeMasteryInfo {
    if (challenge?.mastery) {
        const m = challenge.mastery;
        return {
            tier: m.tier,
            tierName: m.tierName,
            completions: m.completions,
            nextTierAt: m.nextTierAt ?? null,
            completionsToNext: m.completionsToNext ?? null,
            xpMultiplier: m.xpMultiplier,
            difficultyUnlocked: !!m.difficultyUnlocked,
            maxDifficulty: m.maxDifficulty ?? 3,
            preferredDifficulty: m.preferredDifficulty ?? null,
        };
    }

    // Fallback: derive from completionCount using the static mastery config.
    const masteryConfig = getMasteryConfig();
    const completions = challenge?.progress?.completionCount ?? 0;
    const tier = getMasteryTier(completions);
    const nextTier = getMasteryTierByIndex(tier.tier + 1);
    return {
        tier: tier.tier,
        tierName: tier.name,
        completions,
        nextTierAt: nextTier?.minCompletions ?? null,
        completionsToNext: nextTier ? Math.max(0, nextTier.minCompletions - completions) : null,
        xpMultiplier: tier.xpMult,
        difficultyUnlocked: tier.tier >= masteryConfig.raiseTier,
        maxDifficulty: masteryConfig.maxDifficulty,
        preferredDifficulty: null,
    };
}

// Pure reducer: apply quest progress deltas to a quest set.
// Lives at module scope so action callbacks can use it without ordering hazards
// (useCallbacks declared before mergeQuestProgress would otherwise close over undef).
function applyQuestProgressUpdates(
    prev: DailyQuestSet | null,
    updates: QuestProgressUpdate[] | undefined,
): DailyQuestSet | null {
    if (!prev) return prev;
    if (!updates || !updates.length) return prev;
    const bySlot: Record<number, number> = {};
    updates.forEach(u => { bySlot[u.slot] = u.newProgress; });
    const nextQuests = prev.quests.map(q => {
        const np = bySlot[q.slot];
        if (np == null) return q;
        const progress = Math.min(np, q.goal);
        return { ...q, progress, completed: progress >= q.goal };
    });
    const allClaimedOrComplete = nextQuests.every(q => q.claimed || q.progress >= q.goal);
    return {
        ...prev,
        quests: nextQuests,
        bonus: { ...prev.bonus, unlocked: allClaimedOrComplete },
    };
}

export interface GameContextType {
    actionConfigs: Record<ActionType, ActionConfig>;
    timeWindows: {
        window1Start: number;
        window2Start: number;
        window3Start: number;
    };
    gameParams: { signupReward: number; mintPrice: number };
    error: string | null;

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
    getEligibleTotems: (challengeId: string) => TotemData[];
    canAttemptChallenge: (challengeId: string, totemId: string) => boolean;
    getChallengeStatus: (challengeId: string) => string;
    completeChallenge: (challengeId: string, tokenId: string, score: number, difficulty?: number) => Promise<{ xpEarned: number; happinessEarned: number; essenceEarned: number; tierUp: { name: string; xp: number; lootBoxId: string | null } | null } | void>;
    // Transient "just tiered up" signal — set on a mastery tier-up, auto-cleared
    // shortly after (setTimeout one-shot) so the list card can play its glow.
    recentTierUpChallengeId: string | null;
    // Loot item id granted by the most recent mastery tier-up, pending an
    // in-place reveal on the Challenges page (cleared once surfaced).
    pendingMasteryLootId: string | null;
    clearPendingMasteryLoot: () => void;

    // rewards
    rewardsState: RewardsState;
    getUserStreak: () => Promise<StreakStatus | undefined>;
    claimDailyReward: () => Promise<boolean>;
    claimWeeklyReward: () => Promise<boolean>;
    purchaseProtection: (type: 'daily' | 'weekly', quantity?: number) => Promise<boolean>;
    refreshRewardStatus: () => Promise<void>;

    setNickname: (totemId: string, newName: string) => Promise<void>;

    runeBalances: RuneBalances;
    getUserRuneBalances: () => Promise<void>;

    // New expedition-related properties
    expeditionState: ExpeditionState;
    refreshExpeditions: () => Promise<void>;
    startExpedition: (expeditionId: string, totemIds: string[]) => Promise<boolean>;
    claimExpeditionRewards: (expeditionId: string) => Promise<boolean>;
    claimCouncilMission: (totemId: string) => Promise<MissionClaimResult | null>;
    isTotemAvailable: (totemId: string) => boolean;
    activeExpeditionEffect: ExpeditionRewardsData | null;
    showExpeditionEffect: (data: ExpeditionRewardsData) => void;
    hideExpeditionEffect: () => void;

    // Loot box system
    lootItems: LootItem[];
    fetchLootItems: () => Promise<void>;
    claimLootItem: (lootItemId: string, options?: { speciesId?: number }) => Promise<unknown>;

    // Totem cooldown cache (single source of truth)
    getTotemCooldowns: (totemId: string) => CooldownStatus | null;
    setTotemCooldowns: (totemId: string, cooldowns: CooldownStatus) => void;
    fetchTotemCooldowns: (totemId: string) => Promise<CooldownStatus | null>;

    // Daily Quests
    dailyQuests: DailyQuestSet | null;
    dailyQuestsLoading: boolean;
    dailyQuestsError: string | null;
    refreshDailyQuests: (force?: boolean) => Promise<void>;
    claimAllQuests: () => Promise<boolean>;
    mergeQuestProgress: (updates: QuestProgressUpdate[] | undefined) => void;
    dailyQuestWizardVisible: boolean;
    setDailyQuestWizardVisible: (visible: boolean) => void;
    lastQuestBonusRunes: QuestRunesAwarded | null;
}

export interface MissionClaimResult {
    missionName: string;
    xp: number;
    runesGained: { lesser: number; greater: number; ancient: number };
}

export interface LootItem {
    id: string;
    boxId: string;
    source: string;
    status: string;
    grantedAt: string;
    box: {
        id: string;
        name: string;
        description: string;
        icon: string;
        rarity: string;
        type: string;
        config: {
            rarityId?: number;
            minAmount?: number;
            maxAmount?: number;
            userChooses: string[];
            randomized: string[];
        };
    };
}

// Module-level dedup for loot items fetch (prevents StrictMode double-fire)
let lootFetchPromise: Promise<void> | null = null;

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
    actionConfigs: ACTION_CONFIGS,
    timeWindows: TIME_WINDOWS,
    gameParams: GAME_PARAMS,
    error: null,
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
    recentTierUpChallengeId: null,
    pendingMasteryLootId: null,
    clearPendingMasteryLoot: () => {},
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
    refreshRewardStatus: async () => {},
    setNickname: async() => {},
    runeBalances: {
        lesser: 0,
        greater: 0,
        ancient: 0
      },
      getUserRuneBalances: async () => {},
      expeditionState: {
        expeditions: {},
        userExpeditions: [],
        loading: false,
        error: null
      },
      refreshExpeditions: async () => {},
      startExpedition: async () => false,
      claimExpeditionRewards: async () => false,
      claimCouncilMission: async () => null,
      isTotemAvailable: () => false,
      activeExpeditionEffect: null,
      showExpeditionEffect: () => undefined,
      hideExpeditionEffect: () => undefined,
      lootItems: [],
      fetchLootItems: async () => {},
      claimLootItem: async () => undefined,
      getTotemCooldowns: () => null,
      setTotemCooldowns: () => {},
      fetchTotemCooldowns: async () => null,
      dailyQuests: null,
      dailyQuestsLoading: false,
      dailyQuestsError: null,
      refreshDailyQuests: async () => {},
      claimAllQuests: async () => false,
      mergeQuestProgress: () => {},
      dailyQuestWizardVisible: true,
      setDailyQuestWizardVisible: () => {},
      lastQuestBonusRunes: null,
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { address, totems, updateBalances, updateTotem: _updateTotem, fetchTotems, updateTotemNickname, setEssenceBalance, updateTotemAttributes } = useUser();
    const [actionConfigs] = useState<Record<ActionType, ActionConfig>>(ACTION_CONFIGS);
    const [timeWindows] = useState(TIME_WINDOWS);
    const [gameParams] = useState(GAME_PARAMS);
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

    // Web2: Transaction service not used in REST API mode

    const [runeBalances, setRuneBalances] = useState<RuneBalances>({ lesser: 0, greater: 0, ancient: 0 });
      
    const [expeditionState, setExpeditionState] = useState<ExpeditionState>({
        expeditions: {},
        userExpeditions: [],
        loading: false,
        error: null
    });

    const [activeExpeditionEffect, setActiveExpeditionEffect] = useState<ExpeditionRewardsData | null>(null);

    const [dailyQuests, setDailyQuests] = useState<DailyQuestSet | null>(null);
    const [dailyQuestsLoading, setDailyQuestsLoading] = useState<boolean>(false);
    const [dailyQuestsError, setDailyQuestsError] = useState<string | null>(null);
    const [lastQuestBonusRunes, setLastQuestBonusRunes] = useState<QuestRunesAwarded | null>(null);
    const dailyQuestsLoadedDateRef = useRef<string | null>(null);
    const [dailyQuestWizardVisible, setDailyQuestWizardVisibleState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        const todayUTC = new Date().toISOString().slice(0, 10);
        return localStorage.getItem('dq_wizard_dismissed_for') !== todayUTC;
    });
    const setDailyQuestWizardVisible = useCallback((visible: boolean) => {
        if (typeof window !== 'undefined') {
            const todayUTC = new Date().toISOString().slice(0, 10);
            if (visible) localStorage.removeItem('dq_wizard_dismissed_for');
            else localStorage.setItem('dq_wizard_dismissed_for', todayUTC);
        }
        setDailyQuestWizardVisibleState(visible);
    }, []);
    const [lootItems, setLootItems] = useState<LootItem[]>([]);

    // Mastery tier-up surfacing: a transient glow signal for the list card and a
    // pending loot id for the in-place reveal on the Challenges page.
    const [recentTierUpChallengeId, setRecentTierUpChallengeId] = useState<string | null>(null);
    const [pendingMasteryLootId, setPendingMasteryLootId] = useState<string | null>(null);
    const tierUpGlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearPendingMasteryLoot = useCallback(() => setPendingMasteryLootId(null), []);
    // One-shot clear for the glow signal (NOT polling) — cancelled on unmount.
    useEffect(() => () => {
        if (tierUpGlowTimerRef.current) clearTimeout(tierUpGlowTimerRef.current);
    }, []);

    // Per-totem cooldown cache - persists across navigation, single source of truth
    const cooldownCacheRef = useRef<Record<string, CooldownStatus>>({});
    const cooldownFetchRef = useRef<Record<string, Promise<CooldownStatus | null>>>({});

    const getTotemCooldowns = useCallback((totemId: string): CooldownStatus | null => {
        return cooldownCacheRef.current[totemId] || null;
    }, []);

    const setTotemCooldowns = useCallback((totemId: string, cooldowns: CooldownStatus) => {
        cooldownCacheRef.current[totemId] = cooldowns;
    }, []);

    const fetchTotemCooldowns = useCallback(async (totemId: string): Promise<CooldownStatus | null> => {
        // Return cached if available
        if (cooldownCacheRef.current[totemId]) {
            return cooldownCacheRef.current[totemId];
        }
        // Dedup: return in-flight promise for same totem
        if (totemId in cooldownFetchRef.current) {
            return cooldownFetchRef.current[totemId];
        }
        // Fetch from API and cache
        const promise = (async () => {
            try {
                const response = await apiClient.getCooldowns(totemId);
                if (response.success && response.data) {
                    const { cooldowns } = response.data;
                    const status: CooldownStatus = {
                        feed: {
                            onCooldown: cooldowns.feed.onCooldown,
                            readyAt: cooldowns.feed.readyAt ? new Date(cooldowns.feed.readyAt) : null,
                            remainingMs: cooldowns.feed.remainingMs,
                        },
                        train: {
                            onCooldown: cooldowns.train.onCooldown,
                            readyAt: cooldowns.train.readyAt ? new Date(cooldowns.train.readyAt) : null,
                            remainingMs: cooldowns.train.remainingMs,
                        },
                        treat: {
                            onCooldown: cooldowns.treat.onCooldown,
                            readyAt: cooldowns.treat.readyAt ? new Date(cooldowns.treat.readyAt) : null,
                            remainingMs: cooldowns.treat.remainingMs,
                        },
                    };
                    cooldownCacheRef.current[totemId] = status;
                    return status;
                }
            } catch { /* silently fail */ }
            return null;
        })();
        cooldownFetchRef.current[totemId] = promise;
        promise.finally(() => { delete cooldownFetchRef.current[totemId]; });
        return promise;
    }, []);

    const challengesLoadedRef = useRef(false);

    const loadChallenges = useCallback(async () => {
        // Web2: Use REST API instead of smart contracts
        if (!apiClient.isAuthenticated()) return;

        // SPA cache: only fetch once per session, updates happen client-side.
        // Set ref BEFORE await to prevent StrictMode / concurrent double-fires.
        if (challengesLoadedRef.current) return;
        challengesLoadedRef.current = true;

        console.log('loading challenges');

        try {
            setChallengeState(prev => ({ ...prev, loading: true, error: null }));

            const response = await apiClient.getChallenges();

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Failed to load challenges');
            }

            // Build challenge state from API response
            const challenges: Record<string, ChallengeInfo> = {};
            const userStatus: Record<string, ChallengeStatus> = {};

            // Handle both array format and object with challenges property
            const challengeList = Array.isArray(response.data)
                ? response.data
                : response.data.challenges || [];

            challengeList.forEach((challenge: any) => {
                const id = challenge.id;

                challenges[id] = {
                    id,
                    name: challenge.name,
                    description: challenge.description,
                    challengeType: challenge.challengeType || challenge.type,
                    attribute: challenge.attribute || challenge.affinity,
                    requirements: challenge.requirements || { stage: 0, strength: 0, agility: 0, wisdom: 0 },
                    maxDailyAttempts: challenge.maxDailyAttempts || 3,
                    maxScore: challenge.maxScore || 100,
                    enabled: challenge.enabled !== false,
                    // Prefer the backend mastery block; fall back to a client-derived
                    // tier from completionCount so the frame renders before the backend ships.
                    mastery: buildMasteryInfo(challenge),
                };

                userStatus[id] = {
                    lastAttemptTime: challenge.progress?.lastAttemptAt
                        ? new Date(challenge.progress.lastAttemptAt).getTime() / 1000
                        : 0,
                    dailyAttempts: challenge.daily?.attemptsToday || 0,
                    attemptsRemaining: challenge.daily?.attemptsRemaining ?? challenge.maxDailyAttempts ?? 3,
                    highScore: challenge.progress?.highScore || challenge.userStatus?.highScore || 0,
                    totalAttempts: challenge.progress?.totalAttempts || challenge.userStatus?.totalAttempts || 0,
                    totalScore: challenge.progress?.totalXpEarned || challenge.userStatus?.totalScore || 0
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
            challengesLoadedRef.current = false; // allow retry on error
            setChallengeState(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to load challenges'
            }));
        }
    }, []);

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

    // Get eligible totems for a challenge (stat/stage requirements only)
    // Availability (expedition, council mission) is checked separately via isTotemAvailable
    const getEligibleTotems = useCallback((challengeId: string) => {
        // Web2: Use plain string IDs instead of hashed IDs
        const challenge = challengeState.challenges[challengeId];
        if (!challenge) return [];

        return totems
            .filter(totem => {
                const reqs = challenge.requirements;
                return totem.attributes.stage >= Number(reqs.stage) &&
                       totem.attributes.strength >= Number(reqs.strength) &&
                       totem.attributes.agility >= Number(reqs.agility) &&
                       totem.attributes.wisdom >= Number(reqs.wisdom);
            });
    }, [challengeState, totems]);

    // Get user-friendly status message
    const getChallengeStatus = useCallback((challengeId: string) => {
        // Web2: Use plain string IDs instead of hashed IDs
        const challenge = challengeState.challenges[challengeId];
        const status = challengeState.userStatus[challengeId];

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
        score: number,
        difficulty?: number
    ) => {
        // Web2: Use REST API instead of smart contracts
        const challenge = challengeState.challenges[challengeId];

        if (!challenge) throw new Error('Challenge not found');
        if (!challenge.enabled) throw new Error('Challenge disabled');

        const response = await apiClient.completeChallenge(challengeId, tokenId, score, difficulty);

        if (!response.success) {
            throw new Error(response.error?.message || 'Failed to complete challenge');
        }

        // Update Essence balance inline (no extra /user/profile call)
        if (response.data?.newEssenceBalance != null) {
            setEssenceBalance(response.data.newEssenceBalance);
        }

        // Update client-side challenge state from response (no re-fetch needed)
        const p = response.data?.progress;
        const masteryData = response.data?.mastery;
        if (p) {
            setChallengeState(prev => {
                const prevChallenge = prev.challenges[challengeId];
                return {
                    ...prev,
                    // Merge the updated mastery block onto the challenge so the frame/badge re-render.
                    challenges: masteryData && prevChallenge
                        ? {
                            ...prev.challenges,
                            [challengeId]: {
                                ...prevChallenge,
                                mastery: {
                                    ...(prevChallenge.mastery as ChallengeMasteryInfo | undefined),
                                    tier: masteryData.tier,
                                    tierName: masteryData.tierName,
                                    completions: masteryData.completions,
                                    nextTierAt: masteryData.nextTierAt ?? null,
                                    completionsToNext: masteryData.completionsToNext ?? null,
                                    xpMultiplier: masteryData.xpMultiplier,
                                    difficultyUnlocked: !!masteryData.difficultyUnlocked,
                                    maxDifficulty: masteryData.maxDifficulty ?? 3,
                                    preferredDifficulty: masteryData.preferredDifficulty ?? null,
                                },
                            },
                        }
                        : prev.challenges,
                    userStatus: {
                        ...prev.userStatus,
                        [challengeId]: {
                            ...prev.userStatus[challengeId],
                            lastAttemptTime: Date.now() / 1000,
                            dailyAttempts: p.attemptsToday,
                            attemptsRemaining: p.attemptsRemaining,
                            highScore: p.highScore,
                            totalAttempts: p.totalAttempts,
                            totalScore: p.totalXpEarned,
                        },
                    },
                };
            });
        }

        // Push any unlocked achievements to the notifications bell
        notificationService.processAchievementsFromResponse(response.data?.achievements);

        // Apply daily-quest progress deltas from the response (e.g. Iron Trial / Swift Trial / Wise Trial)
        setDailyQuests(prev => applyQuestProgressUpdates(prev, response.data?.quests));

        // Mastery tier-up: fire the celebratory notification; the granted Essence loot
        // box persists server-side as unclaimed and is revealed via the existing
        // LootBoxesCard / LootClaimModal flow — refresh the cache so it surfaces.
        const tierUp = response.data?.tierUp;
        if (tierUp) {
            notificationService.showChallengeTierUp({
                challengeName: response.data?.challengeName || challenge.name,
                tierName: tierUp.name,
                tier: tierUp.to,
                xp: tierUp.xp,
                boxName: tierUp.lootBox?.boxId,
            });

            // Transient "just tiered up" signal so the list card's frame plays its
            // one-shot glow. Cleared by a setTimeout one-shot (no polling).
            setRecentTierUpChallengeId(challengeId);
            if (tierUpGlowTimerRef.current) clearTimeout(tierUpGlowTimerRef.current);
            tierUpGlowTimerRef.current = setTimeout(() => {
                setRecentTierUpChallengeId(prev => (prev === challengeId ? null : prev));
                tierUpGlowTimerRef.current = null;
            }, 4000);

            if (tierUp.lootBox) {
                // Refresh the unclaimed-loot cache so the box surfaces in LootBoxesCard.
                // Inlined (not via fetchLootItems) to avoid a use-before-declaration hazard.
                try {
                    const lootResponse = await apiClient.getLootItems();
                    if (lootResponse.success && lootResponse.data) {
                        setLootItems(lootResponse.data.items || []);
                    }
                } catch (err) {
                    console.error('Error refreshing loot after tier-up:', err);
                }
                // Queue the in-place reveal — the Challenges page opens LootClaimModal
                // for this box once the challenge dialog closes.
                setPendingMasteryLootId(tierUp.lootBox.id);
            }
        }

        // Return the actual rewards so the UI animation reflects trait bonuses
        // (Clever / Mentor aura / Persistent / Merchant's Eye) rather than the
        // client-side score-only estimate. tierUp lets the completion view show
        // the mastery bonus + loot box alongside the run rewards.
        return {
            xpEarned: response.data?.xpEarned ?? 0,
            happinessEarned: response.data?.happinessEarned ?? 0,
            essenceEarned: response.data?.essenceEarned ?? 0,
            tierUp: tierUp
                ? { name: tierUp.name, xp: tierUp.xp, lootBoxId: tierUp.lootBox?.boxId ?? null }
                : null,
        };
    }, [challengeState]);

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
                : 'Next time window';
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

    // Single API call to fetch both daily and weekly reward status
    const refreshAllRewardStatus = async (): Promise<{ streak?: StreakStatus; weekly?: WeeklyStatus }> => {
        try {
            console.log('[GameContext] Fetching reward status from API...');
            const response = await apiClient.getRewardStatus();

            if (!response.success || !response.data) {
                console.error("[GameContext] Error fetching reward status:", response.error);
                return {};
            }

            const { daily, weekly } = response.data;
            console.log('[GameContext] API response - canClaim:', daily.canClaim, 'streakDays:', daily.streakDays);

            const streakStatus: StreakStatus = {
                streakDays: daily.streakDays || 0,
                canClaimToday: daily.canClaim || false,
                bestStreak: daily.bestStreak || 0,
                nextClaimTime: daily.nextClaimTime ? new Date(daily.nextClaimTime).getTime() / 1000 : 0,
                isProtected: daily.isProtected || false,
                protectionCharges: daily.protectionCharges || 0
            };

            const weeklyStatus: WeeklyStatus = {
                weeklyStreak: weekly.weeklyStreak || 0,
                canClaimWeekly: weekly.canClaim || false,
                bestWeeklyStreak: weekly.bestStreak || 0,
                nextClaimTime: weekly.nextClaimTime ? new Date(weekly.nextClaimTime).getTime() / 1000 : 0,
                isProtected: weekly.isProtected || false,
                protectionCharges: weekly.protectionCharges || 0
            };

            const hasWeeklyUnlocked = weekly.isUnlocked || false;

            console.log('[GameContext] Updating rewardsState with canClaimToday:', streakStatus.canClaimToday);
            setRewardsState(prev => ({
                ...prev,
                streakStatus,
                weeklyStatus,
                hasWeeklyUnlocked
            }));

            return { streak: streakStatus, weekly: weeklyStatus };
        } catch (error) {
            console.error("[GameContext] Error fetching reward status:", error);
            return {};
        }
    };

    // Stable callback for refreshing reward status (used by Rewards page useEffect).
    // Skips API call if data is already cached within the same UTC day.
    // Claim actions call refreshAllRewardStatus() directly to force-refresh.
    // Forces re-fetch when UTC date rolls over (midnight boundary).
    const rewardsLoadedDateRef = useRef<string | null>(null);
    const refreshRewardStatus = useCallback(async () => {
        const todayUTC = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        if (rewardsLoadedDateRef.current === todayUTC) return;
        rewardsLoadedDateRef.current = todayUTC;
        await refreshAllRewardStatus();
    }, []);

    // PWA visibility change: when app comes back to foreground, check if UTC date
    // rolled over and invalidate reward cache so next visit to Rewards page re-fetches.
    // Also invalidates cooldown cache on date change.
    // Daily-quests rollover handling lives near refreshDailyQuests definition below.
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const todayUTC = new Date().toISOString().slice(0, 10);
                if (rewardsLoadedDateRef.current && rewardsLoadedDateRef.current !== todayUTC) {
                    // Date rolled over — clear reward cache so next access re-fetches
                    rewardsLoadedDateRef.current = null;
                    // Also clear cooldown cache since day changed
                    cooldownCacheRef.current = {};
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const getUserStreak = async (): Promise<StreakStatus | undefined> => {
        if (rewardsState.streakStatus) return rewardsState.streakStatus;
        const result = await refreshAllRewardStatus();
        return result.streak;
    };

    const _getWeeklyStatus = async (): Promise<WeeklyStatus | undefined> => {
        if (rewardsState.weeklyStatus) return rewardsState.weeklyStatus;
        const result = await refreshAllRewardStatus();
        return result.weekly;
    };

    const claimDailyReward = async () => {
        setRewardsState(prev => ({ ...prev, isClaimLoading: true }));

        try {
            const response = await apiClient.claimDailyReward();

            if (!response.success) {
                console.error("Error claiming daily reward:", response.error);
                return false;
            }

            // Show notification
            if (response.data?.reward) {
                notificationService.showRewardClaimed({
                    rewardType: 'daily',
                    amount: response.data.reward.totalAmount || 0,
                    streakDays: response.data.newStreak,
                    streakBonus: response.data.reward.bonusAmount || 0,
                });
            }
            notificationService.processAchievementsFromResponse((response.data as any)?.achievements);

            // Single call updates both daily and weekly status
            await Promise.all([
                updateBalances(),
                refreshAllRewardStatus()
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

    // Keep updateWeeklyStatus for backward compat (now delegates to single call)
    const updateWeeklyStatus = async (): Promise<WeeklyStatus | undefined> => {
        const result = await refreshAllRewardStatus();
        return result.weekly;
    };

    // Keep updateStreakStatus for backward compat
    const updateStreakStatus = async (): Promise<StreakStatus | undefined> => {
        const result = await refreshAllRewardStatus();
        return result.streak;
    };

    const claimWeeklyReward = async () => {
        // Web2: Use REST API instead of smart contracts
        try {
            // Call REST API to claim weekly reward
            const response = await apiClient.claimWeeklyReward();

            if (!response.success) {
                console.error("Error claiming weekly reward:", response.error);
                return false;
            }

            // Show notification
            if (response.data?.reward) {
                notificationService.showRewardClaimed({
                    rewardType: 'weekly',
                    amount: response.data.reward.totalAmount || response.data.reward.amount || 0,
                });
            }
            notificationService.processAchievementsFromResponse((response.data as any)?.achievements);

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

    const purchaseProtection = async (type: 'daily' | 'weekly', quantity?: number) => {
        try {
            const response = await apiClient.purchaseProtection(type, quantity);

            if (!response.success) {
                console.error("Error purchasing protection:", response.error);
                throw new Error((response.error as any)?.message || 'Failed to purchase protection');
            }

            // Refresh balances and streak status to reflect protection
            await Promise.all([
                updateBalances(),
                type === 'daily' ? updateStreakStatus() : updateWeeklyStatus()
            ]);

            return true;
        } catch (error) {
            console.error("Error purchasing protection:", error);
            throw error;
        }
    };

    const setNickname = async (totemId: string, newName: string) => {
        // Web2: Call REST API to set nickname
        if (!apiClient.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const response = await apiClient.setNickname(totemId, newName.trim() || null);

        if (!response.success) {
            throw new Error(response.error?.message || 'Failed to set nickname');
        }

        // Update the nickname immediately in local state
        const newNickname = response.data?.nickname ?? null;
        updateTotemNickname(totemId, newNickname);
    };

    // Sync rune balances from auth user (already fetched by /auth/me — no extra API call)
    useEffect(() => {
        if (user?.currencies?.runes) {
            const runes = user.currencies.runes;
            setRuneBalances({
                lesser: runes.lesser || 0,
                greater: runes.greater || 0,
                ancient: runes.ancient || 0,
            });
        }
    }, [user?.currencies?.runes]);

    // No-op: rune balances are synced from auth user and updated inline after expedition claims.
    // Kept for API compatibility with components that call it.
    const getUserRuneBalances = useCallback(async () => {}, []);
      
    const refreshExpeditions = useCallback(async () => {
        // Only fetch active (dynamic) expeditions from API.
        // Static expedition definitions come from components/data/expeditions.json
        if (!apiClient.isAuthenticated()) return;

        try {
          setExpeditionState(prev => ({ ...prev, loading: true, error: null }));

          const response = await apiClient.getActiveExpeditions();

          if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to load expeditions');
          }

          const { expeditions } = response.data;

          // Transform active expeditions
          const userExpeditions = (expeditions || []).map((exp: any) => ({
            expeditionId: exp.expeditionId,
            captainId: exp.totemIds?.[0] || exp.totemId,
            totemIds: exp.totemIds || [exp.totemId],
            endTime: exp.endsAt ? new Date(exp.endsAt).getTime() / 1000 : (exp.endTime || 0),
            completed: false,
            canClaim: exp.canClaim || false
          }));

          setExpeditionState(prev => ({
            ...prev,
            userExpeditions,
            loading: false,
            error: null
          }));
        }
        catch (err) {
          console.error('Error loading expeditions:', err);
          setExpeditionState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load expeditions'
          }));
        }
    }, []);
      
    const startExpedition = useCallback(async (
        expeditionId: string,
        totemIds: string[]
      ) => {
        // Web2: Use REST API instead of smart contracts
        try {
          const response = await apiClient.startExpedition(expeditionId, totemIds);

          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to start expedition');
          }

          // Update ALL team totems' happiness locally so UI stays in sync
          const expData = response.data?.expedition;
          if (expData?.happinessCost && expData.happinessCost > 0) {
            for (const tid of totemIds) {
              const t = totems.find(t => t.id === tid);
              if (t) {
                updateTotemAttributes(tid, {
                  happiness: Math.max(0, t.attributes.happiness - expData.happinessCost),
                });
              }
            }
          }

          // Apply daily-quest progress deltas from the response (Skybound, etc.)
          setDailyQuests(prev => applyQuestProgressUpdates(prev, response.data?.quests));

          // Refresh data
          await Promise.all([
            refreshExpeditions(),
            updateBalances()
          ]);

          return true;
        }
        catch (error) {
          console.error('Error starting expedition:', error);
          return false;
        }
      }, [updateBalances, refreshExpeditions, totems, updateTotemAttributes]);
      
    const claimExpeditionRewards = useCallback(async (expeditionId: string) => {
        // Web2: Use REST API instead of smart contracts
        try {
          const response = await apiClient.claimExpeditionRewards(expeditionId);

          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to claim expedition rewards');
          }

          // Show expedition rewards notification
          const rewards = response.data?.rewards;
          const expedition = response.data?.expedition;
          const scoreValue = response.data?.score?.value ?? 0;
          if (rewards) {
            notificationService.showExpeditionRewards({
              expeditionId,
              expeditionName: expedition?.name || expedition?.expeditionId,
              totemIds: expedition?.totemIds || (response.data?.totem?.id ? [response.data.totem.id] : []),
              experienceGained: rewards.experience,
              essenceGained: rewards.essence,
              runesGained: rewards.runes,
              score: scoreValue,
            });

            // Show the full-screen celebration modal
            setActiveExpeditionEffect({
              expeditionId,
              experienceGained: rewards.experience,
              essenceGained: rewards.essence,
              runesGained: rewards.runes || { lesser: 0, greater: 0, ancient: 0 },
              score: scoreValue,
            });
          }

          // Process any achievements earned from the claim
          notificationService.processAchievementsFromResponse(response.data?.achievements);

          // Apply daily-quest progress deltas from the response (Twin Returns, etc.)
          setDailyQuests(prev => applyQuestProgressUpdates(prev, response.data?.quests));

          // Update rune balances — use authoritative balance from API if available, else accumulate
          if (rewards?.newRuneBalances) {
            setRuneBalances({
              lesser: rewards.newRuneBalances.lesser || 0,
              greater: rewards.newRuneBalances.greater || 0,
              ancient: rewards.newRuneBalances.ancient || 0,
            });
          } else if (rewards?.runes) {
            setRuneBalances(prev => ({
              lesser: prev.lesser + (rewards.runes.lesser || 0),
              greater: prev.greater + (rewards.runes.greater || 0),
              ancient: prev.ancient + (rewards.runes.ancient || 0),
            }));
          }

          // Update ALL team totems' XP locally so UI stays in sync
          if (rewards?.totemExpUpdates) {
            for (const [tid, newExp] of Object.entries(rewards.totemExpUpdates)) {
              updateTotemAttributes(tid, { experience: newExp as number });
            }
          }

          // Refresh data
          await Promise.all([
            refreshExpeditions(),
            updateBalances()
          ]);

          return true;
        }
        catch (error) {
          console.error('Error claiming expedition rewards:', error);
          return false;
        }
    }, [refreshExpeditions, updateBalances, updateTotemAttributes]);

    const claimCouncilMission = useCallback(async (totemId: string): Promise<MissionClaimResult | null> => {
        try {
            const response = await apiClient.claimCouncilMission(totemId);

            if (!response.success || !response.data) {
                console.error('Failed to claim council mission:', response.error);
                return null;
            }

            const { rewards, missionName, newRuneBalances, achievements } = response.data;

            // Update rune balances inline (authoritative total from backend when runes dropped)
            if (newRuneBalances) {
                setRuneBalances({
                    lesser: newRuneBalances.lesser || 0,
                    greater: newRuneBalances.greater || 0,
                    ancient: newRuneBalances.ancient || 0,
                });
            }

            // Update totem XP locally so UI reflects the gain immediately
            const totem = totems.find(t => t.id === totemId);
            if (totem && rewards?.xp) {
                updateTotemAttributes(totemId, {
                    experience: (totem.attributes.experience || 0) + rewards.xp,
                });
            }

            // Process achievements earned from the claim
            notificationService.processAchievementsFromResponse(achievements);

            return {
                missionName: missionName || 'Council Mission',
                xp: rewards?.xp || 0,
                runesGained: rewards?.runesEarned || { lesser: 0, greater: 0, ancient: 0 },
            };
        } catch (error) {
            console.error('Error claiming council mission:', error);
            return null;
        }
    }, [totems, updateTotemAttributes]);

    const fetchLootItems = useCallback(async () => {
        if (!apiClient.isAuthenticated()) return;
        // Dedup: return in-flight promise (prevents StrictMode double-fire)
        if (lootFetchPromise) return lootFetchPromise;
        lootFetchPromise = (async () => {
            try {
                const response = await apiClient.getLootItems();
                if (response.success && response.data) {
                    setLootItems(response.data.items || []);
                }
            } catch (err) {
                console.error('Error fetching loot items:', err);
            } finally {
                lootFetchPromise = null;
            }
        })();
        return lootFetchPromise;
    }, []);

    const claimLootItemAction = useCallback(async (lootItemId: string, options?: { speciesId?: number }) => {
        if (!apiClient.isAuthenticated()) return;
        try {
            const response = await apiClient.claimLootItem(lootItemId, options);
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to claim loot item');
            }
            const lootResult = response.data?.result;
            // Remove claimed item from local state
            setLootItems(prev => prev.filter(item => item.id !== lootItemId));
            // If totem box was claimed, refresh totems + balances (achievements may award Essence)
            if (lootResult?.type === 'totem') {
                await Promise.all([fetchTotems(), updateBalances()]);
            }
            // If essence box, refresh balances
            if (lootResult?.type === 'essence') {
                await updateBalances();
            }
            // Process achievements from loot claim
            notificationService.processAchievementsFromResponse((lootResult as any)?.achievements);
            return response.data;
        } catch (err) {
            console.error('Error claiming loot item:', err);
            throw err;
        }
    }, [fetchTotems, updateBalances]);

    const isTotemAvailable = useCallback((totemId: string): boolean => {
        // Check if totem is on an active expedition
        if (expeditionState.userExpeditions) {
          const onExpedition = expeditionState.userExpeditions.some(exp =>
            !exp.completed && exp.totemIds.some(id => id === totemId)
          );
          if (onExpedition) return false;
        }

        // Check if totem is on a council mission (blocked from all activities)
        const totem = totems.find(t => t.id === totemId);
        if (totem && !isAvailableForAction(totem.attributes)) return false;

        return true;
      }, [expeditionState.userExpeditions, totems]);

    const showExpeditionEffect = useCallback((data: ExpeditionRewardsData) => {
        setActiveExpeditionEffect(data);
    }, []);
    
    const hideExpeditionEffect = useCallback(() => {
        setActiveExpeditionEffect(null);
    }, []);

    const refreshDailyQuests = useCallback(async (force = false) => {
        if (!apiClient.isAuthenticated()) return;
        const todayUTC = new Date().toISOString().slice(0, 10);
        if (!force && dailyQuestsLoadedDateRef.current === todayUTC && dailyQuests) return;
        setDailyQuestsLoading(true);
        setDailyQuestsError(null);
        try {
            const res = await apiClient.getDailyQuests();
            if (res.success && res.data) {
                setDailyQuests(res.data);
                dailyQuestsLoadedDateRef.current = todayUTC;
            } else {
                setDailyQuestsError(res.error?.message || 'Failed to load daily quests');
            }
        } catch (err) {
            setDailyQuestsError((err as Error).message);
        } finally {
            setDailyQuestsLoading(false);
        }
    }, [dailyQuests]);

    const claimAllQuests = useCallback(async () => {
        if (!apiClient.isAuthenticated()) return false;
        try {
            const res = await apiClient.claimDailyQuests();
            if (!res.success || !res.data) return false;
            const data = res.data;
            const claimedIds = new Set(data.claimed.map(c => c.questId));
            // Stash runes FIRST so the Celebration component's effect sees them
            // on the same render that picks up the bonus.claimed flip below.
            // Otherwise the modal fires with runes=null and the per-day seen-flag
            // prevents a re-fire when the rune state arrives.
            if (data.bonusClaimed && data.runesAwarded) {
                setLastQuestBonusRunes(data.runesAwarded);
                getUserRuneBalances();
            }
            setDailyQuests(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    quests: prev.quests.map(q => claimedIds.has(q.id) ? { ...q, claimed: true } : q),
                    bonus: { ...prev.bonus, claimed: prev.bonus.claimed || data.bonusClaimed },
                };
            });
            if (data.totalEssenceAwarded > 0) {
                await updateBalances();
            }
            // Use the pre-claim snapshot for quest names — claimed list is the same regardless.
            const snapshot = dailyQuests;
            for (const entry of data.claimed) {
                const quest = snapshot?.quests.find(q => q.id === entry.questId);
                if (quest) {
                    notificationService.showQuestClaimed({ questName: quest.name, essence: entry.reward.essence });
                }
            }
            if (data.bonusClaimed && snapshot) {
                notificationService.showQuestSetCompleted({
                    totalEssence: data.totalEssenceAwarded,
                    bonusEssence: snapshot.bonus.reward.essence,
                    questsCompleted: snapshot.quests.length,
                    runesAwarded: data.runesAwarded,
                });
            }
            // Surface achievement milestone unlocks (ach_quest-set-master, ach_theme-master)
            // that fire server-side inside batchClaim — uses the same pipeline as action handlers.
            notificationService.processAchievementsFromResponse(data.achievements);
            return true;
        } catch (err) {
            setDailyQuestsError((err as Error).message);
            return false;
        }
    }, [updateBalances, dailyQuests]);

    const mergeQuestProgress = useCallback((updates: QuestProgressUpdate[] | undefined) => {
        if (!updates || !updates.length) return;
        setDailyQuests(prev => applyQuestProgressUpdates(prev, updates));
    }, []);

    useEffect(() => {
        // Initial load: only fetch expeditions (needed by /totems for "on expedition" badge).
        // Rewards, runes, and challenges are loaded lazily when their pages mount.
        if (!apiClient.isAuthenticated()) return;
        refreshExpeditions();
    }, [address, refreshExpeditions]);

    // Daily Quests UTC-rollover guardrails — needed when a tab stays open across
    // midnight (visibilitychange won't fire) or when the user re-focuses the tab.
    // Cheap: a single string compare on a 60s interval; clears cache + refetches.
    useEffect(() => {
        const flushIfRolled = () => {
            const todayUTC = new Date().toISOString().slice(0, 10);
            if (dailyQuestsLoadedDateRef.current && dailyQuestsLoadedDateRef.current !== todayUTC) {
                dailyQuestsLoadedDateRef.current = null;
                setDailyQuests(null);
                if (apiClient.isAuthenticated()) refreshDailyQuests(true);
            }
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') flushIfRolled();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        const interval = setInterval(flushIfRolled, 60_000);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(interval);
        };
    }, [refreshDailyQuests]);

    // Clear user-specific state when user logs out or changes
    useEffect(() => {
        if (!address || !apiClient.isAuthenticated()) {
            // Reset user-specific game state + cache flags
            challengesLoadedRef.current = false;
            rewardsLoadedDateRef.current = null;
            setChallengeState(prev => ({
                ...prev,
                userStatus: {}
            }));
            setRewardsState({
                streakStatus: null,
                isClaimLoading: false,
                weeklyStatus: null,
                hasWeeklyUnlocked: false,
                hasStakingUnlocked: false
            });
            setRuneBalances({ lesser: 0, greater: 0, ancient: 0 });
            setExpeditionState(prev => ({
                ...prev,
                userExpeditions: []
            }));
            dailyQuestsLoadedDateRef.current = null;
            setDailyQuests(null);
            setRecentTierUpChallengeId(null);
            setPendingMasteryLootId(null);
        }
    }, [address]);
    
    return (
        <GameContext.Provider value={{
            actionConfigs,
            timeWindows,
            gameParams,
            error,
            debugTimeWindow,
            getFormattedWindowTimes,
            canUseAction,
            getActionStatus,
            getNextAvailableWindow,
            challengeState,
            refreshChallenges: loadChallenges,
            canAttemptChallenge,
            getEligibleTotems,
            getChallengeStatus,
            completeChallenge,
            recentTierUpChallengeId,
            pendingMasteryLootId,
            clearPendingMasteryLoot,
            rewardsState,
            getUserStreak,
            claimDailyReward,
            claimWeeklyReward,
            purchaseProtection,
            refreshRewardStatus,
            setNickname,
            runeBalances,
            getUserRuneBalances,
            expeditionState,
            refreshExpeditions,
            startExpedition,
            claimExpeditionRewards,
            claimCouncilMission,
            isTotemAvailable,
            activeExpeditionEffect,
            showExpeditionEffect,
            hideExpeditionEffect,
            lootItems,
            fetchLootItems,
            claimLootItem: claimLootItemAction,
            getTotemCooldowns,
            setTotemCooldowns,
            fetchTotemCooldowns,
            dailyQuests,
            dailyQuestsLoading,
            dailyQuestsError,
            refreshDailyQuests,
            claimAllQuests,
            mergeQuestProgress,
            dailyQuestWizardVisible,
            setDailyQuestWizardVisible,
            lastQuestBonusRunes,
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
