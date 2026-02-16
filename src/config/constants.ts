import { Location, Rarity, Species } from "../types/types";

// Import static config from JSON files (single source of truth)
import speciesConfig from './species.json';
import raritiesConfig from './rarities.json';
import colorsConfig from './colors.json';

// Re-export for components that need full config
export { speciesConfig, raritiesConfig, colorsConfig };

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

export const GOOSE_TOTEMS = [
  {
    id: 1,
    name: "Brown Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeih67w6len2bh4iqyezikguccwpmzi656j6sou6bhbezjtmrti2su4`,
  },
  {
    id: 2,
    name: "Gray Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeiervdglagz3dqzivn4pbcwxfts2txq45dggnecqjwbhs3p2ufvwqu`,
  },
  {
    id: 3,
    name: "White Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeigw67q3qc22k5h6hcj6gzb2da6mvtlm6w2jydo6blvqvgts7y3l6u`,
  },
  {
    id: 4,
    name: "Tawny Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeiakzqtgxtv5a5h5y4bcohwnypa5ucif22fi32wquahyigmo5244nq`,
  },
  {
    id: 5,
    name: "Slate Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeichcdqioyw2xeo3puj6vpth5tet7o6aefrjoiaibsapgwt5d4wkyy`,
  },
  {
    id: 6,
    name: "Copper Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeibxsgzpsz6lmlobuazo56zrle2wjob6v7ngoedraw2ahjmw4znpfe`,
  },
  {
    id: 7,
    name: "Cream Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeie6ewyjuufiflac63v5g6piyqqzxshkbyqqupq3c3tucfgdswtukq`,
  },
  {
    id: 8,
    name: "Dappled Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeibzy55d25h6llzhjuxnrrw2kkpp6kcqhes57khfdboslleorkukay`,
  },
  {
    id: 9,
    name: "Dawnwatch Hatchling",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeihn6kjfldsqbg6j67pcmwia2o7kbvdl76ytkulrttgfjgs5b7xh6q`,
  },
  {
    id: 10,
    name: "Veilcrest Hatchling",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeig64vnyiheqxnbsoxulo4lsbbmngl34eayvbwelybfz6astgiya4i`,
  },
  {
    id: 11,
    name: "Ashen Hatchling",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeidbarxnpjyalrtonxq5z3k4e3kbadak44mvyhjgi6joykuyycka2q`,
  },
  {
    id: 12,
    name: "Verdant Hatchling",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeibjc4xgp2bzn4bvs4b5f3lubnu4cuqu42jx3cophboizqduetjgb4`,
  },
  {
    id: 13,
    name: "Bloodfeather Hatchling",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeigeavfjwbqp7fvmher6hrhpveaavg6h6a3hsv7ccle42bfystfdhu`,
  },
  {
    id: 14,
    name: "Abyssal Hatchling",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeihfekilzd4nvi7bekhzr7nujtjhm5maniro74fq72jyts3fo7y3a4`,
  },
  {
    id: 15,
    name: "Moonveil Hatchling",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeiftdnk5e3n36k5pvvcpoammj2jik4t2avdzrbrr33xliazlms36li`,
  },
  {
    id: 16,
    name: "Celestial Hatchling",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeifouhfvea4y3azh3l33kjy2excpliqgwsffqi76gvko6gatv7kuy4`,
  },
  {
    id: 17,
    name: "Frostbound Hatchling",
    rarity: Rarity.Limited,
    image: `${IPFS_GATEWAY_URL}bafybeidyswpx4qd6q4vu6eqtyqzuc75uh33cczspbvxtq4p2qajjxm6ora`,
  },
];

