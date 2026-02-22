/**
 * IoTService - Real-time server push notifications
 *
 * Strategy Pattern — Transport is selected at connect time based on environment:
 *   - Local: Socket.IO client connecting to API server (localhost:3001)
 *   - AWS:   MQTT over WebSocket to IoT Core (SigV4 signed via Cognito Identity Pool)
 *
 * The server publishes commands to per-user topics. This service subscribes
 * and dispatches them to registered handlers.
 *
 * Used ONLY for server-initiated events with no active HTTP request:
 *   - Stripe webhook → balance_update (gems purchased)
 *   - Admin broadcasts → app_reload, config_update
 *   - Background → expedition completion (future)
 *
 * All action-triggered notifications use API responses (Phase 1).
 */

import apiClient from './ApiClient';
import { signIoTWebSocketUrl } from '../utils/sigv4';

// ============================================================================
// Types
// ============================================================================

export interface IoTCommand {
  type: 'notification' | 'balance_update' | 'totem_update' | 'app_reload' | 'config_update' | 'sync' | 'force_logout';
  id: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export type CommandHandler = (command: IoTCommand) => void;

/** Common interface for both transports */
interface Transport {
  disconnect(): void;
}

// ============================================================================
// IoTService
// ============================================================================

class IoTService {
  private handlers: Map<string, Set<CommandHandler>> = new Map();
  private globalHandlers: Set<CommandHandler> = new Set();
  private connected = false;
  private userId: string | null = null;
  private transport: Transport | null = null;

  /** Deduplication: track recently seen message IDs (prevents QoS 1 duplicates) */
  private recentMessageIds: Set<string> = new Set();
  private readonly DEDUP_MAX_SIZE = 100;

  // ============================================
  // Connection lifecycle
  // ============================================

  /**
   * Connect to the push notification transport.
   * Call after user login with the user's ID.
   */
  async connect(userId: string): Promise<void> {
    if (this.connected && this.userId === userId) return;

    // Disconnect any previous connection
    this.disconnect();

    this.userId = userId;

    if (this.isLocalMode()) {
      await this.connectSocketIO(userId);
    } else {
      await this.connectIoTCore(userId);
    }
  }

