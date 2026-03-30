import { Location, Rarity, Species } from "../types/types";

// Species config (rich data with descriptions, stages, images)
import speciesConfig from './species.json';
export { speciesConfig };

// Constants for progression calculations
export const PRESTIGE_XP_REQUIREMENT = 2500;
export const BASE_ELDER_XP = 7500;
export const STAGE_THRESHOLDS = [0, 500, 1500, 3500, 7500];
export const IPFS_GATEWAY_URL = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://ipfs.totembound.com/ipfs/';
export const ESSENCE_COST = 500;

// Currency display names - change these to rebrand currencies
export const CURRENCY_NAMES = {
  SOFT: 'Essence',        // Soft currency (earned in-game)
  PREMIUM: 'Gems',        // Premium currency (purchased)
} as const;

// Challenge defaults
export const DEFAULT_MAX_DAILY_ATTEMPTS = 5;

// Gem to Essence conversion rate
export const GEM_TO_ESSENCE_RATIO = 5;

// Standard gem packages (currency only)
export const GEM_PACKAGES = [
  { id: 'pkg_starter', name: 'Starter Pack', price: '$0.99', gems: 100, essence: 500 },
  { id: 'pkg_popular', name: 'Popular Pack', price: '$4.99', gems: 550, essence: 2750, bonus: '10%' },
  { id: 'pkg_best_value', name: 'Best Value', price: '$9.99', gems: 1200, essence: 6000, bonus: '20%' },
  { id: 'pkg_mega', name: 'Mega Pack', price: '$19.99', gems: 2600, essence: 13000, bonus: '30%' },
  { id: 'pkg_ultimate', name: 'Ultimate Pack', price: '$49.99', gems: 7000, essence: 35000, bonus: '40%' },
] as const;

// Collector bundles (includes limited totems) - based on original 250 POL (~$75-125) monthly series
export const COLLECTOR_BUNDLES = [
  { id: 'bundle_collector', name: 'Collector Bundle', price: '$74.99', gems: 10000, essence: 50000, bonus: '43%', limitedTotems: 1, enabled: false },
  { id: 'bundle_founder', name: 'Founder Bundle', price: '$99.99', gems: 15000, essence: 75000, bonus: '50%', limitedTotems: 1, title: 'Founder', enabled: false },
  { id: 'bundle_legendary', name: 'Legendary Bundle', price: '$149.99', gems: 25000, essence: 125000, bonus: '67%', limitedTotems: 2, title: 'Legend', badge: true, enabled: false },
] as const;

export const TIER_TYPES = {
    free: 'Free',
    premium: 'Premium',
    vip: 'VIP',
};

export const STORAGE_KEYS = {
    theme: 'totem-theme',
    notifications: 'totem-notifications',
    notificationSound: "totem-notification-sound",
    maxNotifications: "totem-max-notifications",
    tutorialWizardVisible: 'totem-tutorialWizardVisible',
    linkTracking: 'totem-link-tracking'
};

// Build AVAILABLE_SPECIES from JSON config (single source of truth)
// Maps JSON data to include Species enum for type safety
const speciesEnumMap: Record<number, Species> = {
  0: Species.Goose,
  1: Species.Otter,
  2: Species.Wolf,
  3: Species.Falcon,
  4: Species.Beaver,
  5: Species.Deer,
  6: Species.Woodpecker,
  7: Species.Turtle,
  8: Species.Bear,
  9: Species.Raven,
  10: Species.Snake,
  11: Species.Owl,
};

export const AVAILABLE_SPECIES = speciesConfig.species.map(s => ({
  id: s.id,
  name: s.name,
  species: speciesEnumMap[s.id],
  title: s.title,
  desc: s.description,
  locationId: s.locationId,
  affinity: s.affinity,
  domain: s.domain,
  available: s.available,
  image: s.image,
}));

