import React, { useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import CountdownTimer from '../CountdownTimer';
import QuestDetailsModal from './QuestDetailsModal';
import { CURRENCY_NAMES } from '../../config/constants';
import { Target, Gift, CheckCircle2, Apple, Dumbbell, Heart, Zap, Maximize2, Info, Diamond} from 'lucide-react';
import type { DailyAction, DailyQuest } from '../../types/quests';
// Affinity/domain glyphs come from the shared totem-details maps so every surface
// (gallery card, detail view, quests) uses the same icon set.
import { AFFINITY_ICONS, DOMAIN_ICONS } from '../../utils/totems';

const ACTION_ICONS: Record<DailyAction, React.ComponentType<{ className?: string }>> = {
  feed: Apple,
  train: Dumbbell,
  treat: Heart,
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const DailyQuestsCard: React.FC = () => {
  const { dailyQuests, dailyQuestsLoading, refreshDailyQuests, claimAllQuests, setDailyQuestWizardVisible } = useGame();
  const [detailsQuest, setDetailsQuest] = useState<DailyQuest | null>(null);

  useEffect(() => {
    refreshDailyQuests();
  }, [refreshDailyQuests]);

  if (dailyQuestsLoading && !dailyQuests) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-emerald-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Quests</h2>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      </div>
    );
  }
  if (!dailyQuests) return null;

  const { theme, quests, bonus } = dailyQuests;
  const AffinityIcon = AFFINITY_ICONS[cap(theme.affinity) as keyof typeof AFFINITY_ICONS];
  const DomainIcon = DOMAIN_ICONS[cap(theme.domain) as keyof typeof DOMAIN_ICONS];
  const ActionIcon = ACTION_ICONS[theme.action];

  const todayUTC = new Date().toISOString().slice(0, 10);
  const isStale = dailyQuests.date !== todayUTC;
  const claimableCount = quests.filter(q => q.progress >= q.goal && !q.claimed).length;
  const allComplete = quests.every(q => q.progress >= q.goal);
  const canClaim = !isStale && (claimableCount > 0 || (allComplete && !bonus.claimed));

  const totalEssenceToday = quests.reduce((s, q) => s + (q.claimed ? q.reward.essence : 0), 0)
    + (bonus.claimed ? bonus.reward.essence : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {detailsQuest && <QuestDetailsModal quest={detailsQuest} onClose={() => setDetailsQuest(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="w-6 h-6 text-emerald-500 shrink-0" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Quests</h2>
          <button
            onClick={() => setDailyQuestWizardVisible(true)}
            className="text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors p-1"
            aria-label="Open Daily Quests wizard"
            title="Open in floating wizard"
          >
            <Maximize2 size={14} />
          </button>
        </div>
        <div className="text-xs text-gray-900 dark:text-white shrink-0">
          <CountdownTimer option="midnight" onComplete={() => refreshDailyQuests(true)} />
        </div>
      </div>

      {isStale && (
        <div className="rounded-lg p-2 mb-3 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300 text-center">
          A new day's quests are loading…
        </div>
      )}

      {/* Theme strip */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <AffinityIcon className="w-3 h-3" /> {cap(theme.affinity)}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30 text-xs font-medium text-sky-700 dark:text-sky-300">
          <DomainIcon className="w-3 h-3" /> {cap(theme.domain)}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-xs font-medium text-amber-700 dark:text-amber-300">
          <ActionIcon className="w-3 h-3" /> {cap(theme.action)}
        </span>
      </div>

      {/* Quest rows — single-line layout. Tighter row gap (the rest of the old
          gap becomes row padding) so the whole-row tap target is taller without
          changing the list's overall height. */}
      <ul className="space-y-1 mb-4">
        {quests.map(q => {
          const pct = Math.min(100, Math.round((q.progress / q.goal) * 100));
          const done = q.progress >= q.goal;
          return (
            <li
              key={q.slot}
              onClick={() => setDetailsQuest(q)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailsQuest(q); } }}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${q.name}`}
              title={q.description}
              className="flex items-center gap-2 py-1 text-base cursor-pointer rounded-lg -mx-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors"
            >
              {q.claimed
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                : <span className={`w-5 h-5 rounded-full shrink-0 ${done ? 'bg-emerald-400' : 'border border-gray-300 dark:border-gray-600'}`} />}
              <span className={`flex-1 min-w-0 truncate ${q.claimed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                {q.name}
              </span>
              {/* Static cue that the row opens details (the whole row is the button). */}
              <Info size={14} className="text-gray-400 shrink-0" aria-hidden />
              <div className="w-12 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 shrink-0">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${q.claimed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums w-8 text-right shrink-0">
                {Math.min(q.progress, q.goal)}/{q.goal}
              </span>
              <span className="inline-flex items-center gap-0.5 text-sm text-gray-500 dark:text-gray-400 w-12 justify-end shrink-0">
                <Zap className="w-3.5 h-3.5 text-purple-500" />+{q.reward.essence}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Bonus callout */}
      <div className={`rounded-lg p-3 mb-4 mt-auto ${allComplete ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-700/40'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className={`w-4 h-4 ${allComplete ? 'text-amber-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {bonus.claimed ? 'Bonus claimed' : allComplete ? 'Bonus ready!' : 'Complete all 5 for bonus'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-purple-500" />
            <span className={`font-bold ${bonus.claimed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
              +{bonus.reward.essence}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{CURRENCY_NAMES.SOFT}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <Diamond className="w-3 h-3" />
          <span>+ random rune</span>
        </div>
      </div>

      {/* Claim All */}
      <button
        onClick={() => claimAllQuests()}
        disabled={!canClaim}
        className={`w-full py-2 px-4 min-h-[44px] rounded-lg transition-colors ${
          canClaim
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isStale
          ? 'Refreshing…'
          : canClaim
            ? (allComplete && !bonus.claimed ? `Claim All + Bonus` : `Claim ${claimableCount} Reward${claimableCount === 1 ? '' : 's'}`)
            : (totalEssenceToday > 0 ? `Claimed today: +${totalEssenceToday}` : 'Nothing to claim yet')}
      </button>
    </div>
  );
};

export default DailyQuestsCard;
