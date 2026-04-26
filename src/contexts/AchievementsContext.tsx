import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AchievementCategory, AchievementProgress, AchievementType, AchievementView, ONETIME_REQUIREMENT } from '../types/types';
import { useAuth } from './AuthContext';
import apiClient from '../services/ApiClient';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_TYPES } from '../config/achievements';

export interface ActionAchievementUnlock {
    achievementId: string;
    milestone?: number;
    newMilestones?: number[];
    rewards?: { essence?: number; xp?: number };
}

interface AchievementsContextType {
    achievements: Record<AchievementCategory, AchievementView[]>;
    achievementsById: Record<string, AchievementView>;
    progress: Record<string, AchievementProgress>;
    isLoading: boolean;
    error: string | null;
    refreshAchievements: () => Promise<void>;
    getAchievementById: (id: string) => AchievementView | undefined;
    hasAchievement: (id: string) => boolean;
    incrementAchievementProgress: (achievementId: string) => void;
    applyUnlockedAchievements: (unlocked?: ActionAchievementUnlock[]) => void;
    showAchievementEffect: (achievementId: string) => void;
    hideAchievementEffect: () => void;
    checkSpecificAchievement: (id: string) => Promise<boolean>;
    activeAchievementEffect: string | null;
}

const AchievementsContext = createContext<AchievementsContextType | null>(null);

