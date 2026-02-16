/**
 * useNotifications - Notification Hook
 *
 * Manages notification queue, display, and persistence.
 * Works with NotificationService for REST API response-based notifications.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Notification,
  NotificationType,
  NotificationScope,
  NotificationPriority,
  NOTIFICATION_CONFIG,
} from "../types/notifications";
import { getUserStorage, setUserStorage } from "../utils/localStorage";
import { STORAGE_KEYS } from "../config/constants";
import { useAuth } from "../contexts/AuthContext";
import { notificationService } from "../services/NotificationService";

// Create a hash for deduplication
const hashMessage = async (
  message: string,
  type: string,
  data?: unknown
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

export function useNotifications() {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id || '';
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load saved notifications from localStorage on startup
    return getUserStorage<Notification[]>(
      STORAGE_KEYS.notifications,
      userId,
      []
    );
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    // Load sound setting from localStorage, default to true
    return getUserStorage<boolean>(
      STORAGE_KEYS.notificationSound,
      userId,
      true
    );
  });
  const [openPanel, setOpenPanel] = useState(false);
  const eventHashesRef = useRef(
    new Set<string>(notifications.map((n) => n.id))
  );
  const eventHashes = eventHashesRef.current;
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Maximum number of notifications to keep in storage
  const [maxNotifications, setMaxNotifications] = useState<number>(() => {
    // Load max notifications setting from localStorage, default to 100
    return getUserStorage<number>(
      STORAGE_KEYS.maxNotifications,
      userId,
      100
    );
  });

  // Save notifications to localStorage
  const saveNotifications = useCallback(
    (notifs: Notification[]) => {
      if (!userId) return;

      // Sort by timestamp (newest first) and limit to max number
      const sorted = [...notifs].sort((a, b) => b.timestamp - a.timestamp);
      const limited = sorted.slice(0, maxNotifications);

      setUserStorage(STORAGE_KEYS.notifications, userId, limited);
    },
    [userId, maxNotifications]
  );

  // Toggle sound setting
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      if (userId) {
        setUserStorage(STORAGE_KEYS.notificationSound, userId, newValue);
      }
      return newValue;
    });
  }, [userId]);

  // Play notification sound
  const playSound = useCallback((soundType = "default") => {
    if (!soundEnabledRef.current) {
      return;
    }

    const audio = new Audio(`/sounds/${soundType}.mp3`);
    audio.volume = 0.3;
    audio
      .play()
      .catch((err) => console.error("Error playing notification sound:", err));
  }, []);

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

      if (userId) {
        setUserStorage(
          STORAGE_KEYS.maxNotifications,
          userId,
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
    [userId, notifications, updateNotifications]
  );

  const addNotification = useCallback(
    async (
      type: NotificationType,
      message: string,
      scope: NotificationScope = NotificationScope.PERSONAL,
      priority: NotificationPriority = NotificationPriority.MEDIUM,
      data?: unknown,
      notifUserId?: string
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
          playSound();

          return updatedNotifications;
        } else {
          // Add new notification
          eventHashes.add(hash);

          const newNotification: Notification = {
            id: hash,
            type,
            message,
            isRead: false,
            timestamp: Date.now(),
            scope,
            priority,
            data,
            userId: notifUserId,
          };

          const newNotifications = [newNotification, ...currentNotifications];

          // Save to localStorage
          saveNotifications(newNotifications);

          // Trigger notification behaviors
          const config = NOTIFICATION_CONFIG[type];
          if (config.autoOpen) {
            setOpenPanel(true);
          }
          playSound();

          return newNotifications;
        }
      });
    },
    [saveNotifications, setOpenPanel, playSound]
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

  // Initialize notification service with addNotification callback
  useEffect(() => {
    if (isAuthenticated && userId) {
      notificationService.initialize(addNotification, userId);
    } else {
      notificationService.setUserId(null);
    }
  }, [isAuthenticated, userId, addNotification]);

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
