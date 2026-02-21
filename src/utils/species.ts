/**
 * Species Data Utilities
 *
 * Helpers for loading species configs from public/data/species/
 * and building image URLs from CIDs.
 */

import { useState, useEffect } from 'react';
import { IPFS_GATEWAY_URL, type TotemCodex } from '../config/constants';
import { Rarity } from '../types/types';

// Species name mapping by ID
const SPECIES_NAMES: Record<number, string> = {
  0: 'goose',
  1: 'otter',
  2: 'wolf',
  3: 'falcon',
  4: 'beaver',
  5: 'deer',
  6: 'woodpecker',
  7: 'turtle',
  8: 'bear',
  9: 'raven',
  10: 'snake',
  11: 'owl',
};

// Color name mapping by ID
const COLOR_NAMES: Record<number, string> = {
  0: 'brown',
  1: 'gray',
  2: 'white',
  3: 'tawny',
  4: 'slate',
  5: 'copper',
  6: 'cream',
  7: 'dappled',
  8: 'golden',
  9: 'purple',
  10: 'charcoal',
  11: 'emerald',
  12: 'crimson',
  13: 'sapphire',
  14: 'silver',
  15: 'gold',
  16: 'frostbite',
  17: 'rosy',
  18: 'verdant',
  19: 'raindrop',
  20: 'floral',
  21: 'sunset',
  22: 'ember',
  23: 'oceanic',
  24: 'harvest',
  25: 'phantom',
  26: 'emberwood',
  27: 'starlit',
};

export interface SpeciesColorData {
  id: number;
  displayName: string;
  rarity: string;
  stageNames: string[];
  stageDescriptions: string[];
  images: string[]; // CIDs only
}

export interface SpeciesConfig {
  id: number;
  name: string;
  fullName: string;
  title: string;
  description: string;
  affinity: string;
  domain: string;
  locationId: number | null;
  available: boolean;
  placeholderImage: string;
  baseStats: {
    strength: number;
    agility: number;
    wisdom: number;
  };
  stages: string[];
  colors: Record<string, SpeciesColorData>;
}

export interface SpeciesIndex {
  gateway: string;
  generated: string;
  species: Array<{ name: string; file: string }>;
}

// Cache for loaded species configs
const speciesCache: Map<string, SpeciesConfig> = new Map();
let indexCache: SpeciesIndex | null = null;
// Dedup promises to prevent concurrent fetches (e.g. React StrictMode double-mount)
let indexLoadingPromise: Promise<SpeciesIndex> | null = null;
let allSpeciesLoadingPromise: Promise<Map<string, SpeciesConfig>> | null = null;

/**
 * Get species name from ID
 */
export function getSpeciesName(speciesId: number): string {
  return SPECIES_NAMES[speciesId] || 'unknown';
}

/**
 * Get color name from ID
 */
export function getColorName(colorId: number): string {
  return COLOR_NAMES[colorId] || 'unknown';
}

/**
 * Build full IPFS image URL from CID
 */
export function buildImageUrl(cid: string): string {
  if (!cid) return '';
  // Handle if already a full URL
  if (cid.startsWith('http')) return cid;
  if (cid.startsWith('ipfs://')) {
    return `${IPFS_GATEWAY_URL}${cid.replace('ipfs://', '')}`;
  }
  return `${IPFS_GATEWAY_URL}${cid}`;
}

/**
 * Get totem image URL by species, color, and stage
 */
export function getTotemImageUrl(
  speciesId: number,
  colorId: number,
  stage = 0
): string {
  const speciesName = getSpeciesName(speciesId);
  const colorName = getColorName(colorId);

  // Try to get from cache
  const config = speciesCache.get(speciesName);
  if (config) {
    const colorData = config.colors[colorName];
    if (colorData?.images?.[stage]) {
      return buildImageUrl(colorData.images[stage]);
    }
    // Fallback to stage 0
    if (colorData?.images?.[0]) {
      return buildImageUrl(colorData.images[0]);
    }
  }

  // Fallback to placeholder
  return `/totems/${speciesName}placecard.png`;
}

/**
 * Load species index
 */
export async function loadSpeciesIndex(): Promise<SpeciesIndex> {
  if (indexCache) return indexCache;
  if (indexLoadingPromise) return indexLoadingPromise;

  indexLoadingPromise = (async () => {
    const response = await fetch('/data/species/index.json');
    if (!response.ok) {
      indexLoadingPromise = null;
      throw new Error(`Failed to load species index: ${response.status}`);
    }
    indexCache = await response.json();
    return indexCache!;
  })();

  return indexLoadingPromise;
}

/**
 * Load a single species config
 */
export async function loadSpeciesConfig(speciesName: string): Promise<SpeciesConfig> {
  const cached = speciesCache.get(speciesName);
  if (cached) return cached;

  const response = await fetch(`/data/species/${speciesName}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load species ${speciesName}: ${response.status}`);
  }

  const config: SpeciesConfig = await response.json();
  speciesCache.set(speciesName, config);
  return config;
}

