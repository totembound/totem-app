import React from 'react';
import { useGame } from '../../contexts/GameContext';
import ExpeditionRewardsEffect from './ExpeditionRewardsEffect';
import expeditionData from '../data/expeditions.json';

const ExpeditionEffectManager: React.FC = () => {
  const { activeExpeditionEffect, hideExpeditionEffect } = useGame();

  if (!activeExpeditionEffect) return null;

  // Look up expedition name from static config (not API)
  const expedition = expeditionData.find(
    exp => exp.id === activeExpeditionEffect.expeditionId
  );

  const expeditionName = expedition?.name || 'Expedition';

  return (
    <ExpeditionRewardsEffect
      expeditionName={expeditionName}
      experienceGained={activeExpeditionEffect.experienceGained}
      essenceGained={activeExpeditionEffect.essenceGained}
      runesGained={activeExpeditionEffect.runesGained}
      score={activeExpeditionEffect.score}
      onComplete={hideExpeditionEffect}
    />
  );
};

export default ExpeditionEffectManager;