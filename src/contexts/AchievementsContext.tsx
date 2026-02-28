import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AchievementCategory, AchievementProgress, AchievementType, AchievementView, ONETIME_REQUIREMENT } from '../types/types';
import { useAuth } from './AuthContext';
import apiClient from '../services/ApiClient';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_TYPES } from '../config/achievements';

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

                    // Get progress value from first milestone (all milestones have same progress)
                    const currentCount = milestoneArray[0]?.progress || 0;

                    // Check if any milestone is unlocked (for one-time achievements, this means completed)
                    const unlockedMilestones = milestoneArray.map(m => m.unlocked);
                    const hasAnyUnlocked = unlockedMilestones.some(u => u);

                    // For one-time achievements (single milestone), achieved = that milestone unlocked
                    // For progression achievements, achieved = all milestones unlocked
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