/**
 * Load species config by ID
 */
export async function loadSpeciesById(speciesId: number): Promise<SpeciesConfig> {
  const speciesName = getSpeciesName(speciesId);
  return loadSpeciesConfig(speciesName);
}

/**
 * Load all available species configs
 */
export async function loadAllSpecies(): Promise<Map<string, SpeciesConfig>> {
  if (speciesCache.size > 0) return speciesCache;
  if (allSpeciesLoadingPromise) return allSpeciesLoadingPromise;

  allSpeciesLoadingPromise = (async () => {
    const index = await loadSpeciesIndex();
    await Promise.all(
      index.species.map(({ name }) => loadSpeciesConfig(name))
    );
    return speciesCache;
  })();

  return allSpeciesLoadingPromise;
}

/**
 * Preload species configs for faster access
 * Call this on app startup or when needed
 */
export async function preloadSpecies(speciesIds: number[]): Promise<void> {
  await Promise.all(
    speciesIds.map((id) => loadSpeciesById(id))
  );
}

/**
 * Get stage name for a species/color/stage combination
 */
export function getStageName(
  speciesId: number,
  colorId: number,
  stage: number
): string {
  const speciesName = getSpeciesName(speciesId);
  const colorName = getColorName(colorId);
  const config = speciesCache.get(speciesName);

  if (config) {
    const colorData = config.colors[colorName];
    if (colorData?.stageNames?.[stage]) {
      // Split compound color names like "CrimsonRed" → "Crimson Red"
      return colorData.stageNames[stage].replace(/([a-z])([A-Z])/g, '$1 $2');
    }
    // Fallback to generic stage name
    if (config.stages?.[stage]) {
      return config.stages[stage];
    }
  }

  // Default stage names
  const defaults = ['Hatchling', 'Juvenile', 'Adult', 'Elder', 'Wise Elder'];
  return defaults[stage] || 'Unknown';
}

/**
 * Get stage description for a species/color/stage combination
 */
export function getStageDescription(
  speciesId: number,
  colorId: number,
  stage: number
): string {
  const speciesName = getSpeciesName(speciesId);
  const colorName = getColorName(colorId);
  const config = speciesCache.get(speciesName);

  if (config) {
    const colorData = config.colors[colorName];
    if (colorData?.stageDescriptions?.[stage]) {
      return colorData.stageDescriptions[stage];
    }
  }

  return '';
}

/**
 * Get all colors available for a species
 */
export function getSpeciesColors(speciesId: number): SpeciesColorData[] {
  const speciesName = getSpeciesName(speciesId);
  const config = speciesCache.get(speciesName);

  if (config) {
    return Object.values(config.colors);
  }

  return [];
}

/**
 * Check if species config is loaded
 */
export function isSpeciesLoaded(speciesId: number): boolean {
  const speciesName = getSpeciesName(speciesId);
  return speciesCache.has(speciesName);
}

const RARITY_MAP: Record<string, Rarity> = {
  common: Rarity.Common,
  uncommon: Rarity.Uncommon,
  rare: Rarity.Rare,
  epic: Rarity.Epic,
  legendary: Rarity.Legendary,
  limited: Rarity.Limited,
};

/**
 * Get Codex variants for a species (stage 0 images for all colors).
 * Returns empty array if species not yet loaded.
 */
export function getCodexVariants(speciesId: number): TotemCodex[] {
  const speciesName = getSpeciesName(speciesId);
  const config = speciesCache.get(speciesName);
  if (!config) return [];

  return Object.values(config.colors).map((color) => ({
    id: color.id,
    name: color.stageNames?.[0] || color.displayName,
    rarity: RARITY_MAP[color.rarity] ?? Rarity.Common,
    image: color.images?.[0] ? buildImageUrl(color.images[0]) : '',
  }));
}

/**
 * React hook that loads species data and returns Codex variants (stage 0).
 * Triggers async fetch if not cached, then re-renders with variants.
 */
export function useCodexVariants(speciesId: number): TotemCodex[] {
  const [variants, setVariants] = useState<TotemCodex[]>(() => getCodexVariants(speciesId));

  useEffect(() => {
    if (variants.length > 0) return;
    let cancelled = false;
    loadSpeciesById(speciesId).then(() => {
      if (!cancelled) setVariants(getCodexVariants(speciesId));
    }).catch(() => {});
      return () => { cancelled = true; };
  }, [speciesId, variants.length]);

  return variants;
}

/**
 * Clear species cache (useful for testing or refresh)
 */
export function clearSpeciesCache(): void {
  speciesCache.clear();
  indexCache = null;
  indexLoadingPromise = null;
  allSpeciesLoadingPromise = null;
}
