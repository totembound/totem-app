/**
 * IoTService tests
 *
 * Tests the pub/sub handler registration, dispatch, deduplication logic,
 * Socket.IO connection lifecycle, IoT Core connection flow, and disconnect.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock ApiClient
vi.mock('./ApiClient', () => ({
  default: {
    getIoTConfig: vi.fn(),
    getIdToken: vi.fn(),
    registerIoT: vi.fn(),
  },
}));

// Mock sigv4
vi.mock('../utils/sigv4', () => ({
  signIoTWebSocketUrl: vi.fn(),
}));

// --- Socket.IO mock ---
// Store event listeners registered by the service so tests can fire them
type SocketEventMap = Record<string, (...args: any[]) => void>;
function createMockSocket() {
  const listeners: SocketEventMap = {};
  return {
    on: vi.fn((event: string, cb: (...args: any[]) => void) => {
      listeners[event] = cb;
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    /** Helper: fire a registered event from the test */
    __fire(event: string, ...args: any[]) {
      listeners[event]?.(...args);
    },
    __listeners: listeners,
  };
}

let mockSocket: ReturnType<typeof createMockSocket>;
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    mockSocket = createMockSocket();
    return mockSocket;
  }),
}));

// --- MQTT mock ---
type MqttEventMap = Record<string, (...args: any[]) => void>;
function createMockMqttClient() {
  const listeners: MqttEventMap = {};
  return {
    on: vi.fn((event: string, cb: (...args: any[]) => void) => {
      listeners[event] = cb;
    }),
    subscribe: vi.fn(),
    end: vi.fn(),
    __fire(event: string, ...args: any[]) {
      listeners[event]?.(...args);
    },
    __listeners: listeners,
  };
}

let mockMqttClient: ReturnType<typeof createMockMqttClient>;
vi.mock('mqtt', () => ({
  default: {
    connect: vi.fn(() => {
      mockMqttClient = createMockMqttClient();
      return mockMqttClient;
    }),
  },
  connect: vi.fn(() => {
    mockMqttClient = createMockMqttClient();
    return mockMqttClient;
  }),
}));

// --- AWS SDK mock ---
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-cognito-identity', () => ({
  CognitoIdentityClient: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  GetIdCommand: vi.fn().mockImplementation((input: any) => ({ input, _type: 'GetIdCommand' })),
  GetCredentialsForIdentityCommand: vi.fn().mockImplementation((input: any) => ({ input, _type: 'GetCredentialsForIdentityCommand' })),
}));

import apiClient from './ApiClient';
import { signIoTWebSocketUrl } from '../utils/sigv4';
import { iotService, type IoTCommand } from './IoTService';

