import React, { useEffect } from 'react';
import { PartyPopper, Sparkles, X, Zap, Diamond } from 'lucide-react';
import CountdownTimer from '../CountdownTimer';
import { CURRENCY_NAMES } from '../../config/constants';
import type { QuestRunesAwarded } from '../../types/quests';

interface DailyQuestsCompleteModalProps {
  totalEssence: number;
  bonusEssence: number;
  runesAwarded?: QuestRunesAwarded | null;
  onClose: () => void;
  autoCloseMs?: number;
}

const RUNE_STYLES: Record<keyof QuestRunesAwarded, { label: string; color: string }> = {
  lesser:  { label: 'Lesser Rune',  color: 'text-stone-300 dark:text-stone-200' },
  greater: { label: 'Greater Rune', color: 'text-sky-400' },
  ancient: { label: 'Ancient Rune', color: 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' },
};

const DailyQuestsCompleteModal: React.FC<DailyQuestsCompleteModalProps> = ({
  totalEssence,
  bonusEssence,
  runesAwarded,
  onClose,
  autoCloseMs = 6000,
}) => {
  const runeKey = (runesAwarded && Object.keys(runesAwarded).find(k => (runesAwarded as Record<string, number>)[k] > 0)) as keyof QuestRunesAwarded | undefined;
  const runeStyle = runeKey ? RUNE_STYLES[runeKey] : null;
  useEffect(() => {
    if (!autoCloseMs) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [autoCloseMs, onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center pt-8 sm:pt-0 overflow-y-auto">
      <div className="relative w-full max-w-sm mx-4 mb-4 animate-fade-in">
        <div className="absolute -inset-1">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-xl blur opacity-30 animate-pulse" />
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-emerald-300 dark:border-emerald-600 p-6">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="text-center space-y-4">
            <div className="flex justify-center gap-2">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              <PartyPopper className="w-8 h-8 text-emerald-500" />
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Daily Quests Complete!
            </h2>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Zap className="w-5 h-5 text-purple-500" />
                <span>+{totalEssence}</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{CURRENCY_NAMES.SOFT}</span>
              </div>
              {bonusEssence > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Includes +{bonusEssence} completion bonus
                </p>
              )}
              {runeStyle && (
                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-emerald-200/40 dark:border-emerald-700/40">
                  <Diamond className={`w-5 h-5 ${runeStyle.color}`} />
                  <span className={`font-semibold ${runeStyle.color}`}>+1 {runeStyle.label}</span>
                </div>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              The Ancients reward those who walk the daily path. Come back tomorrow for new quests in{' '}
              <CountdownTimer option="midnight" />.
            </p>

            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 min-h-[44px] bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyQuestsCompleteModal;
