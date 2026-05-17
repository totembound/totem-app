import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { withVillagePrefix } from '../village/villagePath';
import { CURRENCY_NAMES } from '../../config/constants';
import type { DailyQuest } from '../../types/quests';

interface QuestDetailsModalProps {
  quest: DailyQuest;
  onClose: () => void;
}

interface QuestRoute {
  tip: string;
  ctaLabel: string;
  route: string | null;
}

// Generic tips by trigger — covers most catalog entries. Per-quest overrides
// below handle variants where the generic tip would be misleading.
const TRIGGER_ROUTES: Record<string, QuestRoute> = {
  ACTION_FEED:    { tip: "Open one of your totems and tap Feed. Each feed increments the counter.", ctaLabel: "Go to Totems",       route: '/totems' },
  ACTION_TRAIN:   { tip: "Open a totem and tap Train. Training also grants 50 XP each time.",       ctaLabel: "Go to Totems",       route: '/totems' },
  ACTION_TREAT:   { tip: "Open a totem and tap Treat. Treats restore happiness.",                    ctaLabel: "Go to Totems",       route: '/totems' },
  CHALLENGE_COMPLETED: { tip: "Pick the matching challenge type and complete a run with any totem.", ctaLabel: "Go to Challenges",   route: '/challenges' },
  EXPEDITION_STARTED:  { tip: "Start an expedition in the matching domain. Send your strongest team.", ctaLabel: "Go to Expeditions", route: '/expeditions' },
  EXPEDITION_CLAIMED:  { tip: "Wait for an expedition to finish, then claim its rewards.",            ctaLabel: "Go to Expeditions", route: '/expeditions' },
};

// Per-quest-ID overrides for cases where the generic trigger tip is misleading
// (e.g., hard variants requiring multiple distinct actions, or generic "any X").
const QUEST_OVERRIDES: Record<string, Partial<QuestRoute>> = {
  dq_train_diff_2: { tip: "Train two different totems today — switch totems between trains so each one counts." },
  dq_challenge_1:  { tip: "Complete any challenge — strength, agility, or wisdom all count." },
  dq_challenge_3:  { tip: "Complete any 3 challenges today — strength, agility, or wisdom all count." },
  dq_expedition_start_1: { tip: "Start any expedition — any domain qualifies." },
  dq_expedition_claim_1: { tip: "Claim any finished expedition's reward today." },
  dq_expedition_24h:  { tip: "Start a 24-hour expedition. Any domain qualifies — pick whatever fits your team." },
  dq_expedition_claim_2: { tip: "Claim 2 finished expeditions today. Plan ahead: send teams early so they're ready to claim." },
};

// Match the catalog `trigger` strings via a lookup — falls back gracefully.
function getQuestRoute(questId: string, trigger: string | undefined): QuestRoute {
  const base = (trigger && TRIGGER_ROUTES[trigger])
    || { tip: 'Keep playing — progress will register automatically.', ctaLabel: 'Got it', route: null };
  const override = QUEST_OVERRIDES[questId];
  return override ? { ...base, ...override } : base;
}

// Catalog data isn't on the runtime DailyQuest object — so we infer the trigger
// from the quest id prefix. Card/wizard could pass trigger through later for
// full fidelity, but id-based inference covers every catalog entry today.
// Catalog scope (v1.1.0): totem actions (feed/train/treat) + challenges + expeditions only.
function inferTrigger(questId: string): string {
  if (questId.startsWith('dq_feed')) return 'ACTION_FEED';
  if (questId.startsWith('dq_train')) return 'ACTION_TRAIN';
  if (questId.startsWith('dq_treat')) return 'ACTION_TREAT';
  if (questId.startsWith('dq_challenge')) return 'CHALLENGE_COMPLETED';
  if (questId.startsWith('dq_expedition_start') || questId === 'dq_expedition_24h') return 'EXPEDITION_STARTED';
  if (questId.startsWith('dq_expedition_claim')) return 'EXPEDITION_CLAIMED';
  return 'UNKNOWN';
}

const QuestDetailsModal: React.FC<QuestDetailsModalProps> = ({ quest, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const meta = getQuestRoute(quest.id, inferTrigger(quest.id));
  const done = quest.progress >= quest.goal;

  const handleGo = () => {
    if (meta.route) {
      navigate(withVillagePrefix(location.pathname, meta.route));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full max-w-md mx-0 sm:mx-4 bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-3 pr-6">
          <div className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            {quest.tier} quest · slot {quest.slot}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{quest.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{quest.description}</p>
        </div>

        <div className="rounded-lg p-3 mb-4 bg-gray-50 dark:bg-gray-700/40">
          <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">How to complete</div>
          <p className="text-sm text-gray-800 dark:text-gray-200">{meta.tip}</p>
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-2">
            {quest.claimed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600 dark:text-gray-400">Already claimed</span>
              </>
            ) : done ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-700 dark:text-gray-200">Complete · ready to claim</span>
              </>
            ) : (
              <span className="text-gray-700 dark:text-gray-200 tabular-nums">
                Progress: {Math.min(quest.progress, quest.goal)} / {quest.goal}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-200">
            <Zap className="w-4 h-4 text-purple-500" />
            <span className="font-bold">+{quest.reward.essence}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{CURRENCY_NAMES.SOFT}</span>
          </div>
        </div>

        <button
          onClick={handleGo}
          className="w-full py-2.5 min-h-[44px] rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center gap-2"
        >
          {meta.ctaLabel}
          {meta.route && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
};

export default QuestDetailsModal;
