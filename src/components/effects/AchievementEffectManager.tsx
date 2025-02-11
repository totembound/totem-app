import React from 'react';
import { useAchievements } from '../../contexts/AchievementsContext';
import AchievementEffect from './AchievementEffect';

const AchievementEffectManager: React.FC = () => {
  const { activeAchievementEffect, hideAchievementEffect, getAchievementById } = useAchievements();

  if (!activeAchievementEffect) return null;

  const achievement = getAchievementById(activeAchievementEffect);
  if (!achievement) return null;

  return (
    <AchievementEffect
      title={achievement.name}
      description={achievement.description}
      badgeUri={achievement.badgeUri}
      onComplete={hideAchievementEffect}
    />
  );
};

export default AchievementEffectManager;