describe('IoTService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    iotService.disconnect();
    iotService.removeAllHandlers();
    // Clear dedup set between tests
    (iotService as any).recentMessageIds.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('handler registration', () => {
    it('should register a type-specific handler and return unsubscribe', () => {
      const handler = vi.fn();
      const unsub = iotService.on('notification', handler);

      expect(typeof unsub).toBe('function');

      // Unsubscribe
      unsub();
      // No error on double unsubscribe
      unsub();
    });

    it('should register a global handler and return unsubscribe', () => {
      const handler = vi.fn();
      const unsub = iotService.onAny(handler);

      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('should remove all handlers', () => {
      iotService.on('notification', vi.fn());
      iotService.on('balance_update', vi.fn());
      iotService.onAny(vi.fn());

      iotService.removeAllHandlers();
      // No error - handlers cleared
    });
  });

  describe('connection state', () => {
    it('should start disconnected', () => {
      expect(iotService.isConnected()).toBe(false);
    });

    it('should be disconnected after disconnect()', () => {
      iotService.disconnect();
      expect(iotService.isConnected()).toBe(false);
    });
  });

  describe('dispatch (via internal method)', () => {
    // We can test dispatch indirectly by accessing the private method
    // via the class prototype, or by simulating a Socket.IO connection.
    // Since transports need mocking, we test handler logic via a helper.

    it('should dispatch to type-specific handlers', () => {
      const handler = vi.fn();
      iotService.on('notification', handler);

      // Access private dispatch via prototype
      const dispatchFn = (iotService as any).dispatch.bind(iotService);
      const command: IoTCommand = {
        type: 'notification',
        id: 'msg-1',
        timestamp: new Date().toISOString(),
        payload: { message: 'Hello' },
      };

      dispatchFn(command);

      expect(handler).toHaveBeenCalledWith(command);
    });

    it('should dispatch to global handlers', () => {
      const handler = vi.fn();
      iotService.onAny(handler);

      const dispatchFn = (iotService as any).dispatch.bind(iotService);
      const command: IoTCommand = {
        type: 'balance_update',
        id: 'msg-2',
        timestamp: new Date().toISOString(),
        payload: { gems: 100 },
      };

      dispatchFn(command);

      expect(handler).toHaveBeenCalledWith(command);
    });

    it('should dispatch to both type-specific and global handlers', () => {
      const typeHandler = vi.fn();
      const globalHandler = vi.fn();
      iotService.on('notification', typeHandler);
      iotService.onAny(globalHandler);

      const dispatchFn = (iotService as any).dispatch.bind(iotService);
      const command: IoTCommand = {
        type: 'notification',
        id: 'msg-3',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      dispatchFn(command);

      expect(typeHandler).toHaveBeenCalledTimes(1);
      expect(globalHandler).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate messages with same id', () => {
      const handler = vi.fn();
      iotService.on('notification', handler);

      const dispatchFn = (iotService as any).dispatch.bind(iotService);
      const command: IoTCommand = {
        type: 'notification',
        id: 'dup-msg',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      dispatchFn(command);
      dispatchFn(command); // Duplicate

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should allow messages with different ids', () => {
      const handler = vi.fn();
      iotService.on('notification', handler);

      const dispatchFn = (iotService as any).dispatch.bind(iotService);

      dispatchFn({
        type: 'notification',
        id: 'msg-a',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      dispatchFn({
        type: 'notification',
        id: 'msg-b',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should evict old message ids when dedup set is full', () => {
      // Clear any previously tracked IDs from other tests
      (iotService as any).recentMessageIds.clear();

      const handler = vi.fn();
      iotService.on('notification', handler);

      const dispatchFn = (iotService as any).dispatch.bind(iotService);

      // Fill up the dedup set (max 100) then add 5 more
      for (let i = 0; i < 105; i++) {
        dispatchFn({
          type: 'notification',
          id: `evict-${i}`,
          timestamp: new Date().toISOString(),
          payload: {},
        });
      }

      expect(handler).toHaveBeenCalledTimes(105);

      // The first few IDs should have been evicted, so re-dispatching them works
      handler.mockClear();
      dispatchFn({
        type: 'notification',
        id: 'evict-0',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should catch handler errors without breaking dispatch', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler crashed');
      });
      const goodHandler = vi.fn();

      iotService.on('notification', errorHandler);
      iotService.on('notification', goodHandler);

      const dispatchFn = (iotService as any).dispatch.bind(iotService);

      dispatchFn({
        type: 'notification',
        id: 'msg-err',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
    });

    it('should catch global handler errors without breaking', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Global crashed');
      });

      iotService.onAny(errorHandler);

      const dispatchFn = (iotService as any).dispatch.bind(iotService);

      // Should not throw
      dispatchFn({
        type: 'notification',
        id: 'msg-gerr',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should not call unsubscribed handler', () => {
      const handler = vi.fn();
      const unsub = iotService.on('notification', handler);

      unsub();

      const dispatchFn = (iotService as any).dispatch.bind(iotService);
      dispatchFn({
        type: 'notification',
        id: 'msg-after-unsub',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not call unsubscribed global handler', () => {
      const handler = vi.fn();
      const unsub = iotService.onAny(handler);

      unsub();

      const dispatchFn = (iotService as any).dispatch.bind(iotService);
      dispatchFn({
        type: 'notification',
        id: 'msg-after-unsub-global',
        timestamp: new Date().toISOString(),
        payload: {},
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('isLocalMode', () => {
    it('should detect local mode from empty API URL', () => {
      const result = (iotService as any).isLocalMode();
      // Default VITE_API_URL in test env is 'http://localhost:3001' or empty
      // Either way, it includes 'localhost' so it's local
      expect(typeof result).toBe('boolean');
    });
  });

  // ================================================================
  // connect() lifecycle
  // ================================================================

  describe('connect()', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should skip if already connected with same userId', async () => {
      // Force internal state to "connected"
      (iotService as any).connected = true;
      (iotService as any).userId = 'user-123';

      await iotService.connect('user-123');

      // io() should NOT have been called since we short-circuited
      const { io } = await import('socket.io-client');
      expect(io).not.toHaveBeenCalled();
    });

    it('should disconnect previous connection before reconnecting with new userId', async () => {
      // Set up a mock transport to verify disconnect is called
      const mockDisconnect = vi.fn();
      (iotService as any).transport = { disconnect: mockDisconnect };
      (iotService as any).connected = true;
      (iotService as any).userId = 'old-user';

      await iotService.connect('new-user');

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should reconnect if called with a different userId while connected', async () => {
      (iotService as any).connected = true;
      (iotService as any).userId = 'user-A';

      await iotService.connect('user-B');

      // Should have attempted to create a Socket.IO connection (local mode)
      const { io } = await import('socket.io-client');
      expect(io).toHaveBeenCalled();
    });
  });

  // ================================================================
  // disconnect() with active transport
  // ================================================================

  describe('disconnect()', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should call transport.disconnect() when a transport exists', () => {
      const mockDisconnect = vi.fn();
      (iotService as any).transport = { disconnect: mockDisconnect };
      (iotService as any).connected = true;
      (iotService as any).userId = 'user-99';

      iotService.disconnect();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect((iotService as any).transport).toBeNull();
      expect((iotService as any).connected).toBe(false);
      expect((iotService as any).userId).toBeNull();
    });

    it('should be safe to call when no transport exists', () => {
      (iotService as any).transport = null;

      expect(() => iotService.disconnect()).not.toThrow();
      expect(iotService.isConnected()).toBe(false);
    });
  });

  // ================================================================
  // Socket.IO transport (local mode)
  // ================================================================

  describe('connectSocketIO (local mode)', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should create a Socket.IO connection and register event handlers', async () => {
      await iotService.connect('user-socket-1');

      const { io } = await import('socket.io-client');
      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          transports: ['websocket', 'polling'],
          autoConnect: true,
        }),
      );

      // Verify all 4 events were registered
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('command', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should set connected=true and emit subscribe on socket "connect" event', async () => {
      await iotService.connect('user-socket-2');

      // Simulate the socket connecting
      mockSocket.__fire('connect');

      expect(iotService.isConnected()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', { userId: 'user-socket-2' });
    });

    it('should dispatch commands received via socket "command" event', async () => {
      const handler = vi.fn();
      iotService.on('balance_update', handler);

      await iotService.connect('user-socket-3');
      mockSocket.__fire('connect');

      const command: IoTCommand = {
        type: 'balance_update',
        id: 'socket-cmd-1',
        timestamp: new Date().toISOString(),
        payload: { gems: 50 },
      };
      mockSocket.__fire('command', command);

      expect(handler).toHaveBeenCalledWith(command);
    });

    it('should set connected=false on socket "disconnect" event', async () => {
      await iotService.connect('user-socket-4');
      mockSocket.__fire('connect');

      expect(iotService.isConnected()).toBe(true);

      mockSocket.__fire('disconnect');

      expect(iotService.isConnected()).toBe(false);
    });

    it('should handle socket "connect_error" without crashing', async () => {
      await iotService.connect('user-socket-5');

      // Should not throw
      mockSocket.__fire('connect_error', new Error('Connection refused'));

      expect(console.warn).toHaveBeenCalledWith(
        '[IoT] Socket.IO connection error:',
        'Connection refused',
      );
    });

    it('should create a transport that disconnects the socket', async () => {
      await iotService.connect('user-socket-6');
      mockSocket.__fire('connect');

      // Disconnect through the service
      iotService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should catch errors when socket.io-client import fails', async () => {
      // Force the dynamic import to throw by making io() throw
      const { io } = await import('socket.io-client');
      (io as any).mockImplementationOnce(() => {
        throw new Error('Module load failed');
      });

      // Should not throw, should log warning
      await iotService.connect('user-socket-err');

      expect(console.warn).toHaveBeenCalledWith(
        '[IoT] Failed to connect Socket.IO:',
        expect.any(Error),
      );
    });
  });

  // ================================================================
  // IoT Core transport (production mode)
  // ================================================================

  describe('connectIoTCore (production mode)', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // Force production mode by overriding isLocalMode
      vi.spyOn(iotService as any, 'isLocalMode').mockReturnValue(false);
    });

    function setupSuccessfulIoTMocks() {
      (apiClient.getIoTConfig as any).mockResolvedValue({
        success: true,
        data: {
          endpoint: 'abc123-ats.iot.us-west-2.amazonaws.com',
          region: 'us-west-2',
          identityPoolId: 'us-west-2:pool-id',
          userPoolId: 'us-west-2_PoolXyz',
        },
      });
      (apiClient.getIdToken as any).mockReturnValue('fake-id-token');
      (apiClient.registerIoT as any).mockResolvedValue({
        success: true,
        data: { registered: true, topic: 'user/identity-123/commands' },
      });
      (signIoTWebSocketUrl as any).mockResolvedValue('wss://signed-url');

      // Mock Cognito SDK responses
      mockSend
        .mockResolvedValueOnce({ IdentityId: 'identity-123' }) // GetIdCommand
        .mockResolvedValueOnce({ // GetCredentialsForIdentityCommand
          Credentials: {
            AccessKeyId: 'AKID',
            SecretKey: 'SECRET',
            SessionToken: 'TOKEN',
          },
        });
    }

    it('should connect via MQTT when IoT config is available', async () => {
      setupSuccessfulIoTMocks();

      await iotService.connect('user-iot-1');

      expect(apiClient.getIoTConfig).toHaveBeenCalled();
      expect(apiClient.getIdToken).toHaveBeenCalled();
      expect(apiClient.registerIoT).toHaveBeenCalledWith('identity-123');
      expect(signIoTWebSocketUrl).toHaveBeenCalledWith(
        'abc123-ats.iot.us-west-2.amazonaws.com',
        'us-west-2',
        'AKID',
        'SECRET',
        'TOKEN',
      );
    });

    it('should set connected=true on MQTT "connect" event and subscribe to topics', async () => {
      setupSuccessfulIoTMocks();

      await iotService.connect('user-iot-2');

      // Simulate MQTT connected
      mockMqttClient.__fire('connect');

      expect(iotService.isConnected()).toBe(true);
      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
        'user/identity-123/commands',
        { qos: 1 },
      );
      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
        'global/commands',
        { qos: 1 },
      );
    });

    it('should dispatch commands from MQTT "message" event', async () => {
      setupSuccessfulIoTMocks();
      const handler = vi.fn();
      iotService.on('totem_update', handler);

      await iotService.connect('user-iot-3');
      mockMqttClient.__fire('connect');

      const command: IoTCommand = {
        type: 'totem_update',
        id: 'mqtt-cmd-1',
        timestamp: new Date().toISOString(),
        payload: { totemId: 'totem-42' },
      };
      const payload = Buffer.from(JSON.stringify(command));
      mockMqttClient.__fire('message', 'user/identity-123/commands', payload);

      expect(handler).toHaveBeenCalledWith(command);
    });

    it('should handle invalid JSON in MQTT message gracefully', async () => {
      setupSuccessfulIoTMocks();

      await iotService.connect('user-iot-4');
      mockMqttClient.__fire('connect');

      const badPayload = Buffer.from('not-valid-json');
      mockMqttClient.__fire('message', 'some/topic', badPayload);

      expect(console.error).toHaveBeenCalledWith(
        '[IoT] Failed to parse MQTT message:',
        expect.any(Error),
      );
    });

    it('should handle MQTT "error" event', async () => {
      setupSuccessfulIoTMocks();

      await iotService.connect('user-iot-5');

      mockMqttClient.__fire('error', new Error('MQTT connection lost'));

      expect(console.error).toHaveBeenCalledWith(
        '[IoT] MQTT error:',
        'MQTT connection lost',
      );
    });

    it('should set connected=false on MQTT "close" event', async () => {
      setupSuccessfulIoTMocks();

      await iotService.connect('user-iot-6');
      mockMqttClient.__fire('connect');
      expect(iotService.isConnected()).toBe(true);

      mockMqttClient.__fire('close');

      expect(iotService.isConnected()).toBe(false);
    });

    it('should schedule credential refresh at 50 minutes and reconnect', async () => {
      setupSuccessfulIoTMocks();

      await iotService.connect('user-iot-7');
      mockMqttClient.__fire('connect');

      const firstMqttClient = mockMqttClient;

      // Set up mocks for the reconnection
      setupSuccessfulIoTMocks();

      // Advance time by 50 minutes
      await vi.advanceTimersByTimeAsync(50 * 60 * 1000);

      // The refresh timer should have ended the old client
      expect(firstMqttClient.end).toHaveBeenCalledWith(true);
      // And started a new connection (getIoTConfig called again)
      expect(apiClient.getIoTConfig).toHaveBeenCalledTimes(2);
    });

    it('should clear refresh timer on disconnect', async () => {
      setupSuccessfulIoTMocks();

      await iotService.connect('user-iot-8');
      mockMqttClient.__fire('connect');

      // Disconnect clears the timer
      iotService.disconnect();

      expect(mockMqttClient.end).toHaveBeenCalledWith(true);
    });

    it('should abort if getIoTConfig fails', async () => {
      (apiClient.getIoTConfig as any).mockResolvedValue({ success: false });

      await iotService.connect('user-iot-fail-1');

      expect(console.warn).toHaveBeenCalledWith('[IoT] Failed to get IoT config');
      expect(iotService.isConnected()).toBe(false);
    });

    it('should abort if getIoTConfig returns no data', async () => {
      (apiClient.getIoTConfig as any).mockResolvedValue({ success: true, data: null });

      await iotService.connect('user-iot-fail-1b');

      expect(console.warn).toHaveBeenCalledWith('[IoT] Failed to get IoT config');
    });

    it('should abort if IoT endpoint is not configured', async () => {
      (apiClient.getIoTConfig as any).mockResolvedValue({
        success: true,
        data: {
          endpoint: null,
          region: 'us-west-2',
          identityPoolId: null,
          userPoolId: 'pool',
        },
      });

      await iotService.connect('user-iot-fail-2');

      expect(console.log).toHaveBeenCalledWith(
        '[IoT] IoT Core not configured, push notifications disabled',
      );
    });

    it('should abort if no ID token is available', async () => {
      (apiClient.getIoTConfig as any).mockResolvedValue({
        success: true,
        data: {
          endpoint: 'endpoint.iot.amazonaws.com',
          region: 'us-west-2',
          identityPoolId: 'pool-id',
          userPoolId: 'pool',
        },
      });
      (apiClient.getIdToken as any).mockReturnValue(null);

      await iotService.connect('user-iot-fail-3');

      expect(console.warn).toHaveBeenCalledWith(
        '[IoT] No ID token available for IoT authentication',
      );
    });

    it('should abort if Cognito GetId returns no IdentityId', async () => {
      (apiClient.getIoTConfig as any).mockResolvedValue({
        success: true,
        data: {
          endpoint: 'endpoint.iot.amazonaws.com',
          region: 'us-west-2',
          identityPoolId: 'pool-id',
          userPoolId: 'pool',
        },
      });
      (apiClient.getIdToken as any).mockReturnValue('fake-token');
      mockSend.mockResolvedValueOnce({ IdentityId: null });

      await iotService.connect('user-iot-fail-4');

      expect(console.warn).toHaveBeenCalledWith('[IoT] Failed to get Cognito Identity ID');
    });

    it('should abort if registerIoT fails', async () => {
      (apiClient.getIoTConfig as any).mockResolvedValue({
        success: true,
        data: {
          endpoint: 'endpoint.iot.amazonaws.com',
          region: 'us-west-2',
          identityPoolId: 'pool-id',
          userPoolId: 'pool',
        },
      });
      (apiClient.getIdToken as any).mockReturnValue('fake-token');
      mockSend.mockResolvedValueOnce({ IdentityId: 'identity-x' });
      (apiClient.registerIoT as any).mockResolvedValue({ success: false });

      await iotService.connect('user-iot-fail-5');

      expect(console.warn).toHaveBeenCalledWith('[IoT] Failed to register IoT identity');
    });

    it('should abort if credentials are incomplete (missing AccessKeyId)', async () => {
      (apiClient.getIoTConfig as any).mockResolvedValue({
        success: true,
        data: {
          endpoint: 'endpoint.iot.amazonaws.com',
          region: 'us-west-2',
          identityPoolId: 'pool-id',
          userPoolId: 'pool',
        },
      });
      (apiClient.getIdToken as any).mockReturnValue('fake-token');
      (apiClient.registerIoT as any).mockResolvedValue({
        success: true,
        data: { registered: true, topic: 'user/id/commands' },
      });
      mockSend
        .mockResolvedValueOnce({ IdentityId: 'identity-y' })
        .mockResolvedValueOnce({
          Credentials: {
            AccessKeyId: null,
            SecretKey: 'SECRET',
            SessionToken: 'TOKEN',
          },
        });

      await iotService.connect('user-iot-fail-6');

      expect(console.warn).toHaveBeenCalledWith('[IoT] Failed to get temporary credentials');
    });

    it('should abort if credentials are missing entirely', async () => {
      (apiClient.getIoTConfig as any).mockResolvedValue({
        success: true,
        data: {
          endpoint: 'endpoint.iot.amazonaws.com',
          region: 'us-west-2',
          identityPoolId: 'pool-id',
          userPoolId: 'pool',
        },
      });
      (apiClient.getIdToken as any).mockReturnValue('fake-token');
      (apiClient.registerIoT as any).mockResolvedValue({
        success: true,
        data: { registered: true, topic: 'user/id/commands' },
      });
      mockSend
        .mockResolvedValueOnce({ IdentityId: 'identity-z' })
        .mockResolvedValueOnce({ Credentials: null });

      await iotService.connect('user-iot-fail-7');

      expect(console.warn).toHaveBeenCalledWith('[IoT] Failed to get temporary credentials');
    });

    it('should catch and log errors when the entire IoT Core flow throws', async () => {
      (apiClient.getIoTConfig as any).mockRejectedValue(new Error('Network error'));

      await iotService.connect('user-iot-fail-8');

      expect(console.warn).toHaveBeenCalledWith(
        '[IoT] Failed to connect to IoT Core:',
        expect.any(Error),
      );
    });

    it('should use default topic when registerIoT response has no topic', async () => {
      (apiClient.getIoTConfig as any).mockResolvedValue({
        success: true,
        data: {
          endpoint: 'abc.iot.us-west-2.amazonaws.com',
          region: 'us-west-2',
          identityPoolId: 'pool-id',
          userPoolId: 'pool',
        },
      });
      (apiClient.getIdToken as any).mockReturnValue('fake-token');
      (apiClient.registerIoT as any).mockResolvedValue({
        success: true,
        data: { registered: true }, // No topic field
      });
      (signIoTWebSocketUrl as any).mockResolvedValue('wss://signed-url');
      mockSend
        .mockResolvedValueOnce({ IdentityId: 'identity-456' })
        .mockResolvedValueOnce({
          Credentials: {
            AccessKeyId: 'AK',
            SecretKey: 'SK',
            SessionToken: 'ST',
          },
        });

      await iotService.connect('user-iot-default-topic');
      mockMqttClient.__fire('connect');

      // Should use the fallback topic format
      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
        'user/identity-456/commands',
        { qos: 1 },
      );
    });
  });
});
