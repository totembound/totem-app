import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Achievement, AchievementCategory, AchievementProgress, AchievementView, Milestone } from '../types/types';
import { createAchievementsContract, createRewardsContract } from '../config/contracts';
import { useUser } from './UserContext';
import { ethers } from 'ethers';

interface AchievementsContextType {
    achievements: Record<AchievementCategory, AchievementView[]>;
    achievementsById: Record<string, AchievementView>; 
    progress: Record<string, AchievementProgress>;
    isLoading: boolean;
    error: string | null;
    refreshAchievements: () => Promise<void>;
    getAchievementById: (id: string) => AchievementView | undefined;
    hasAchievement: (id: string) => boolean;
    showAchievementEffect: (achievementId: string) => void;
    hideAchievementEffect: () => void;
    activeAchievementEffect: string | null;
}

const AchievementsContext = createContext<AchievementsContextType | null>(null);

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { provider, address, isConnected, totemUpdateCounter } = useUser();
    const [achievements, setAchievements] = useState<Record<AchievementCategory, AchievementView[]>>({} as Record<AchievementCategory, AchievementView[]>);
    const [achievementsById, setAchievementsById] = useState<Record<string, AchievementView>>({});
    const [progress, setProgress] = useState<Record<string, AchievementProgress>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeAchievementEffect, setActiveAchievementEffect] = useState<string | null>(null);

    const loadAchievements = useCallback(async () => {
        if (!provider || !address) return;

        try {
            setIsLoading(true);
            setError(null);
            const contract = createAchievementsContract(provider);

            // Load achievements for each category
            const categories = [
                AchievementCategory.Evolution,
                AchievementCategory.Collection,
                AchievementCategory.Streak,
                AchievementCategory.Action,
                AchievementCategory.Challenge,
                AchievementCategory.Expedition
            ];

            const achievementsByCategory: Record<AchievementCategory, AchievementView[]> = {} as Record<AchievementCategory, AchievementView[]>;
            const byId: Record<string, AchievementView> = {};
            const progressMap: Record<string, AchievementProgress> = {};

            await Promise.all(categories.map(async (category) => {
                const categoryAchievements = await contract.getAchievementsByCategory(category);

                // Convert to AchievementViews with progress
                const achievementViews = await Promise.all(categoryAchievements.map(async (achievement) => {
                    const progress = await contract.getDetailedProgress(achievement.id, address);
                    progressMap[achievement.id] = progress;
                    
                    // Create AchievementView with base data and progress
                    const view: AchievementView = {
                        id: achievement.id,
                        name: achievement.name,
                        description: achievement.description,
                        category: achievement.category,
                        achievementType: achievement.achievementType,
                        subType: achievement.subType,
                        enabled: achievement.enabled,
                        badgeUri: achievement.badgeUri,
                        milestones: achievement.milestones,
                        requirements: achievement.requirements.map(req => req.toString()), // Convert bytes32 to string
                        isCompleted: progress.achieved,
                        currentCount: progress.count
                    };
                    
                    byId[achievement.id] = view;
                    return view;
                }));
                
                achievementsByCategory[category] = achievementViews;

                // Load detailed progress for each achievement
                await Promise.all(categoryAchievements.map(async (achievement) => {
                    const progress = await contract.getDetailedProgress(achievement.id, address);
                    progressMap[achievement.id] = progress;
                }));
            }));

            setAchievements(achievementsByCategory);
            setAchievementsById(byId);
            setProgress(progressMap);
        }
        catch (err) {
            console.error('Error loading achievements:', err);
            setError('Failed to load achievements');
        }
        finally {
            setIsLoading(false);
        }
    }, [provider, address, totemUpdateCounter]);

    const refreshAchievements = useCallback(async () => {
        await loadAchievements();
    }, [loadAchievements]);

    const getAchievementById = useCallback((id: string): AchievementView | undefined => {
        for (const categoryAchievements of Object.values(achievements)) {
            const found = categoryAchievements.find(a => a.id === id);
            if (found) return found;
        }
        return undefined;
    }, [achievements]);

    const hasAchievement = useCallback((id: string): boolean => {
        const achievement = getAchievementById(id);
        return achievement?.isCompleted || false;
    }, [getAchievementById]);

    const showAchievementEffect = useCallback((achievementId: string) => {
        setActiveAchievementEffect(achievementId);
    }, []);

    const hideAchievementEffect = useCallback(() => {
        setActiveAchievementEffect(null);
    }, []);

    useEffect(() => {
        if (isConnected && provider && address) {
            loadAchievements();
        }
    }, [isConnected, provider, address, loadAchievements]);

    const setupAchievementListeners = useCallback(() => {
        if (!provider || !address) return;
      
        const contract = createAchievementsContract(provider);
        const rewardsContract = createRewardsContract(provider);
        
        const userUnlockedFilter = contract.filters.AchievementUnlocked(null, address);
        const userMilestoneFilter = contract.filters.MilestoneUnlocked(null, null, address);
        const userRewardFilter = rewardsContract.filters.RewardClaimed();

        const handleAchievementUnlocked = async (id: string, user: string) => {
          if (user.toLowerCase() !== address.toLowerCase()) return;
      
          // Refresh the specific achievement
          const achievement = getAchievementById(id);
          if (achievement) {
            showAchievementEffect(id);
            await refreshAchievements();
          }
        };
      
        const handleMilestoneUnlocked = async (id: string, milestone: number, user: string) => {
          if (user.toLowerCase() !== address.toLowerCase()) return;
      
          // Refresh the specific achievement
          const achievement = getAchievementById(id);
          if (achievement && achievement.milestones[milestone]) {
            showAchievementEffect(id);
            await refreshAchievements();
          }
        };
      
        const handleRewardClaimed = async (rewardId: string, user: string, amount: bigint, streak: bigint) => {
            if (user.toLowerCase() !== address.toLowerCase()) return;
            
            // Only handle daily login rewards
            const loginRewardId = ethers.id("daily_login");
            console.log(loginRewardId, rewardId);
            if (rewardId === loginRewardId) {
                await refreshAchievements();
            }
        };
        
        // Subscribe to events
        contract.on("AchievementUnlocked", handleAchievementUnlocked);
        contract.on("MilestoneUnlocked", handleMilestoneUnlocked);
        rewardsContract.on("RewardClaimed", handleRewardClaimed);

        // Cleanup function
        return () => {
          contract.off("AchievementUnlocked", handleAchievementUnlocked);
          contract.off("MilestoneUnlocked", handleMilestoneUnlocked);
          rewardsContract.off("RewardClaimed", handleRewardClaimed);
        };
      }, [provider, address, getAchievementById, showAchievementEffect, refreshAchievements]);
      
      // Add to useEffect in AchievementsProvider
      useEffect(() => {
        const cleanup = setupAchievementListeners();
        return () => {
          if (cleanup) cleanup();
        };
      }, [setupAchievementListeners]);

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
            showAchievementEffect,
            hideAchievementEffect,
            activeAchievementEffect
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