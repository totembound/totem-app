/**
 * Species Data Utilities
 *
 * Provides species configs bundled at build time from src/config/species-data/.
 * All data is available synchronously - no fetch() calls needed.
 */

import { IPFS_GATEWAY_URL, type TotemCodex } from '../config/constants';
import { Rarity } from '../types/types';
import { SPECIES_DATA } from '../config/species-data';

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

export function getSpeciesName(speciesId: number): string {
  return SPECIES_NAMES[speciesId] || 'unknown';
}

export function getColorName(colorId: number): string {
  return COLOR_NAMES[colorId] || 'unknown';
}

export function buildImageUrl(cid: string): string {
  if (!cid) return '';
  if (cid.startsWith('http')) return cid;
  if (cid.startsWith('ipfs://')) {
    return `${IPFS_GATEWAY_URL}${cid.replace('ipfs://', '')}`;
  }
  return `${IPFS_GATEWAY_URL}${cid}`;
}

/**
 * Resolve species + color config from IDs.
 * Shared lookup used by getTotemImageUrl, getStageName, etc.
 */
function resolveColorData(speciesId: number, colorId: number) {
  const speciesName = getSpeciesName(speciesId);
  const config = SPECIES_DATA.get(speciesName);
  const colorName = getColorName(colorId);
  return { speciesName, config, colorData: config?.colors[colorName] };
}

export function getTotemImageUrl(
  speciesId: number,
  colorId: number,
  stage = 0
): string {
  const { speciesName, colorData } = resolveColorData(speciesId, colorId);

  if (colorData?.images?.[stage]) {
    return buildImageUrl(colorData.images[stage]);
  }
  if (colorData?.images?.[0]) {
    return buildImageUrl(colorData.images[0]);
  }

  return `/totems/${speciesName}placecard.png`;
}

export function getSpeciesById(speciesId: number): SpeciesConfig | undefined {
  const speciesName = getSpeciesName(speciesId);
  return SPECIES_DATA.get(speciesName);
}

export function getStageName(
  speciesId: number,
  colorId: number,
  stage: number
): string {
  const { config, colorData } = resolveColorData(speciesId, colorId);

  if (colorData?.stageNames?.[stage]) {
    return colorData.stageNames[stage].replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  if (config?.stages?.[stage]) {
    return config.stages[stage];
  }

  const defaults = ['Hatchling', 'Juvenile', 'Adult', 'Elder', 'Wise Elder'];
  return defaults[stage] || 'Unknown';
}

export function getStageDescription(
  speciesId: number,
  colorId: number,
  stage: number
): string {
  const { colorData } = resolveColorData(speciesId, colorId);
  return colorData?.stageDescriptions?.[stage] || '';
}

export function getSpeciesColors(speciesId: number): SpeciesColorData[] {
  const speciesName = getSpeciesName(speciesId);
  const config = SPECIES_DATA.get(speciesName);
  return config ? Object.values(config.colors) : [];
}

export function isSpeciesLoaded(speciesId: number): boolean {
  const speciesName = getSpeciesName(speciesId);
  return speciesName !== 'unknown' && SPECIES_DATA.has(speciesName);
}

const RARITY_MAP: Record<string, Rarity> = {
  common: Rarity.Common,
  uncommon: Rarity.Uncommon,
  rare: Rarity.Rare,
  epic: Rarity.Epic,
  legendary: Rarity.Legendary,
  limited: Rarity.Limited,
};

export function getCodexVariants(speciesId: number): TotemCodex[] {
  const speciesName = getSpeciesName(speciesId);
  const config = SPECIES_DATA.get(speciesName);
  if (!config) return [];

  return Object.values(config.colors).map((color) => ({
    id: color.id,
    name: color.stageNames?.[0] || color.displayName,
    rarity: RARITY_MAP[color.rarity] ?? Rarity.Common,
    image: color.images?.[0] ? buildImageUrl(color.images[0]) : '',
  }));
}

/**
 * React hook that returns Codex variants (stage 0).
 * Data is static and bundled — just calls getCodexVariants directly.
 */
export function useCodexVariants(speciesId: number): TotemCodex[] {
  return getCodexVariants(speciesId);
}
