/**
 * Totem Service tests
 *
 * Tests fetchTotems, fetchTotem, performTotemAction, and the internal
 * transformTotem logic that enriches API responses with static JSON config.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the species utils (used for per-color stage names and images)
vi.mock('../utils/species', () => ({
  getStageName: vi.fn().mockReturnValue('Cached Stage Name'),
  isSpeciesLoaded: vi.fn().mockReturnValue(false),
  getTotemImageUrl: vi.fn().mockReturnValue('/cached-image.png'),
}));

import { isSpeciesLoaded, getStageName as getPerColorStageName, getTotemImageUrl as getSpeciesImageUrl } from '../utils/species';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const store: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
  },
  writable: true,
});

import { fetchTotems, fetchTotem, performTotemAction } from './totem';

// Helper: build a minimal API totem response
function makeApiTotem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ttm_test1',
    displayName: 'Brown Hatchling',
    name: 'Goose',
    description: 'A goose totem',
    image: '/api-image.png',
    affinity: 'Wisdom',
    domain: 'Water',
    attributes: {
      species: 0,    // Goose
      color: 0,      // Brown
      rarity: 0,     // Common
      happiness: 80,
      experience: 500,
      stage: 1,
      strength: 8,
      agility: 6,
      wisdom: 10,
      nickname: null,
      prestigeLevel: 0,
      isStaked: false,
    },
    trackings: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    ...overrides,
  };
}

function setAuthToken(token: string) {
  store['totembound_tokens'] = JSON.stringify({ accessToken: token });
}

function _clearAuth() {
  delete store['totembound_tokens'];
}

describe('totem service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(store).forEach(k => delete store[k]);
    // Default: species not loaded in cache
    (isSpeciesLoaded as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  // ============================================
  // fetchTotems
  // ============================================

  describe('fetchTotems', () => {
    it('should return UNAUTHORIZED when no token stored', async () => {
      const result = await fetchTotems();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
      expect(result.totems).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return corrupted token as not authenticated', async () => {
      store['totembound_tokens'] = 'not-json';
      const result = await fetchTotems();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });

    it('should fetch and transform totems on success', async () => {
      setAuthToken('test-access');

      const apiTotem = makeApiTotem();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: [apiTotem] }),
      });

      const result = await fetchTotems();
      expect(result.success).toBe(true);
      expect(result.totems).toHaveLength(1);

      const totem = result.totems[0];
      expect(totem.id).toBe('ttm_test1');
      expect(totem.attributes.species).toBe(0);
      expect(totem.attributes.happiness).toBe(80);
      expect(totem.attributes.experience).toBe(500);
      expect(totem.attributes.stage).toBe(1);
      expect(totem.attributes.strength).toBe(8);
      expect(totem.attributes.agility).toBe(6);
      expect(totem.attributes.wisdom).toBe(10);
      expect(totem.attributes.prestigeLevel).toBe(0);
      expect(totem.attributes.isStaked).toBe(false);

      // Verify auth header sent
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1/totems');
      expect(options.headers['Authorization']).toBe('Bearer test-access');
    });

    it('should return empty totems array on API failure', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Invalid request' },
        }),
      });

      const result = await fetchTotems();
      expect(result.success).toBe(false);
      expect(result.totems).toEqual([]);
      expect(result.error).toBe('Invalid request');
    });

    it('should return error message when API returns success:false', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: false }),
      });

      const result = await fetchTotems();
      expect(result.success).toBe(false);
      expect(result.totems).toEqual([]);
      expect(result.error).toBe('Failed to fetch totems');
    });

    it('should handle network error', async () => {
      setAuthToken('test-access');
      vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await fetchTotems();
      expect(result.success).toBe(false);
      expect(result.totems).toEqual([]);
      expect(result.error).toBe('Network failure');
    });

    it('should handle non-Error throw', async () => {
      setAuthToken('test-access');
      vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce('string error');

      const result = await fetchTotems();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('should transform multiple totems', async () => {
      setAuthToken('test-access');

      const totems = [
        makeApiTotem({ id: 'ttm_1' }),
        makeApiTotem({ id: 'ttm_2', attributes: { ...makeApiTotem().attributes, species: 1, color: 4, rarity: 2 } }),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: totems }),
      });

      const result = await fetchTotems();
      expect(result.success).toBe(true);
      expect(result.totems).toHaveLength(2);
      expect(result.totems[0].id).toBe('ttm_1');
      expect(result.totems[1].id).toBe('ttm_2');
    });
  });

  // ============================================
  // fetchTotem
  // ============================================

  describe('fetchTotem', () => {
    it('should return UNAUTHORIZED when no token', async () => {
      const result = await fetchTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
      expect(result.totem).toBeUndefined();
    });

    it('should fetch and transform a single totem', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: makeApiTotem({ id: 'ttm_42' }) }),
      });

      const result = await fetchTotem('ttm_42');
      expect(result.success).toBe(true);
      expect(result.totem).toBeDefined();
      expect(result.totem!.id).toBe('ttm_42');

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/v1/totems/ttm_42');
    });

    it('should return error on API failure', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Totem not found' },
        }),
      });

      const result = await fetchTotem('ttm_missing');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Totem not found');
    });

    it('should return fallback error when no error message', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: false }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch totem');
    });

    it('should handle network error', async () => {
      setAuthToken('test-access');
      vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await fetchTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });
  });

  // ============================================
  // performTotemAction
  // ============================================

  describe('performTotemAction', () => {
    it('should return UNAUTHORIZED when no token', async () => {
      const result = await performTotemAction('ttm_1', 'feed');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });

    it('should POST feed action and transform result', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ id: 'ttm_1', attributes: { ...makeApiTotem().attributes, happiness: 90 } }),
        }),
      });

      const result = await performTotemAction('ttm_1', 'feed');
      expect(result.success).toBe(true);
      expect(result.totem).toBeDefined();
      expect(result.totem!.attributes.happiness).toBe(90);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1/totems/ttm_1/feed');
      expect(options.method).toBe('POST');
    });

    it('should POST train action', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: makeApiTotem() }),
      });

      await performTotemAction('ttm_1', 'train');
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/totems/ttm_1/train');
    });

    it('should POST treat action', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: makeApiTotem() }),
      });

      await performTotemAction('ttm_1', 'treat');
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/totems/ttm_1/treat');
    });

    it('should POST evolve action', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: makeApiTotem() }),
      });

      await performTotemAction('ttm_1', 'evolve');
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/totems/ttm_1/evolve');
    });

    it('should return error on API failure', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'COOLDOWN', message: 'Action on cooldown' },
        }),
      });

      const result = await performTotemAction('ttm_1', 'feed');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Action on cooldown');
    });

    it('should return fallback error when no error message', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: false }),
      });

      const result = await performTotemAction('ttm_1', 'train');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to train totem');
    });

    it('should handle network error', async () => {
      setAuthToken('test-access');
      vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await performTotemAction('ttm_1', 'feed');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout');
    });

    it('should handle non-Error throw', async () => {
      setAuthToken('test-access');
      vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(42);

      const result = await performTotemAction('ttm_1', 'evolve');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  // ============================================
  // transformTotem (tested via fetchTotem)
  // ============================================

  describe('transform logic', () => {
    beforeEach(() => {
      setAuthToken('test-access');
    });

    it('should enrich with species name from local JSON (Goose → Mystic Goose)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: makeApiTotem({ attributes: { ...makeApiTotem().attributes, species: 0 } }) }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.name).toBe('Mystic Goose');
    });

    it('should enrich with species description from local JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: makeApiTotem() }),
      });

      const result = await fetchTotem('ttm_1');
      // Species 0 = Goose, should have real description from species.json
      expect(result.totem!.description).toContain('Goose');
    });

    it('should fallback description for unknown species', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ attributes: { ...makeApiTotem().attributes, species: 999 } }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.description).toBe('A mystical spirit companion.');
    });

    it('should use fallback display name when species not cached (Color StageName)', async () => {
      (isSpeciesLoaded as ReturnType<typeof vi.fn>).mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ attributes: { ...makeApiTotem().attributes, species: 0, color: 0, stage: 0 } }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      // Color 0 = Brown, Species 0/Stage 0 = Hatchling
      expect(result.totem!.displayName).toBe('Brown Hatchling');
    });

    it('should use cached stage name when species is loaded', async () => {
      (isSpeciesLoaded as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (getPerColorStageName as ReturnType<typeof vi.fn>).mockReturnValue('Sunbranch Kit');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: makeApiTotem() }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.displayName).toBe('Sunbranch Kit');
      expect(getPerColorStageName).toHaveBeenCalledWith(0, 0, 1);
    });

    it('should use cached image when species is loaded', async () => {
      (isSpeciesLoaded as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (getSpeciesImageUrl as ReturnType<typeof vi.fn>).mockReturnValue('/species-cached.png');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: makeApiTotem() }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.image).toBe('/species-cached.png');
    });

    it('should use API image when species not loaded', async () => {
      (isSpeciesLoaded as ReturnType<typeof vi.fn>).mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ image: '/api-fallback.png' }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.image).toBe('/api-fallback.png');
    });

    it('should get affinity and domain from species config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ attributes: { ...makeApiTotem().attributes, species: 0 } }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      // Species 0 = Goose, affinity=Wisdom, domain=Water (from species.json)
      expect(result.totem!.affinity).toBe('Wisdom');
      expect(result.totem!.domain).toBe('Water');
    });

    it('should fallback affinity/domain to API values for unknown species', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({
            affinity: 'Spirit',
            domain: 'Shadow',
            attributes: { ...makeApiTotem().attributes, species: 999 },
          }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.affinity).toBe('Spirit');
      expect(result.totem!.domain).toBe('Shadow');
    });

    it('should fallback to "Spirit" when both config and API values missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({
            affinity: '',
            domain: '',
            attributes: { ...makeApiTotem().attributes, species: 999 },
          }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.affinity).toBe('Spirit');
      expect(result.totem!.domain).toBe('Spirit');
    });

    it('should fallback species name to apiTotem.name for unknown species', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({
            name: 'Dragon Spirit',
            attributes: { ...makeApiTotem().attributes, species: 999 },
          }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.name).toBe('Dragon Spirit');
    });

    it('should fallback species name to "Unknown Totem" when all fallbacks empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({
            name: '',
            attributes: { ...makeApiTotem().attributes, species: 999 },
          }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.name).toBe('Unknown Totem');
    });

    it('should transform trackings to ActionType keys', async () => {
      const trackings = {
        0: { lastUsed: 1000, dailyUses: 2, dayStartTime: 500 },
        1: { lastUsed: 2000, dailyUses: 1, dayStartTime: 1000 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ trackings }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.trackings).toBeDefined();
      expect(result.totem!.trackings![0]).toEqual({
        lastUsed: 1000,
        dailyUses: 2,
        dayStartTime: 500,
      });
      expect(result.totem!.trackings![1]).toEqual({
        lastUsed: 2000,
        dailyUses: 1,
        dayStartTime: 1000,
      });
    });

    it('should handle empty trackings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ trackings: {} }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.trackings).toEqual({});
    });

    it('should handle null/undefined tracking values', async () => {
      const trackings = {
        0: { lastUsed: 1000, dailyUses: 2, dayStartTime: 500 },
        1: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ trackings }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      // Only action 0 should be present (1 was undefined)
      expect(result.totem!.trackings![0]).toBeDefined();
      expect(result.totem!.trackings![1]).toBeUndefined();
    });

    it('should set nickname to null when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ attributes: { ...makeApiTotem().attributes, nickname: null } }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.attributes.nickname).toBeNull();
    });

    it('should preserve nickname when set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ attributes: { ...makeApiTotem().attributes, nickname: 'Fluffy' } }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.attributes.nickname).toBe('Fluffy');
    });

    it('should use color name from colors.json', async () => {
      (isSpeciesLoaded as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Color 8 = Golden
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ attributes: { ...makeApiTotem().attributes, color: 8, stage: 0 } }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.displayName).toContain('Golden');
    });

    it('should use "Unknown" for invalid color ID', async () => {
      (isSpeciesLoaded as ReturnType<typeof vi.fn>).mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ attributes: { ...makeApiTotem().attributes, color: 999, species: 0, stage: 0 } }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.totem!.displayName).toContain('Unknown');
    });

    it('should use default stages for unknown species', async () => {
      (isSpeciesLoaded as ReturnType<typeof vi.fn>).mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: makeApiTotem({ attributes: { ...makeApiTotem().attributes, species: 999, stage: 2, color: 0 } }),
        }),
      });

      const result = await fetchTotem('ttm_1');
      // Default stages[2] = 'Sub-Adult'
      expect(result.totem!.displayName).toContain('Sub-Adult');
    });

    it('should handle API error without error object', async () => {
      setAuthToken('test-access');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      const result = await fetchTotem('ttm_1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('API request failed');
    });
  });
});
