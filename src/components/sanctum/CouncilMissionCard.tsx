import React from 'react';
import { Clock, Sparkles, Heart, Shield, Scroll, Crown } from 'lucide-react';

const RUNE_STYLES: Record<string, { gradient: string; shadow: string; image: string; label: string }> = {
  lesser: { gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30', image: '/runes/lesser-rune.png', label: 'Lesser' },
  greater: { gradient: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/30', image: '/runes/greater-rune.png', label: 'Greater' },
  ancient: { gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/30', image: '/runes/ancient-rune.png', label: 'Ancient' },
};
import type { CouncilMissionDef } from '../../config/sanctum';

interface CouncilMissionCardProps {
  mission: CouncilMissionDef;
  hasEnoughHappiness: boolean;
  totemStage: number;
  onStart: (missionId: string) => void;
  isLoading: boolean;
}

const TIER_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode; accent: string }> = {
  governance: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    icon: <Shield className="w-3 h-3" />,
    accent: 'border-l-blue-400 dark:border-l-blue-500',
  },
  diplomacy: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    icon: <Scroll className="w-3 h-3" />,
    accent: 'border-l-purple-400 dark:border-l-purple-500',
  },
  legacy: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    icon: <Crown className="w-3 h-3" />,
    accent: 'border-l-amber-400 dark:border-l-amber-500',
  },
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return `${hours} hr`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

/** Map internal stage number to UI label */
function getStageName(internalStage: number): string {
  const names: Record<number, string> = {
    0: 'Stage 1 (Hatchling)',
    1: 'Stage 2 (Juvenile)',
    2: 'Stage 3 (Adolescent)',
    3: 'Stage 4 (Adult)',
    4: 'Stage 5 (Ascended)',
  };
  return names[internalStage] ?? `Stage ${internalStage + 1}`;
}

const CouncilMissionCard: React.FC<CouncilMissionCardProps> = ({
  mission,
  hasEnoughHappiness,
  totemStage,
  onStart,
  isLoading,
}) => {
  const tier = TIER_STYLES[mission.tier] ?? TIER_STYLES.governance;
  const meetsStageRequirement = totemStage >= mission.requiredStage;
  const isDisabled = !meetsStageRequirement || !hasEnoughHappiness || isLoading;

  let disabledReason = '';
  if (!meetsStageRequirement) disabledReason = `Requires ${getStageName(mission.requiredStage)}`;
  else if (!hasEnoughHappiness) disabledReason = 'Not enough Happiness';

  return (
    <div
      className={`rounded-lg border border-l-4 p-3 sm:p-4 transition-opacity duration-150 ${tier.accent} ${
        isDisabled && !isLoading
          ? 'opacity-50 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      {/* Header: name + tier badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight">
          {mission.name}
        </h4>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tier.bg} ${tier.text}`}
        >
          {tier.icon}
          {mission.tier.charAt(0).toUpperCase() + mission.tier.slice(1)}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
        {mission.description}
      </p>

      {/* Duration */}
      <div className="flex items-center gap-1.5 mb-2 text-sm text-gray-600 dark:text-gray-300">
        <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
        <span>{formatDuration(mission.duration)}</span>
      </div>

      {/* Cost */}
      <div className="flex items-center gap-3 mb-2 text-sm">
        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
          <Heart className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          {mission.cost.happiness} Happiness
        </span>
      </div>

      {/* Rewards: XP + Rune drops */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <div className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">+{mission.rewards.xp} XP</span>
        </div>
        {mission.rewards.runes && Object.entries(mission.rewards.runes).map(([type, chance]) => {
          const style = RUNE_STYLES[type];
          if (!style) return null;
          return (
            <div key={type} className={`flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r ${style.gradient} rounded shadow-sm ${style.shadow}`}>
              <img src={style.image} alt={style.label} className="w-3 h-3 drop-shadow shrink-0" width={12} height={12} />
              <span className="text-[10px] font-bold text-white drop-shadow whitespace-nowrap">{chance}%</span>
            </div>
          );
        })}
      </div>

      {/* Start button */}
      <button
        onClick={() => onStart(mission.id)}
        disabled={isDisabled}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600
          disabled:cursor-not-allowed text-white dark:disabled:text-gray-400 font-semibold rounded-lg
          min-h-[48px] transition-colors duration-150 text-sm"
      >
        {isLoading ? 'Starting...' : disabledReason || 'Start Mission'}
      </button>
    </div>
  );
};

export default CouncilMissionCard;
