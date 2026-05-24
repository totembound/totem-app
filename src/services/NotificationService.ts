/**
 * NotificationService - Web2 REST API Notification Service
 *
 * Provides a simple interface for showing notifications from REST API responses.
 * Replaces contract event listeners with direct function calls after API success.
 */

import {
  NotificationType,
  NotificationScope,
  NotificationPriority,
} from "../types/notifications";
import { CURRENCY_NAMES } from "../config/constants";
import { formatTokenAmount, splitWords } from "../utils/formats";
import { getAchievementById } from "../config/achievements";
import { LOOT_BOXES } from "../config/loot-boxes";

/**
 * Data interfaces for different notification types
 */
export interface ActionNotificationData {
  totemId: string;
  actionType: "feed" | "train" | "treat";
  xpGained?: number;
  newExperience?: number;
  statChanges?: Record<string, number>;
  message?: string;
}

export interface EvolutionNotificationData {
  totemId: string;
  previousStage: number;
  newStage: number;
  newStageName?: string;
  newDisplayName?: string;
}

export interface RewardNotificationData {
  rewardType: "daily" | "weekly" | "one_time";
  amount: number;
  streakDays?: number;
  streakBonus?: number;
  experienceReward?: number;
  totemId?: string;
}

export interface ChallengeNotificationData {
  challengeId: string;
  challengeName: string;
  totemId: string;
  score: number;
  isHighScore?: boolean;
}

export interface ExpeditionNotificationData {
  expeditionId: string;
  expeditionName?: string;
  totemIds: string[];
  experienceGained?: number;
  essenceGained?: number;
  runesGained?: {
    lesser: number;
    greater: number;
    ancient: number;
  };
  score?: number;
}

export interface AchievementRewards {
  essence?: number;
  xp?: number;
  newEssenceBalance?: number;
  newTotemExp?: number;
  lootBox?: { id: string; boxId: string; source?: string };
  lootBoxes?: Array<{ id: string; boxId: string; source?: string }>;
}

export interface AchievementNotificationData {
  achievementId: string;
  achievementName: string;
  badgeUri?: string;
  rewards?: AchievementRewards;
}

export interface MilestoneNotificationData {
  achievementId: string;
  achievementName?: string;
  milestoneIndex: number;
  badgeUri?: string;
  rewards?: AchievementRewards;
}

export interface PurchaseNotificationData {
  tokenId: string;
  rarity?: string;
  species?: string;
  amount?: string;
  bundleId?: string;
}

/**
 * Notification callback type - used to send notifications to the hook
 */
export type NotificationCallback = (
  type: NotificationType,
  message: string,
  scope?: NotificationScope,
  priority?: NotificationPriority,
  data?: unknown,
  userId?: string
) => Promise<void>;

/**
 * NotificationService class
 *
 * Provides typed methods for showing notifications based on REST API responses.
 * Initialize with the addNotification callback from useNotifications hook.
 */
class NotificationService {
  private addNotification: NotificationCallback | null = null;
  private userId: string | null = null;

  /**
   * Initialize the service with the notification callback
   */
  initialize(callback: NotificationCallback, userId?: string): void {
    console.log('[NotificationService] initialize called, userId:', userId, 'hasCallback:', !!callback);
    this.addNotification = callback;
    this.userId = userId || null;
  }

  /**
   * Set/update the current user ID
   */
  setUserId(id: string | null): void {
    this.userId = id;
  }

  /**
   * Check if service is ready to send notifications
   */
  isReady(): boolean {
    return this.addNotification !== null;
  }

  /**
   * Generic show notification method for custom notifications
   */
  async showNotification(
    type: NotificationType,
    message: string,
    data?: unknown,
    options?: {
      scope?: NotificationScope;
      priority?: NotificationPriority;
    }
  ): Promise<void> {
    if (!this.addNotification) {
      console.warn("[NotificationService] not initialized, dropping:", type, message);
      return;
    }

    console.log('[NotificationService] showNotification:', type, message);
    await this.addNotification(
      type,
      message,
      options?.scope || NotificationScope.PERSONAL,
      options?.priority || NotificationPriority.MEDIUM,
      data,
      this.userId || undefined
    );
  }

  /**
   * Show notification for action performed (feed, train, treat)
   */
  async showActionPerformed(data: ActionNotificationData): Promise<void> {
    const actionNames: Record<string, string> = {
      feed: "fed",
      train: "trained",
      treat: "treated",
    };

    const actionVerb = actionNames[data.actionType] || "interacted with";
    let message = `You ${actionVerb} your totem`;

    if (data.xpGained) {
      message += ` (+${data.xpGained} XP)`;
    }

    await this.showNotification(NotificationType.ACTION_PERFORMED, message, data, {
      priority: NotificationPriority.LOW,
    });
  }

