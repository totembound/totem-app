#!/usr/bin/env node
/**
 * Rebuild Species Data Script
 *
 * Rebuilds all species JSON files in /public/data/species/ from the
 * source data in /home/dpatten/repos/totembound/
 *
 * Sources (in priority order):
 * 1. {species}/{species}-config.json - Color data with stageNames, stageDescriptions, stageImages
 * 2. {species}-cids.json - CIDs by color (used when config has empty images)
 * 3. src/config/species.json - Base metadata (name, title, description, locationId, etc.)
 *
 * Usage: node scripts/rebuild-species-data.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TOTEMBOUND_DIR = '/home/dpatten/repos/totembound';
const OUTPUT_DIR = path.join(__dirname, '../public/data/species');
const SPECIES_CONFIG_PATH = path.join(__dirname, '../src/config/species.json');
const IPFS_GATEWAY = 'https://ipfs.totembound.com/ipfs/';

// Species list (excluding non-species folders)
const SPECIES_LIST = [
  'bear', 'beaver', 'deer', 'falcon', 'goose',
  'otter', 'owl', 'raven', 'snake', 'turtle', 'wolf', 'woodpecker'
];

// Color ID mapping (matches types.ts Color enum)
const COLOR_IDS = {
  'brown': 0, 'gray': 1, 'white': 2, 'tawny': 3,
  'slate': 4, 'copper': 5, 'cream': 6, 'dappled': 7,
  'golden': 8, 'purple': 9, 'charcoal': 10,
  'emerald': 11, 'crimson': 12, 'sapphire': 13,
  'silver': 14, 'gold': 15,
  'frostbite': 16, 'rosy': 17, 'verdant': 18, 'raindrop': 19,
  'floral': 20, 'sunset': 21, 'ember': 22, 'oceanic': 23,
  'harvest': 24, 'phantom': 25, 'emberwood': 26, 'starlit': 27
};

// Map extended color names from config files to standard names
const COLOR_NAME_MAP = {
  'darkpurple': 'purple',
  'emeraldgreen': 'emerald',
  'crimsonred': 'crimson',
  'deepsapphire': 'sapphire',
  'etherealsilver': 'silver',
  'radiantgold': 'gold',
  'frostbiteblue': 'frostbite',
  'rosypink': 'rosy',
  'verdantgold': 'verdant',
  'raindropteal': 'raindrop',
  'floralviolet': 'floral',
  'sunsetorange': 'sunset',
  'emberred': 'ember',
  'oceanicazure': 'oceanic',
  'harvestgold': 'harvest',
  'phantomblack': 'phantom',
  'emberwoodbrown': 'emberwood',
  'starlitsilver': 'starlit',
  'yellow': 'golden'  // Some species use 'yellow' instead of 'golden'
};

/**
 * Normalize color name to standard form
 */
function normalizeColorName(colorName) {
  const lower = colorName.toLowerCase().replace(/[^a-z]/g, '');
  return COLOR_NAME_MAP[lower] || lower;
}

// Color to rarity mapping
const COLOR_RARITIES = {
  'brown': 'common', 'gray': 'common', 'white': 'common', 'tawny': 'common',
  'slate': 'uncommon', 'copper': 'uncommon', 'cream': 'uncommon', 'dappled': 'uncommon',
  'golden': 'rare', 'purple': 'rare', 'charcoal': 'rare',
  'emerald': 'epic', 'crimson': 'epic', 'sapphire': 'epic',
  'silver': 'legendary', 'gold': 'legendary',
  'frostbite': 'limited', 'rosy': 'limited', 'verdant': 'limited', 'raindrop': 'limited',
  'floral': 'limited', 'sunset': 'limited', 'ember': 'limited', 'oceanic': 'limited',
  'harvest': 'limited', 'phantom': 'limited', 'emberwood': 'limited', 'starlit': 'limited'
};

