/**
 * useIoTCommands tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Hoist mocks
const { mockUseAuth, mockIotService, mockNotificationService } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockIotService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn().mockReturnValue(vi.fn()), // Returns unsubscribe fn
  },
  mockNotificationService: {
    showNotification: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../services/IoTService', () => ({
  default: mockIotService,
  iotService: mockIotService,
}));

vi.mock('../services/NotificationService', () => ({
  notificationService: mockNotificationService,
}));

import { useIoTCommands } from './useIoTCommands';

describe('useIoTCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-set after clearAllMocks resets return values
    mockIotService.on.mockImplementation(() => vi.fn());
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should disconnect when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });

    renderHook(() => useIoTCommands());

    expect(mockIotService.disconnect).toHaveBeenCalled();
    expect(mockIotService.connect).not.toHaveBeenCalled();
  });

  it('should disconnect when no user id', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: {} });

    renderHook(() => useIoTCommands());

    expect(mockIotService.disconnect).toHaveBeenCalled();
  });

  it('should connect when authenticated with user id', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'user-1' } });

    renderHook(() => useIoTCommands());

    expect(mockIotService.connect).toHaveBeenCalledWith('user-1');
  });

  it('should register 7 event handlers', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'user-1' } });

    renderHook(() => useIoTCommands());

    expect(mockIotService.on).toHaveBeenCalledTimes(7);
    const eventTypes = mockIotService.on.mock.calls.map((c: any) => c[0]);
    expect(eventTypes).toContain('balance_update');
    expect(eventTypes).toContain('notification');
    expect(eventTypes).toContain('app_reload');
    expect(eventTypes).toContain('config_update');
    expect(eventTypes).toContain('totem_update');
    expect(eventTypes).toContain('sync');
    expect(eventTypes).toContain('force_logout');
  });

  it('should unsubscribe all handlers on cleanup', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'user-1' } });

    const unsubFns = Array.from({ length: 7 }, () => vi.fn());
    let callIdx = 0;
    mockIotService.on.mockImplementation(() => {
      return unsubFns[callIdx++];
    });

    const { unmount } = renderHook(() => useIoTCommands());

    unmount();

    unsubFns.forEach(fn => {
      expect(fn).toHaveBeenCalled();
    });
    // disconnect also called on cleanup
    expect(mockIotService.disconnect).toHaveBeenCalled();
  });

  describe('event handlers', () => {
    let handlers: Record<string, Function>;

    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'user-1' } });
      handlers = {};
      mockIotService.on.mockImplementation((type: string, handler: Function) => {
        handlers[type] = handler;
        return vi.fn();
      });
    });

    it('balance_update should show notification and call callback', () => {
      const onBalanceUpdate = vi.fn();
      renderHook(() => useIoTCommands({ onBalanceUpdate }));

      handlers['balance_update']({
        type: 'balance_update',
        id: 'cmd-1',
        timestamp: new Date().toISOString(),
        payload: { currency: 'Essence', amount: 100, reason: 'daily reward' },
      });

      expect(mockNotificationService.showNotification).toHaveBeenCalled();
      expect(onBalanceUpdate).toHaveBeenCalledWith({ currency: 'Essence', amount: 100, reason: 'daily reward' });
    });

    it('notification should map server type to frontend type', () => {
      renderHook(() => useIoTCommands());

      handlers['notification']({
        type: 'notification',
        id: 'cmd-2',
        timestamp: new Date().toISOString(),
        payload: { notificationType: 'ACHIEVEMENT_UNLOCKED', title: 'Achievement!', message: 'You earned it' },
      });

      expect(mockNotificationService.showNotification).toHaveBeenCalled();
    });

    it('totem_update should call callback', () => {
      const onTotemUpdate = vi.fn();
      renderHook(() => useIoTCommands({ onTotemUpdate }));

      handlers['totem_update']({
        type: 'totem_update',
        id: 'cmd-3',
        timestamp: new Date().toISOString(),
        payload: { totemId: 't1' },
      });

      expect(onTotemUpdate).toHaveBeenCalledWith({ totemId: 't1' });
    });

    it('sync should call callback', () => {
      const onSync = vi.fn();
      renderHook(() => useIoTCommands({ onSync }));

      handlers['sync']({
        type: 'sync',
        id: 'cmd-4',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(onSync).toHaveBeenCalled();
    });

    it('force_logout should show notification and call callback', () => {
      const onForceLogout = vi.fn();
      renderHook(() => useIoTCommands({ onForceLogout }));

      handlers['force_logout']({
        type: 'force_logout',
        id: 'cmd-5',
        timestamp: new Date().toISOString(),
        payload: { reason: 'Session expired' },
      });

      expect(mockNotificationService.showNotification).toHaveBeenCalled();
      expect(onForceLogout).toHaveBeenCalled();
    });

    it('config_update should show notification', () => {
      renderHook(() => useIoTCommands());

      handlers['config_update']({
        type: 'config_update',
        id: 'cmd-6',
        timestamp: new Date().toISOString(),
        payload: { configKeys: ['shop', 'rewards'] },
      });

      expect(mockNotificationService.showNotification).toHaveBeenCalled();
    });
  });
});