export const LOCATIONS: Location[] = [
  {
    id: 1,
    name: "Emerald Forest Camp",
    desc: "A lush green forest camp with ancient trees and wildlife trails.",
    type: "Forest",
    coordinates: { x: 19, y: 47 },
    details: "This forest camp serves as a base for exploring the dense woodland areas.",
    image: ""
  },
  {
    id: 2,
    name: "Crystal Lake Outpost", 
    desc: "A serene outpost by the crystal-clear mountain lake.",
    type: "Lake",
    coordinates: { x: 52, y: 65 },
    details: "Perfect fishing spot with pristine waters fed by mountain streams.",
    image: ""
  },
  {
    id: 3,
    name: "Fire Peak Crater",
    desc: "An active volcanic crater shrouded in smoke and legend, its depths remain largely unexplored.",
    type: "Volcano",
    coordinates: { x: 66, y: 22 },
    details: "Known for recent lava flows and violent tremors, few have ventured far beyond its outer rim and fewer still have returned with stories.",
    image: ""
  },
  {
    id: 4,
    name: "Golden Dunes Trading Post",
    desc: "A trading post in the heart of the golden desert.",
    type: "Desert",
    coordinates: { x: 66, y: 54 },
    details: "Essential stop for desert travelers and traders crossing the dunes.",
    image: ""
  },
  {
    id: 5,
    name: "Ancient Stone Circle",
    desc: "Mysterious ancient ruins with carved stone monuments.",
    type: "Ruins",
    coordinates: { x: 52, y: 41 },
    details: "These stone circles predate known civilizations in the region.",
    image: ""
  },
  {
    id: 6,
    name: "Misty Peak Base Camp",
    desc: "Mountain base camp for high-altitude expeditions.",
    type: "Mountains",
    coordinates: { x: 26, y: 24 },
    details: "Starting point for climbs to the highest peaks in the range.",
    image: ""
  },
  {
    id: 7,
    name: "Forest Grove Sanctuary",
    desc: "Protected grove in the heart of the ancient forest.",
    type: "Forest",
    coordinates: { x: 37, y: 53 },
    details: "Sacred grove protected by ancient forest guardians.",
    image: ""
  },
  {
    id: 8,
    name: "Desert Oasis",
    desc: "Life-giving oasis in the vast desert expanse.",
    type: "Desert",
    coordinates: { x: 69, y: 59 },
    details: "Rare water source that sustains life in the harsh desert.",
    image: ""
  },
  {
    id: 9,
    name: "Reedwind Marsh",
    desc: "A wide marshland of whispering reeds and watchful skies. Geese nest here beneath spirit-drawn constellations.",
    type: "Lake",
    coordinates: { x: 25, y: 66 },
    details: "Goose Habitat",
    image: "/habitats/goose-habitat.jpg"
  },
  {
    id: 10,
    name: "Misttail Delta",
    desc: "Playful and ever-changing, the delta is full of spirit streams, smooth stones, and trickling laughter from beyond the veil.",
    type: "Lake",
    coordinates: { x: 52, y: 56 },
    details: "Otter Habitat",
    image: "/habitats/otter-habitat.jpg"
  },
  {
    id: 11,
    name: "Stonefang Ridge",
    desc: "A highland terrain of jagged rocks and echoing canyons, where the pack’s call resonates across generations.",
    type: "Forest",
    coordinates: { x: 18, y: 32 },
    details: "Wolf Habitat",
    image: "/habitats/wolf-habitat.jpg"
  },
  {
    id: 12,
    name: "Galecrest Spire",
    desc: "A jagged cliff jutting into the clouds, where the air is sharp and unyielding. It is a place of speed, clarity, and vision beyond reach.",
    type: "Mountains",
    coordinates: { x: 36, y: 10 }, 
    details: "Falcon Habitat",
    image: "/habitats/falcon-habitat.jpg"
  },
  {
    id: 13,
    name: "Stonebranch Dam",
    desc: "A sacred woodland delta where earth and water weave together. The air hums with steady purpose, and every ripple tells a story of patience, protection, and craft.",
    type: "Lake",
    coordinates: { x: 46, y: 60 }, 
    details: "Beaver Habitat",
    image: "/habitats/beaver-habitat.jpg"
  },
  {
    id: 14,
    name: "Sunveil Grove",
    desc: "A serene glade protected by ancient trees, where sunlight filters through golden leaves and the air hums with calm energy.",
    type: "Forest",
    coordinates: { x: 42, y: 36 }, 
    details: "Deer Habitat",
    image: "/habitats/deer-habitat.jpg"
  },
  {
    id: 15,
    name: "Skythrum Canopy",
    desc: "A towering treetop realm where wind tunnels through ancient wooden cathedrals. The canopy bends but never breaks, shaped by generations of flight and ritual.",
    type: "Mountains",
    coordinates: { x: 36, y: 26 }, 
    details: "Woodpecker Habitat",
    image: "/habitats/woodpecker-habitat.jpg"
  },
  {
    id: 16,
    name: "Stillwater Hollow",
    desc: "A tranquil, shaded pool hidden deep in the wetlands. Time slows here, and spirit ripples drift endlessly across the water.",
    type: "Lake",
    coordinates: { x: 38, y: 62 }, 
    details: "Turtle Habitat",
    image: "/habitats/turtle-habitat.jpg"
  },
  {
    id: 17,
    name: "Stoneroot Cavern",
    desc: "A deep, echoing cave complex nestled beneath the roots of the oldest trees. Here the earth breathes slowly, and ancient spirit glyphs pulse faintly in the stone.",
    type: "Forest",
    coordinates: { x: 28, y: 34 }, 
    details: "Bear Habitat",
    image: "/habitats/bear-habitat.jpg"
  },
  {
    id: 18,
    name: "Gravecrow Perch",
    desc: "A cliff-top graveyard of old stone and cracked branches, where the veil between realms is thin and riddles are whispered.",
    type: "Mountains",
    coordinates: { x: 16, y: 16 }, 
    details: "Raven Habitat",
    image: "/habitats/raven-habitat.jpg"
  },
  {
    id: 19,
    name: "Twilight Coil",
    desc: "A dark and tangled jungle choked with vines and secrets. Movement here is silent, and the watchers never sleep.",
    type: "Forest",
    coordinates: { x: 16, y: 56 }, 
    details: "Snake Habitat",
    image: "/habitats/snake-habitat.jpg"
  },
  {
    id: 20,
    name: "Windcliff Nest",
    desc: "A sacred ledge high atop misty peaks, where silent winds carry wisdom and starlight touches the feathers of the old spirits.",
    type: "Mountains",
    coordinates: { x: 26, y: 16 }, 
    details: "Owl Habitat",
    image: "/habitats/owl-habitat.jpg"
  },
  {
    id: 21,
    name: "Dreamroot Altar",
    desc: "A floating grove where memory-fruits grow from mist, shaped by unspoken desires and discarded paths.",
    type: "Mist",
    coordinates: { x: 81, y: 45 },
    details: "Visitors often speak of dreams they never lived, whispered by the roots beneath their feet.",
    image: ""
  },
  {
    id: 22,
    name: "Hollow Tree of Ages",
    desc: "An ancient, living tree whose hollowed core echoes with the voices of those who came before.",
    type: "Ruins",
    coordinates: { x: 28, y: 80 },
    details: "Said to hold the memories of the first Totems, its rings are etched with forgotten names and stories lost to time.",
    image: ""
  },
  {
    id: 23,
    name: "Buried Vault",
    desc: "A sealed chamber hidden beneath the roots of the earth, warded by time and elemental seals.",
    type: "Ruins",
    coordinates: { x: 38, y: 82 },
    details: "Its doors bear the markings of every domain, though none remember who carved them or why.",
    image: ""
  },
  {
    id: 24,
    name: "Shadowring Obelisk",
    desc: "A jagged, obsidian monument that distorts nearby energy and casts a second shadow on every soul.",
    type: "Marsh",
    coordinates: { x: 56, y: 84 },
    details: "Legends claim it was raised by a Totem who walked between worlds and returned changed.",
    image: ""
  },
];

export interface TotemCodex {
  id: number;
  name: string;
  rarity: Rarity;
  image: string;
}
