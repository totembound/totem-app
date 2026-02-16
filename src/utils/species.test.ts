/**
 * Tests for species data utility functions
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSpeciesName,
  getColorName,
  buildImageUrl,
  getTotemImageUrl,
  getStageName,
  getStageDescription,
  getSpeciesColors,
  isSpeciesLoaded,
  clearSpeciesCache,
  loadSpeciesConfig,
  loadSpeciesIndex,
} from './species';

// =============================================================================
// getSpeciesName
// =============================================================================

describe('getSpeciesName', () => {
  it('should return correct species names', () => {
    expect(getSpeciesName(0)).toBe('goose');
    expect(getSpeciesName(1)).toBe('otter');
    expect(getSpeciesName(2)).toBe('wolf');
    expect(getSpeciesName(3)).toBe('falcon');
    expect(getSpeciesName(4)).toBe('beaver');
    expect(getSpeciesName(5)).toBe('deer');
    expect(getSpeciesName(6)).toBe('woodpecker');
    expect(getSpeciesName(7)).toBe('turtle');
    expect(getSpeciesName(8)).toBe('bear');
    expect(getSpeciesName(9)).toBe('raven');
    expect(getSpeciesName(10)).toBe('snake');
    expect(getSpeciesName(11)).toBe('owl');
  });

  it('should return "unknown" for invalid ID', () => {
    expect(getSpeciesName(99)).toBe('unknown');
    expect(getSpeciesName(-1)).toBe('unknown');
  });
});

// =============================================================================
// getColorName
// =============================================================================

describe('getColorName', () => {
  it('should return correct color names', () => {
    expect(getColorName(0)).toBe('brown');
    expect(getColorName(1)).toBe('gray');
    expect(getColorName(2)).toBe('white');
    expect(getColorName(3)).toBe('tawny');
    expect(getColorName(8)).toBe('golden');
    expect(getColorName(15)).toBe('gold');
  });

  it('should return "unknown" for invalid ID', () => {
    expect(getColorName(99)).toBe('unknown');
    expect(getColorName(-1)).toBe('unknown');
  });
});

// =============================================================================
// buildImageUrl
// =============================================================================

describe('buildImageUrl', () => {
  it('should return empty string for empty CID', () => {
    expect(buildImageUrl('')).toBe('');
  });

  it('should return full URL as-is', () => {
    expect(buildImageUrl('https://example.com/img.png')).toBe('https://example.com/img.png');
    expect(buildImageUrl('http://example.com/img.png')).toBe('http://example.com/img.png');
  });

  it('should strip ipfs:// prefix and prepend gateway', () => {
    const result = buildImageUrl('ipfs://QmHash123');
    expect(result).toContain('QmHash123');
    expect(result).not.toContain('ipfs://');
  });

  it('should prepend gateway URL to plain CID', () => {
    const result = buildImageUrl('QmHash456');
    expect(result).toContain('QmHash456');
    expect(result).toMatch(/^https?:\/\//);
  });
});

// =============================================================================
// getTotemImageUrl (cache-based, returns placeholder when not loaded)
// =============================================================================

describe('getTotemImageUrl', () => {
  beforeEach(() => {
    clearSpeciesCache();
  });

  it('should return placeholder when species not cached', () => {
    const url = getTotemImageUrl(8, 0, 0); // bear, brown, stage 0
    expect(url).toBe('/totems/bearplacecard.png');
  });

  it('should return placeholder for unknown species', () => {
    const url = getTotemImageUrl(99, 0, 0);
    expect(url).toBe('/totems/unknownplacecard.png');
  });
});

// =============================================================================
// getStageName (cache-based)
// =============================================================================

describe('getStageName', () => {
  beforeEach(() => {
    clearSpeciesCache();
  });

  it('should return default stage names when not cached', () => {
    expect(getStageName(0, 0, 0)).toBe('Hatchling');
    expect(getStageName(0, 0, 1)).toBe('Juvenile');
    expect(getStageName(0, 0, 2)).toBe('Adult');
    expect(getStageName(0, 0, 3)).toBe('Elder');
    expect(getStageName(0, 0, 4)).toBe('Wise Elder');
  });

  it('should return "Unknown" for out of range stage', () => {
    expect(getStageName(0, 0, 10)).toBe('Unknown');
  });
});

// =============================================================================
// getStageDescription (cache-based)
// =============================================================================

describe('getStageDescription', () => {
  beforeEach(() => {
    clearSpeciesCache();
  });

  it('should return empty string when not cached', () => {
    expect(getStageDescription(0, 0, 0)).toBe('');
  });
});

// =============================================================================
// getSpeciesColors (cache-based)
// =============================================================================

describe('getSpeciesColors', () => {
  beforeEach(() => {
    clearSpeciesCache();
  });

  it('should return empty array when not cached', () => {
    expect(getSpeciesColors(0)).toEqual([]);
  });
});

// =============================================================================
// isSpeciesLoaded
// =============================================================================

describe('isSpeciesLoaded', () => {
  beforeEach(() => {
    clearSpeciesCache();
  });

  it('should return false when not loaded', () => {
    expect(isSpeciesLoaded(0)).toBe(false);
    expect(isSpeciesLoaded(8)).toBe(false);
  });
});

// =============================================================================
// clearSpeciesCache
// =============================================================================

describe('clearSpeciesCache', () => {
  it('should reset all caches without error', () => {
    clearSpeciesCache();
    // After clearing, nothing should be loaded
    expect(isSpeciesLoaded(0)).toBe(false);
  });
});

// =============================================================================
// loadSpeciesIndex (async, requires fetch mock)
// =============================================================================

describe('loadSpeciesIndex', () => {
  beforeEach(() => {
    clearSpeciesCache();
  });

  it('should load and cache species index', async () => {
    const mockIndex = { gateway: 'https://gw.com/', generated: '2024-01-01', species: [{ name: 'goose', file: 'goose.json' }] };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockIndex), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const result = await loadSpeciesIndex();
    expect(result.species).toHaveLength(1);
    expect(result.species[0].name).toBe('goose');

    // Should be cached — second call should not fetch again
    const result2 = await loadSpeciesIndex();
    expect(result2).toEqual(result);
    // Only 1 fetch call (cached after first)
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });

  it('should throw on fetch failure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 })
    );

    await expect(loadSpeciesIndex()).rejects.toThrow('Failed to load species index: 404');
    fetchSpy.mockRestore();
  });
});

// =============================================================================
// loadSpeciesConfig (async, requires fetch mock)
// =============================================================================

describe('loadSpeciesConfig', () => {
  beforeEach(() => {
    clearSpeciesCache();
  });

  it('should load and cache species config', async () => {
    const mockConfig = {
      id: 0, name: 'goose', fullName: 'Goose Spirit', title: 'The Watcher',
      description: 'A mystical goose', affinity: 'Wisdom', domain: 'Water',
      locationId: 9, available: true, placeholderImage: 'goose.png',
      baseStats: { strength: 8, agility: 6, wisdom: 10 },
      stages: ['Hatchling', 'Juvenile', 'Adult', 'Elder', 'Wise Elder'],
      colors: { brown: { id: 0, displayName: 'Brown', rarity: 'Common', stageNames: ['Brown Hatchling'], stageDescriptions: ['A young goose'], images: ['QmHash1'] } },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockConfig), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const result = await loadSpeciesConfig('goose');
    expect(result.name).toBe('goose');
    expect(result.colors.brown.displayName).toBe('Brown');

    // After loading, species should be marked as loaded
    expect(isSpeciesLoaded(0)).toBe(true);

    // getSpeciesColors should now return colors
    const colors = getSpeciesColors(0);
    expect(colors).toHaveLength(1);

    fetchSpy.mockRestore();
  });

  it('should return cached config on second call', async () => {
    const mockConfig = { id: 0, name: 'goose', colors: {} };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockConfig), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    await loadSpeciesConfig('goose');
    await loadSpeciesConfig('goose'); // should use cache
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });

  it('should throw on fetch failure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 })
    );

    await expect(loadSpeciesConfig('unicorn')).rejects.toThrow('Failed to load species unicorn: 404');
    fetchSpy.mockRestore();
  });
});
