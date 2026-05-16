import React, { useEffect, useState } from 'react';
import { Flame, Minus, Maximize2, X, CheckCircle2, Gift, Zap, Sword, Wind, Mountain, Droplet, Apple, Dumbbell, Heart, Sparkles, Info, Diamond } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useUser } from '../../contexts/UserContext';
import CountdownTimer from '../CountdownTimer';
import DailyQuestsCompleteModal from './DailyQuestsCompleteModal';
import QuestDetailsModal from './QuestDetailsModal';
import { CURRENCY_NAMES } from '../../config/constants';
import type { Affinity, Domain, DailyAction, DailyQuest } from '../../types/quests';

const AFFINITY_ICONS: Record<Affinity, React.ComponentType<{ className?: string }>> = {
  strength: Sword,
  agility: Wind,
  wisdom: Sparkles,
};

const DOMAIN_ICONS: Record<Domain, React.ComponentType<{ className?: string }>> = {
  air: Wind,
  earth: Mountain,
  water: Droplet,
};

const ACTION_ICONS: Record<DailyAction, React.ComponentType<{ className?: string }>> = {
  feed: Apple,
  train: Dumbbell,
  treat: Heart,
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const COMPLETE_SEEN_KEY = 'dq_complete_seen_for';

const DailyQuestWizard: React.FC = () => {
  const { isSignedUp } = useUser();
  const { dailyQuests, refreshDailyQuests, claimAllQuests, dailyQuestWizardVisible, setDailyQuestWizardVisible, lastQuestBonusRunes } = useGame();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completePayload, setCompletePayload] = useState<{ total: number; bonus: number; runes: typeof lastQuestBonusRunes } | null>(null);
  const [detailsQuest, setDetailsQuest] = useState<DailyQuest | null>(null);

  const todayUTC = new Date().toISOString().slice(0, 10);

  // Initial fetch.
  useEffect(() => {
    if (isSignedUp) refreshDailyQuests();
  }, [isSignedUp, refreshDailyQuests]);

  // Fire celebration modal once per quest-set when bonus claimed flips true.
  // Guard against UTC rollover: tie the seen-flag to the quest record's own date
  // (dailyQuests.date), not new Date(). Otherwise yesterday's claimed bonus could
  // re-fire the modal after midnight if a refresh hasn't yet landed today's set.
  useEffect(() => {
    if (!dailyQuests) return;
    if (!dailyQuests.bonus.claimed) return;
    if (dailyQuests.date !== todayUTC) return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(COMPLETE_SEEN_KEY) === dailyQuests.date) return;
    const total = dailyQuests.quests.reduce((s, q) => s + (q.claimed ? q.reward.essence : 0), 0)
      + dailyQuests.bonus.reward.essence;
    setCompletePayload({ total, bonus: dailyQuests.bonus.reward.essence, runes: lastQuestBonusRunes });
    setShowComplete(true);
    localStorage.setItem(COMPLETE_SEEN_KEY, dailyQuests.date);
  }, [dailyQuests, todayUTC, lastQuestBonusRunes]);

  const close = () => setDailyQuestWizardVisible(false);

  if (!isSignedUp) return null;
  if (!dailyQuests) return null;
  if (!dailyQuestWizardVisible && !showComplete) return null;

  const { theme, quests, bonus } = dailyQuests;
  const AffinityIcon = AFFINITY_ICONS[theme.affinity];
  const DomainIcon = DOMAIN_ICONS[theme.domain];
  const ActionIcon = ACTION_ICONS[theme.action];

  const isStale = dailyQuests.date !== todayUTC;
  const claimableCount = quests.filter(q => q.progress >= q.goal && !q.claimed).length;
  const allComplete = quests.every(q => q.progress >= q.goal);
  const canClaim = !isStale && (claimableCount > 0 || (allComplete && !bonus.claimed));
  const allClaimed = quests.every(q => q.claimed) && bonus.claimed;

  // Once everything is claimed for the day, don't keep showing the wizard.
  if (allClaimed && !showComplete && !isStale) return null;

  return (
    <>
      {showComplete && completePayload && (
        <DailyQuestsCompleteModal
          totalEssence={completePayload.total}
          bonusEssence={completePayload.bonus}
          runesAwarded={completePayload.runes}
          onClose={() => setShowComplete(false)}
        />
      )}
      {detailsQuest && <QuestDetailsModal quest={detailsQuest} onClose={() => setDetailsQuest(null)} />}
      {dailyQuestWizardVisible && (
        <div
          className="daily-quest-wizard fixed sm:bottom-6 right-2 w-96 max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out z-50 border border-gray-200 dark:border-gray-700"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-900/20 dark:to-amber-900/20">
            <div className="flex items-center gap-2 min-w-0">
              <Flame className="w-5 h-5 text-orange-500 shrink-0" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Daily Quests</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                · <CountdownTimer option="midnight" onComplete={() => refreshDailyQuests(true)} />
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
              </button>
              <button
                onClick={close}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {isStale && (
                <div className="rounded-lg p-2 mb-3 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300 text-center">
                  A new day's quests are loading…
                </div>
              )}

              {/* Theme badge */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <AffinityIcon className="w-3 h-3" /> {cap(theme.affinity)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-xs font-medium text-sky-700 dark:text-sky-300">
                  <DomainIcon className="w-3 h-3" /> {cap(theme.domain)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-xs font-medium text-amber-700 dark:text-amber-300">
                  <ActionIcon className="w-3 h-3" /> {cap(theme.action)}
                </span>
              </div>

              {/* Quest rows */}
              <ul className="space-y-2 mb-3">
                {quests.map(q => {
                  const done = q.progress >= q.goal;
                  return (
                    <li key={q.slot} className="flex items-center gap-2 text-sm">
                      {q.claimed
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <span className={`w-4 h-4 rounded-full shrink-0 ${done ? 'bg-emerald-400' : 'border border-gray-300 dark:border-gray-600'}`} />}
                      <span
                        className={`flex-1 truncate ${q.claimed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}
                        title={q.description}
                      >
                        {q.name}
                      </span>
                      <button
                        onClick={() => setDetailsQuest(q)}
                        className="text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors p-0.5 shrink-0"
                        aria-label={`Details for ${q.name}`}
                        title={q.description}
                      >
                        <Info size={14} />
                      </button>
                      <div className="w-14 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 shrink-0">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${q.claimed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                          style={{ width: `${Math.min(100, Math.round((q.progress / q.goal) * 100))}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0 w-8 text-right">
                        {Math.min(q.progress, q.goal)}/{q.goal}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400 shrink-0 w-10 justify-end">
                        <Zap className="w-3 h-3 text-purple-500" />+{q.reward.essence}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Bonus footer */}
              <div className={`rounded-lg p-3 ${allComplete ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-700/40'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Gift className={`w-4 h-4 ${allComplete ? 'text-amber-500' : 'text-gray-400'}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {bonus.claimed ? 'Bonus claimed' : allComplete ? 'Bonus ready!' : 'All 5 for bonus'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                      <span className={`font-bold text-sm ${bonus.claimed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                        +{bonus.reward.essence}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{CURRENCY_NAMES.SOFT}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Diamond className="w-3 h-3" />
                      <span>+ random rune</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => claimAllQuests()}
                  disabled={!canClaim}
                  className={`w-full py-2 px-3 min-h-[44px] rounded-lg transition-colors text-sm font-medium ${
                    canClaim
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isStale
                    ? 'Refreshing…'
                    : canClaim
                      ? (allComplete && !bonus.claimed ? 'Claim All + Bonus' : `Claim ${claimableCount} Reward${claimableCount === 1 ? '' : 's'}`)
                      : 'Keep playing to make progress'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DailyQuestWizard;
