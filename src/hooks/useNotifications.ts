import { useEffect, useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESSES,
  createChallengesContract,
  createTotemNFTContract,
} from "../config/contracts";
import {
  Notification,
  NotificationType,
  NotificationScope,
  NotificationPriority,
  NOTIFICATION_CONFIG,
} from "../types/notifications";
import gameABI from "../contracts/TotemGame.abi.json";
import nftABI from "../contracts/TotemNFT.abi.json";
import shopABI from "../contracts/TotemShop.abi.json";
import rewardsABI from "../contracts/TotemRewards.abi.json";
import achievementsABI from "../contracts/TotemAchievements.abi.json";
import challengesABI from "../contracts/TotemChallenges.abi.json";
import { getUserStorage, setUserStorage } from "../utils/localStorage";
import { STORAGE_KEYS } from "../config/constants";
import { useUser } from "../contexts/UserContext";
import { useAchievements } from "../contexts/AchievementsContext";
import { Rarity, Species } from "../types/types";

const gameAddress = CONTRACT_ADDRESSES.game;
const nftAddress = CONTRACT_ADDRESSES.nft;
const shopAddress = CONTRACT_ADDRESSES.shop;
const rewardsAddress = CONTRACT_ADDRESSES.rewards;
const achievementsAddress = CONTRACT_ADDRESSES.achievements;
const challengesAddress = CONTRACT_ADDRESSES.challenges;

// Play notification sound
const playSound = (soundEnabled: boolean, soundType = "default") => {
  if (!soundEnabled) return;

  const audio = new Audio(`/sounds/${soundType}.mp3`);
  audio.volume = 0.3;
  audio
    .play()
    .catch((err) => console.error("Error playing notification sound:", err));
};

const getEnumKeyByValue = (enumObj: any, value: number): string => {
  return Object.keys(enumObj).find((key) => enumObj[key] === value) || "";
};