  /**
   * Show notification for totem evolution
   */
  async showTotemEvolved(data: EvolutionNotificationData & { totemLabel?: string }): Promise<void> {
    const stageName = data.newStageName || `Stage ${data.newStage + 1}`;
    // Prefer the explicit totemLabel (nickname or pre-evolve display name) over
    // the post-evolve newDisplayName so the user recognizes the totem they acted on.
    const subject = data.totemLabel
      ? `Your ${data.totemLabel}`
      : (data.newDisplayName || 'Your totem');
    const message = `${subject} evolved to ${stageName}!`;

    await this.showNotification(NotificationType.TOTEM_EVOLVED, message, data, {
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Show notification for a single daily quest claim — small Essence toast.
   */
  async showQuestClaimed(data: { questName: string; essence: number }): Promise<void> {
    const message = `Quest complete: ${data.questName} (+${data.essence} ${CURRENCY_NAMES.SOFT})`;
    await this.showNotification(NotificationType.QUEST_CLAIMED, message, data, {
      priority: NotificationPriority.LOW,
    });
  }

  /**
   * Show notification for full daily quest set + bonus claimed — the celebration.
   */
  async showQuestSetCompleted(data: { totalEssence: number; bonusEssence: number; questsCompleted: number; runesAwarded?: { lesser?: number; greater?: number; ancient?: number } | null }): Promise<void> {
    let runeSuffix = '';
    if (data.runesAwarded) {
      if (data.runesAwarded.ancient) runeSuffix = ' +1 Ancient Rune';
      else if (data.runesAwarded.greater) runeSuffix = ' +1 Greater Rune';
      else if (data.runesAwarded.lesser) runeSuffix = ' +1 Lesser Rune';
    }
    const message = `Daily Quests complete! +${data.totalEssence} ${CURRENCY_NAMES.SOFT} (incl. ${data.bonusEssence} bonus)${runeSuffix}`;
    await this.showNotification(NotificationType.QUEST_SET_COMPLETED, message, data, {
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Show notification for reward claimed (daily/weekly)
   */
  async showRewardClaimed(data: RewardNotificationData): Promise<void> {
    const formattedAmount = formatTokenAmount(data.amount.toString());
    let message: string;

    if (data.rewardType === "daily") {
      const streakDay = data.streakDays || 1;
      if (data.streakBonus && data.streakBonus > 0) {
        const baseAmount = data.amount - data.streakBonus;
        message = `Daily Reward: +${formattedAmount} ${CURRENCY_NAMES.SOFT} (${baseAmount} + ${data.streakBonus} streak bonus, Day ${streakDay})`;
      } else {
        message = `Daily Reward: +${formattedAmount} ${CURRENCY_NAMES.SOFT} (Day ${streakDay} streak)`;
      }
    } else if (data.rewardType === "weekly") {
      message = `Weekly bonus: ${formattedAmount} ${CURRENCY_NAMES.SOFT}!`;
    } else {
      message = `You claimed ${formattedAmount} ${CURRENCY_NAMES.SOFT}!`;
    }

    await this.showNotification(NotificationType.REWARD_CLAIMED, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Show notification for challenge completed
   */
  async showChallengeCompleted(data: ChallengeNotificationData): Promise<void> {
    const message = `Completed ${data.challengeName} with a score of ${data.score}!`;

    await this.showNotification(NotificationType.CHALLENGE_COMPLETED, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Show notification for high score set
   */
  async showHighScoreSet(data: ChallengeNotificationData): Promise<void> {
    const message = `New high score: ${data.score} on ${data.challengeName}!`;

    await this.showNotification(NotificationType.HIGH_SCORE_SET, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Show notification for expedition started
   */
  async showExpeditionStarted(data: ExpeditionNotificationData): Promise<void> {
    const message = `You started an expedition with ${data.totemIds.length} totems.`;

    await this.showNotification(NotificationType.EXPEDITION_STARTED, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Show notification for expedition completed
   */
  async showExpeditionCompleted(data: ExpeditionNotificationData): Promise<void> {
    const message = `Your expedition team has returned! Claim your rewards.`;

    await this.showNotification(NotificationType.EXPEDITION_COMPLETED, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Show notification for expedition rewards claimed
   */
  async showExpeditionRewards(data: ExpeditionNotificationData): Promise<void> {
    const runesGained = data.runesGained || { lesser: 0, greater: 0, ancient: 0 };
    const totalRunes = runesGained.lesser + runesGained.greater + runesGained.ancient;

    const score = data.score || 0;
    const isGreatSuccess = score >= 90;
    const isSuccess = score >= 70;
    const statusText = isGreatSuccess ? "Great Success!" : isSuccess ? "Success!" : "Completed.";

    const rewardParts: string[] = [];
    if (data.essenceGained) rewardParts.push(`+${data.essenceGained} Essence`);
    if (data.experienceGained) rewardParts.push(`+${data.experienceGained} XP`);
    if (totalRunes > 0) {
      const runeParts: string[] = [];
      if (runesGained.lesser > 0) runeParts.push(`${runesGained.lesser} Lesser`);
      if (runesGained.greater > 0) runeParts.push(`${runesGained.greater} Greater`);
      if (runesGained.ancient > 0) runeParts.push(`${runesGained.ancient} Ancient`);
      rewardParts.push(runeParts.join(', ') + ` Rune${totalRunes !== 1 ? 's' : ''}`);
    }

    const expName = data.expeditionName ? `"${data.expeditionName}" ` : '';
    const message = `Expedition ${expName}${statusText} ${rewardParts.join(', ')}`;

    await this.showNotification(NotificationType.EXPEDITION_REWARDS, message, data, {
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Show notification for sanctum Essence claimed
   */
  async showSanctumClaimed(data: { totalClaimed: number }): Promise<void> {
    const message = `Claimed ${data.totalClaimed.toLocaleString()} Essence from the Elder Sanctum`;
    await this.showNotification(NotificationType.SANCTUM_CLAIMED, message, data, {
      priority: NotificationPriority.LOW,
    });
  }

  /**
   * Show notification for council mission rewards claimed
   */
  async showMissionRewards(data: { missionName: string; xp: number; runesGained: { lesser: number; greater: number; ancient: number } }): Promise<void> {
    const totalRunes = data.runesGained.lesser + data.runesGained.greater + data.runesGained.ancient;

    const rewardParts: string[] = [];
    if (data.xp) rewardParts.push(`+${data.xp} XP`);
    if (totalRunes > 0) {
      const runeParts: string[] = [];
      if (data.runesGained.lesser > 0) runeParts.push(`${data.runesGained.lesser} Lesser`);
      if (data.runesGained.greater > 0) runeParts.push(`${data.runesGained.greater} Greater`);
      if (data.runesGained.ancient > 0) runeParts.push(`${data.runesGained.ancient} Ancient`);
      rewardParts.push(runeParts.join(', ') + ` Rune${totalRunes !== 1 ? 's' : ''}`);
    }

    const message = `Mission "${data.missionName}" complete! ${rewardParts.join(', ')}`;

    await this.showNotification(NotificationType.MISSION_COMPLETE, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Format granted loot boxes into reward chips (e.g. "+Rare Totem Box").
   * Handles both the one-time `lootBox` and the milestone `lootBoxes` array.
   */
  private lootBoxRewardParts(rewards?: AchievementRewards): string[] {
    const boxes = rewards?.lootBoxes ?? (rewards?.lootBox ? [rewards.lootBox] : []);
    return boxes
      .map(b => LOOT_BOXES[b.boxId]?.name)
      .filter((name): name is string => Boolean(name))
      .map(name => `+${name}`);
  }

  /**
   * Show notification for achievement unlocked
   */
  async showAchievementUnlocked(data: AchievementNotificationData & { totemLabel?: string }): Promise<void> {
    const subject = data.totemLabel ? `Your ${data.totemLabel} unlocked` : 'Unlocked';
    let message = `${subject} Achievement "${data.achievementName}"!`;
    const rewardParts: string[] = [];
    if (data.rewards?.essence) rewardParts.push(`+${data.rewards.essence} ${CURRENCY_NAMES.SOFT}`);
    if (data.rewards?.xp) rewardParts.push(`+${data.rewards.xp} XP`);
    rewardParts.push(...this.lootBoxRewardParts(data.rewards));
    if (rewardParts.length > 0) message += ` ${rewardParts.join(', ')}`;

    await this.showNotification(NotificationType.ACHIEVEMENT_UNLOCKED, message, data, {
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Show notification for milestone unlocked
   */
  async showMilestoneUnlocked(data: MilestoneNotificationData & { totemLabel?: string }): Promise<void> {
    const subject = data.totemLabel ? `Your ${data.totemLabel} unlocked` : 'Unlocked';
    const name = data.achievementName ? ` "${data.achievementName}"` : '';
    let message = `${subject} Milestone${name}!`;
    const rewardParts: string[] = [];
    if (data.rewards?.essence) rewardParts.push(`+${data.rewards.essence} ${CURRENCY_NAMES.SOFT}`);
    if (data.rewards?.xp) rewardParts.push(`+${data.rewards.xp} XP`);
    rewardParts.push(...this.lootBoxRewardParts(data.rewards));
    if (rewardParts.length > 0) message += ` ${rewardParts.join(', ')}`;

    await this.showNotification(NotificationType.MILESTONE_UNLOCKED, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Show notification for loot box claimed
   */
  async showLootClaimed(data: { boxName: string; resultType: string; species?: string; rarity?: string; colorName?: string; stageName?: string; amount?: number }): Promise<void> {
    let message: string;

    if (data.resultType === 'totem' && data.rarity && data.species) {
      // colorName arrives raw from the server (e.g. "CrimsonRed"); split to "Crimson Red" for display.
      const totemName = data.colorName && data.stageName
        ? `${splitWords(data.colorName)} ${data.stageName}`
        : `${data.rarity} ${data.species}`;
      message = `Opened ${data.boxName}: ${totemName} (${data.rarity} ${data.species})!`;
    } else if (data.resultType === 'essence' && data.amount) {
      message = `Opened ${data.boxName}: ${data.amount.toLocaleString()} ${CURRENCY_NAMES.SOFT}!`;
    } else {
      message = `Opened ${data.boxName}!`;
    }

    await this.showNotification(NotificationType.LOOT_CLAIMED, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Show notification for totem purchase
   */
  async showTotemPurchased(data: PurchaseNotificationData): Promise<void> {
    let message: string;

    if (data.rarity && data.species) {
      message = `New totem acquired: ${data.rarity} ${data.species}`;
    } else {
      message = `New totem acquired`;
    }

    if (data.amount) {
      message += ` for ${Number(data.amount).toLocaleString()} ${CURRENCY_NAMES.SOFT}`;
    }

    await this.showNotification(NotificationType.TOTEM_PURCHASE, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Show notification for totem forged (fusion)
   */
  async showTotemForged(data: { fusionType: 'pure' | 'wild'; speciesName: string; rarityName: string }): Promise<void> {
    const fusionLabel = data.fusionType === 'pure' ? 'Pure Fusion' : 'Wild Fusion';
    const message = `${fusionLabel} complete! Forged a ${data.rarityName} ${data.speciesName}`;

    await this.showNotification(NotificationType.TOTEM_FORGED, message, data, {
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Show notification for bundle purchase
   */
  async showBundlePurchased(data: PurchaseNotificationData): Promise<void> {
    let message: string;

    if (data.rarity && data.species) {
      message = `Bundle claimed! Received ${data.rarity} ${data.species}`;
    } else {
      message = `Bundle claimed! Received a new totem`;
    }

    await this.showNotification(NotificationType.BUNDLE_PURCHASED, message, data, {
      priority: NotificationPriority.MEDIUM,
    });
  }

  /**
   * Show notification for prestige reached
   */
  async showPrestigeReached(totemId: string, prestigeLevel: number): Promise<void> {
    const message = `Your totem reached Prestige Level ${prestigeLevel}!`;

    await this.showNotification(
      NotificationType.PRESTIGE_REACHED,
      message,
      { tokenId: totemId, prestigeLevel },
      { priority: NotificationPriority.HIGH }
    );
  }

  /**
   * Show notification for attribute/experience milestone
   */
  async showAttributeUpdate(
    totemId: string,
    experience: number,
    happiness?: number
  ): Promise<void> {
    // Only show for significant milestones
    if (experience % 500 === 0 || experience >= 7500) {
      const message = `Your totem reached ${experience.toLocaleString()} experience!`;

      await this.showNotification(
        NotificationType.ATTRIBUTE_UPDATED,
        message,
        { tokenId: totemId, experience, happiness },
        { priority: NotificationPriority.LOW }
      );
    }
  }
  /**
   * Process achievements array from API response and show notifications.
   * Call after any API response that includes an `achievements` array.
   *
   * @param achievements - Array of { achievementId, milestone, rewards }
   */
  async processAchievementsFromResponse(
    achievements?: Array<{
      achievementId: string;
      milestone?: number;
      newMilestones?: number[];
      rewards?: AchievementRewards;
    }>,
    totemLabel?: string
  ): Promise<void> {
    if (!achievements || achievements.length === 0) return;

    for (const ach of achievements) {
      let config;
      try {
        config = getAchievementById(ach.achievementId);
      } catch {
        // Config not loaded yet — use formatted ID as fallback
      }
      const achievementName = config?.name ||
        ach.achievementId.replace(/^ach_/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      const milestoneIndex = ach.milestone ?? ach.newMilestones?.[ach.newMilestones.length - 1];

      if (milestoneIndex !== undefined && milestoneIndex !== null && config?.milestones) {
        const milestoneConfig = config.milestones[milestoneIndex];
        await this.showMilestoneUnlocked({
          achievementId: ach.achievementId,
          achievementName: milestoneConfig?.name || achievementName,
          milestoneIndex,
          badgeUri: milestoneConfig?.badgeUri,
          rewards: ach.rewards,
          totemLabel,
        });
      } else {
        await this.showAchievementUnlocked({
          achievementId: ach.achievementId,
          achievementName,
          badgeUri: config?.badgeUri,
          rewards: ach.rewards,
          totemLabel,
        });
      }
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
