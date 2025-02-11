import { useCallback } from 'react';
import { useAchievements } from '../contexts/AchievementsContext';
import { AchievementRequirement } from '../types/types';

export const useAchievementRequirements = () => {
  const { hasAchievement, getAchievementById } = useAchievements();

  const checkRequirements = useCallback((requirements?: AchievementRequirement[]) => {
    if (!requirements || requirements.length === 0) return true;

    return requirements.every(req => hasAchievement(req.achievementId));
  }, [hasAchievement]);

  const getMissingRequirements = useCallback((requirements?: AchievementRequirement[]) => {
    if (!requirements || requirements.length === 0) return [];

    return requirements.filter(req => !hasAchievement(req.achievementId))
      .map(req => ({
        ...req,
        achievement: getAchievementById(req.achievementId)
      }));
  }, [hasAchievement, getAchievementById]);

  return {
    checkRequirements,
    getMissingRequirements
  };
};
