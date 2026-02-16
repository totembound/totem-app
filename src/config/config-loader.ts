/**
 * Static Game Config Loader
 *
 * Loads game configuration from CloudFront-served JSON files.
 * These configs are static and cached aggressively.
 *
 * User-specific data is fetched from the API (DynamoDB) separately.
 */

const CONFIG_VERSION = '1.0.0';

// Types for static config data
export interface Species {
  id: number;
  name: string;
  affinity: 'strength' | 'agility' | 'wisdom';
  domain: 'air' | 'earth' | 'water';
  baseStats: {
    strength: number;
    agility: number;
    wisdom: number;
  };
  available: boolean;
}

export interface Stage {
  stage: number;
  name: string;
  experienceRequired: number;
}

export interface Rarity {
  id: number;
  name: string;
  statBonus: number;
  dropChance: number;
}

export interface Color {
  id: number;
  name: string;
}

export interface ActionConfig {
  id: number;
  essenceCost: number;
  cooldownSeconds: number;
  maxDaily: number;
  minHappiness: number;
  happinessChange: number;
  experienceGain: number;
  useTimeWindows: boolean;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  affinity: string;
  requirements: {
    stage: number;
    strength: number;
    agility: number;
    wisdom: number;
  };
  maxDailyAttempts: number;
  maxScore: number;
  xpReward: {
    base: number;
    perPoint: number;
  };
  enabled: boolean;
}

export interface Expedition {
  id: string;
  name: string;
  domain: number;
  durationMinutes: number;
  essenceCost: number;
  happinessCost: number;
  baseExp: number;
  affinityWeights: {
    strength: number;
    agility: number;
    wisdom: number;
  };
  runeDropChances: {
    lesser: number;
    greater: number;
    ancient: number;
  };
  minStage: number;
  enabled: boolean;
}

export interface TutorialReward {
  id: string;
  step: number;
  name: string;
  description: string;
  essenceReward: number;
  experienceReward: number;
  requiresTotem: boolean;
}

export interface AchievementMilestone {
  index: number;
  name: string;
  requirement: number;
  badgeUri: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: number;
  type: number; // 0 = OneTime, 1 = Progression
  badgeUri?: string;
  requires?: string[];
  milestones?: AchievementMilestone[];
}

export interface LootBoxConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  type: string;
  config: {
    rarityId?: number;
    minAmount?: number;
    maxAmount?: number;
    userChooses: string[];
    randomized: string[];
  };
}

// Aggregated game config
export interface GameConfig {
  version: string;
  species: Species[];
  availableSpeciesIds: number[];
  stages: Stage[];
  prestige: {
    baseThreshold: number;
    levelIncrement: number;
  };
  rarities: Rarity[];
  colors: {
    common: Color[];
    uncommon: Color[];
    rare: Color[];
    epic: Color[];
    legendary: Color[];
    limited: Color[];
  };
  affinities: { id: string; name: string; speciesIds: number[] }[];
  domains: { id: number; name: string; speciesIds: number[] }[];
  actions: {
    feed: ActionConfig;
    train: ActionConfig;
    treat: ActionConfig;
  };
  challenges: Challenge[];
  expeditions: Expedition[];
  rewards: {
    daily: object;
    weekly: object;
    tutorial: TutorialReward[];
  };
  achievements: Achievement[];
  lootBoxes: Record<string, LootBoxConfig>;
}

// Cache for loaded config
let cachedConfig: GameConfig | null = null;
let loadingPromise: Promise<GameConfig> | null = null;

/**
 * Get the base URL for config files
 */
function getConfigBaseUrl(): string {
  return import.meta.env.VITE_CONFIG_URL || '/config';
}

/**
 * Fetch a single config file with version cache-busting
 */
async function fetchConfig<T>(filename: string): Promise<T> {
  const baseUrl = getConfigBaseUrl();
  const url = `${baseUrl}/${filename}?v=${CONFIG_VERSION}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load config: ${filename}`);
  }

  return response.json();
}

/**
 * Load all game configuration from static JSON files
 *
 * Call this once on app initialization. The config is cached in memory.
 */
