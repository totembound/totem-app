export type Affinity = 'strength' | 'agility' | 'wisdom';
export type Domain = 'air' | 'earth' | 'water';
export type DailyAction = 'feed' | 'train' | 'treat';
export type QuestTier = 'easy' | 'medium' | 'hard';
export type QuestSlot = 1 | 2 | 3 | 4 | 5;

export interface QuestTheme {
  affinity: Affinity;
  domain: Domain;
  action: DailyAction;
}

export interface QuestReward {
  essence: number;
}

export interface DailyQuest {
  slot: QuestSlot;
  id: string;
  name: string;
  description: string;
  tier: QuestTier;
  goal: number;
  progress: number;
  claimed: boolean;
  reward: QuestReward;
  completed: boolean;
}

export interface QuestBonus {
  reward: QuestReward;
  claimed: boolean;
  unlocked: boolean;
}

export interface DailyQuestSet {
  date: string;
  theme: QuestTheme;
  nextResetAt: string;
  quests: DailyQuest[];
  bonus: QuestBonus;
  /** Subscription tier reward multiplier (1 free / 2 premium / 3 vip). Quest
   *  essence values are already scaled by this server-side. */
  tierMultiplier?: number;
}

export interface QuestClaimedEntry {
  questId: string;
  reward: QuestReward;
}

export interface QuestRunesAwarded {
  lesser?: number;
  greater?: number;
  ancient?: number;
}

export interface QuestAchievementUnlock {
  achievementId: string;
  milestone?: number;
  newMilestones?: number[];
  rewards?: { essence?: number; xp?: number };
}

export interface QuestClaimResponse {
  claimed: QuestClaimedEntry[];
  bonusClaimed: boolean;
  totalEssenceAwarded: number;
  newEssenceBalance: number;
  nextResetAt: string;
  runesAwarded?: QuestRunesAwarded | null;
  achievements?: QuestAchievementUnlock[];
}

export interface QuestProgressUpdate {
  slot: QuestSlot;
  newProgress: number;
}
