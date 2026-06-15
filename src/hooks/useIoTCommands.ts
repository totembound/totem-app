/**
 * useIoTCommands - Connects to IoT push notifications and dispatches commands
 *
 * Automatically connects on login, disconnects on logout.
 * Dispatches server-pushed commands to:
 *   - NotificationService (for notification type)
 *   - UserContext balance refresh (for balance_update type)
 *   - Page reload (for app_reload type)
 *   - Config reload (for config_update type)
 *
 * Used for server-initiated events only (Stripe webhooks, admin broadcasts).
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import iotService, { IoTCommand } from '../services/IoTService';
import { notificationService } from '../services/NotificationService';
import {
  NotificationType,
  NotificationPriority,
} from '../types/notifications';

interface UseIoTCommandsOptions {
  onBalanceUpdate?: (payload: Record<string, unknown>) => void;
  onTotemUpdate?: (payload: Record<string, unknown>) => void;
  onSync?: () => void;
  onForceLogout?: () => void;
}

export function useIoTCommands(options: UseIoTCommandsOptions = {}) {
  const { isAuthenticated, user } = useAuth();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      iotService.disconnect();
      return;
    }

    // Connect to IoT push
    iotService.connect(user.id);

    // Register command handlers
    const unsubBalanceUpdate = iotService.on('balance_update', (command: IoTCommand) => {
      const { currency, amount, reason } = command.payload;
      console.log(`[IoT] Balance update: ${currency} ${amount} (${reason})`);

      notificationService.showNotification(
        NotificationType.REWARD_CLAIMED,
        `Your ${currency} balance has been updated${reason ? `: ${reason}` : ''}.`,
        command.payload,
        { priority: NotificationPriority.MEDIUM }
      );

      optionsRef.current.onBalanceUpdate?.(command.payload);
    });

    const unsubNotification = iotService.on('notification', (command: IoTCommand) => {
      const { notificationType, title, message } = command.payload;
      console.log(`[IoT] Notification: ${notificationType} - ${title}`);

      // Map server notification types to frontend NotificationType enum
      const typeMap: Record<string, NotificationType> = {
        ACHIEVEMENT_UNLOCKED: NotificationType.ACHIEVEMENT_UNLOCKED,
        MILESTONE_UNLOCKED: NotificationType.MILESTONE_UNLOCKED,
        EXPEDITION_COMPLETED: NotificationType.EXPEDITION_COMPLETED,
        REWARD_CLAIMED: NotificationType.REWARD_CLAIMED,
      };

      const frontendType = typeMap[notificationType as string] || NotificationType.ACTION_PERFORMED;
      notificationService.showNotification(
        frontendType,
        (message || title) as string,
        command.payload,
        { priority: NotificationPriority.HIGH }
      );
    });

    const unsubAppReload = iotService.on('app_reload', (command: IoTCommand) => {
      console.log(`[IoT] App reload requested: ${command.payload.reason}`);
      notificationService.showNotification(
        NotificationType.ADMIN_CONFIG_UPDATED,
        'The app will reload in 3 seconds to apply updates.',
        command.payload,
        { priority: NotificationPriority.HIGH }
      );
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    });

    const unsubConfigUpdate = iotService.on('config_update', (command: IoTCommand) => {
      const { configKeys } = command.payload;
      console.log(`[IoT] Config update: ${JSON.stringify(configKeys)}`);
      notificationService.showNotification(
        NotificationType.ADMIN_CONFIG_UPDATED,
        'Game configuration has been updated. Refresh for changes.',
        command.payload,
        { priority: NotificationPriority.MEDIUM }
      );
    });

    const unsubTotemUpdate = iotService.on('totem_update', (command: IoTCommand) => {
      console.log('[IoT] Totem update received');
      optionsRef.current.onTotemUpdate?.(command.payload);
    });

    const unsubSync = iotService.on('sync', () => {
      console.log('[IoT] Sync requested');
      optionsRef.current.onSync?.();
    });

    const unsubForceLogout = iotService.on('force_logout', (command: IoTCommand) => {
      console.log(`[IoT] Force logout: ${command.payload.reason}`);
      notificationService.showNotification(
        NotificationType.ADMIN_CONFIG_UPDATED,
        `You have been logged out${command.payload.reason ? `: ${command.payload.reason}` : ''}.`,
        command.payload,
        { priority: NotificationPriority.HIGH }
      );
      optionsRef.current.onForceLogout?.();
    });

    return () => {
      unsubBalanceUpdate();
      unsubNotification();
      unsubAppReload();
      unsubConfigUpdate();
      unsubTotemUpdate();
      unsubSync();
      unsubForceLogout();
      iotService.disconnect();
    };
  }, [isAuthenticated, user?.id]);
}

export default useIoTCommands;
