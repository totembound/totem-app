import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, Shield, Scroll, Crown, Trophy } from 'lucide-react';
import { getMissionById } from '../../config/sanctum';
import type { ActiveCouncilMission } from '../../types/types';

const RUNE_STYLES: Record<string, { gradient: string; shadow: string; image: string; label: string }> = {
  lesser: { gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30', image: '/runes/lesser-rune.png', label: 'Lesser' },
  greater: { gradient: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/30', image: '/runes/greater-rune.png', label: 'Greater' },
  ancient: { gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/30', image: '/runes/ancient-rune.png', label: 'Ancient' },
};

interface CouncilMissionActiveProps {
  mission: ActiveCouncilMission;
  totemId: string;
  onClaim: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  governance: <Shield className="w-4 h-4" />,
  diplomacy: <Scroll className="w-4 h-4" />,
  legacy: <Crown className="w-4 h-4" />,
};

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'Complete!';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const CouncilMissionActive: React.FC<CouncilMissionActiveProps> = ({
  mission,
  totemId: _totemId,
  onClaim,
  onCancel,
  isLoading,
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const remaining = new Date(mission.endsAt).getTime() - Date.now();
      setTimeLeft(Math.max(0, remaining));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [mission.endsAt]);

  const canClaim = timeLeft === 0;
  const def = getMissionById(mission.missionType);

  // Calculate progress
  const startMs = new Date(mission.startedAt).getTime();
  const endMs = new Date(mission.endsAt).getTime();
  const totalDuration = endMs - startMs;
  const elapsed = totalDuration - timeLeft;
  const progressPct = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 100;

  const tierIcon = def ? TIER_ICONS[def.tier] : null;

  return (
    <div className="space-y-4">
      {/* Mission header */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          {tierIcon && (
            <span className="text-indigo-500 dark:text-indigo-400">{tierIcon}</span>
          )}
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {mission.name}
          </h3>
        </div>

        {def && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {def.description}
          </p>
        )}

        {/* Timer display */}
        <div className="flex items-center gap-2 mb-3">
          <Clock className={`w-5 h-5 shrink-0 ${canClaim ? 'text-green-500 dark:text-green-400' : 'text-indigo-500 dark:text-indigo-400'}`} />
          <span className={`text-lg font-bold tabular-nums ${canClaim ? 'text-green-600 dark:text-green-400' : 'text-indigo-700 dark:text-indigo-300'}`}>
            {formatTimeLeft(timeLeft)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              canClaim
                ? 'bg-green-500 dark:bg-green-400'
                : 'bg-gradient-to-r from-indigo-500 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right tabular-nums">
          {Math.round(progressPct)}%
        </p>
      </div>

      {/* Rewards preview */}
      {def && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Rewards on Completion
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">+{def.rewards.xp} XP</span>
            </div>
            {def.rewards.runes && Object.entries(def.rewards.runes).map(([type, chance]) => {
              const style = RUNE_STYLES[type];
              if (!style) return null;
              return (
                <div key={type} className={`flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r ${style.gradient} rounded shadow-sm ${style.shadow}`}>
                  <img src={style.image} alt={style.label} className="w-3.5 h-3.5 drop-shadow shrink-0" width={14} height={14} />
                  <span className="text-[10px] font-bold text-white drop-shadow whitespace-nowrap">{chance}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {canClaim && (
          <button
            onClick={onClaim}
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600
              text-white font-bold rounded-lg min-h-[48px] transition-colors duration-150
              shadow-sm text-base"
          >
            {isLoading ? 'Claiming...' : 'Claim Reward'}
          </button>
        )}

        {!canClaim && (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full border-2 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/20
              disabled:opacity-50 disabled:cursor-not-allowed text-red-600 dark:text-red-400
              font-semibold rounded-lg min-h-[48px] transition-colors duration-150 text-sm"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Mission'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CouncilMissionActive;