export async function loadGameConfig(): Promise<GameConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }
  // Dedup concurrent calls (e.g. React StrictMode double-mount)
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = doLoadGameConfig();
  return loadingPromise;
}

async function doLoadGameConfig(): Promise<GameConfig> {
  // Fetch all configs in parallel for performance
  const [
    speciesData,
    gameConfigData,
    challengesData,
    expeditionsData,
    rewardsData,
    achievementsData,
    lootBoxesData,
  ] = await Promise.all([
    fetchConfig<{ version: string; species: Species[]; availableSpeciesIds: number[] }>('species.json'),
    fetchConfig<{
      version: string;
      stages: Stage[];
      prestige: { baseThreshold: number; levelIncrement: number };
      rarities: Rarity[];
      colors: GameConfig['colors'];
      affinities: GameConfig['affinities'];
      domains: GameConfig['domains'];
      actions: GameConfig['actions'];
    }>('game-config.json'),
    fetchConfig<{ version: string; challenges: Challenge[] }>('challenges.json'),
    fetchConfig<{ version: string; expeditions: Expedition[] }>('expeditions.json'),
    fetchConfig<{ version: string; recurring: object; tutorial: TutorialReward[] }>('rewards.json'),
    fetchConfig<{ version: string; achievements: Achievement[] }>('achievements.json'),
    fetchConfig<{ version: string; boxes: Record<string, LootBoxConfig> }>('loot-boxes.json'),
  ]);

  // Merge into single config object
  cachedConfig = {
    version: CONFIG_VERSION,
    species: speciesData.species,
    availableSpeciesIds: speciesData.availableSpeciesIds,
    stages: gameConfigData.stages,
    prestige: gameConfigData.prestige,
    rarities: gameConfigData.rarities,
    colors: gameConfigData.colors,
    affinities: gameConfigData.affinities,
    domains: gameConfigData.domains,
    actions: gameConfigData.actions,
    challenges: challengesData.challenges,
    expeditions: expeditionsData.expeditions,
    rewards: {
      daily: (rewardsData.recurring as { daily: object }).daily,
      weekly: (rewardsData.recurring as { weekly: object }).weekly,
      tutorial: rewardsData.tutorial,
    },
    achievements: achievementsData.achievements,
    lootBoxes: lootBoxesData.boxes,
  };

  console.log(`[Config] Loaded game config v${CONFIG_VERSION}`);
  return cachedConfig;
}

/**
 * Get cached config (must call loadGameConfig first)
 */
export function getGameConfig(): GameConfig {
  if (!cachedConfig) {
    throw new Error('Game config not loaded. Call loadGameConfig() first.');
  }
  return cachedConfig;
}

/**
 * Clear cached config (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  loadingPromise = null;
}

// Helper functions for common lookups

export function getSpeciesById(id: number): Species | undefined {
  return getGameConfig().species.find(s => s.id === id);
}

export function getAvailableSpecies(): Species[] {
  const config = getGameConfig();
  return config.species.filter(s => config.availableSpeciesIds.includes(s.id));
}

export function getStageByExperience(experience: number): Stage {
  const stages = getGameConfig().stages;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (experience >= stages[i].experienceRequired) {
      return stages[i];
    }
  }
  return stages[0];
}

export function getChallengeById(id: string): Challenge | undefined {
  return getGameConfig().challenges.find(c => c.id === id);
}

export function getExpeditionById(id: string): Expedition | undefined {
  return getGameConfig().expeditions.find(e => e.id === id);
}

export function getAchievementById(id: string): Achievement | undefined {
  return getGameConfig().achievements.find(a => a.id === id);
}

export function getRarityById(id: number): Rarity | undefined {
  return getGameConfig().rarities.find(r => r.id === id);
}

export function getColorById(id: number): Color | undefined {
  const colors = getGameConfig().colors;
  const allColors = [
    ...colors.common,
    ...colors.uncommon,
    ...colors.rare,
    ...colors.epic,
    ...colors.legendary,
    ...colors.limited,
  ];
  return allColors.find(c => c.id === id);
}

export function getLootBoxById(boxId: string): LootBoxConfig | undefined {
  return getGameConfig().lootBoxes[boxId];
}