export const OTTER_TOTEMS = [
  {
    id: 1,
    name: "Brown Pup",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeihvnz7oa5n4kxtn5r52f2tteld5q6q3j7twjfh43tpdpoxx3hn6di`,
  },
  {
    id: 2,
    name: "Gray Pup",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeidng77cqxojtxfvuwhtko5iznmdj6gx7bfjuz4fjcufvyvetgfpwu`,
  },
  {
    id: 3,
    name: "White Pup",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeif5gsdbufcbm77wbkjdu2vw6lv3ekkp326qdh662sk7t3pgr4bply`,
  },
  {
    id: 4,
    name: "Tawny Pup",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeihn5ywlblyo3o2hamvfdppgksagyxwqfkj3c5sdmeedcg7os5uveq`,
  },
  {
    id: 5,
    name: "Slate Pup",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeieo5oloocy4dolsntwi33j47ydfcgmcqzqorprof4rt4r27xfpo44`,
  },
  {
    id: 6,
    name: "Copper Pup",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeihfic6cbmmbsn3qecwpxkbm3fq7whthd2iqlqrlvwubvfnkxbu3cm`,
  },
  {
    id: 7,
    name: "Cream Pup",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeif3dssv5tl7zwn4jpmrv6yykjmohhy3a7zuxgxdlom7icllwmcswu`,
  },
  {
    id: 8,
    name: "Dappled Pup",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeiceqfsdaizzqkt2mqmrzumeaqpzfpxx324cd4jlpoc7yea4fycg4e`,
  },
  {
    id: 9,
    name: "Sunflare Pup",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeih2ytrhcwghhfzkzagh5tk7ihdv2xeuoh35uzikkpg3sw5n3lakzu`,
  },
  {
    id: 10,
    name: "Umbratide Pup",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeib4icwpsyzjwunbado6gin3eybjo63n7wa6rgltmswe3ump7y5ioi`,
  },
  {
    id: 11,
    name: "Emberflow Pup",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeictvfbbvhd6i3znhknynz6qh2kc53dphfzzjehxqhsv7mktyfwlaa`,
  },
  {
    id: 12,
    name: "Verdant Pup",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeieu27bdrwecjzv7qiqhty4kjhebpvbhjwieko4fi64fl3qd6k2qou`,
  },
  {
    id: 13,
    name: "Bloodcurrent Pup",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeicmqch5rfy3uprc6zzetknbgnzre3wwudcclqvhhbili552sjdi4a`,
  },
  {
    id: 14,
    name: "Abyssal Pup",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeif3m3btajot4dqyuljqcnvs4oa2jtlirxpbzu26rmbwiuhc6dbbw4`,
  },
  {
    id: 15,
    name: "Moonwhisper Pup",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeiaczezftzhrnynfegjeazhuioosfrhjahzeabzf3xhhqoxufxlq6i`,
  },
  {
    id: 16,
    name: "Celestial Pup",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeiauhrywv5ims27sulksfzabwyhfjjuhpcna7dyvhg4fh7rgqrp4qq`,
  },
  {
    id: 17,
    name: "Lovewave Pup",
    rarity: Rarity.Limited,
    image: `${IPFS_GATEWAY_URL}bafybeibyigve45wxxu3r22rx2xmnt5fxjusxxbrqxds2d334hkoyge626i`,
  },
];