  /**
   * Disconnect from the push notification transport.
   * Call on user logout.
   */
  disconnect(): void {
    if (this.transport) {
      this.transport.disconnect();
      this.transport = null;
    }
    this.connected = false;
    this.userId = null;
    console.log('[IoT] Disconnected');
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  // ============================================
  // Command handlers (pub/sub pattern)
  // ============================================

  /**
   * Register a handler for a specific command type.
   * Returns an unsubscribe function.
   */
  on(type: string, handler: CommandHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * Register a handler for ALL command types.
   * Returns an unsubscribe function.
   */
  onAny(handler: CommandHandler): () => void {
    this.globalHandlers.add(handler);
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  /**
   * Remove all handlers
   */
  removeAllHandlers(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
  }

  // ============================================
  // Internal: dispatch with deduplication
  // ============================================

  private dispatch(command: IoTCommand): void {
    // Deduplicate (QoS 1 may deliver the same message twice)
    if (command.id && this.recentMessageIds.has(command.id)) {
      console.log(`[IoT] Duplicate command ${command.id} ignored`);
      return;
    }

    // Track message ID for dedup
    if (command.id) {
      this.recentMessageIds.add(command.id);
      // Evict oldest entries when the set gets too large
      if (this.recentMessageIds.size > this.DEDUP_MAX_SIZE) {
        const first = this.recentMessageIds.values().next().value;
        if (first !== undefined) this.recentMessageIds.delete(first);
      }
    }

    console.log(`[IoT] Received command: ${command.type}`, command);

    // Type-specific handlers
    const typeHandlers = this.handlers.get(command.type);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        try {
          handler(command);
        } catch (err) {
          console.error(`[IoT] Handler error for ${command.type}:`, err);
        }
      }
    }

    // Global handlers
    for (const handler of this.globalHandlers) {
      try {
        handler(command);
      } catch (err) {
        console.error('[IoT] Global handler error:', err);
      }
    }
  }

  // ============================================
  // Transport: Socket.IO (local development)
  // ============================================

  private async connectSocketIO(userId: string): Promise<void> {
    try {
      // Dynamic import to avoid bundling socket.io-client in production
      const { io } = await import('socket.io-client');

      // Strip path (e.g. /v1) — Socket.IO interprets paths as namespaces
      const raw = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const baseUrl = new URL(raw).origin;
      const socket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      socket.on('connect', () => {
        console.log(`[IoT] Socket.IO connected, subscribing for user ${userId}`);
        socket.emit('subscribe', { userId });
        this.connected = true;
      });

      socket.on('command', (command: IoTCommand) => {
        this.dispatch(command);
      });

      socket.on('disconnect', () => {
        console.log('[IoT] Socket.IO disconnected');
        this.connected = false;
      });

      socket.on('connect_error', (err: Error) => {
        console.warn('[IoT] Socket.IO connection error:', err.message);
      });

      this.transport = {
        disconnect: () => socket.disconnect(),
      };
    } catch (err) {
      console.warn('[IoT] Failed to connect Socket.IO:', err);
    }
  }

  // ============================================
  // Transport: AWS IoT Core (production)
  // ============================================

  private async connectIoTCore(_userId: string): Promise<void> {
    try {
      // Get IoT config from backend
      const configResponse = await apiClient.getIoTConfig();
      if (!configResponse.success || !configResponse.data) {
        console.warn('[IoT] Failed to get IoT config');
        return;
      }

      const { endpoint, region, identityPoolId, userPoolId } = configResponse.data;

      if (!endpoint || !identityPoolId) {
        console.log('[IoT] IoT Core not configured, push notifications disabled');
        return;
      }

      // Get the user's ID token for Cognito Identity Pool authentication
      const idToken = apiClient.getIdToken();
      if (!idToken) {
        console.warn('[IoT] No ID token available for IoT authentication');
        return;
      }

      // Step 1: Get Cognito Identity credentials
      const { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } = await import('@aws-sdk/client-cognito-identity');

      const cognitoClient = new CognitoIdentityClient({ region });
      const providerName = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

      const getIdResult = await cognitoClient.send(new GetIdCommand({
        IdentityPoolId: identityPoolId,
        Logins: { [providerName]: idToken },
      }));

      const identityId = getIdResult.IdentityId;
      if (!identityId) {
        console.warn('[IoT] Failed to get Cognito Identity ID');
        return;
      }

      // Register the identity with the backend (stores mapping + attaches IoT policy)
      const registerResponse = await apiClient.registerIoT(identityId);
      if (!registerResponse.success) {
        console.warn('[IoT] Failed to register IoT identity');
        return;
      }

      const topic = registerResponse.data?.topic || `user/${identityId}/commands`;

      // Step 2: Get temporary credentials
      const credsResult = await cognitoClient.send(new GetCredentialsForIdentityCommand({
        IdentityId: identityId,
        Logins: { [providerName]: idToken },
      }));

      const credentials = credsResult.Credentials;
      if (!credentials?.AccessKeyId || !credentials?.SecretKey || !credentials?.SessionToken) {
        console.warn('[IoT] Failed to get temporary credentials');
        return;
      }

      // Step 3: Create SigV4 signed WebSocket URL for IoT Core
      const signedUrl = await signIoTWebSocketUrl(
        endpoint,
        region,
        credentials.AccessKeyId,
        credentials.SecretKey,
        credentials.SessionToken,
      );

      // Step 4: Connect via MQTT over WebSocket
      const mqttModule = await import('mqtt');
      // Handle both ESM default export and direct named exports
      const mqtt = mqttModule.default || mqttModule;
      const clientId = `${identityId}-${Date.now()}`;
      const globalTopic = 'global/commands';

      // Disconnect previous transport before creating new one (prevents orphaned timers)
      if (this.transport) {
        this.transport.disconnect();
        this.transport = null;
      }

      const mqttClient = mqtt.connect(signedUrl, {
        clientId,
        clean: true,
        reconnectPeriod: 0, // Disable auto-reconnect; we handle it via credential refresh
        connectTimeout: 10000,
      });

      mqttClient.on('connect', () => {
        console.log(`[IoT] MQTT connected, subscribing to ${topic} + ${globalTopic}`);
        mqttClient.subscribe(topic, { qos: 1 });
        mqttClient.subscribe(globalTopic, { qos: 1 });
        this.connected = true;
      });

      mqttClient.on('message', (_topic: string, payload: Buffer) => {
        try {
          const command = JSON.parse(payload.toString()) as IoTCommand;
          this.dispatch(command);
        } catch (err) {
          console.error('[IoT] Failed to parse MQTT message:', err);
        }
      });

      mqttClient.on('error', (err: Error) => {
        console.error('[IoT] MQTT error:', err.message);
      });

      mqttClient.on('close', () => {
        console.log('[IoT] MQTT connection closed');
        this.connected = false;
      });

      // Schedule credential refresh (50 minutes into the 1-hour STS token)
      const refreshTimer = setTimeout(() => {
        console.log('[IoT] Refreshing MQTT credentials...');
        if (this.userId) {
          this.connectIoTCore(this.userId);
        }
      }, 50 * 60 * 1000);

      this.transport = {
        disconnect: () => {
          clearTimeout(refreshTimer);
          mqttClient.end(true);
        },
      };
    } catch (err) {
      console.warn('[IoT] Failed to connect to IoT Core:', err);
    }
  }

  // ============================================
  // Helpers
  // ============================================

  private isLocalMode(): boolean {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    return !apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  }
}

// Export singleton
export const iotService = new IoTService();
export default iotService;
