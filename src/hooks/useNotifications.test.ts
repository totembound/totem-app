/**
 * useNotifications tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Hoist mocks
const { mockUseAuth, mockGetUserStorage, mockSetUserStorage, mockNotificationService } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockGetUserStorage: vi.fn(),
  mockSetUserStorage: vi.fn(),
  mockNotificationService: {
    initialize: vi.fn(),
    setUserId: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../utils/localStorage', () => ({
  getUserStorage: (...args: any[]) => mockGetUserStorage(...args),
  setUserStorage: (...args: any[]) => mockSetUserStorage(...args),
}));

vi.mock('../services/NotificationService', () => ({
  notificationService: mockNotificationService,
}));

// Mock crypto.subtle for hashMessage
const mockDigest = vi.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
  writable: true,
});

// Mock Audio
const mockPlay = vi.fn();
global.Audio = class MockAudio {
  volume = 0;
  play = mockPlay;
  constructor() {}
} as any;

import { useNotifications } from './useNotifications';
import { NotificationType, NotificationScope, NotificationPriority } from '../types/notifications';

// Use recent timestamps so notifications don't expire
const NOW = Date.now();
const TS1 = NOW - 60000;   // 1 minute ago
const TS2 = NOW - 30000;   // 30 seconds ago
const TS3 = NOW - 10000;   // 10 seconds ago

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Re-initialize mocks after clearAllMocks
    mockDigest.mockResolvedValue(new ArrayBuffer(32));
    mockPlay.mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
    });

    // Default: no stored notifications
    mockGetUserStorage.mockImplementation((_key: string, _userId: string, defaultValue: any) => defaultValue);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should start with empty notifications', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should load notifications from localStorage', () => {
      const stored = [
        { id: 'h1', type: NotificationType.TOTEM_PURCHASE, message: 'Purchased', isRead: false, timestamp: TS1, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
      ];
      mockGetUserStorage.mockImplementation((key: string, _userId: string, defaultValue: any) => {
        if (key === 'totem-notifications') return stored;
        return defaultValue;
      });

      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(1);
    });

    it('should initialize notification service when authenticated', () => {
      renderHook(() => useNotifications());

      expect(mockNotificationService.initialize).toHaveBeenCalledWith(
        expect.any(Function),
        'user-1'
      );
    });

    it('should set userId to null when not authenticated', () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });

      renderHook(() => useNotifications());

      expect(mockNotificationService.setUserId).toHaveBeenCalledWith(null);
    });
  });

  describe('addNotification', () => {
    it('should add a new notification', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.addNotification(
          NotificationType.TOTEM_PURCHASE,
          'Totem was purchased!'
        );
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].message).toBe('Totem was purchased!');
      expect(result.current.notifications[0].isRead).toBe(false);
      expect(result.current.unreadCount).toBe(1);
    });

    it('should deduplicate notifications by hash', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.addNotification(NotificationType.TOTEM_PURCHASE, 'Purchased');
      });

      await act(async () => {
        await result.current.addNotification(NotificationType.TOTEM_PURCHASE, 'Purchased');
      });

      // Same hash = update existing, not add new
      expect(result.current.notifications).toHaveLength(1);
    });

    it('should play sound on notification', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.addNotification(NotificationType.TOTEM_PURCHASE, 'Test');
      });

      expect(mockPlay).toHaveBeenCalled();
    });

    it('should save notifications to localStorage', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.addNotification(NotificationType.TOTEM_PURCHASE, 'Test');
      });

      expect(mockSetUserStorage).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', () => {
      const stored = [
        { id: 'h1', type: NotificationType.TOTEM_PURCHASE, message: 'Purchased', isRead: false, timestamp: TS1, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
      ];
      mockGetUserStorage.mockImplementation((key: string, _userId: string, defaultValue: any) => {
        if (key === 'totem-notifications') return stored;
        return defaultValue;
      });

      const { result } = renderHook(() => useNotifications());

      expect(result.current.unreadCount).toBe(1);

      act(() => {
        result.current.markAsRead('h1');
      });

      expect(result.current.notifications[0].isRead).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('removeNotification', () => {
    it('should remove a notification by id', () => {
      const stored = [
        { id: 'h1', type: NotificationType.TOTEM_PURCHASE, message: 'Purchased', isRead: false, timestamp: TS1, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
        { id: 'h2', type: NotificationType.REWARD_CLAIMED, message: 'Reward', isRead: false, timestamp: TS2, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
      ];
      mockGetUserStorage.mockImplementation((key: string, _userId: string, defaultValue: any) => {
        if (key === 'totem-notifications') return stored;
        return defaultValue;
      });

      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        result.current.removeNotification('h1');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].id).toBe('h2');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      const stored = [
        { id: 'h1', type: NotificationType.TOTEM_PURCHASE, message: 'A', isRead: false, timestamp: TS1, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
        { id: 'h2', type: NotificationType.REWARD_CLAIMED, message: 'B', isRead: false, timestamp: TS2, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
      ];
      mockGetUserStorage.mockImplementation((key: string, _userId: string, defaultValue: any) => {
        if (key === 'totem-notifications') return stored;
        return defaultValue;
      });

      const { result } = renderHook(() => useNotifications());

      expect(result.current.unreadCount).toBe(2);

      act(() => {
        result.current.markAllAsRead();
      });

      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every(n => n.isRead)).toBe(true);
    });
  });

  describe('clearNotifications', () => {
    it('should clear all notifications with no filter', () => {
      const stored = [
        { id: 'h1', type: NotificationType.TOTEM_PURCHASE, message: 'A', isRead: false, timestamp: TS1, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
        { id: 'h2', type: NotificationType.REWARD_CLAIMED, message: 'B', isRead: false, timestamp: TS2, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
      ];
      mockGetUserStorage.mockImplementation((key: string, _userId: string, defaultValue: any) => {
        if (key === 'totem-notifications') return stored;
        return defaultValue;
      });

      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should clear only specific types', () => {
      const stored = [
        { id: 'h1', type: NotificationType.TOTEM_PURCHASE, message: 'A', isRead: false, timestamp: TS1, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
        { id: 'h2', type: NotificationType.REWARD_CLAIMED, message: 'B', isRead: false, timestamp: TS2, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
      ];
      mockGetUserStorage.mockImplementation((key: string, _userId: string, defaultValue: any) => {
        if (key === 'totem-notifications') return stored;
        return defaultValue;
      });

      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.clearNotifications({ types: [NotificationType.TOTEM_PURCHASE] });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe(NotificationType.REWARD_CLAIMED);
    });

    it('should clear by scope', () => {
      const stored = [
        { id: 'h1', type: NotificationType.TOTEM_PURCHASE, message: 'A', isRead: false, timestamp: TS1, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
        { id: 'h2', type: NotificationType.REWARD_CLAIMED, message: 'B', isRead: false, timestamp: TS2, scope: NotificationScope.GLOBAL, priority: NotificationPriority.MEDIUM },
      ];
      mockGetUserStorage.mockImplementation((key: string, _userId: string, defaultValue: any) => {
        if (key === 'totem-notifications') return stored;
        return defaultValue;
      });

      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.clearNotifications({ scope: NotificationScope.PERSONAL });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].scope).toBe(NotificationScope.GLOBAL);
    });
  });

  describe('getFilteredNotifications', () => {
    const stored = [
      { id: 'h1', type: NotificationType.TOTEM_PURCHASE, message: 'Purchased', isRead: false, timestamp: TS1, scope: NotificationScope.PERSONAL, priority: NotificationPriority.MEDIUM },
      { id: 'h2', type: NotificationType.REWARD_CLAIMED, message: 'Reward', isRead: true, timestamp: TS3, scope: NotificationScope.PERSONAL, priority: NotificationPriority.HIGH },
      { id: 'h3', type: NotificationType.TOTEM_SALE, message: 'Sold', isRead: false, timestamp: TS2, scope: NotificationScope.GLOBAL, priority: NotificationPriority.LOW },
    ];

    beforeEach(() => {
      mockGetUserStorage.mockImplementation((key: string, _userId: string, defaultValue: any) => {
        if (key === 'totem-notifications') return stored;
        return defaultValue;
      });
    });

    it('should filter by type', () => {
      const { result } = renderHook(() => useNotifications());

      const filtered = result.current.getFilteredNotifications({
        types: [NotificationType.REWARD_CLAIMED],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('h2');
    });

    it('should filter unread only', () => {
      const { result } = renderHook(() => useNotifications());

      const filtered = result.current.getFilteredNotifications({ unreadOnly: true });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(n => !n.isRead)).toBe(true);
    });

    it('should filter by scope', () => {
      const { result } = renderHook(() => useNotifications());

      const filtered = result.current.getFilteredNotifications({
        scope: NotificationScope.GLOBAL,
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('h3');
    });

    it('should limit results', () => {
      const { result } = renderHook(() => useNotifications());

      const filtered = result.current.getFilteredNotifications({ limit: 1 });

      expect(filtered).toHaveLength(1);
    });

    it('should sort by timestamp (newest first)', () => {
      const { result } = renderHook(() => useNotifications());

      const filtered = result.current.getFilteredNotifications();

      expect(filtered[0].timestamp).toBe(TS3);
      expect(filtered[1].timestamp).toBe(TS2);
      expect(filtered[2].timestamp).toBe(TS1);
    });
  });

  describe('sound control', () => {
    it('should toggle sound on/off', () => {
      const { result } = renderHook(() => useNotifications());

      // Default is true
      expect(result.current.soundEnabled).toBe(true);

      act(() => {
        result.current.toggleSound();
      });

      expect(result.current.soundEnabled).toBe(false);
      expect(mockSetUserStorage).toHaveBeenCalled();
    });
  });

  describe('panel control', () => {
    it('should open/close panel', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.openPanel).toBe(false);

      act(() => {
        result.current.setOpenPanel(true);
      });

      expect(result.current.openPanel).toBe(true);
    });
  });

  describe('maxNotifications', () => {
    it('should update max and save to localStorage', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.updateMaxNotifications(50);
      });

      expect(result.current.maxNotifications).toBe(50);
      expect(mockSetUserStorage).toHaveBeenCalled();
    });

    it('should clamp max between 10 and 1000', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.updateMaxNotifications(5);
      });
      expect(result.current.maxNotifications).toBe(10);

      act(() => {
        result.current.updateMaxNotifications(9999);
      });
      expect(result.current.maxNotifications).toBe(1000);
    });

    it('should trim notifications when max is reduced', () => {
      const stored = Array.from({ length: 20 }, (_, i) => ({
        id: `h${i}`,
        type: NotificationType.TOTEM_PURCHASE,
        message: `Msg ${i}`,
        isRead: false,
        timestamp: NOW - (20 - i) * 1000,
        scope: NotificationScope.PERSONAL,
        priority: NotificationPriority.MEDIUM,
      }));
      mockGetUserStorage.mockImplementation((key: string, _userId: string, defaultValue: any) => {
        if (key === 'totem-notifications') return stored;
        return defaultValue;
      });

      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toHaveLength(20);

      act(() => {
        result.current.updateMaxNotifications(10);
      });

      expect(result.current.notifications).toHaveLength(10);
    });
  });
});
