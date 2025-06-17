import { Location, Rarity, Species } from "../types/types";

// Constants for progression calculations
export const PRESTIGE_XP_REQUIREMENT = 2500;
export const BASE_ELDER_XP = 7500;
export const STAGE_THRESHOLDS = [0, 500, 1500, 3500, 7500];
export const IPFS_GATEWAY_URL = process.env.REACT_APP_IPFS_GATEWAY_URL || 'https://ipfs.totembound.com/ipfs/';
export const TOTEM_COST = 500;

export const TIER_TYPES = {
    free: 'Free',
    premium: 'Premium',
    advanced: 'Advanced'
};

export const STORAGE_KEYS = {
    theme: 'totem-theme',
    notifications: 'totem-notifications',
    notificationSound: "totem-notification-sound",
    maxNotifications: "totem-max-notifications",
    tokenApprovalMessageDismissed: 'totem-approval-message-dismissed',
    isGaslessEnabled: 'totem-gasless-enabled',
    gaslessApiKey: 'totem-gasless-api-key',
    accountType: 'totem-account-type',
    tutorialWizardVisible: 'totem-tutorialWizardVisible'
};

export const AVAILABLE_SPECIES = [
  {
    id: 0, name: 'Goose', species: Species.Goose, 
    title: 'The Watchful Guardian',
    desc: 'The Goose represents protection, vigilance, and leadership. Known for its strong instincts and devotion to its flock, it ensures the safety of all who travel under its watchful eye.',
    locationId: 9,
    affinity: 'Wisdom',
    domain: 'Water',
    available: true,
    image: '/totems/gooseplacecard.png'
  }, {
    id: 1, name: 'Otter', species: Species.Otter, 
    title: 'The Joyful Trickster',
    desc: 'The Otter represents adaptability, curiosity, and playfulness. It approaches challenges with an open mind, embracing creativity and joy even in difficult situations.',
    locationId: 10,
    affinity: 'Agility',
    domain: 'Water',
    available: true,
    image: '/totems/otterplacecard.png'
  }, {
    id: 2, name: 'Wolf', species: Species.Wolf, 
    title: 'The Pack Leader',
    desc: 'The Wolf represents strategy, loyalty, and teamwork. As a natural pack hunter, it excels in coordination and thrives when working together with others.',
    locationId: 11,
    affinity: 'Strength',
    domain: 'Earth',
    available: true,
    image: '/totems/wolfplacecard.png'
  }, {
    id: 3, name: 'Falcon', species: Species.Falcon, 
    title: 'The Swift Hunter',
    desc: 'The Falcon represents precision, agility, and speed. With unmatched vision and lightning reflexes, it never loses sight of its target.',
    locationId: 12,
    affinity: 'Agility',
    domain: 'Air',
    available: true,
    image: '/totems/falconplacecard.png'
  }, {
    id: 4, name: 'Beaver', species: Species.Beaver, 
    title: 'The Tireless Builder',
    desc: 'The Beaver represents ingenuity, determination, and resourcefulness. It constructs solutions to any problem, always working toward long-term success.',
    locationId: 13,
    affinity: 'Strength',
    domain: 'Water',
    available: true,
    image: '/totems/beaverplacecard.png'
  }, {
    id: 5, name: 'Deer', species: Species.Deer, 
    title: 'The Gentle Pathfinder',
    desc: 'The Deer represents grace, awareness, and intuition. It moves with ease through difficult terrain, staying alert to potential dangers.',
    locationId: 14,
    affinity: 'Agility',
    domain: 'Earth',
    available: false,
    image: '/totems/deerplacecard.png'
  }, {
    id: 6, name: 'Woodpecker', species: Species.Woodpecker, 
    title: 'The Relentless Worker',
    desc: 'The Woodpecker represents persistence, rhythm, and focus. It never tires in its pursuit, chiseling away at obstacles until success.',
    locationId: 15,
    affinity: 'Agility',
    domain: 'Air',
    available: false,
    image: '/totems/woodpeckerplacecard.png'
  }, {
    id: 7, name: 'Turtle', species: Species.Turtle, 
    title: 'The Unyielding Navigator',
    desc: 'The Turtle symbolizes resilience, grounded strength, and patient resolve. It carries its world while navigating waters with quiet, ancient wisdom.',
    locationId: 16,
    affinity: 'Strength',
    domain: 'Water',
    available: false,
    image: '/totems/turtleplacecard.png'
  }, {
    id: 8, name: 'Bear', species: Species.Bear, 
    title: 'The Unstoppable Force',
    desc: 'The Bear represents strength, resilience, and dominance. It relies on brute force to overcome adversity, clearing obstacles through sheer power.',
    locationId: 17,
    affinity: 'Strength',
    domain: 'Earth',
    available: false,
    image: '/totems/bearplacecard.png'
  }, {
    id: 9, name: 'Raven', species: Species.Raven, 
    title: 'The Shadowed Trickster',
    desc: 'The Raven represents intelligence, cunning, and mystery. A master of deception, it sees paths unseen by others.',
    locationId: 18,
    affinity: 'Wisdom',
    domain: 'Air',
    available: false,
    image: '/totems/ravenplacecard.png'
  }, {
    id: 10, name: 'Snake', species: Species.Snake, 
    title: 'The Silent Observer',
    desc: 'The Snake represents stealth, transformation, and wisdom. It moves unnoticed, striking only when the time is right.',
    locationId: 19,
    affinity: 'Wisdom',
    domain: 'Earth',
    available: false,
    image: '/totems/snakeplacecard.png'
  }, {
    id: 11, name: 'Owl', species: Species.Owl, 
    title: 'The Eternal Watcher', 
    desc: 'The Owl represents knowledge, insight, and patience. It sees beyond the present, guiding those who seek the truth.',
    locationId: 20,
    affinity: 'Wisdom',
    domain: 'Air',
    available: true,
    image: '/totems/owlplacecard.png'
  }
];

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

