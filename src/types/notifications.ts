export enum NotificationType {
    // Game core notifications
    USER_SIGNUP = 'user_signup',
    TOTEM_PURCHASE = 'totem_purchase',
    TOTEM_SALE = 'totem_sale',
    
    // Achievement notifications
    ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
    MILESTONE_UNLOCKED = 'milestone_unlocked',
    PROGRESS_UPDATED = 'progress_updated',
    
    // Evolution & attribute notifications
    TOTEM_EVOLVED = 'totem_evolved',
    ATTRIBUTE_UPDATED = 'attribute_updated',
    PRESTIGE_REACHED = 'prestige_reached',
    
    // Action notifications
    ACTION_PERFORMED = 'action_performed',
    
    // Challenge notifications
    CHALLENGE_COMPLETED = 'challenge_completed',
    HIGH_SCORE_SET = 'high_score_set',
    
    // Expedition notifications
    EXPEDITION_STARTED = 'expedition_started',
    EXPEDITION_COMPLETED = 'expedition_completed',
    EXPEDITION_REWARDS = 'expedition_rewards',

    // Reward notifications
    REWARD_CLAIMED = 'reward_claimed',
    PROTECTION_PURCHASED = 'protection_purchased',
    PROTECTION_USED = 'protection_used',
    
    // Loot notifications
    LOOT_CLAIMED = 'loot_claimed',

    // Shop notifications
    BUNDLE_PURCHASED = 'bundle_purchased',
    TOTEM_UNBOUND = 'totem_unbound',
    
    // Admin notifications
    ADMIN_CONFIG_UPDATED = 'admin_config_updated',
    ADMIN_ACHIEVEMENT_CONFIGURED = 'admin_achievement_configured',
    ADMIN_CHALLENGE_CONFIGURED = 'admin_challenge_configured'
  }
  
  export enum NotificationScope {
    PERSONAL = 'personal',  // Only visible to the user who triggered it
    GLOBAL = 'global',      // Visible to all users
    ADMIN = 'admin'         // Only visible to admin users
  }
  
  export enum NotificationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
  }
  
  export interface NotificationConfig {
    type: NotificationType;
    scope: NotificationScope;
    priority: NotificationPriority;
    expiresInDays?: number; // How many days until this notification expires
    icon?: string;          // Icon to show with notification
    sound?: boolean;        // Whether to play a sound when this notification appears
    autoOpen?: boolean;     // Whether to automatically open the notification panel when this notification arrives
  }
  
  export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    isRead: boolean;
    timestamp: number;
    scope: NotificationScope;
    priority: NotificationPriority;
    data?: any;            // Additional data related to the notification
    userId?: string;  // User ID related to this notification
  }
  
  // Configuration for all notification types
  export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
    // Game core notifications
    [NotificationType.USER_SIGNUP]: {
      type: NotificationType.USER_SIGNUP,
      scope: NotificationScope.GLOBAL,
      priority: NotificationPriority.LOW,
      expiresInDays: 1
    },
    [NotificationType.TOTEM_PURCHASE]: {
      type: NotificationType.TOTEM_PURCHASE,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },
    [NotificationType.TOTEM_SALE]: {
      type: NotificationType.TOTEM_SALE,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },
    
    // Achievement notifications
    [NotificationType.ACHIEVEMENT_UNLOCKED]: {
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.HIGH,
      sound: true,
      autoOpen: true
    },
    [NotificationType.MILESTONE_UNLOCKED]: {
      type: NotificationType.MILESTONE_UNLOCKED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },
    [NotificationType.PROGRESS_UPDATED]: {
      type: NotificationType.PROGRESS_UPDATED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.LOW
    },
    
    // Evolution & attribute notifications
    [NotificationType.TOTEM_EVOLVED]: {
      type: NotificationType.TOTEM_EVOLVED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.HIGH,
      sound: true,
      autoOpen: true
    },
    [NotificationType.ATTRIBUTE_UPDATED]: {
      type: NotificationType.ATTRIBUTE_UPDATED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.LOW
    },
    [NotificationType.PRESTIGE_REACHED]: {
      type: NotificationType.PRESTIGE_REACHED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.HIGH,
      sound: true
    },
    
    // Action notifications
    [NotificationType.ACTION_PERFORMED]: {
      type: NotificationType.ACTION_PERFORMED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.LOW,
      expiresInDays: 1
    },
    
    // Challenge notifications
    [NotificationType.CHALLENGE_COMPLETED]: {
      type: NotificationType.CHALLENGE_COMPLETED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },
    [NotificationType.HIGH_SCORE_SET]: {
      type: NotificationType.HIGH_SCORE_SET,
      scope: NotificationScope.GLOBAL,
      priority: NotificationPriority.MEDIUM
    },
    
    // Expedition notifications
    [NotificationType.EXPEDITION_STARTED]: {
      type: NotificationType.EXPEDITION_STARTED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM,
      expiresInDays: 3,
      autoOpen: false,
    },
    [NotificationType.EXPEDITION_COMPLETED]: {
      type: NotificationType.EXPEDITION_COMPLETED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM,
      expiresInDays: 3,
      autoOpen: true,
    },
    [NotificationType.EXPEDITION_REWARDS]: {
      type: NotificationType.EXPEDITION_REWARDS,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.HIGH,
      expiresInDays: 3, 
      autoOpen: true,
    },

    // Reward notifications
    [NotificationType.REWARD_CLAIMED]: {
      type: NotificationType.REWARD_CLAIMED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },
    [NotificationType.PROTECTION_PURCHASED]: {
      type: NotificationType.PROTECTION_PURCHASED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },
    [NotificationType.PROTECTION_USED]: {
      type: NotificationType.PROTECTION_USED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },
    
    // Loot notifications
    [NotificationType.LOOT_CLAIMED]: {
      type: NotificationType.LOOT_CLAIMED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },

    // Shop notifications
    [NotificationType.BUNDLE_PURCHASED]: {
      type: NotificationType.BUNDLE_PURCHASED,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },
    [NotificationType.TOTEM_UNBOUND]: {
      type: NotificationType.TOTEM_UNBOUND,
      scope: NotificationScope.PERSONAL,
      priority: NotificationPriority.MEDIUM
    },
    
    // Admin notifications
    [NotificationType.ADMIN_CONFIG_UPDATED]: {
      type: NotificationType.ADMIN_CONFIG_UPDATED,
      scope: NotificationScope.ADMIN,
      priority: NotificationPriority.MEDIUM
    },
    [NotificationType.ADMIN_ACHIEVEMENT_CONFIGURED]: {
      type: NotificationType.ADMIN_ACHIEVEMENT_CONFIGURED,
      scope: NotificationScope.ADMIN,
      priority: NotificationPriority.MEDIUM
    },
    [NotificationType.ADMIN_CHALLENGE_CONFIGURED]: {
      type: NotificationType.ADMIN_CHALLENGE_CONFIGURED,
      scope: NotificationScope.ADMIN,
      priority: NotificationPriority.MEDIUM
    }
  };