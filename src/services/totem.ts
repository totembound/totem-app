/**
 * Totem Service
 *
 * Handles totem-related API calls for Web2 authentication mode.
 * Transforms API responses to the TotemData format used by the app.
 *
 * Static config (species, colors, rarities) loaded from local JSON files
 * to minimize API calls. Only dynamic data (exp, stage, happiness) comes from API.
 */

import { TotemData, Species, Color, Rarity, ActionType, ActionTracking } from '../types/types';
import { getStageName as getPerColorStageName, isSpeciesLoaded, getTotemImageUrl as getSpeciesImageUrl } from '../utils/species';

// Static config loaded from local JSON files (no API calls needed)
import speciesConfig from '../config/species.json';
import colorsConfig from '../config/colors.json';
import raritiesConfig from '../config/rarities.json';

// Create lookup maps for fast access
const speciesById = new Map(speciesConfig.species.map(s => [s.id, s]));
const rarityById = new Map(raritiesConfig.rarities.map(r => [r.id, r]));
const colorById = colorsConfig.colorById as Record<string, string>;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

// ============================================
// Types
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface ApiTotemAttributes {
  species: number;
  color: number;
  rarity: number;
  happiness: number;
  experience: number;
  stage: number;
  strength: number;
  agility: number;
  wisdom: number;
  nickname: string | null;
  prestigeLevel: number;
  isStaked: boolean;
}

interface ApiTotemTrackings {
  [key: number]: {
    lastUsed: number;
    dailyUses: number;
    dayStartTime: number;
  } | undefined;
}

interface ApiTotem {
  id: string;
  displayName: string;
  name: string;
  description: string;
  image: string;
  affinity: string;
  domain: string;
  attributes: ApiTotemAttributes;
  trackings: ApiTotemTrackings;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Helpers
// ============================================

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  const tokensJson = localStorage.getItem('totembound_tokens');
  if (!tokensJson) return null;

  try {
    const tokens = JSON.parse(tokensJson);
    return tokens.idToken || null;
  } catch {
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    };
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || { code: 'API_ERROR', message: 'API request failed' },
    };
  }

  return data;
}

/**
 * Get species description from local JSON (no API call needed)
 */
function getSpeciesDescription(speciesId: number): string {
  const species = speciesById.get(speciesId);
  return species?.description || 'A mystical spirit companion.';
}

/**
 * Get species stage name from local JSON (no API call needed)
 */
function getSpeciesStageName(speciesId: number, stage: number): string {
  const species = speciesById.get(speciesId);
  const stages = species?.stages || ['Hatchling', 'Juvenile', 'Sub-Adult', 'Adult', 'Wise Elder'];
  return stages[stage] || stages[0];
}

/**
 * Get color name from local JSON (no API call needed)
 */
function getColorName(colorId: number): string {
  return colorById[colorId.toString()] || 'Unknown';
}

/**
 * Get rarity name from local JSON (no API call needed)
 */
function _getRarityName(rarityId: number): string {
  const rarity = rarityById.get(rarityId);
  return rarity?.name || 'Common';
}

/**
 * Transform API totem to TotemData format
 *
 * Enriches minimal API data with static config from local JSON files.
 * API provides: id, speciesId, colorId, rarityId + dynamic data (exp, stage, happiness, prestige, displayName)
 * Local JSON provides: species description, stage names, affinity, domain
 */
