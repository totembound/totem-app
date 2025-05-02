import React from 'react';
import { useGame } from '../../contexts/GameContext';
import ExpeditionRewardsEffect from './ExpeditionRewardsEffect';

const ExpeditionEffectManager: React.FC = () => {
  const { activeExpeditionEffect, hideExpeditionEffect, expeditionState } = useGame();

  if (!activeExpeditionEffect) return null;

  // Find expedition name from the state
  const expedition = Object.values(expeditionState.expeditions).find(
    exp => exp.id === activeExpeditionEffect.expeditionId
  );
  
  const expeditionName = expedition?.name || 'Expedition';

  return (
    <ExpeditionRewardsEffect
      expeditionName={expeditionName}
      experienceGained={activeExpeditionEffect.experienceGained}
      runesGained={activeExpeditionEffect.runesGained}
      score={activeExpeditionEffect.score}
      onComplete={hideExpeditionEffect}
    />
  );
};

export default ExpeditionEffectManager;