// Default stage names by species
const DEFAULT_STAGES = {
  'bear': ['Cub', 'Yearling', 'Hunter', 'Guardian', 'Wise Elder'],
  'beaver': ['Kit', 'Youngling', 'Builder', 'Warden', 'Wise Elder'],
  'deer': ['Fawn', 'Yearling', 'Stag', 'Warden', 'Wise Elder'],
  'falcon': ['Hatchling', 'Fledgling', 'Hunter', 'Raptor', 'Wise Elder'],
  'goose': ['Hatchling', 'Gosling', 'Sentinel', 'Guardian', 'Wise Elder'],
  'otter': ['Pup', 'Splash', 'Glide', 'Guardian', 'Wise Elder'],
  'owl': ['Hatchling', 'Fledgling', 'Hunter', 'Sage', 'Wise Elder'],
  'raven': ['Hatchling', 'Fledgling', 'Trickster', 'Oracle', 'Wise Elder'],
  'snake': ['Hatchling', 'Slither', 'Striker', 'Serpent', 'Wise Elder'],
  'turtle': ['Hatchling', 'Paddler', 'Voyager', 'Ancient', 'Wise Elder'],
  'wolf': ['Pup', 'Howler', 'Stalker', 'Alpha', 'Wise Elder'],
  'woodpecker': ['Hatchling', 'Chick', 'Drummer', 'Tapper', 'Wise Elder']
};

/**
 * Extract CID from IPFS URL (handles both ipfs:// format and raw CIDs)
 */
function extractCid(ipfsUrl) {
  if (!ipfsUrl) return '';
  const cid = ipfsUrl.replace('ipfs://', '').trim();
  // Return empty if just "ipfs://" with no actual CID
  return cid.length > 10 ? cid : '';
}

/**
 * Check if a CID array has valid data
 */
function hasValidCids(images) {
  return images && images.length > 0 && images.some(cid => cid && cid.length > 10);
}

/**
 * Load the base species metadata from src/config/species.json
 */
function loadBaseSpeciesConfig() {
  try {
    const content = fs.readFileSync(SPECIES_CONFIG_PATH, 'utf8');
    const data = JSON.parse(content);
    // Convert to a map by lowercase name
    const map = {};
    for (const species of data.species) {
      map[species.name.toLowerCase()] = species;
    }
    return map;
  } catch (err) {
    console.warn('Could not load base species config:', err.message);
    return {};
  }
}

/**
 * Load the species config from totembound folder
 */
function loadTotemBoundConfig(speciesName) {
  const configPath = path.join(TOTEMBOUND_DIR, speciesName, `${speciesName}-config.json`);
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.warn(`  Could not load config for ${speciesName}:`, err.message);
    return null;
  }
}

/**
 * Load the CIDs file from totembound folder
 */