export const WOLF_TOTEMS = [
  {
    id: 1,
    name: "Brown Pup",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeibo3ttzjp3r5n4n2zzsristr6segyvowtlms6n3gxalyx7mppl5jm`,
  },
  {
    id: 2,
    name: "Gray Pup",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeib3qdygoysu4de27xckbkzu5f5sis4ix3nxgrezqeetaq7pmnwh6q`,
  },
  {
    id: 3,
    name: "White Pup",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeif5lbrlgs22ucyadi3h7r7wsbis37asa62x2cdjsktj47cwpoyxaq`,
  },
  {
    id: 4,
    name: "Tawny Pup",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeihf6gt7lpolfhrjs5jmnl34oq6n5x2vtxhu4mz67lv73gmmhgitxy`,
  },
  {
    id: 5,
    name: "Slate Pup",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeie5bovoqxkrbjggvpm5thmng64d3hnjfyzu62avk7ehshlrv3lagy`,
  },
  {
    id: 6,
    name: "Copper Pup",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeifbrytl43fjiabzkmim7jrckygndlwdjekuyjqrlitdntzcsuuxqy`,
  },
  {
    id: 7,
    name: "Cream Pup",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeihwztoeqyrj7kes4xomq77e4ybpb6vlzjf3k52iqjo4tf5akuachi`,
  },
  {
    id: 8,
    name: "Dappled Pup",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeiffp4oamlsq6skpnu3z2yq6n3y4lkkooduiszyer4yhx72gvsr2g4`,
  },
  {
    id: 9,
    name: "Dawnfang Pup",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeieol25lnnbqdfvkh5sted3w5ikbojjejmykgrqwe5wwhibnn2w7ja`,
  },
  {
    id: 10,
    name: "Umbral Pup",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeienrc4vdrwyyshei47iz256feue4yk4czydyhwkl3pyc3t67pslza`,
  },
  {
    id: 11,
    name: "Ashen Pup",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeigsdzz62fsv5tuek2k7o5akjur3dqea4jouhg5uurxohbhrticmue`,
  },
  {
    id: 12,
    name: "Verdant Pup",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeigysqzrg7u54aqy7yq7t4gq54st6ipzivulc7as6ne26phpybibqe`,
  },
  {
    id: 13,
    name: "Bloodfang Pup",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeiewumg56dwukxhdvv6fhkqvkoimf7pdgn4kdwvqn5xzdolwoxfrxi`,
  },
  {
    id: 14,
    name: "Abyssal Pup",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeia55ttmypxlqvbi4wlhlb5dt6ie26fbpi2h5bi6ryay5pigwzavza`,
  },
  {
    id: 15,
    name: "Moonshadow Pup",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeibinbdjqkmossbnfmxqx4kyxidrncxtcfhyp2prdxjbjtaokgei5i`,
  },
  {
    id: 16,
    name: "Celestial Pup",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeighykr65um6tcdvz6vrpf64vdfhjkzfqecvk6icovhlxnnx55ax2e`,
  },
  {
    id: 17,
    name: "Cloverfang Pup",
    rarity: Rarity.Limited,
    image: `${IPFS_GATEWAY_URL}bafybeieezvdacnrn36zbubevnb67b3pezoumpyepwzoyvlmjqsnosluu7i`,
  },
];

export const FALCON_TOTEMS = [
  {
    id: 1,
    name: "Brown Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeihppmy5vxggtp4v5u7earr4y6kiy77xcuiwds22tgs3ojasjzzdva`,
  },
  {
    id: 2,
    name: "Gray Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeidesm3bji4ubmwfausbbwbssrh3tcex4w4jwthiymmogghwn7qrjy`,
  },
  {
    id: 3,
    name: "White Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeie4njhi5bgviju35nwcevmqyv7xaywmpwrdact6vm4qdgahmcsvda`,
  },
  {
    id: 4,
    name: "Tawny Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeifl47bxdgkb3dsmzoyisrm7ny6sa7kyjppujvogrtogfbhhc3nhry`,
  },
  {
    id: 5,
    name: "Slate Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeifinhekhahdfplev2idysbhwz5vukaemcwcunfnqqfb2wi77x4ptq`,
  },
  {
    id: 6,
    name: "Copper Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeibhorvnumhgqhhwop22rhzr2gk7abzvhfoxvhckc34xqsmnc5antm`,
  },
  {
    id: 7,
    name: "Cream Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeidnko7ra3u4fidblxx4rdqx66cne7wmmhxio76kcmffiep5zh7gca`,
  },
  {
    id: 8,
    name: "Dappled Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeidjohs5c5goscuula76gmznf6tizafnchjx7anefrzka2bn6gjolq`,
  },
  {
    id: 9,
    name: "Sunpiercer Hatchling",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeienb6e3mspmx3nlztrttedivtnzgzfkzh5ec3sim3zohelzfxpbt4`,
  },
  {
    id: 10,
    name: "Umbrashade Hatchling",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeig64vnyiheqxnbsoxulo4lsbbmngl34eayvbwelybfz6astgiya4i`,
  },
  {
    id: 11,
    name: "Ashen Tempest Hatchling",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeihb3ji2qgar6a3yxpdzcgy2nldxhwxwluifxrxn5ywupixlpf6gkm`,
  },
  {
    id: 12,
    name: "Verdant Gale Hatchling",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeia4cvqgd3zgjbfaw2qxcvci462cgih3opdcin3ldvdhki6xz3iq6i`,
  },
  {
    id: 13,
    name: "Bloodflare Hatchling",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeif7ce2plmvlm2ybzzfjbtmie5nyo2s2nlniilf2lvddamjyu36p7y`,
  },
  {
    id: 14,
    name: "Abysswing Hatchling",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeif45wur7jn6gpc5wqwfty3kfihhb7arifohk3m7bnon4tcvr2sagu`,
  },
  {
    id: 15,
    name: "Moonshadow Hatchling",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeifdo5qymg5aiwjcg6d6ixc7fbrcuaid7o745cbknowpoagoot7gau`,
  },
  {
    id: 16,
    name: "Celestial Hatchling",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeid7fnkjwryr42ijwugtle5y3lccg5b7uxldenqxzs5gzmhueeunha`,
  },
  {
    id: 17,
    name: "Thunderstrike Hatchling",
    rarity: Rarity.Limited,
    image: `${IPFS_GATEWAY_URL}bafybeibskxpmkb4pg4iszesux4t7rpjmx423dfhyilqxtmbecbiy6hydk4`,
  },
];

