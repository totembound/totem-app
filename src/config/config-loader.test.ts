/**
 * config-loader tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// We need to reset module state between tests since config-loader uses module-level cache
let loadGameConfig: typeof import('./config-loader').loadGameConfig;
let getGameConfig: typeof import('./config-loader').getGameConfig;
let clearConfigCache: typeof import('./config-loader').clearConfigCache;
let getSpeciesById: typeof import('./config-loader').getSpeciesById;
let getAvailableSpecies: typeof import('./config-loader').getAvailableSpecies;
let getStageByExperience: typeof import('./config-loader').getStageByExperience;
let getChallengeById: typeof import('./config-loader').getChallengeById;
let getExpeditionById: typeof import('./config-loader').getExpeditionById;
let getAchievementById: typeof import('./config-loader').getAchievementById;
let getRarityById: typeof import('./config-loader').getRarityById;
let getColorById: typeof import('./config-loader').getColorById;
let getLootBoxById: typeof import('./config-loader').getLootBoxById;

const mockSpeciesData = {
  version: '1.0.0',
  species: [
    { id: 0, name: 'Goose', affinity: 'wisdom', domain: 'water', baseStats: { strength: 8, agility: 10, wisdom: 12 }, available: true },
    { id: 1, name: 'Otter', affinity: 'agility', domain: 'water', baseStats: { strength: 10, agility: 12, wisdom: 8 }, available: true },
    { id: 2, name: 'Wolf', affinity: 'strength', domain: 'earth', baseStats: { strength: 12, agility: 10, wisdom: 8 }, available: false },
  ],
  availableSpeciesIds: [0, 1],
};

const mockGameConfigData = {
  version: '1.0.0',
  stages: [
    { stage: 0, name: 'Hatchling', experienceRequired: 0 },
    { stage: 1, name: 'Juvenile', experienceRequired: 500 },
    { stage: 2, name: 'Adult', experienceRequired: 1500 },
    { stage: 3, name: 'Elder', experienceRequired: 3500 },
    { stage: 4, name: 'Ancient', experienceRequired: 7500 },
  ],
  prestige: { baseThreshold: 2500, levelIncrement: 1000 },
  rarities: [
    { id: 0, name: 'Common', statBonus: 0, dropChance: 40 },
    { id: 1, name: 'Uncommon', statBonus: 1, dropChance: 30 },
    { id: 2, name: 'Rare', statBonus: 2, dropChance: 15 },
  ],
  colors: {
    common: [{ id: 0, name: 'Brown' }, { id: 1, name: 'Gray' }],
    uncommon: [{ id: 4, name: 'Slate' }],
    rare: [{ id: 8, name: 'Dawnwatch' }],
    epic: [{ id: 11, name: 'Verdant' }],
    legendary: [{ id: 14, name: 'Moonveil' }],
    limited: [{ id: 16, name: 'Frostbound' }],
  },
  affinities: [{ id: 'strength', name: 'Strength', speciesIds: [2] }],
  domains: [{ id: 0, name: 'Water', speciesIds: [0, 1] }],
  actions: {
    feed: { id: 0, essenceCost: 10, cooldownSeconds: 0, maxDaily: 3, minHappiness: 0, happinessChange: 10, experienceGain: 15, useTimeWindows: true },
    train: { id: 1, essenceCost: 20, cooldownSeconds: 3600, maxDaily: 3, minHappiness: 20, happinessChange: -5, experienceGain: 50, useTimeWindows: false },
    treat: { id: 2, essenceCost: 20, cooldownSeconds: 14400, maxDaily: 2, minHappiness: 0, happinessChange: 10, experienceGain: 5, useTimeWindows: false },
  },
};

const mockChallengesData = {
  version: '1.0.0',
  challenges: [
    { id: 'ch-speed', name: 'Speed Run', description: 'Go fast', type: 'speed', affinity: 'agility', requirements: { stage: 0, strength: 0, agility: 0, wisdom: 0 }, maxDailyAttempts: 3, maxScore: 100, xpReward: { base: 10, perPoint: 1 }, enabled: true },
  ],
};

const mockExpeditionsData = {
  version: '1.0.0',
  expeditions: [
    { id: 'exp-forest', name: 'Forest Trek', domain: 0, durationMinutes: 60, essenceCost: 50, happinessCost: 10, baseExp: 100, affinityWeights: { strength: 1, agility: 1, wisdom: 1 }, runeDropChances: { lesser: 50, greater: 10, ancient: 1 }, minStage: 0, enabled: true },
  ],
};

const mockRewardsData = {
  version: '1.0.0',
  recurring: {
    daily: { baseReward: 100 },
    weekly: { baseReward: 500 },
  },
  tutorial: [
    { id: 'tut-1', step: 1, name: 'Welcome', description: 'First step', essenceReward: 100, experienceReward: 0, requiresTotem: false },
  ],
};

const mockAchievementsData = {
  version: '1.0.0',
  achievements: [
    { id: 'ach_first_feed', name: 'First Feed', description: 'Feed once', category: 3, type: 0, badgeUri: '/b.png' },
  ],
};

const mockLootBoxesData = {
  version: '1.0.0',
  boxes: {
    'box-common': { id: 'box-common', name: 'Common Box', description: 'A box', icon: '/box.png', rarity: 'common', type: 'totem', config: { userChooses: [], randomized: ['species'] } },
  },
};

function setupFetchMock() {
  const mockFetch = vi.fn((url: string) => {
    if (url.includes('species.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpeciesData) });
    if (url.includes('game-config.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGameConfigData) });
    if (url.includes('challenges.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockChallengesData) });
    if (url.includes('expeditions.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockExpeditionsData) });
    if (url.includes('rewards.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRewardsData) });
    if (url.includes('achievements.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAchievementsData) });
    if (url.includes('loot-boxes.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLootBoxesData) });
    return Promise.resolve({ ok: false });
  });
  global.fetch = mockFetch as any;
  return mockFetch;
}

describe('config-loader', () => {
  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Reset modules to clear module-level cache
    vi.resetModules();
    const mod = await import('./config-loader');
    loadGameConfig = mod.loadGameConfig;
    getGameConfig = mod.getGameConfig;
    clearConfigCache = mod.clearConfigCache;
    getSpeciesById = mod.getSpeciesById;
    getAvailableSpecies = mod.getAvailableSpecies;
    getStageByExperience = mod.getStageByExperience;
    getChallengeById = mod.getChallengeById;
    getExpeditionById = mod.getExpeditionById;
    getAchievementById = mod.getAchievementById;
    getRarityById = mod.getRarityById;
    getColorById = mod.getColorById;
    getLootBoxById = mod.getLootBoxById;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadGameConfig', () => {
    it('should fetch all 7 config files and merge them', async () => {
      const mockFetch = setupFetchMock();

      const config = await loadGameConfig();

      expect(mockFetch).toHaveBeenCalledTimes(7);
      expect(config.version).toBe('1.0.0');
      expect(config.species).toHaveLength(3);
      expect(config.availableSpeciesIds).toEqual([0, 1]);
      expect(config.stages).toHaveLength(5);
      expect(config.challenges).toHaveLength(1);
      expect(config.expeditions).toHaveLength(1);
      expect(config.rewards.tutorial).toHaveLength(1);
      expect(config.achievements).toHaveLength(1);
      expect(config.lootBoxes['box-common']).toBeDefined();
    });

    it('should cache config after first load', async () => {
      const mockFetch = setupFetchMock();

      const config1 = await loadGameConfig();
      const config2 = await loadGameConfig();

      expect(config1).toBe(config2); // Same reference
      expect(mockFetch).toHaveBeenCalledTimes(7); // Only called once
    });

    it('should include version query param for cache-busting', async () => {
      const mockFetch = setupFetchMock();

      await loadGameConfig();

      const urls = mockFetch.mock.calls.map((c: any) => c[0]);
      urls.forEach((url: string) => {
        expect(url).toContain('?v=1.0.0');
      });
    });

    it('should throw when a config file fails to load', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false }) as any;

      await expect(loadGameConfig()).rejects.toThrow('Failed to load config');
    });

    it('should dedup concurrent calls', async () => {
      const mockFetch = setupFetchMock();

      const [config1, config2] = await Promise.all([
        loadGameConfig(),
        loadGameConfig(),
      ]);

      expect(config1).toBe(config2);
      expect(mockFetch).toHaveBeenCalledTimes(7);
    });
  });

  describe('clearConfigCache', () => {
    it('should allow reloading after clear', async () => {
      const mockFetch = setupFetchMock();

      await loadGameConfig();
      expect(mockFetch).toHaveBeenCalledTimes(7);

      clearConfigCache();

      await loadGameConfig();
      expect(mockFetch).toHaveBeenCalledTimes(14); // Called again
    });
  });

  describe('getGameConfig', () => {
    it('should throw when config not loaded', () => {
      expect(() => getGameConfig()).toThrow('Game config not loaded');
    });

    it('should return cached config after load', async () => {
      setupFetchMock();
      const loaded = await loadGameConfig();

      expect(getGameConfig()).toBe(loaded);
    });
  });

  describe('helper functions', () => {
    beforeEach(async () => {
      setupFetchMock();
      await loadGameConfig();
    });

    describe('getSpeciesById', () => {
      it('should find species by id', () => {
        expect(getSpeciesById(0)?.name).toBe('Goose');
        expect(getSpeciesById(1)?.name).toBe('Otter');
        expect(getSpeciesById(2)?.name).toBe('Wolf');
      });

      it('should return undefined for unknown id', () => {
        expect(getSpeciesById(99)).toBeUndefined();
      });
    });

    describe('getAvailableSpecies', () => {
      it('should return only available species', () => {
        const available = getAvailableSpecies();
        expect(available).toHaveLength(2);
        expect(available.map(s => s.name)).toEqual(['Goose', 'Otter']);
      });
    });

    describe('getStageByExperience', () => {
      it('should return Hatchling for 0 XP', () => {
        expect(getStageByExperience(0).name).toBe('Hatchling');
      });

      it('should return Juvenile for 500 XP', () => {
        expect(getStageByExperience(500).name).toBe('Juvenile');
      });

      it('should return Adult for 1500 XP', () => {
        expect(getStageByExperience(1500).name).toBe('Adult');
      });

      it('should return Elder for 3500 XP', () => {
        expect(getStageByExperience(3500).name).toBe('Elder');
      });

      it('should return Ancient for 7500+ XP', () => {
        expect(getStageByExperience(7500).name).toBe('Ancient');
        expect(getStageByExperience(99999).name).toBe('Ancient');
      });

      it('should return correct stage for mid-range XP', () => {
        expect(getStageByExperience(1000).name).toBe('Juvenile');
        expect(getStageByExperience(2500).name).toBe('Adult');
      });
    });

    describe('getChallengeById', () => {
      it('should find challenge', () => {
        expect(getChallengeById('ch-speed')?.name).toBe('Speed Run');
      });

      it('should return undefined for unknown', () => {
        expect(getChallengeById('nonexistent')).toBeUndefined();
      });
    });

    describe('getExpeditionById', () => {
      it('should find expedition', () => {
        expect(getExpeditionById('exp-forest')?.name).toBe('Forest Trek');
      });

      it('should return undefined for unknown', () => {
        expect(getExpeditionById('nonexistent')).toBeUndefined();
      });
    });

    describe('getAchievementById', () => {
      it('should find achievement', () => {
        expect(getAchievementById('ach_first_feed')?.name).toBe('First Feed');
      });

      it('should return undefined for unknown', () => {
        expect(getAchievementById('nonexistent')).toBeUndefined();
      });
    });

    describe('getRarityById', () => {
      it('should find rarity', () => {
        expect(getRarityById(0)?.name).toBe('Common');
        expect(getRarityById(1)?.name).toBe('Uncommon');
        expect(getRarityById(2)?.name).toBe('Rare');
      });

      it('should return undefined for unknown', () => {
        expect(getRarityById(99)).toBeUndefined();
      });
    });

    describe('getColorById', () => {
      it('should find colors across all rarity groups', () => {
        expect(getColorById(0)?.name).toBe('Brown');
        expect(getColorById(1)?.name).toBe('Gray');
        expect(getColorById(4)?.name).toBe('Slate');
        expect(getColorById(8)?.name).toBe('Dawnwatch');
        expect(getColorById(11)?.name).toBe('Verdant');
        expect(getColorById(14)?.name).toBe('Moonveil');
        expect(getColorById(16)?.name).toBe('Frostbound');
      });

      it('should return undefined for unknown', () => {
        expect(getColorById(99)).toBeUndefined();
      });
    });

    describe('getLootBoxById', () => {
      it('should find loot box', () => {
        expect(getLootBoxById('box-common')?.name).toBe('Common Box');
      });

      it('should return undefined for unknown', () => {
        expect(getLootBoxById('nonexistent')).toBeUndefined();
      });
    });
  });
});
