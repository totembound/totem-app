/**
 * ApiClient service tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need to test the ApiClient class, not the singleton.
// Mock localStorage before import.
const mockLocalStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Mock fetch globally for these tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocks set up
// Use dynamic import to get fresh instance
let ApiClientModule: any;
let apiClient: any;

describe('ApiClient', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.clear();
    Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]);
    mockFetch.mockReset();

    // Re-import to get fresh instance
    vi.resetModules();
    ApiClientModule = await import('./ApiClient');
    apiClient = ApiClientModule.default;
  });

  describe('token management', () => {
    it('should start not authenticated when no tokens stored', () => {
      expect(apiClient.isAuthenticated()).toBe(false);
      expect(apiClient.getAccessToken()).toBeNull();
    });

    it('should load tokens from localStorage on construction', async () => {
      const tokens = {
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        idToken: 'test-id',
        expiresAt: Date.now() + 3600000,
      };
      mockLocalStorage['totembound_tokens'] = JSON.stringify(tokens);

      vi.resetModules();
      const mod = await import('./ApiClient');
      const client = mod.default;

      expect(client.isAuthenticated()).toBe(true);
      expect(client.getAccessToken()).toBe('test-access');
    });

    it('should handle corrupted localStorage gracefully', async () => {
      mockLocalStorage['totembound_tokens'] = 'not-json';

      vi.resetModules();
      const mod = await import('./ApiClient');
      const client = mod.default;

      expect(client.isAuthenticated()).toBe(false);
    });

    it('should clear tokens', async () => {
      const tokens = {
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        idToken: 'test-id',
        expiresAt: Date.now() + 3600000,
      };
      mockLocalStorage['totembound_tokens'] = JSON.stringify(tokens);

      vi.resetModules();
      const mod = await import('./ApiClient');
      const client = mod.default;

      expect(client.isAuthenticated()).toBe(true);
      client.clearTokens();
      expect(client.isAuthenticated()).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('totembound_tokens');
    });

    it('should return idToken via getIdToken', async () => {
      const tokens = {
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        idToken: 'my-id-token',
        expiresAt: Date.now() + 3600000,
      };
      mockLocalStorage['totembound_tokens'] = JSON.stringify(tokens);

      vi.resetModules();
      const mod = await import('./ApiClient');
      expect(mod.default.getIdToken()).toBe('my-id-token');
    });
  });

  describe('request - unauthenticated', () => {
    it('should return NOT_AUTHENTICATED when no tokens for auth-required request', async () => {
      const result = await apiClient.getTotems();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_AUTHENTICATED');
    });
  });

  describe('request - authenticated', () => {
    beforeEach(() => {
      const tokens = {
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        idToken: 'test-id',
        expiresAt: Date.now() + 3600000,
      };
      mockLocalStorage['totembound_tokens'] = JSON.stringify(tokens);
    });

    it('should make GET request with auth header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const result = await apiClient.getTotems();
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems');
      expect(options.headers['Authorization']).toBe('test-id');
      expect(options.method).toBe('GET');
    });

    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { action: 'feed' } }),
      });

      const result = await apiClient.feedTotem('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/ttm_1/feed');
      expect(options.method).toBe('POST');
    });

    it('should handle HTTP error with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: { code: 'INVALID', message: 'Bad param' } }),
      });

      const result = await apiClient.feedTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID');
      expect(result.error?.message).toBe('Bad param');
    });

    it('should handle HTTP error without JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('not json')),
      });

      const result = await apiClient.feedTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_500');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const result = await apiClient.feedTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Failed to fetch');
    });

    it('should handle JSON parse error on success response', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('bad json')),
      });

      const result = await apiClient.feedTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARSE_ERROR');
    });

    it('should retry on 401 with token refresh', async () => {
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { code: 'UNAUTHORIZED', message: 'Token expired' } }),
      });

      // Refresh call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          tokens: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            idToken: 'new-id',
            expiresIn: 3600,
          },
        }),
      });

      // Retry succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const result = await apiClient.getTotems();
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3); // original + refresh + retry
    });

    it('should fail on 401 when refresh fails', async () => {
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { code: 'UNAUTHORIZED', message: 'Token expired' } }),
      });

      // Refresh fails
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: false }),
      });

      const result = await apiClient.getTotems();
      expect(result.success).toBe(false);
    });
  });

  describe('login', () => {
    it('should save tokens on successful login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: 'u1', email: 'test@test.com', displayName: 'Test' },
            tokens: {
              accessToken: 'new-access',
              refreshToken: 'new-refresh',
              idToken: 'new-id',
              expiresIn: 3600,
            },
          },
        }),
      });

      const result = await apiClient.login('test@test.com', 'pass123');
      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'totembound_tokens',
        expect.stringContaining('new-access')
      );
      expect(apiClient.isAuthenticated()).toBe(true);
    });

    it('should not save tokens on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Wrong password' } }),
      });

      const result = await apiClient.login('test@test.com', 'wrong');
      expect(result.success).toBe(false);
    });
  });

  describe('signup', () => {
    it('should save tokens on successful signup', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: 'u1', email: 'new@test.com', displayName: 'New' },
            tokens: {
              accessToken: 'signup-access',
              refreshToken: 'signup-refresh',
              idToken: 'signup-id',
              expiresIn: 3600,
            },
          },
        }),
      });

      const result = await apiClient.signup('new@test.com', 'pass123', 'New');
      expect(result.success).toBe(true);
      expect(apiClient.isAuthenticated()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear tokens and call logout endpoint', async () => {
      const tokens = {
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        idToken: 'test-id',
        expiresAt: Date.now() + 3600000,
      };
      mockLocalStorage['totembound_tokens'] = JSON.stringify(tokens);

      // Need to re-import so it picks up the tokens
      vi.resetModules();
      const mod = await import('./ApiClient');
      const client = mod.default;

      // Logout endpoint call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await client.logout();
      expect(client.isAuthenticated()).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should still clear tokens even without refresh token', async () => {
      await apiClient.logout();
      expect(apiClient.isAuthenticated()).toBe(false);
      // No fetch call made (no refresh token to revoke)
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('shop listings with query params', () => {
    beforeEach(() => {
      mockLocalStorage['totembound_tokens'] = JSON.stringify({
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        idToken: 'test-id',
        expiresAt: Date.now() + 3600000,
      });
    });

    it('should build query string for shop listings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { listings: [], total: 0, hasMore: false } }),
      });

      await apiClient.getShopListings({
        page: 1,
        limit: 10,
        speciesId: 0,
        sortBy: 'price',
        sortOrder: 'asc',
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
      expect(url).toContain('speciesId=0');
      expect(url).toContain('sortBy=price');
      expect(url).toContain('sortOrder=asc');
    });

    it('should make request without query string when no options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { listings: [], total: 0, hasMore: false } }),
      });

      await apiClient.getShopListings();

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/shop/listings');
      expect(url).not.toContain('?');
    });
  });

  describe('unauthenticated endpoints', () => {
    it('should make exchange bundles request without auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { bundles: [], conversionRate: 10 } }),
      });

      const result = await apiClient.getExchangeBundles();
      expect(result.success).toBe(true);

      const [, options] = mockFetch.mock.calls[0];
      // Should NOT have Authorization header since requiresAuth is false
      expect(options.headers['Authorization']).toBeUndefined();
    });
  });

  describe('specific API methods', () => {
    beforeEach(() => {
      mockLocalStorage['totembound_tokens'] = JSON.stringify({
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        idToken: 'test-id',
        expiresAt: Date.now() + 3600000,
      });
    });

    it('setNickname should POST with nickname body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { totemId: 'ttm_1', nickname: 'Fluffy' } }),
      });

      await apiClient.setNickname('ttm_1', 'Fluffy');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/ttm_1/nickname');
      expect(JSON.parse(options.body)).toEqual({ nickname: 'Fluffy' });
    });

    it('completeChallenge should POST with totemId and score', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { score: 90 } }),
      });

      await apiClient.completeChallenge('c-0', 'ttm_1', 90);

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ totemId: 'ttm_1', score: 90 });
    });

    it('startExpedition should POST with totemId and totemIds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await apiClient.startExpedition('exp-1', ['ttm_1', 'ttm_2']);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.totemId).toBe('ttm_1');
      expect(body.totemIds).toEqual(['ttm_1', 'ttm_2']);
    });

    it('purchaseNewTotem should POST with options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { totem: { id: 'ttm_new' } } }),
      });

      await apiClient.purchaseNewTotem({ speciesId: 5 });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ speciesId: 5 });
    });

    it('purchaseNewTotem should POST empty object when no options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { totem: { id: 'ttm_new' } } }),
      });

      await apiClient.purchaseNewTotem();

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({});
    });

    it('getMyListings should append status param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { listings: [] } }),
      });

      await apiClient.getMyListings('active');

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('?status=active');
    });

    it('claimLootItem should POST with lootItemId and options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await apiClient.claimLootItem('loot_1', { speciesId: 3 });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ lootItemId: 'loot_1', options: { speciesId: 3 } });
    });

    it('getMe should GET /auth/me', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { id: 'u1', email: 'test@test.com' } }),
      });

      const result = await apiClient.getMe();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/me');
      expect(options.method).toBe('GET');
    });

    it('getTotem should GET /totems/:id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { id: 'ttm_1' } }),
      });

      const result = await apiClient.getTotem('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/ttm_1');
      expect(options.method).toBe('GET');
    });

    it('trainTotem should POST /totems/:id/train', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { action: 'train', xpGained: 50 } }),
      });

      const result = await apiClient.trainTotem('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/ttm_1/train');
      expect(options.method).toBe('POST');
    });

    it('treatTotem should POST /totems/:id/treat', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { action: 'treat', xpGained: 10 } }),
      });

      const result = await apiClient.treatTotem('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/ttm_1/treat');
      expect(options.method).toBe('POST');
    });

    it('evolveTotem should POST /totems/:id/evolve', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { action: 'evolve', evolution: { newStage: 2 } } }),
      });

      const result = await apiClient.evolveTotem('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/ttm_1/evolve');
      expect(options.method).toBe('POST');
    });

    it('getCooldowns should GET /totems/:id/cooldowns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { totemId: 'ttm_1', cooldowns: {} } }),
      });

      const result = await apiClient.getCooldowns('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/ttm_1/cooldowns');
      expect(options.method).toBe('GET');
    });

    it('getEvolutionStatus should GET /totems/:id/evolution', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { totemId: 'ttm_1', canEvolve: false } }),
      });

      const result = await apiClient.getEvolutionStatus('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/ttm_1/evolution');
      expect(options.method).toBe('GET');
    });

    it('getTotemStatus should GET /totems/:id/status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { totemId: 'ttm_1', stage: 1 } }),
      });

      const result = await apiClient.getTotemStatus('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/ttm_1/status');
      expect(options.method).toBe('GET');
    });

    it('getProfile should GET /user/profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { id: 'u1', displayName: 'Test' } }),
      });

      const result = await apiClient.getProfile();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/user/profile');
      expect(options.method).toBe('GET');
    });

    it('updateProfile should PUT /user/profile with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { displayName: 'NewName' } }),
      });

      const result = await apiClient.updateProfile({ displayName: 'NewName' });
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/user/profile');
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual({ displayName: 'NewName' });
    });

    it('getRewardStatus should GET /rewards/status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { daily: { canClaim: true }, weekly: { canClaim: false } } }),
      });

      const result = await apiClient.getRewardStatus();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/rewards/status');
      expect(options.method).toBe('GET');
    });

    it('claimDailyReward should POST /rewards/daily/claim', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { reward: { amount: 100 } } }),
      });

      const result = await apiClient.claimDailyReward();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/rewards/daily/claim');
      expect(options.method).toBe('POST');
    });

    it('claimWeeklyReward should POST /rewards/weekly/claim', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { reward: { amount: 500 } } }),
      });

      const result = await apiClient.claimWeeklyReward();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/rewards/weekly/claim');
      expect(options.method).toBe('POST');
    });

    it('purchaseProtection should POST /rewards/:type/protection with tier', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { rewardType: 'daily', tier: 1 } }),
      });

      const result = await apiClient.purchaseProtection('daily', 1);
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/rewards/daily/protection');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ tier: 1 });
    });

    it('purchaseProtection should work with weekly type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { rewardType: 'weekly', tier: 2 } }),
      });

      const result = await apiClient.purchaseProtection('weekly', 2);
      expect(result.success).toBe(true);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/rewards/weekly/protection');
    });

    it('getChallenges should GET /challenges', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { challenges: [], summary: {} } }),
      });

      const result = await apiClient.getChallenges();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/challenges');
      expect(options.method).toBe('GET');
    });

    it('getExpeditions should GET /expeditions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { available: [], active: [] } }),
      });

      const result = await apiClient.getExpeditions();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/expeditions');
      expect(options.method).toBe('GET');
    });

    it('getActiveExpeditions should GET /expeditions/active', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { expeditions: [], summary: { total: 0 } } }),
      });

      const result = await apiClient.getActiveExpeditions();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/expeditions/active');
      expect(options.method).toBe('GET');
    });

    it('claimExpeditionRewards should POST /expeditions/:totemId/claim', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { rewards: { experience: 100 } } }),
      });

      const result = await apiClient.claimExpeditionRewards('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/expeditions/ttm_1/claim');
      expect(options.method).toBe('POST');
    });

    it('getGemPackages should GET /shop/gems/packages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { packages: [], conversionRate: 10 } }),
      });

      const result = await apiClient.getGemPackages();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/shop/gems/packages');
      expect(options.method).toBe('GET');
    });

    it('purchaseGems should POST /shop/gems/checkout with packageId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { gemsAdded: 100, isDev: true } }),
      });

      const result = await apiClient.purchaseGems('pkg_starter');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/shop/gems/checkout');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ packageId: 'pkg_starter' });
    });

    it('exchangeGemsForEssence should POST /shop/exchange with bundleId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { bundleId: 'b1', essenceReceived: 500 } }),
      });

      const result = await apiClient.exchangeGemsForEssence('b1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/shop/exchange');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ bundleId: 'b1' });
    });

    it('getAchievements should GET /achievements', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { achievements: {} } }),
      });

      const result = await apiClient.getAchievements();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/achievements');
      expect(options.method).toBe('GET');
    });

    it('checkAchievement should POST /achievements/:id/check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { unlocked: true } }),
      });

      const result = await apiClient.checkAchievement('ach_first_feed');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/achievements/ach_first_feed/check');
      expect(options.method).toBe('POST');
    });

    it('getTotemPurchaseInfo should GET /totems/purchase/info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { cost: 500, currency: 'essence' } }),
      });

      const result = await apiClient.getTotemPurchaseInfo();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/purchase/info');
      expect(options.method).toBe('GET');
    });

    it('listTotemForSale should POST /shop/list with totemId and askingPrice', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { listing: { id: 'lst_1' } } }),
      });

      const result = await apiClient.listTotemForSale('ttm_1', 350);
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/shop/list');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ totemId: 'ttm_1', askingPrice: 350 });
    });

    it('purchaseUnboundTotem should POST /shop/purchase with totemId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { totem: { id: 'ttm_2' }, totalPaid: 450 } }),
      });

      const result = await apiClient.purchaseUnboundTotem('ttm_2');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/shop/purchase');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ totemId: 'ttm_2' });
    });

    it('cancelListing should POST /shop/cancel with totemId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { message: 'Listing cancelled' } }),
      });

      const result = await apiClient.cancelListing('ttm_1');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/shop/cancel');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ totemId: 'ttm_1' });
    });

    it('getShopConfig should GET /shop/config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { listingFee: 50, purchaseFee: 100 } }),
      });

      const result = await apiClient.getShopConfig();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/shop/config');
      expect(options.method).toBe('GET');
    });

    it('createSubscriptionCheckout should POST /subscription/checkout with tier', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { sessionUrl: 'https://stripe.com/checkout' } }),
      });

      const result = await apiClient.createSubscriptionCheckout('premium');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/subscription/checkout');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ tier: 'premium' });
    });

    it('getSubscriptionStatus should GET /subscription/status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { tier: 'free', subscription: { status: 'none' } } }),
      });

      const result = await apiClient.getSubscriptionStatus();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/subscription/status');
      expect(options.method).toBe('GET');
    });

    it('cancelSubscription should POST /subscription/cancel', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { message: 'Subscription cancelled' } }),
      });

      const result = await apiClient.cancelSubscription();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/subscription/cancel');
      expect(options.method).toBe('POST');
    });

    it('reactivateSubscription should POST /subscription/reactivate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { message: 'Subscription reactivated' } }),
      });

      const result = await apiClient.reactivateSubscription();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/subscription/reactivate');
      expect(options.method).toBe('POST');
    });

    it('getBillingPortalUrl should GET /subscription/portal', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { portalUrl: 'https://billing.stripe.com/session' } }),
      });

      const result = await apiClient.getBillingPortalUrl();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/subscription/portal');
      expect(options.method).toBe('GET');
    });

    it('getSubscriptionBonusStatus should GET /subscription/bonus-status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { eligible: true, canClaim: true } }),
      });

      const result = await apiClient.getSubscriptionBonusStatus();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/subscription/bonus-status');
      expect(options.method).toBe('GET');
    });

    it('claimSubscriptionBonus should POST /subscription/claim-bonus', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { essence: 500, gems: 50 } }),
      });

      const result = await apiClient.claimSubscriptionBonus();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/subscription/claim-bonus');
      expect(options.method).toBe('POST');
    });

    it('getSpecialOfferBundles should GET /shop/bundles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { bundles: [] } }),
      });

      const result = await apiClient.getSpecialOfferBundles();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/shop/bundles');
      expect(options.method).toBe('GET');
    });

    it('purchaseBundle should POST /shop/bundles/purchase with bundleId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { bundle: { name: 'Collector' }, gemsSpent: 200 } }),
      });

      const result = await apiClient.purchaseBundle(1);
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/shop/bundles/purchase');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ bundleId: 1 });
    });

    it('getLootItems should GET /loot/items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { items: [], count: 0 } }),
      });

      const result = await apiClient.getLootItems();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/loot/items');
      expect(options.method).toBe('GET');
    });

    it('getIoTConfig should GET /iot/config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { endpoint: null, registered: false } }),
      });

      const result = await apiClient.getIoTConfig();
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/iot/config');
      expect(options.method).toBe('GET');
    });

    it('registerIoT should POST /iot/register with identityId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { registered: true, topic: 'user/u1' } }),
      });

      const result = await apiClient.registerIoT('identity-123');
      expect(result.success).toBe(true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/iot/register');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ identityId: 'identity-123' });
    });

    it('getMyListings should work without status param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { listings: [] } }),
      });

      await apiClient.getMyListings();

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/shop/my-listings');
      expect(url).not.toContain('?status=');
    });

    it('getShopListings should include rarityId, minPrice, maxPrice query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { listings: [], total: 0, hasMore: false } }),
      });

      await apiClient.getShopListings({
        rarityId: 3,
        minPrice: 100,
        maxPrice: 500,
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('rarityId=3');
      expect(url).toContain('minPrice=100');
      expect(url).toContain('maxPrice=500');
    });
  });

  describe('token refresh edge cases', () => {
    beforeEach(() => {
      mockLocalStorage['totembound_tokens'] = JSON.stringify({
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        idToken: 'test-id',
        expiresAt: Date.now() + 3600000,
      });
    });

    it('should handle refresh network error by clearing tokens', async () => {
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { code: 'UNAUTHORIZED', message: 'Expired' } }),
      });

      // Refresh call throws network error
      mockFetch.mockRejectedValueOnce(new Error('Network down'));

      const result = await apiClient.getTotems();
      expect(result.success).toBe(false);
      // Tokens should be cleared after failed refresh
      expect(apiClient.isAuthenticated()).toBe(false);
    });

    it('should handle non-Error throw in network error', async () => {
      mockFetch.mockRejectedValueOnce('string error');

      const result = await apiClient.feedTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Network error');
    });

    it('should handle HTTP error with message but no error field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ message: 'Access denied' }),
      });

      const result = await apiClient.feedTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_403');
      expect(result.error?.message).toBe('Access denied');
    });

    it('should handle HTTP error with empty statusText', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: '',
        json: () => Promise.reject(new Error('not json')),
      });

      const result = await apiClient.feedTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_502');
      expect(result.error?.message).toBe('Request failed with status 502');
    });
  });

  describe('fuseTotem', () => {
    beforeEach(() => {
      const tokens = {
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        idToken: 'test-id',
        expiresAt: Date.now() + 3600000,
      };
      mockLocalStorage['totembound_tokens'] = JSON.stringify(tokens);
    });

    it('should POST to /totems/forge with totemIds array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          success: true,
          data: {
            action: 'forge',
            fusionType: 'wild',
            consumedTotemIds: ['ttm_1', 'ttm_2', 'ttm_3'],
            newTotem: { id: 'ttm_new', speciesId: 2, speciesName: 'Wolf', colorId: 5, rarityId: 1, stage: 0 },
            newEssenceBalance: 1500,
            achievements: [],
          },
        }),
      });

      const result = await apiClient.fuseTotem(['ttm_1', 'ttm_2', 'ttm_3']);
      expect(result.success).toBe(true);
      expect(result.data?.action).toBe('forge');
      expect(result.data?.fusionType).toBe('wild');
      expect(result.data?.newTotem.speciesName).toBe('Wolf');
      expect(result.data?.consumedTotemIds).toEqual(['ttm_1', 'ttm_2', 'ttm_3']);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/totems/forge');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ totemIds: ['ttm_1', 'ttm_2', 'ttm_3'] });
    });

    it('should handle pure fusion response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          success: true,
          data: {
            action: 'forge',
            fusionType: 'pure',
            consumedTotemIds: ['ttm_a', 'ttm_b', 'ttm_c'],
            newTotem: { id: 'ttm_forged', speciesId: 0, speciesName: 'Goose', colorId: 3, rarityId: 2, stage: 0 },
            newEssenceBalance: 2000,
            achievements: [{ achievementId: 'ach_fusion-progression', milestone: 0, rewards: { essence: 100, xp: 150 } }],
          },
        }),
      });

      const result = await apiClient.fuseTotem(['ttm_a', 'ttm_b', 'ttm_c']);
      expect(result.success).toBe(true);
      expect(result.data?.fusionType).toBe('pure');
      expect(result.data?.achievements).toHaveLength(1);
      expect(result.data?.achievements[0].achievementId).toBe('ach_fusion-progression');
    });

    it('should handle INVALID_IDS error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'INVALID_IDS', message: 'Must provide exactly 3 totem IDs' },
        }),
      });

      const result = await apiClient.fuseTotem(['ttm_1']);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_IDS');
    });

    it('should handle RARITY_MISMATCH error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'RARITY_MISMATCH', message: 'All 3 totems must be the same rarity' },
        }),
      });

      const result = await apiClient.fuseTotem(['ttm_1', 'ttm_2', 'ttm_3']);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RARITY_MISMATCH');
    });

    it('should handle SERVICE_UNAVAILABLE error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'SERVICE_UNAVAILABLE', message: 'Unable to verify expedition status' },
        }),
      });

      const result = await apiClient.fuseTotem(['ttm_1', 'ttm_2', 'ttm_3']);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const result = await apiClient.fuseTotem(['ttm_1', 'ttm_2', 'ttm_3']);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });
});