// Create a hash for deduplication
const hashMessage = async (
  message: string,
  type: string,
  data?: any
): Promise<string> => {
  const dataStr = data ? JSON.stringify(data) : "";
  const combined = `${message}_${type}_${dataStr}`;
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// Format addresses for display
const formatAddress = (address: string, length = 6) => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, length)}...${address.slice(-4)}`;
};

export function useNotifications() {
  const { address: userAddress, isConnected, getTotem } = useUser();
  const { getAchievementById } = useAchievements();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load saved notifications from localStorage on startup
    return getUserStorage<Notification[]>(
      STORAGE_KEYS.notifications,
      userAddress,
      []
    );
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    // Load sound setting from localStorage, default to true
    return getUserStorage<boolean>(
      STORAGE_KEYS.notificationSound,
      userAddress,
      true
    );
  });
  const [openPanel, setOpenPanel] = useState(false);
  const eventHashesRef = useRef(
    new Set<string>(notifications.map((n) => n.id))
  );
  const eventHashes = eventHashesRef.current;

  // Maximum number of notifications to keep in storage
  const [maxNotifications, setMaxNotifications] = useState<number>(() => {
    // Load max notifications setting from localStorage, default to 100
    return getUserStorage<number>(
      STORAGE_KEYS.maxNotifications,
      userAddress,
      100
    );
  });

  // Save notifications to localStorage
  const saveNotifications = useCallback(
    (notifs: Notification[]) => {
      if (!userAddress) return;

      // Sort by timestamp (newest first) and limit to max number
      const sorted = [...notifs].sort((a, b) => b.timestamp - a.timestamp);
      const limited = sorted.slice(0, maxNotifications);

      setUserStorage(STORAGE_KEYS.notifications, userAddress, limited);
    },
    [userAddress, maxNotifications]
  );

  // Toggle sound setting
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      if (userAddress) {
        setUserStorage(STORAGE_KEYS.notificationSound, userAddress, newValue);
      }
      return newValue;
    });
  }, [userAddress]);

  // Update notifications
  const updateNotifications = useCallback(
    (newNotifications: Notification[]) => {
      setNotifications(newNotifications);
      saveNotifications(newNotifications);
    },
    [saveNotifications]
  );

  const updateMaxNotifications = useCallback(
    (newMax: number) => {
      // Validate the input (ensure it's a reasonable number)
      const validatedMax = Math.max(10, Math.min(1000, newMax));

      setMaxNotifications(validatedMax);

      if (userAddress) {
        setUserStorage(
          STORAGE_KEYS.maxNotifications,
          userAddress,
          validatedMax
        );
      }

      // Immediately apply the new limit to current notifications
      if (notifications.length > validatedMax) {
        const sorted = [...notifications].sort(
          (a, b) => b.timestamp - a.timestamp
        );
        const limited = sorted.slice(0, validatedMax);
        updateNotifications(limited);
      }
    },
    [userAddress, notifications, updateNotifications]
  );

  const addNotification = useCallback(
    async (
      type: NotificationType,
      message: string,
      scope: NotificationScope = NotificationScope.PERSONAL,
      priority: NotificationPriority = NotificationPriority.MEDIUM,
      data?: any,
      address?: string
    ) => {
      const hash = await hashMessage(message, type, data);
      // Use setNotifications to get the latest state
      setNotifications((currentNotifications) => {
        // Check if notification with this hash already exists
        const existingIndex = currentNotifications.findIndex(
          (n) => n.id === hash
        );

        if (existingIndex >= 0) {
          // Update existing notification's timestamp
          const updatedNotifications = [...currentNotifications];
          updatedNotifications[existingIndex] = {
            ...updatedNotifications[existingIndex],
            timestamp: Date.now(),
            isRead: false, // Also mark as unread again
          };

          // Resort the array (newest first)
          updatedNotifications.sort((a, b) => b.timestamp - a.timestamp);

          // Add to hash set
          eventHashes.add(hash);

          // Save to localStorage
          saveNotifications(updatedNotifications);

          // Trigger notification behaviors
          const config = NOTIFICATION_CONFIG[type];
          if (config.autoOpen) {
            setOpenPanel(true);
          }
          playSound(soundEnabled);

          return updatedNotifications;
        } else {
          // Add new notification
          eventHashes.add(hash);

          const newNotification = {
            id: hash,
            type,
            message,
            isRead: false,
            timestamp: Date.now(),
            scope,
            priority,
            data,
            userAddress: address,
          };

          const newNotifications = [newNotification, ...currentNotifications];

          // Save to localStorage
          saveNotifications(newNotifications);

          // Trigger notification behaviors
          const config = NOTIFICATION_CONFIG[type];
          if (config.autoOpen) {
            setOpenPanel(true);
          }
          playSound(soundEnabled);

          return newNotifications;
        }
      });
    },
    [saveNotifications, setOpenPanel]
  );

  // Mark a notification as read
  const markAsRead = useCallback(
    (id: string) => {
      const updatedNotifications = notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      );
      updateNotifications(updatedNotifications);
    },
    [notifications, updateNotifications]
  );

  // Remove a notification
  const removeNotification = useCallback(
    (id: string) => {
      const updatedNotifications = notifications.filter(
        (notification) => notification.id !== id
      );
      eventHashes.delete(id);
      updateNotifications(updatedNotifications);
    },
    [notifications, updateNotifications]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      isRead: true,
    }));
    updateNotifications(updatedNotifications);
  }, [notifications, updateNotifications]);

  // Clear notifications that match certain criteria
  const clearNotifications = useCallback(
    (
      options: {
        types?: NotificationType[];
        olderThan?: number; // timestamp
        scope?: NotificationScope;
      } = {}
    ) => {
      const { types, olderThan, scope } = options;

      const updatedNotifications = notifications.filter((notification) => {
        // If type filter is provided, check if notification matches any type
        if (types && !types.includes(notification.type)) {
          return true; // Keep if not in the types to clear
        }

        // If timestamp filter is provided
        if (olderThan && notification.timestamp > olderThan) {
          return true; // Keep if not older than specified timestamp
        }

        // If scope filter is provided
        if (scope && notification.scope !== scope) {
          return true; // Keep if not matching the scope
        }

        // If we got here, this notification matches the clear criteria
        eventHashes.delete(notification.id);
        return false;
      });

      updateNotifications(updatedNotifications);
    },
    [notifications, updateNotifications]
  );

  // Filter notifications based on criteria
  const getFilteredNotifications = useCallback(
    (
      options: {
        types?: NotificationType[];
        scope?: NotificationScope;
        unreadOnly?: boolean;
        limit?: number;
      } = {}
    ) => {
      const { types, scope, unreadOnly, limit } = options;

      let filtered = [...notifications];

      if (types) {
        filtered = filtered.filter((n) => types.includes(n.type));
      }

      if (scope) {
        filtered = filtered.filter((n) => n.scope === scope);
      }

      if (unreadOnly) {
        filtered = filtered.filter((n) => !n.isRead);
      }

      // Sort by timestamp (newest first)
      filtered = filtered.sort((a, b) => b.timestamp - a.timestamp);

      if (limit && limit > 0) {
        filtered = filtered.slice(0, limit);
      }

      return filtered;
    },
    [notifications]
  );

  // Listen to contract events
  useEffect(() => {
    if (!window.ethereum || !isConnected || !userAddress) {
      return;
    }
    console.log("Setting up contract event listeners...");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const gameContract = new ethers.Contract(gameAddress, gameABI, provider);
    const nftContract = new ethers.Contract(nftAddress, nftABI, provider);
    const shopContract = new ethers.Contract(shopAddress, shopABI, provider);
    const rewardsContract = new ethers.Contract(
      rewardsAddress,
      rewardsABI,
      provider
    );
    const achievementsContract = new ethers.Contract(
      achievementsAddress,
      achievementsABI,
      provider
    );
    const challengesContract = new ethers.Contract(
      challengesAddress,
      challengesABI,
      provider
    );

    // Events from TotemGame
    const handleUserSignedUp = (user: string) => {
      addNotification(
        NotificationType.USER_SIGNUP,
        `New player joined: ${formatAddress(user)}`,
        NotificationScope.GLOBAL,
        NotificationPriority.LOW,
        { user }
      );
    };

    const handleActionPerformed = (tokenId: any, actionType: any) => {
      // Only show for user's own actions
      const actionNames = ["Fed", "Trained", "Treated"];
      const actionName = actionNames[Number(actionType)] || "Interacted with";

      addNotification(
        NotificationType.ACTION_PERFORMED,
        `You ${actionName.toLowerCase()} your Totem #${tokenId.toString()}`,
        NotificationScope.PERSONAL,
        NotificationPriority.LOW,
        { tokenId: tokenId.toString(), actionType: Number(actionType) },
        userAddress
      );
    };

    const handleTotemPurchased = async (
      user: any,
      tokenId: any,
      amount: any
    ) => {
      const isOwn = user.toLowerCase() === userAddress.toLowerCase();

      if (isOwn) {
        const contract = createTotemNFTContract(provider);
        const attributes = await contract.attributes(tokenId);
        const rarity = getEnumKeyByValue(Rarity, Number(attributes.rarity));
        const species = getEnumKeyByValue(Species, Number(attributes.species));

        addNotification(
          NotificationType.TOTEM_PURCHASE,
          `You purchased Totem #${tokenId.toString()}, ${rarity} ${species}`,
          NotificationScope.PERSONAL,
          NotificationPriority.MEDIUM,
          { tokenId: tokenId.toString(), amount: amount.toString() },
          userAddress
        );
      } else {
        addNotification(
          NotificationType.TOTEM_PURCHASE,
          `${formatAddress(user)} purchased a new Totem`,
          NotificationScope.GLOBAL,
          NotificationPriority.LOW,
          { user, tokenId: tokenId.toString() }
        );
      }
    };

    const handleBundlePurchased = async (
      user: any,
      bundleId: any,
      tokenId: any,
      amount: any
    ) => {
      const isOwn = user.toLowerCase() === userAddress.toLowerCase();

      if (isOwn) {
        const contract = createTotemNFTContract(provider);
        const attributes = await contract.attributes(tokenId);
        const rarity = getEnumKeyByValue(Rarity, Number(attributes.rarity));
        const species = getEnumKeyByValue(Species, Number(attributes.species));

        addNotification(
          NotificationType.BUNDLE_PURCHASED,
          `You purchased bundle, Totem #${tokenId.toString()}, ${rarity} ${species}`,
          NotificationScope.PERSONAL,
          NotificationPriority.MEDIUM,
          {
            bundleId: bundleId.toString(),
            tokenId: tokenId.toString(),
            amount: amount.toString(),
          },
          userAddress
        );
      } else {
        addNotification(
          NotificationType.BUNDLE_PURCHASED,
          `${formatAddress(user)} purchased a new bundle`,
          NotificationScope.GLOBAL,
          NotificationPriority.LOW,
          { bundleId: bundleId.toString(), user, tokenId: tokenId.toString() }
        );
      }
    };

    // Events from TotemNFT
    const handleTotemEvolved = (
      tokenId: any,
      newStage: any,
      species: any,
      rarity: any
    ) => {
      const totem = getTotem(tokenId);
      // only show for my totems
      if (totem) {
        addNotification(
          NotificationType.TOTEM_EVOLVED,
          `Your Totem #${tokenId.toString()} evolved to stage ${
            Number(newStage) + 1
          }!`,
          NotificationScope.PERSONAL,
          NotificationPriority.HIGH,
          {
            tokenId: tokenId.toString(),
            newStage: Number(newStage) + 1,
            species: Number(species),
            rarity: Number(rarity),
          },
          userAddress
        );
      }
    };

    const handleAttributesUpdated = (
      tokenId: any,
      happiness: any,
      experience: any
    ) => {
      // Low priority update - only show for significant changes
      if (Number(experience) % 500 === 0 || Number(experience) >= 7500) {
        addNotification(
          NotificationType.ATTRIBUTE_UPDATED,
          `Totem #${tokenId.toString()} reached ${experience.toString()} experience!`,
          NotificationScope.PERSONAL,
          NotificationPriority.LOW,
          {
            tokenId: tokenId.toString(),
            happiness: Number(happiness),
            experience: Number(experience),
          },
          userAddress
        );
      }
    };

    const handlePrestigeLevelReached = (tokenId: any, prestigeLevel: any) => {
      const totem = getTotem(tokenId);
      // only show for my totems
      if (totem) {
        addNotification(
          NotificationType.PRESTIGE_REACHED,
          `Totem #${tokenId.toString()} reached prestige level ${prestigeLevel.toString()}!`,
          NotificationScope.PERSONAL,
          NotificationPriority.HIGH,
          { tokenId: tokenId.toString(), prestigeLevel: Number(prestigeLevel) },
          userAddress
        );
      }
    };

    // Events from TotemAchievements
    const handleAchievementUnlocked = (id: any, user: any, badgeUri: any) => {
      const isOwn = user.toLowerCase() === userAddress.toLowerCase();
      if (isOwn) {
        const ach = getAchievementById(id);
        const achievementName = ach?.name;

        addNotification(
          NotificationType.ACHIEVEMENT_UNLOCKED,
          `You unlocked the "${achievementName}" achievement!`,
          NotificationScope.PERSONAL,
          NotificationPriority.HIGH,
          { achievementId: id, badgeUri },
          userAddress
        );
      }
    };

    const handleMilestoneUnlocked = (
      id: any,
      milestone: any,
      user: any,
      badgeUri: any
    ) => {
      const isOwn = user.toLowerCase() === userAddress.toLowerCase();
      if (isOwn) {
        const ach = getAchievementById(id);
        const name = ach?.name ? ` of "${ach?.name}"` : "";
        const milestoneName = `Milestone ${Number(milestone) + 1}${name}`;

        addNotification(
          NotificationType.MILESTONE_UNLOCKED,
          `You reached ${milestoneName}!`,
          NotificationScope.PERSONAL,
          NotificationPriority.MEDIUM,
          { achievementId: id, milestone: Number(milestone), badgeUri },
          userAddress
        );
      }
    };

    // Rewards Events
    const handleRewardClaimed = (rewardId: any, user: any, amount: any) => {
      const isOwn = user.toLowerCase() === userAddress.toLowerCase();
      if (isOwn) {
        const formattedAmount = ethers.formatEther(amount);
        addNotification(
          NotificationType.REWARD_CLAIMED,
          `You claimed ${formattedAmount} TOTEM tokens!`,
          NotificationScope.PERSONAL,
          NotificationPriority.MEDIUM,
          { rewardId, amount: amount.toString() },
          userAddress
        );
      }
    };

    // Challenge Events
    const handleChallengeCompleted = async (
      challengeId: any,
      user: any,
      tokenId: any,
      score: any
    ) => {
      const isOwn = user.toLowerCase() === userAddress.toLowerCase();
      if (isOwn) {
        const contract = createChallengesContract(provider);
        const info = await contract.getChallengeInfo(challengeId);

        addNotification(
          NotificationType.CHALLENGE_COMPLETED,
          `Your Totem #${tokenId.toString()} completed ${
            info.name
          } challenge with score ${score.toString()}!`,
          NotificationScope.PERSONAL,
          NotificationPriority.MEDIUM,
          { challengeId, tokenId: tokenId.toString(), score: Number(score) },
          userAddress
        );
      }
    };

    const handleHighScoreSet = async (
      challengeId: any,
      user: any,
      score: any
    ) => {
      const isOwn = user.toLowerCase() === userAddress.toLowerCase();

      const contract = createChallengesContract(provider);
      const info = await contract.getChallengeInfo(challengeId);

      const message = isOwn
        ? `You set a new high score of ${score.toString()} on ${
            info.name
          } challenge!`
        : `${formatAddress(user)} set a high score of ${score.toString()} on ${
            info.name
          } challenge!`;

      addNotification(
        NotificationType.HIGH_SCORE_SET,
        message,
        isOwn ? NotificationScope.PERSONAL : NotificationScope.GLOBAL,
        NotificationPriority.MEDIUM,
        { challengeId, score: Number(score) },
        isOwn ? userAddress : undefined
      );
    };

    gameContract.on("UserSignedUp", handleUserSignedUp);
    //gameContract.on("ActionPerformed", handleActionPerformed); // Disable until filter
    shopContract.on("TotemPurchased", handleTotemPurchased);
    shopContract.on("BundlePurchased", handleBundlePurchased);
    nftContract.on("TotemEvolved", handleTotemEvolved);
    //nftContract.on("AttributesUpdated", handleAttributesUpdated); // Disable until filter
    nftContract.on("PrestigeLevelReached", handlePrestigeLevelReached);
    achievementsContract.on("AchievementUnlocked", handleAchievementUnlocked);
    achievementsContract.on("MilestoneUnlocked", handleMilestoneUnlocked);
    rewardsContract.on("RewardClaimed", handleRewardClaimed);
    challengesContract.on("ChallengeCompleted", handleChallengeCompleted);
    challengesContract.on("HighScoreSet", handleHighScoreSet);

    // Cleanup: remove all listeners
    return () => {
      console.log("Removing contract event listeners...");

      gameContract.off("UserSignedUp", handleUserSignedUp);
      //gameContract.off("ActionPerformed", handleActionPerformed);
      shopContract.off("TotemPurchased", handleTotemPurchased);
      shopContract.off("BundlePurchased", handleBundlePurchased);
      nftContract.off("TotemEvolved", handleTotemEvolved);
      //nftContract.off("AttributesUpdated", handleAttributesUpdated);
      nftContract.off("PrestigeLevelReached", handlePrestigeLevelReached);
      achievementsContract.off("AchievementUnlocked", handleAchievementUnlocked);
      achievementsContract.off("MilestoneUnlocked", handleMilestoneUnlocked);
      rewardsContract.off("RewardClaimed", handleRewardClaimed);
      challengesContract.off("ChallengeCompleted", handleChallengeCompleted);
      challengesContract.off("HighScoreSet", handleHighScoreSet);
    };
  }, [userAddress, isConnected]);

  // Clean up expired notifications
  useEffect(() => {
    const cleanupExpiredNotifications = () => {
      const now = Date.now();
      const updatedNotifications = notifications.filter((notification) => {
        const config = NOTIFICATION_CONFIG[notification.type];
        if (!config.expiresInDays) return true;

        const expirationTime =
          notification.timestamp + config.expiresInDays * 24 * 60 * 60 * 1000;
        return now < expirationTime;
      });

      if (updatedNotifications.length !== notifications.length) {
        updateNotifications(updatedNotifications);
      }
    };

    // Run cleanup on mount and every 6 hours
    cleanupExpiredNotifications();
    const interval = setInterval(
      cleanupExpiredNotifications,
      6 * 60 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [notifications, updateNotifications]);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    addNotification,
    markAsRead,
    removeNotification,
    markAllAsRead,
    clearNotifications,
    getFilteredNotifications,
    openPanel,
    setOpenPanel,
    soundEnabled,
    toggleSound,
    maxNotifications,
    updateMaxNotifications,
  };
}