function loadCidsFile(speciesName) {
  const cidsPath = path.join(TOTEMBOUND_DIR, `${speciesName}-cids.json`);
  try {
    const content = fs.readFileSync(cidsPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    // CIDs file is optional
    return null;
  }
}

/**
 * Get species ID from name
 */
function getSpeciesId(speciesName) {
  const ids = {
    'goose': 0, 'otter': 1, 'wolf': 2, 'falcon': 3, 'beaver': 4,
    'deer': 5, 'woodpecker': 6, 'turtle': 7, 'bear': 8, 'raven': 9,
    'snake': 10, 'owl': 11
  };
  return ids[speciesName.toLowerCase()] ?? -1;
}

/**
 * Build species data from totembound config
 */
function buildSpeciesData(speciesName, totemConfig, cidsData, baseConfig) {
  const speciesId = getSpeciesId(speciesName);
  const capitalized = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);

  // Base metadata (from src/config/species.json or defaults)
  const base = baseConfig || {};

  const speciesData = {
    id: speciesId,
    name: capitalized,
    fullName: base.fullName || `Spirit ${capitalized}`,
    title: base.title || `The ${capitalized}`,
    description: base.description || `A mystical ${speciesName} totem.`,
    affinity: totemConfig?.affinity || base.affinity || 'Strength',
    domain: totemConfig?.domain || base.domain || 'Earth',
    locationId: base.locationId || null,
    available: base.available !== undefined ? base.available : true,
    placeholderImage: `/totems/${speciesName}placecard.png`,
    baseStats: totemConfig?.baseStats || base.baseStats || { strength: 8, agility: 8, wisdom: 8 },
    stages: DEFAULT_STAGES[speciesName] || ['Hatchling', 'Juvenile', 'Adult', 'Elder', 'Wise Elder'],
    colors: {}
  };

  // Build a map of CIDs from the cids file (fallback source)
  const cidsByColor = cidsData?.cidsByColor || {};

  // Process colors from totembound config
  if (totemConfig?.colors) {
    for (const [colorName, colorData] of Object.entries(totemConfig.colors)) {
      const colorKey = normalizeColorName(colorName);
      const colorId = COLOR_IDS[colorKey];

      if (colorId === undefined) {
        console.warn(`    Unknown color: ${colorName} -> ${colorKey}`);
        continue;
      }

      // Extract CIDs from stageImages in config
      let images = (colorData.stageImages || []).map(extractCid);

      // If config has empty images, try to get from CIDs file
      if (!hasValidCids(images) && cidsByColor[colorKey]) {
        images = cidsByColor[colorKey];
        console.log(`    Using CIDs file for ${colorKey}`);
      }

      // Skip colors with no valid images
      if (!hasValidCids(images)) {
        console.warn(`    No images for ${colorKey} - skipping`);
        continue;
      }

      // Get stage names and descriptions
      let stageNames = colorData.stageNames || speciesData.stages.map(s => `${colorName} ${s}`);
      let stageDescriptions = colorData.stageDescriptions || [];

      // Filter out empty descriptions
      stageDescriptions = stageDescriptions.map(d => d || '');

      speciesData.colors[colorKey] = {
        id: colorId,
        displayName: colorName,
        rarity: COLOR_RARITIES[colorKey] || 'common',
        stageNames: stageNames,
        stageDescriptions: stageDescriptions,
        images: images
      };
    }
  }

  // Also check for colors in CIDs file that aren't in config
  for (const [colorKey, cids] of Object.entries(cidsByColor)) {
    if (!speciesData.colors[colorKey] && hasValidCids(cids)) {
      const colorId = COLOR_IDS[colorKey];
      if (colorId === undefined) continue;

      const colorName = colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
      console.log(`    Adding ${colorKey} from CIDs file only`);

      speciesData.colors[colorKey] = {
        id: colorId,
        displayName: colorName,
        rarity: COLOR_RARITIES[colorKey] || 'common',
        stageNames: speciesData.stages.map(s => `${colorName} ${s}`),
        stageDescriptions: [],
        images: cids
      };
    }
  }

  return speciesData;
}

/**
 * Build the index.json file
 */
function buildIndex(speciesList) {
  return {
    gateway: IPFS_GATEWAY,
    generated: new Date().toISOString(),
    species: speciesList.map(name => ({
      name: name,
      file: `${name}.json`
    }))
  };
}

/**
 * Main function
 */
function main() {
  console.log('Rebuilding species data...\n');
  console.log(`Source: ${TOTEMBOUND_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load base species config
  const baseConfigs = loadBaseSpeciesConfig();

  const processedSpecies = [];
  let totalColors = 0;
  let totalWithImages = 0;

  for (const speciesName of SPECIES_LIST) {
    console.log(`Processing ${speciesName}...`);

    // Load totembound config
    const totemConfig = loadTotemBoundConfig(speciesName);

    // Load CIDs file (optional fallback)
    const cidsData = loadCidsFile(speciesName);

    if (!totemConfig && !cidsData) {
      console.log(`  Skipped (no config or CIDs found)`);
      continue;
    }

    // Build species data
    const baseConfig = baseConfigs[speciesName];
    const speciesData = buildSpeciesData(speciesName, totemConfig, cidsData, baseConfig);

    // Count colors
    const colorCount = Object.keys(speciesData.colors).length;
    const colorsWithImages = Object.values(speciesData.colors).filter(c => hasValidCids(c.images)).length;
    totalColors += colorCount;
    totalWithImages += colorsWithImages;
    console.log(`  Found ${colorCount} colors (${colorsWithImages} with images)`);

    // Write species file
    const outputPath = path.join(OUTPUT_DIR, `${speciesName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(speciesData, null, 2));
    console.log(`  Written to ${outputPath}`);

    processedSpecies.push(speciesName);
  }

  // Write index file
  const indexData = buildIndex(processedSpecies);
  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  console.log(`\nWritten index.json`);

  console.log(`\n✓ Processed ${processedSpecies.length} species`);
  console.log(`✓ Total ${totalColors} colors (${totalWithImages} with valid images)`);
}

// Run
main();
