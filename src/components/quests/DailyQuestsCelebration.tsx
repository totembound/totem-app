import React, { useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useUser } from '../../contexts/UserContext';
import DailyQuestsCompleteModal from './DailyQuestsCompleteModal';
import type { QuestRunesAwarded } from '../../types/quests';

const COMPLETE_SEEN_KEY = 'dq_complete_seen_for';

// Mounts at App level (independent of wizard visibility) so the daily-bonus
// celebration always fires the first time the bonus flips claimed on any given
// quest date. Tying the seen flag to dailyQuests.date guards against UTC
// rollover replays of yesterday's bonus.
const DailyQuestsCelebration: React.FC = () => {
  const { isSignedUp } = useUser();
  const { dailyQuests, lastQuestBonusRunes } = useGame();
  const [showComplete, setShowComplete] = useState(false);
  const [payload, setPayload] = useState<{ total: number; bonus: number; runes: QuestRunesAwarded | null } | null>(null);

  useEffect(() => {
    if (!isSignedUp) return;
    if (!dailyQuests || !dailyQuests.bonus.claimed) return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(COMPLETE_SEEN_KEY) === dailyQuests.date) return;
    const today = new Date().toISOString().slice(0, 10);
    if (dailyQuests.date !== today) return;

    const total = dailyQuests.quests.reduce((s, q) => s + (q.claimed ? q.reward.essence : 0), 0)
      + dailyQuests.bonus.reward.essence;
    setPayload({ total, bonus: dailyQuests.bonus.reward.essence, runes: lastQuestBonusRunes });
    setShowComplete(true);
    localStorage.setItem(COMPLETE_SEEN_KEY, dailyQuests.date);
  }, [isSignedUp, dailyQuests, lastQuestBonusRunes]);

  if (!showComplete || !payload) return null;
  return (
    <DailyQuestsCompleteModal
      totalEssence={payload.total}
      bonusEssence={payload.bonus}
      runesAwarded={payload.runes}
      onClose={() => setShowComplete(false)}
    />
  );
};

export default DailyQuestsCelebration;