export const OWL_TOTEMS = [
  {
    id: 1,
    name: "Brown Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeigfgc4vx5eyscrea3dnuaueaudgt62nm5tiuoyfpwtq6gcyfh7ygq`,
  },
  {
    id: 2,
    name: "Gray Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeidv6ljexvta5c3lfe4bnoejzfrs5eagjagozcvv7qabqbqf36piaa`,
  },
  {
    id: 3,
    name: "White Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeifeh24awti6wmaqvbfdywk2h23ujqikz2sfokdpaf5pcj7ikb7x4u`,
  },
  {
    id: 4,
    name: "Tawny Hatchling",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeiateagilpyw5yyg3yevxmdq72v26f7h3mupxekvzh6hotszdsq64m`,
  },
  {
    id: 5,
    name: "Slate Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeid2ktyewbyvm7nbcxfrfqc5p3ihs5tevu4odlcsiej2yzbx5rrnze`,
  },
  {
    id: 6,
    name: "Copper Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeihgb5odb2bdl5tmgopznxyv73smdkvsc36ds5u3kxamh7x22hxd5q`,
  },
  {
    id: 7,
    name: "Cream Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeidezkybbl5njj36aidtrznttjhaojvfvncgxbi3cngur7nxxy2634`,
  },
  {
    id: 8,
    name: "Dappled Hatchling",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeifdd6pwprezc5qlnikusermhkapuhouch3y4higurzgwstmxdczqu`,
  },
  {
    id: 9,
    name: "Dawnforged Hatchling",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeibeouuugi4cbdrrkuvs5x6oifzcgzeforxk6yc7hvsz7adjfyzx2m`,
  },
  {
    id: 10,
    name: "Umbral Hatchling",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeif5oyc3g25ce6jdo4rqzxdwktcgzyehpmtwom3vcrn6yapqixxnxq`,
  },
  {
    id: 11,
    name: "Ashen Hatchling",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeifpmb2a6abj2updgesr3i6lns6trkzu2iutpyx3qowp7dtvykoj2u`,
  },
  {
    id: 12,
    name: "Verdant Hatchling",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeibqbvpvboudjl5eo45ydrougkuh2astuimzqukao5pouchcurk2na`,
  },
  {
    id: 13,
    name: "Bloodfire Hatchling",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeid35zmyk3lv3tlj6n57nsthqqftqdtuxlxbtrfnn2fhyuiyyyj3hu`,
  },
  {
    id: 14,
    name: "Abyssal Hatchling",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeif3xqsjwq6ucm44tvjsaapc7urpx6afyrmvyyqjz5skoh6qpbw54m`,
  },
  {
    id: 15,
    name: "Moonshadow Hatchling",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeiaml63mdtzjka2ms4qnmfwvyp3dhsoi5i6k5htc22jz45ofhm46iy`,
  },
  {
    id: 16,
    name: "Celestial Hatchling",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeidk2bmdtqgzf5nxq33cepfql6uelqtxzljn3bjgdz7fnv7vt4gtlu`,
  },
  {
    id: 17,
    name: "Everfrost Hatchling",
    rarity: Rarity.Limited,
    image: `${IPFS_GATEWAY_URL}bafybeia5h3n33pvf47yqinlbphgvbqnb2tckbrcwdv67ewexxfzfpzctai`,
  },
];

export const BEAVER_TOTEMS = [
  {
    id: 1,
    name: "Brown Kit",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeiczvakwot4e4jkkzfjafgxypaopmyqqtf22ha67q253a6clor77ue`,
  },
  {
    id: 2,
    name: "Gray Kit",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeigkpyy3xjd656rd2dntqagtheytmwsj6kdpoj4metnrbh4mf4u4bq`,
  },
  {
    id: 3,
    name: "White Kit",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeieoknhthzqzh6m2lecfllaauuzrplffvsdewp4w2x3at4quuiuaxa`,
  },
  {
    id: 4,
    name: "Tawny Kit",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeicajgmn46tq2ryox2a3ern5xrdxhwxqzyqgou736xeq53yio756wq`,
  },
  {
    id: 5,
    name: "Slate Kit",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeid4t7uimf7cbcxt4y3resxmbcaswn6n5dt3kfqihya4acjqopa73u`,
  },
  {
    id: 6,
    name: "Copper Kit",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeiddonybtxamiditfs4atjanzyeoq2vqxfp7qninxlrxrgsif4e5la`,
  },
  {
    id: 7,
    name: "Cream Kit",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeigurfv3k4e36g7wb4e2szhsmobacvfaafxvqcyd3e4wcoxk6i36ia`,
  },
  {
    id: 8,
    name: "Dappled Kit",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeiamuiooy2jjwjzqt3lzek3i5ftqneguq7yg6cldrfvunfwc7hw3qi`,
  },
  {
    id: 9,
    name: "Sunbranch Kit",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeidt6yeej4xdp3xqbfuzzacux2lud7yl7opy74o7lbo7i2chzt7wlq`,
  },
  {
    id: 10,
    name: "Duskmire Kit",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeidakor6idad6qfzly4nr3k7irfrgasn4ddwtf77abkbr4f2ag5hga`,
  },
  {
    id: 11,
    name: "Emberdam Kit",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeif7pgxkxqpiwiyhduclgv7mhcxz4wxon2yczgmkf4zsombzizx3pm`,
  },
  {
    id: 12,
    name: "Verdantroot Kit",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeiakxazrnjrcakxy2hocx6jmw4icyggbihruvv55edt4fsub7mdijm`,
  },
  {
    id: 13,
    name: "Emberbranch Kit",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeigxkanr6g7rlsimgijxr6svzgyjqqkqkj5regbrgwf5or3owdmdpi`,
  },
  {
    id: 14,
    name: "Abysscurrent Kit",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeide2lpjkera3ishqda5w4zgsxcv5z73o47ax5wcyx5psi7uslisfq`,
  },
  {
    id: 15,
    name: "Moonlake Kit",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeigrodxqqzfa2lcippgxoonhwtsxouuahb27nbb6yvdlxvttibukjy`,
  },
  {
    id: 16,
    name: "Celestial Kit",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeicjeax6zbyt4dpxfdibm3jqbanrj6yldzipj2oj3w23d6foqfhkcq`,
  },
  {
    id: 17,
    name: "Blossomroot Kit",
    rarity: Rarity.Limited,
    image: `${IPFS_GATEWAY_URL}bafybeicz3qwrvy5a5p7d3rmn54ojgwvpmkmdqfcjbtkv5o2riklo4fpxva`,
  },
];

export const DEER_TOTEMS = [
  {
    id: 1,
    name: "Brown Fawn",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeiaczt2b5ztdmx3kdbixowqchh5aqc536cbzarzuxbuqsdkdgcjv4a`,
  },
  {
    id: 2,
    name: "Gray Fawn",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeifcyzwyjx5q7y55jfvcaktrkua2zrpqya4xs2kslrv2embjnq53ge`,
  },
  {
    id: 3,
    name: "White Fawn",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeicxlh3nt4r77calcfksdktciki2jah3lnii6r7co6avp2rabh5ule`,
  },
  {
    id: 4,
    name: "Tawny Fawn",
    rarity: Rarity.Common,
    image: `${IPFS_GATEWAY_URL}bafybeiczqymbrbtaxi6kirluxoxpl3ysbe5zfv2aeamansgouxb3jvq66e`,
  },
  {
    id: 5,
    name: "Slate Fawn",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeiezmaptquplvizvbggyqxk6waajys5tp5y2sgcavfjaivwfkgp5rm`,
  },
  {
    id: 6,
    name: "Copper Fawn",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeibz3peyfx6u4t5fpahyecnm6lvryxupz5lwwpqvjmqesiltlkcb2q`,
  },
  {
    id: 7,
    name: "Cream Fawn",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeier7rhh6nelzkhforwbayymqh5io3f2fpmis34vuqv4x7ixlkdaxe`,
  },
  {
    id: 8,
    name: "Dappled Fawn",
    rarity: Rarity.Uncommon,
    image: `${IPFS_GATEWAY_URL}bafybeid244wamd4rcigcy4tvcsfzefkc2ifqehfdbtt3ncptd3wxclhnvq`,
  },
  {
    id: 9,
    name: "Dawnsight Fawn",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeifofafnivd5sns4qpnko3dcxmig2yyrg5743glmg5n5yvmporst44`,
  },
  {
    id: 10,
    name: "Umbravale Fawn",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeigqwire2xr2lqhwhshol4pkgjkcuiqs27nao2ox4rp65wftjholky`,
  },
  {
    id: 11,
    name: "Emberhide Fawn",
    rarity: Rarity.Rare,
    image: `${IPFS_GATEWAY_URL}bafybeic4d6i6p6l2xa7oqi3zvckwpdij6ie63wam6xktkxuelgjxnzz2gq`,
  },
  {
    id: 12,
    name: "Verdantstride Fawn",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeiak5s3ptuhnyjtewtvf44o55w3mygx4ape6resrmpjebodte53aki`,
  },
  {
    id: 13,
    name: "Bloodleaf Fawn",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeicivbb6xwtpezmgygsg73hoyohxdkjy7ipyjtu4aegjrwgy2o2zve`,
  },
  {
    id: 14,
    name: "Abyssroot Fawn",
    rarity: Rarity.Epic,
    image: `${IPFS_GATEWAY_URL}bafybeid7437rbvwinnw454e52yv4avdddbo2vx4py6hras2winscfrwydq`,
  },
  {
    id: 15,
    name: "Moonshade Fawn",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeibnm4t5veyztx3ccu6qylkpeahs2udc24skudyywc5cxu7q3j3sf4`,
  },
  {
    id: 16,
    name: "Celestag Fawn",
    rarity: Rarity.Legendary,
    image: `${IPFS_GATEWAY_URL}bafybeiekiuti5evqspr2rge7s4nhcrdbiidqy2udhozhusazffdcewrzda`,
  },
  {
    id: 17,
    name: "Solstride Fawn",
    rarity: Rarity.Limited,
    image: `${IPFS_GATEWAY_URL}bafybeifocx5phnjridwieygwzjhsnxcw4k67i3y7y3uct3veuwtyybu3ni`,
  },
];