function transformTotem(apiTotem: ApiTotem): TotemData {
  // Transform trackings to match expected format
  const trackings: { [key in ActionType]?: ActionTracking } = {};

  if (apiTotem.trackings) {
    for (const [key, value] of Object.entries(apiTotem.trackings)) {
      if (value) {
        const actionType = parseInt(key) as ActionType;
        trackings[actionType] = {
          lastUsed: value.lastUsed,
          dailyUses: value.dailyUses,
          dayStartTime: value.dayStartTime,
        };
      }
    }
  }

  // Get species data from local JSON (static config - no API call)
  const speciesData = speciesById.get(apiTotem.attributes.species);

  // Use per-color stage names from species cache (e.g., "Sunbranch Kit" for golden beaver)
  // Falls back to generic "Color StageName" if species cache not yet loaded
  let properDisplayName: string;
  if (isSpeciesLoaded(apiTotem.attributes.species)) {
    properDisplayName = getPerColorStageName(
      apiTotem.attributes.species,
      apiTotem.attributes.color,
      apiTotem.attributes.stage
    );
  } else {
    const colorName = getColorName(apiTotem.attributes.color);
    const stageName = getSpeciesStageName(apiTotem.attributes.species, apiTotem.attributes.stage);
    properDisplayName = `${colorName} ${stageName}`;
  }

  // Get description from local JSON (static config - no API call)
  const description = getSpeciesDescription(apiTotem.attributes.species);

  // Get affinity and domain from local species config (static - no API call)
  const affinity = speciesData?.affinity || apiTotem.affinity || 'Spirit';
  const domain = speciesData?.domain || apiTotem.domain || 'Spirit';

  // Get species full name from local config
  const speciesName = speciesData?.fullName || speciesData?.name || apiTotem.name || 'Unknown Totem';

  return {
    id: apiTotem.id,
    // Display name: per-color stage name from species cache (e.g., "Sunbranch Kit")
    displayName: properDisplayName,
    name: speciesName,
    description, // From local JSON, not API
    // Image: use species cache CIDs (frontend source of truth), fallback to backend URL
    image: isSpeciesLoaded(apiTotem.attributes.species)
      ? getSpeciesImageUrl(apiTotem.attributes.species, apiTotem.attributes.color, apiTotem.attributes.stage)
      : apiTotem.image,
    affinity, // From local JSON
    domain, // From local JSON
    attributes: {
      species: apiTotem.attributes.species as Species,
      color: apiTotem.attributes.color as Color,
      rarity: apiTotem.attributes.rarity as Rarity,
      // Dynamic data from API (stored in DynamoDB)
      happiness: apiTotem.attributes.happiness,
      experience: apiTotem.attributes.experience,
      stage: apiTotem.attributes.stage,
      strength: apiTotem.attributes.strength,
      agility: apiTotem.attributes.agility,
      wisdom: apiTotem.attributes.wisdom,
      nickname: apiTotem.attributes.nickname || null, // User's custom name (optional)
      prestigeLevel: apiTotem.attributes.prestigeLevel, // Dynamic
      isStaked: apiTotem.attributes.isStaked,
    },
    trackings,
  };
}

// ============================================
// Service Functions
// ============================================

/**
 * Fetch all totems for the authenticated user
 */
export async function fetchTotems(): Promise<{ success: boolean; totems: TotemData[]; error?: string }> {
  try {
    const response = await apiRequest<ApiTotem[]>('/totems');

    if (!response.success || !response.data) {
      return {
        success: false,
        totems: [],
        error: response.error?.message || 'Failed to fetch totems',
      };
    }

    const totems = response.data.map(transformTotem);

    return {
      success: true,
      totems,
    };
  } catch (error) {
    console.error('Error fetching totems:', error);
    return {
      success: false,
      totems: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch a specific totem by ID
 */
export async function fetchTotem(totemId: string): Promise<{ success: boolean; totem?: TotemData; error?: string }> {
  try {
    const response = await apiRequest<ApiTotem>(`/totems/${totemId}`);

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error?.message || 'Failed to fetch totem',
      };
    }

    const totem = transformTotem(response.data);

    return {
      success: true,
      totem,
    };
  } catch (error) {
    console.error('Error fetching totem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Perform an action on a totem (feed, train, treat, evolve)
 */
export async function performTotemAction(
  totemId: string,
  action: 'feed' | 'train' | 'treat' | 'evolve'
): Promise<{ success: boolean; totem?: TotemData; error?: string }> {
  try {
    const response = await apiRequest<ApiTotem>(`/totems/${totemId}/${action}`, {
      method: 'POST',
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error?.message || `Failed to ${action} totem`,
      };
    }

    const totem = transformTotem(response.data);

    return {
      success: true,
      totem,
    };
  } catch (error) {
    console.error(`Error performing ${action}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  fetchTotems,
  fetchTotem,
  performTotemAction,
};