// Static config is now bundled via src/config/achievements.ts
interface AchievementConfig {
    categories: Array<{ id: number; name: string }>;
    types: Array<{ id: number; name: string }>;
    achievements: Array<{
        id: string;
        name: string;
        description: string;
        category: number;
        type: number;
        badgeUri?: string;
        subType?: string;
        milestones?: Array<{
            index: number;
            name: string;
            description: string;
            requirement: number;
            badgeUri: string;
        }>;
        requires?: any[];
    }>;
}

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [achievements, setAchievements] = useState<Record<AchievementCategory, AchievementView[]>>({} as Record<AchievementCategory, AchievementView[]>);
    const [achievementsById, setAchievementsById] = useState<Record<string, AchievementView>>({});
    const [progress, setProgress] = useState<Record<string, AchievementProgress>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeAchievementEffect, setActiveAchievementEffect] = useState<string | null>(null);
    const loadingRef = useRef(false);
    const lastAuthStateRef = useRef<boolean | null>(null);

    // Static achievement config — bundled at build time, no fetch needed
    const getAchievementConfig = useCallback((): AchievementConfig => ({
        categories: ACHIEVEMENT_CATEGORIES,
        types: ACHIEVEMENT_TYPES,
        achievements: ACHIEVEMENTS,
    }), []);

    // Load user progress from API
    const loadUserProgress = useCallback(async (): Promise<Record<string, AchievementProgress>> => {
        if (!isAuthenticated) {
            return {};
        }

        try {
            const result = await apiClient.getAchievements();
            if (result.success && result.data?.achievements) {
                // API returns: { "ach_id": [{ unlocked: bool, progress: num }, ...] }
                // Convert to progress map
                const progressMap: Record<string, AchievementProgress> = {};

                for (const [achievementId, milestones] of Object.entries(result.data.achievements)) {
                    const milestoneArray = milestones as Array<{ unlocked: boolean; progress: number }>;

                    // Per-milestone progress; falls back to first milestone's progress
                    // for typical progression achievements where all share one counter.
                    const milestoneProgress = milestoneArray.map(m => m.progress || 0);
                    const currentCount = milestoneProgress[0] || 0;

                    const unlockedMilestones = milestoneArray.map(m => m.unlocked);
                    const hasAnyUnlocked = unlockedMilestones.some(u => u);

                    const achieved = milestoneArray.length === 1
                        ? milestoneArray[0].unlocked
                        : milestoneArray.every(m => m.unlocked);

                    progressMap[achievementId] = {
                        startTime: 0,
                        lastUpdate: Date.now(),
                        achieved,
                        count: currentCount,
                        requirementsMet: hasAnyUnlocked || currentCount > 0,
                        unlockedMilestones,
                        milestoneProgress,
                    };
                }
                return progressMap;
            }
        } catch (err) {
            console.error('Failed to load achievement progress from API:', err);
        }

        return {};
    }, [isAuthenticated]);

    const loadAchievements = useCallback(async () => {
        console.log('loading achievements');

        try {
            setIsLoading(true);
            setError(null);

            // Config is bundled (synchronous), user progress from API
            const config = getAchievementConfig();
            const userProgress = await loadUserProgress();

            const achievementsByCategory: Record<AchievementCategory, AchievementView[]> = {
                [AchievementCategory.Evolution]: [],
                [AchievementCategory.Collection]: [],
                [AchievementCategory.Streak]: [],
                [AchievementCategory.Action]: [],
                [AchievementCategory.Challenge]: [],
                [AchievementCategory.Expedition]: [],
                [AchievementCategory.Forge]: [],
                [AchievementCategory.Sanctum]: [],
            };
            const byId: Record<string, AchievementView> = {};

            // Process each achievement from static config
            for (const ach of config.achievements) {
                const category = ach.category as AchievementCategory;
                const achievementType = ach.type as AchievementType;
                const progress = userProgress[ach.id] || {
                    startTime: 0,
                    lastUpdate: 0,
                    achieved: false,
                    count: 0,
                    requirementsMet: !ach.requires?.length,
                    unlockedMilestones: ach.milestones?.map(() => false) || [],
                };

                // Check if requirements are met (based on other achievements)
                const requirementsMet = !ach.requires?.length || ach.requires.every(reqId => {
                    const reqProgress = userProgress[reqId];
                    return reqProgress?.achieved;
                });

                const view: AchievementView = {
                    id: ach.id,
                    name: ach.name,
                    description: ach.description,
                    category,
                    achievementType,
                    subType: ach.id.replace('ach_', ''),
                    enabled: true,
                    badgeUri: ach.badgeUri || '',
                    milestones: ach.milestones?.map(m => ({
                        name: m.name,
                        description: m.description || m.name,
                        requirement: m.requirement,
                        badgeUri: m.badgeUri,
                    })) || [],
                    requirements: ach.requires?.map(reqId => ({
                        achievementId: reqId,
                        milestoneIndex: ONETIME_REQUIREMENT,
                    })) || [],
                    requirementsMet,
                    isCompleted: progress.achieved,
                    currentCount: progress.count,
                };

                byId[ach.id] = view;
                achievementsByCategory[category].push(view);
            }

            setAchievements(achievementsByCategory);
            setAchievementsById(byId);
            setProgress(userProgress);
        }
        catch (err) {
            console.error('Error loading achievements:', err);
            setError('Failed to load achievements');
        }
        finally {
            setIsLoading(false);
        }
    }, [getAchievementConfig, loadUserProgress]);

    // Helper function to check if specific achievement requirements are met
    const checkSpecificAchievement = useCallback(async (id: string): Promise<boolean> => {
        if (!isAuthenticated) return false;

        try {
            const result = await apiClient.checkAchievement(id);
            return result.success && (result.data?.unlocked || false);
        } catch (error) {
            console.error(`Error checking achievement ${id}:`, error);
            return false;
        }
    }, [isAuthenticated]);

    const refreshAchievements = useCallback(async () => {
        await loadAchievements();
    }, [loadAchievements]);

    const getAchievementById = useCallback((id: string): AchievementView | undefined => {
        for (const categoryAchievements of Object.values(achievements)) {
            const found = categoryAchievements.find(a => a.id === id || a.subType === id);
            if (found) return found;
        }
        return undefined;
    }, [achievements]);

    const hasAchievement = useCallback((id: string): boolean => {
        const achievement = getAchievementById(id);
        return achievement?.isCompleted || false;
    }, [getAchievementById]);

    // Optimistic SPA update: increment achievement progress locally (no API call)
    // Used after game actions so tutorial checks see updated state immediately
    const incrementAchievementProgress = useCallback((achievementId: string) => {
        setAchievementsById(prev => {
            const existing = prev[achievementId];
            if (!existing) return prev;
            return {
                ...prev,
                [achievementId]: { ...existing, currentCount: existing.currentCount + 1 },
            };
        });
        // Also update the categorized achievements list
        setAchievements(prev => {
            const updated = { ...prev };
            for (const cat of Object.keys(updated) as unknown as AchievementCategory[]) {
                updated[cat] = updated[cat].map(a =>
                    a.id === achievementId ? { ...a, currentCount: a.currentCount + 1 } : a
                );
            }
            return updated;
        });
    }, []);

    // Patches context state from action-response unlocks. Used by useTotemGame
    // (and other action call sites) instead of a full refresh GET, so achievement
    // UI updates without an extra round-trip.
    const applyUnlockedAchievements = useCallback((unlocked?: ActionAchievementUnlock[]) => {
        if (!unlocked || unlocked.length === 0) return;

        setProgress(prev => {
            const next = { ...prev };
            for (const u of unlocked) {
                const ach = ACHIEVEMENTS.find(a => a.id === u.achievementId);
                if (!ach) continue;
                const milestoneCount = ach.milestones?.length || 1;
                const existing = next[u.achievementId] || {
                    startTime: 0,
                    lastUpdate: Date.now(),
                    achieved: false,
                    count: 0,
                    requirementsMet: true,
                    unlockedMilestones: Array.from({ length: milestoneCount }, () => false),
                    milestoneProgress: Array.from({ length: milestoneCount }, () => 0),
                };
                const indices = u.newMilestones?.length
                    ? u.newMilestones
                    : (typeof u.milestone === 'number' ? [u.milestone] : []);

                const unlockedFlags = [...(existing.unlockedMilestones || Array(milestoneCount).fill(false))];
                // Mark this milestone (and all earlier ones — they must have been unlocked first) as true.
                for (const idx of indices) {
                    for (let i = 0; i <= idx && i < unlockedFlags.length; i++) unlockedFlags[i] = true;
                }
                // Bump count to the highest unlocked milestone's requirement (or +1) so the
                // progress bar reflects the milestone crossed.
                const highest = indices.length ? Math.max(...indices) : -1;
                const requirement = highest >= 0
                    ? ach.milestones?.[highest]?.requirement ?? existing.count
                    : existing.count;
                const newCount = Math.max(existing.count, requirement);

                // Per-milestone progress: bump the specific milestone's count to
                // its requirement when its index is unlocked here.
                const milestoneProgress = [...(existing.milestoneProgress || Array(milestoneCount).fill(0))];
                for (const idx of indices) {
                    if (idx < milestoneProgress.length) {
                        const req = ach.milestones?.[idx]?.requirement ?? 0;
                        milestoneProgress[idx] = Math.max(milestoneProgress[idx] || 0, req);
                    }
                }

                next[u.achievementId] = {
                    ...existing,
                    achieved: ach.type === 0
                        ? unlockedFlags[0] === true // OneTime: achieved when M0 unlocked
                        : unlockedFlags.every(Boolean),
                    count: newCount,
                    requirementsMet: true,
                    unlockedMilestones: unlockedFlags,
                    milestoneProgress,
                    lastUpdate: Date.now(),
                };
            }
            return next;
        });

        // Mirror the count bump into achievementsById so the categorized UI reflects it.
        setAchievementsById(prev => {
            const next = { ...prev };
            for (const u of unlocked) {
                const view = next[u.achievementId];
                if (!view) continue;
                const indices = u.newMilestones?.length
                    ? u.newMilestones
                    : (typeof u.milestone === 'number' ? [u.milestone] : []);
                const highest = indices.length ? Math.max(...indices) : -1;
                const requirement = highest >= 0 && view.milestones?.[highest]?.requirement
                    ? view.milestones[highest].requirement
                    : view.currentCount;
                next[u.achievementId] = {
                    ...view,
                    currentCount: Math.max(view.currentCount, requirement),
                    isCompleted: view.achievementType === 0 ? true : view.isCompleted,
                };
            }
            return next;
        });

        setAchievements(prev => {
            const next = { ...prev };
            for (const cat of Object.keys(next) as unknown as AchievementCategory[]) {
                next[cat] = next[cat].map(a => {
                    const u = unlocked.find(x => x.achievementId === a.id);
                    if (!u) return a;
                    const indices = u.newMilestones?.length
                        ? u.newMilestones
                        : (typeof u.milestone === 'number' ? [u.milestone] : []);
                    const highest = indices.length ? Math.max(...indices) : -1;
                    const requirement = highest >= 0 && a.milestones?.[highest]?.requirement
                        ? a.milestones[highest].requirement
                        : a.currentCount;
                    return {
                        ...a,
                        currentCount: Math.max(a.currentCount, requirement),
                        isCompleted: a.achievementType === 0 ? true : a.isCompleted,
                    };
                });
            }
            return next;
        });
    }, []);

    const showAchievementEffect = useCallback((achievementId: string) => {
        setActiveAchievementEffect(achievementId);
    }, []);

    const hideAchievementEffect = useCallback(() => {
        setActiveAchievementEffect(null);
    }, []);

    // Single useEffect: load on mount, reload when auth changes
    useEffect(() => {
        // Skip if already loading (prevents StrictMode double-fire)
        if (loadingRef.current) return;

        // On logout: clear progress and reload with empty state
        if (lastAuthStateRef.current === true && !isAuthenticated) {
            setProgress({});
        }
        lastAuthStateRef.current = isAuthenticated;

        loadingRef.current = true;
        loadAchievements().finally(() => {
            loadingRef.current = false;
        });
    }, [isAuthenticated, loadAchievements]);

    return (
        <AchievementsContext.Provider value={{
            achievements,
            achievementsById,
            progress,
            isLoading,
            error,
            refreshAchievements,
            getAchievementById,
            hasAchievement,
            incrementAchievementProgress,
            applyUnlockedAchievements,
            showAchievementEffect,
            hideAchievementEffect,
            activeAchievementEffect,
            checkSpecificAchievement
        }}>
            {children}
        </AchievementsContext.Provider>
    );
};

export const useAchievements = () => {
    const context = useContext(AchievementsContext);
    if (!context) {
        throw new Error('useAchievements must be used within an AchievementsProvider');
    }
    return context;
};