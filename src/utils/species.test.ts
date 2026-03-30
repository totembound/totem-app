/**
 * Tests for species data utility functions
 *
 * Species data is bundled at build time (src/config/species-data/),
 * so all lookups are synchronous and always return data.
 */
import { describe, it, expect } from 'vitest';
import {
  getSpeciesName,
  getColorName,
  buildImageUrl,
  getTotemImageUrl,
  getStageName,
  getStageDescription,
  getSpeciesColors,
  isSpeciesLoaded,
  getSpeciesById,
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
// getTotemImageUrl
// =============================================================================

describe('getTotemImageUrl', () => {
  it('should return IPFS URL for available species with color images', () => {
    const url = getTotemImageUrl(0, 0, 0);
    expect(url).toContain('ipfs.totembound.com');
  });

  it('should return placeholder for species without color images', () => {
    const url = getTotemImageUrl(9, 0, 0); // Raven - unavailable, no colors
    expect(url).toBe('/totems/ravenplacecard.png');
  });

  it('should return placeholder for unknown species', () => {
    const url = getTotemImageUrl(99, 0, 0);
    expect(url).toBe('/totems/unknownplacecard.png');
  });
});

// =============================================================================
// getStageName
// =============================================================================

describe('getStageName', () => {
  it('should return per-color stage names for available species', () => {
    expect(getStageName(0, 0, 0)).toBe('Brown Hatchling');
    expect(getStageName(0, 0, 1)).toBe('Brown Gosling');
  });

  it('should return generic stage names for species without color data', () => {
    expect(getStageName(9, 0, 0)).toBe('Hatchling'); // Raven - unavailable, falls back to base stages
  });

  it('should return "Unknown" for out of range stage', () => {
    expect(getStageName(0, 0, 10)).toBe('Unknown');
  });
});

// =============================================================================
// getStageDescription
// =============================================================================

describe('getStageDescription', () => {
  it('should return description for available species', () => {
    const desc = getStageDescription(0, 0, 0);
    expect(desc).toBeTruthy();
    expect(desc.length).toBeGreaterThan(0);
  });

  it('should return empty string for species without color descriptions', () => {
    expect(getStageDescription(9, 0, 0)).toBe(''); // Raven - unavailable, no descriptions
  });
});

// =============================================================================
// getSpeciesColors
// =============================================================================

describe('getSpeciesColors', () => {
  it('should return colors for available species', () => {
    const colors = getSpeciesColors(0);
    expect(colors.length).toBeGreaterThan(0);
    expect(colors[0].displayName).toBeDefined();
  });

  it('should return empty array for species without colors', () => {
    expect(getSpeciesColors(9)).toEqual([]); // Raven - unavailable, no colors
  });
});

// =============================================================================
// isSpeciesLoaded
// =============================================================================

describe('isSpeciesLoaded', () => {
  it('should return true for all known species', () => {
    expect(isSpeciesLoaded(0)).toBe(true);
    expect(isSpeciesLoaded(8)).toBe(true);
    expect(isSpeciesLoaded(11)).toBe(true);
  });

  it('should return false for unknown species', () => {
    expect(isSpeciesLoaded(99)).toBe(false);
  });
});

// =============================================================================
// getSpeciesById
// =============================================================================

describe('getSpeciesById', () => {
  it('should return config by species ID', () => {
    const config = getSpeciesById(0);
    expect(config).toBeDefined();
    expect(config!.name).toBe('Goose');
  });

  it('should return undefined for unknown ID', () => {
    expect(getSpeciesById(99)).toBeUndefined();
  });
});
