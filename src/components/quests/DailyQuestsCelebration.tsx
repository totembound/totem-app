import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useUser } from '../../contexts/UserContext';
import DailyQuestsCompleteModal from './DailyQuestsCompleteModal';
import type { QuestRunesAwarded } from '../../types/quests';

// Mounts at App level (independent of wizard visibility) so the daily-bonus
// celebration always fires when bonus.claimed transitions false → true.
//
// Transition-based (not localStorage-based) so the partial-then-final claim
// flow still fires the modal: a per-day "seen" flag bailed once anything in
// today's session set it, which broke when a previous handler (since removed)
// wrote it for the same date.
type LastSeen = { date: string; claimed: boolean };

const DailyQuestsCelebration: React.FC = () => {
  const { isSignedUp } = useUser();
  const { dailyQuests, lastQuestBonusRunes } = useGame();
  const [showComplete, setShowComplete] = useState(false);
  const [payload, setPayload] = useState<{ total: number; bonus: number; runes: QuestRunesAwarded | null } | null>(null);
  const lastSeenRef = useRef<LastSeen | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('dq_complete_seen_for'); }
      catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!isSignedUp || !dailyQuests) return;

    const currentClaimed = dailyQuests.bonus.claimed;
    const currentDate = dailyQuests.date;
    const lastSeen = lastSeenRef.current;

    // Update ref first so we always reflect what we've observed.
    lastSeenRef.current = { date: currentDate, claimed: currentClaimed };

    // Initial observation (page load / mount): never fires. If bonus was
    // already claimed earlier today, that's history — don't re-celebrate.
    if (lastSeen === null) return;

    // New quest day: reset baseline, don't fire (yesterday's claim is stale).
    if (lastSeen.date !== currentDate) return;

    // Only fire on the false → true transition within the same quest day.
    if (lastSeen.claimed || !currentClaimed) return;

    const today = new Date().toISOString().slice(0, 10);
    if (currentDate !== today) return;

    const total = dailyQuests.quests.reduce((s, q) => s + (q.claimed ? q.reward.essence : 0), 0)
      + dailyQuests.bonus.reward.essence;
    setPayload({ total, bonus: dailyQuests.bonus.reward.essence, runes: lastQuestBonusRunes });
    setShowComplete(true);
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
