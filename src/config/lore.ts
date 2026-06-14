import { Domain, Species } from '../types/types';

export type EraId = 'binding' | 'trials' | 'sundering' | 'hollowing' | 'waking';
export type FactionStatus = 'Existing' | 'New' | 'Fallen';
export type DomainState = 'Bound' | 'Sleeping';

export interface Era {
  id: EraId;
  name: string;
  order: number;
  flavor: string;
}

export interface Tale {
  id: string;
  title: string;
  emoji: string;
  epigraph: string;
  body: string[];
  species?: Species;
  domain: Domain;
  era: EraId;
  linkedLocationIds: number[];
  relicName?: string;
  image: string;
}

export interface MythicEvent {
  id: string;
  name: string;
  era: EraId;
  summary: string;
  linkedLocationIds: number[];
}

export interface Faction {
  id: string;
  name: string;
  status: FactionStatus;
  philosophy: string;
  hook: string;
}

export interface Tradition {
  id: string;
  name: string;
  description: string;
}

export interface DomainLore {
  domain: Domain;
  name: string;
  state: DomainState;
  flavor: string;
  species: string[];
}

export const ERAS: Era[] = [
  {
    id: 'binding',
    name: 'Age of Binding',
    order: 1,
    flavor: 'The First Totems braid starlight into form. The Owl names itself. The domains are drawn.',
  },
  {
    id: 'trials',
    name: 'Age of Trials',
    order: 2,
    flavor: 'Heroes rise. The Flame Trials are forged, the Coil of Becoming named, and the old rites take shape.',
  },
  {
    id: 'sundering',
    name: 'The Sundering',
    order: 3,
    flavor: 'Tidewound. The Third Moon falls. The Bone Tide rises. The world breaks in places that never quite heal.',
  },
  {
    id: 'hollowing',
    name: 'The Hollowing',
    order: 4,
    flavor: 'A long silence. Aeluin dims. The Lanternless wander. Glyphs rearrange nightly.',
  },
  {
    id: 'waking',
    name: 'The Waking Age',
    order: 5,
    flavor: 'Now. Remnants surface. Bells are close to ringing again. You walk among the stories.',
  },
];

export const DOMAIN_LORE: DomainLore[] = [
  {
    domain: Domain.Air,
    name: 'Air',
    state: 'Bound',
    flavor: 'Sight, voice, and the distances between. Air is how the world speaks to itself.',
    species: ['Falcon', 'Woodpecker', 'Raven', 'Owl'],
  },
  {
    domain: Domain.Earth,
    name: 'Earth',
    state: 'Bound',
    flavor: 'Roots, patience, and quiet dominion. The earth keeps a ledger of every footfall.',
    species: ['Wolf', 'Deer', 'Bear', 'Snake'],
  },
  {
    domain: Domain.Water,
    name: 'Water',
    state: 'Bound',
    flavor: 'Memory, change, and the currents of fate. Water remembers what stone forgets.',
    species: ['Goose', 'Otter', 'Beaver', 'Turtle'],
  },
  {
    domain: Domain.Fire,
    name: 'Fire',
    state: 'Sleeping',
    flavor: 'Trial, transformation, and hunger. Its totem is missing. Its rites are still kept.',
    species: [],
  },
  {
    domain: Domain.Spirit,
    name: 'Spirit',
    state: 'Sleeping',
    flavor: 'Dream, threshold, and the Veil. A domain that speaks only in echoes.',
    species: [],
  },
  {
    domain: Domain.Shadow,
    name: 'Shadow',
    state: 'Sleeping',
    flavor: 'The unbound, the undone, the not-yet. A second shadow falls where Shadow passes.',
    species: [],
  },
];

export const TALES: Tale[] = [
  {
    id: 'owl-first-totem',
    title: 'The Binding of the First Totem',
    emoji: '🪶',
    epigraph: 'The Owl watched the sun fall 1,000 times before uttering its name.',
    body: [
      'The First Totem emerged not by birth, but by binding — starlight braided with silence. It is said the Owl was the first to awaken and the first to see the Veil between worlds.',
      'Its voice could still winds, and its gaze made shadows retreat. In the Chamber of Quiet Hours, a single feather floats, never falling. Some say it still listens.',
    ],
    species: Species.Owl,
    domain: Domain.Air,
    era: 'binding',
    linkedLocationIds: [20, 28],
    relicName: 'Feather of the Quiet Hours',
    image: '/habitats/owl-habitat.jpg',
  },
  {
    id: 'goose-tidewound-sela',
    title: 'The Shatter at Tidewound',
    emoji: '🌊',
    epigraph: 'When the Delta ran silver with moonlight, the Goose clans thrived.',
    body: [
      'The Great Tidewound War split water from shadow. Sela of the Reeds, warrior-keeper of the eastern marshes, vanished at the final tidefall, leaving only a glowing feather, still warm to the touch.',
      'The tides have never behaved since. In fog, some still see her silhouette at the Misttail\'s edge — a feather held loosely, as though she were about to set it down.',
    ],
    species: Species.Goose,
    domain: Domain.Water,
    era: 'sundering',
    linkedLocationIds: [9, 10],
    relicName: "Sela's Warm Feather",
    image: '/habitats/goose-habitat.jpg',
  },
  {
    id: 'fire-emberhorn',
    title: 'The Pact of Emberhorn',
    emoji: '🔥',
    epigraph: 'Though scorched and blinded, he emerged carrying flame in his breath.',
    body: [
      'In the Fire Domain, no tale burns brighter than that of Emberhorn, a bison whose hooves cracked volcanic stone. When the Spirit Flame began to fade, he faced the Flame Trials — a gauntlet of rage and memory.',
      'Emberhorn vanished at the end of the Trials, but the Scorchtrack Plateau still trembles where he stood. His breath is said to return each summer, passing from trial-taker to trial-taker.',
    ],
    domain: Domain.Fire,
    era: 'trials',
    linkedLocationIds: [3, 27],
    relicName: "Emberhorn's Breath",
    image: '/domains/fire-domain.jpg',
  },
  {
    id: 'fox-kitsura',
    title: 'The Dream of Kitsura',
    emoji: '🦊',
    epigraph: 'She spoke in riddles and wrote in wind.',
    body: [
      'Kitsura the Twin-Tailed, born of fox and star-mist, wandered between dreams. Her teachings formed the lost art of Echo Weaving — where memory becomes thread.',
      'The Kitsune keep her name sacred, whispered before sleep to ward off the Hollow Fade. Dreams that involve mirrors, riddles, or twin shadows are said to be her visitations.',
    ],
    domain: Domain.Spirit,
    era: 'trials',
    linkedLocationIds: [21],
    image: '/domains/spirit-domain.jpg',
  },
  {
    id: 'lanternless-walk',
    title: 'The Lanternless Walk',
    emoji: '🕯',
    epigraph: 'Before the Totems, there were the Lanternless.',
    body: [
      'Beings of spirit unshaped by form, the Lanternless wandered the realms lost. The Walk marks the time before names, before binding.',
      'Those who trace it in visions report cold fire, songs in reverse, and the soft laughter of things unborn. Initiates of the Hollow School believe walking it in dream grants immunity to forgetting.',
    ],
    domain: Domain.Spirit,
    era: 'hollowing',
    linkedLocationIds: [22, 31],
    image: '/domains/spirit-domain.jpg',
  },
  {
    id: 'third-moon-fall',
    title: 'The Fall of the Third Moon',
    emoji: '💀',
    epigraph: 'Veylua waits.',
    body: [
      'Three moons once orbited the Spirit Realm. The third, Veylua, was jealous of life. It demanded worship and grew hungrier with each age.',
      'When the Totems refused it tribute, it crashed into the sea — creating the Crescent Grave and unleashing the Bone Tide. Even now, salt whispers cling to the rocks, chanting her name.',
    ],
    domain: Domain.Shadow,
    era: 'sundering',
    linkedLocationIds: [16, 25],
    image: '/domains/shadow-domain.jpg',
  },
  {
    id: 'snake-namzaleth',
    title: "The Coil of Nam'Zaleth",
    emoji: '🐍',
    epigraph: 'It remembered the first whisper of creation.',
    body: [
      "Nam'Zaleth, the great serpent of lore, claimed to remember the first whisper of creation. It taught the sacred Coil of Becoming — a cycle of sleep, shedding, and self.",
      "Followers believe that to wear a mask of Nam'Zaleth in ritual grants insight or madness. One mask is said to still breathe.",
    ],
    species: Species.Snake,
    domain: Domain.Earth,
    era: 'binding',
    linkedLocationIds: [19, 33],
    relicName: "Mask of Nam'Zaleth",
    image: '/habitats/snake-habitat.jpg',
  },
  {
    id: 'dove-aeluin',
    title: 'The Dimming of Aeluin',
    emoji: '🕊',
    epigraph: 'She sang no more.',
    body: [
      'Aeluin, the Dove of Morning, was once a guide between realms. Her wings bore messages across death, birth, and memory. But when the First Silence fell, her song ended.',
      'The Bell of Aeluin, cast from her final breath, rings only for those near soul-death. The Lantern Wardens tend her Orchard still, waiting for the Dove\'s Descent to come again.',
    ],
    domain: Domain.Spirit,
    era: 'hollowing',
    linkedLocationIds: [12, 30],
    relicName: 'Bell of Aeluin',
    image: '/domains/spirit-domain.jpg',
  },
  {
    id: 'mirror-glen',
    title: 'The Fracture of the Mirror Glen',
    emoji: '🪞',
    epigraph: 'Truths were once traded like seeds.',
    body: [
      'In the Glen of Mirrors, spirits walked backward and forward, speaking the names of those not yet born. But when a mortal asked to see their true self, the Mirror Glen cracked.',
      'Shards still drift in spiritstorms. Touching one may grant a Vision of the Then — but always at a cost you cannot name.',
    ],
    domain: Domain.Spirit,
    era: 'sundering',
    linkedLocationIds: [7, 36],
    image: '/domains/spirit-domain.jpg',
  },
  {
    id: 'thousand-hands',
    title: 'The Scrawl of the Thousand Hands',
    emoji: '📚',
    epigraph: 'One page survives: it ends with your name.',
    body: [
      "Near the cliffs of Hollowreach is a wall where no plant grows. Etched upon it are the ever-changing Glyphs of Yal'Teveth — said to be the writing of a totem who bore no form, only hands.",
      'The glyphs rearrange each night. Scribes who try to record them vanish after the thirteenth page. One page survives: it ends with your name.',
    ],
    species: Species.Raven,
    domain: Domain.Air,
    era: 'hollowing',
    linkedLocationIds: [18, 34],
    relicName: "Glyphs of Yal'Teveth",
    image: '/habitats/raven-habitat.jpg',
  },
  {
    id: 'otter-miren',
    title: 'Miren Brightpaw, the Laughing Thief',
    emoji: '💧',
    epigraph: 'She laughed the Veil thin.',
    body: [
      'Miren was no warrior. She stole a star from a grieving god and skipped it across the Misttail Delta, and for one night the river ran upstream. The gods forgave her because she made them laugh.',
      'Otters still skip stones at dusk — three skips for a wish, seven for an answer, thirteen for a door that should not open.',
    ],
    species: Species.Otter,
    domain: Domain.Water,
    era: 'trials',
    linkedLocationIds: [10],
    relicName: "Miren's Laughing Stone",
    image: '/habitats/otter-habitat.jpg',
  },
  {
    id: 'wolf-vareth',
    title: 'Vareth Packfather, Who Held the Ridge',
    emoji: '🐺',
    epigraph: 'What the pack holds, the world cannot break.',
    body: [
      'When the Tidewound struck inland, the waters climbed Stonefang Ridge and would not stop. Vareth held the ridgeline with the Grey Pack for twelve nights, howling at the rising sea until it remembered it was water.',
      'He walked into the last wave and did not come out. His howl can still be heard in Stonefang wind, and every pup born on the ridge is named by its echo.',
    ],
    species: Species.Wolf,
    domain: Domain.Earth,
    era: 'sundering',
    linkedLocationIds: [11],
    image: '/habitats/wolf-habitat.jpg',
  },
  {
    id: 'falcon-tassiren',
    title: 'Tassiren Stormwing, Prophet of the High Air',
    emoji: '🦅',
    epigraph: 'I see where the falling star will land.',
    body: [
      'A falcon who flew too high and saw the shape of things to come. Tassiren carried prophecies between domains until the Dimming took Aeluin — then she flew west and was never seen again.',
      "Falcons of Galecrest still scan the western horizon at dawn. A shadow in the wrong shape is said to be hers, and a feather that falls upward is said to be her answer.",
    ],
    species: Species.Falcon,
    domain: Domain.Air,
    era: 'trials',
    linkedLocationIds: [12, 29],
    image: '/habitats/falcon-habitat.jpg',
  },
  {
    id: 'beaver-hodren',
    title: 'Hodren of the Dam, the Forty-Year Builder',
    emoji: '🪵',
    epigraph: 'Patience is a weapon. Water has taught me.',
    body: [
      'Hodren built Stonebranch Dam one stone a day for forty years, against a flood that had not yet come. When Tidewound crested, the dam held.',
      'Hodren was inside it. The dam still hums faintly, as if something is breathing, and the stones warm slightly when a storm approaches.',
    ],
    species: Species.Beaver,
    domain: Domain.Water,
    era: 'trials',
    linkedLocationIds: [13],
    relicName: "Hodren's Compass",
    image: '/habitats/beaver-habitat.jpg',
  },
  {
    id: 'deer-velan',
    title: 'Velan the Pathwalker, Who Led the Lost',
    emoji: '🌿',
    epigraph: 'There is always a way through, even when the way is gone.',
    body: [
      'Velan led the lost out of the Hollowing, a generation of spirits unmoored. Her antlers carried a sliver of mirror, so those behind her could see themselves and remember their names.',
      'She walked until there was nothing left of her but the path. Deer-guides of Sunveil still trace her steps — no one has walked the full length and returned the same.',
    ],
    species: Species.Deer,
    domain: Domain.Earth,
    era: 'hollowing',
    linkedLocationIds: [14, 32],
    relicName: "Velan's Mirror-Antler",
    image: '/habitats/deer-habitat.jpg',
  },
  {
    id: 'woodpecker-tarryk',
    title: 'Tarryk Drumheart, Keeper of the Long Drum',
    emoji: '🥁',
    epigraph: 'The world wakes to rhythm.',
    body: [
      'Woodpecker of the Skythrum, Tarryk taught the Long Drum — a beat that could wake sleepers, calm storms, and call things to attention. When the First Silence came, only his drum could be heard.',
      'He drummed until his heart stopped. The Drumkeepers have carried the beat since, and they believe if the drum ever stops, the world will notice.',
    ],
    species: Species.Woodpecker,
    domain: Domain.Air,
    era: 'trials',
    linkedLocationIds: [15, 35],
    relicName: 'Drum of Tarryk',
    image: '/habitats/woodpecker-habitat.jpg',
  },
  {
    id: 'turtle-mogruun',
    title: 'Old Mogruun, Who Watched the Moon Fall',
    emoji: '🐢',
    epigraph: 'I was here before. I will be here after.',
    body: [
      'The Turtle who swam in the first sea and watched Veylua fall. Mogruun carries a shell of salt-glass that remembers every tide.',
      'It is said if you speak your grief to Stillwater Hollow, Mogruun hears — and will surface once, in your lifetime, if you have earned it.',
    ],
    species: Species.Turtle,
    domain: Domain.Water,
    era: 'binding',
    linkedLocationIds: [16, 25],
    image: '/habitats/turtle-habitat.jpg',
  },
  {
    id: 'bear-urskarr',
    title: 'Urskarr Deepstep, the Underroad Walker',
    emoji: '🐻',
    epigraph: 'Every root remembers.',
    body: [
      'Urskarr walked the underroads beneath the forests when the Hollowing confused the surface. He catalogued what the earth refused to forget in a ledger no one has read twice.',
      'Bears who sleep at Stoneroot dream his footfalls. The ledger surfaces every generation, bound slightly differently — as though the earth is still adding pages.',
    ],
    species: Species.Bear,
    domain: Domain.Earth,
    era: 'hollowing',
    linkedLocationIds: [17],
    relicName: 'Ledger of Urskarr',
    image: '/habitats/bear-habitat.jpg',
  },
  {
    id: 'raven-nine-feathered',
    title: 'The Nine-Feathered, Keeper of Grudges',
    emoji: '🖤',
    epigraph: 'A shadow that is not yours.',
    body: [
      'Neither one nor many, the Nine-Feathered flew through the smoke of a dying domain and came out with nine feathers and a second shadow. They are the keeper of grudges that should not be forgotten.',
      'Ravens count feathers before they speak. If the count ever reaches nine, the listener is expected to bow — or to answer.',
    ],
    species: Species.Raven,
    domain: Domain.Shadow,
    era: 'sundering',
    linkedLocationIds: [18, 29],
    relicName: 'The Second Shadow',
    image: '/habitats/raven-habitat.jpg',
  },
];

export const MYTHIC_EVENTS: MythicEvent[] = [
  {
    id: 'tidewound-war',
    name: 'The Tidewound War',
    era: 'sundering',
    summary: 'Water fought shadow and neither won. Sela vanished. The tides have never behaved since.',
    linkedLocationIds: [9, 10],
  },
  {
    id: 'flame-trials',
    name: 'The Flame Trials',
    era: 'trials',
    summary: 'A gauntlet of rage and memory. Emberhorn was the first to pass. The trial still runs each summer.',
    linkedLocationIds: [3, 27],
  },
  {
    id: 'third-moon',
    name: 'The Fall of the Third Moon',
    era: 'sundering',
    summary: 'Veylua crashed into the sea. The Crescent Grave was carved. The Bone Tide rose behind her.',
    linkedLocationIds: [16, 25],
  },
  {
    id: 'bone-tide',
    name: 'The Bone Tide',
    era: 'sundering',
    summary: 'Salt-bleached horrors climbed the coast. Saltspire Keep fell first. The Bonewatchers keep the salt vigil still.',
    linkedLocationIds: [26],
  },
  {
    id: 'long-drum',
    name: 'The Long Drum',
    era: 'trials',
    summary: 'Tarryk struck a beat that has not stopped for seven generations. Drumhold listens to itself listening.',
    linkedLocationIds: [15, 35],
  },
  {
    id: 'withering',
    name: 'The Withering',
    era: 'hollowing',
    summary: 'A slow rot crept through Sunveil. Velan walked until there was no Velan left, only path.',
    linkedLocationIds: [14, 32],
  },
  {
    id: 'siege-stonefang',
    name: 'The Siege of Stonefang',
    era: 'sundering',
    summary: 'Vareth and the Grey Pack held the ridgeline for twelve nights against a sea that would not stop.',
    linkedLocationIds: [11],
  },
  {
    id: 'lanternless-walk',
    name: 'The Lanternless Walk',
    era: 'hollowing',
    summary: 'A generation wandered unnamed through Driftmoor. Some came back. Some are still walking.',
    linkedLocationIds: [22, 31],
  },
  {
    id: 'rite-of-sealing',
    name: 'The Rite of Sealing',
    era: 'trials',
    summary: 'The Buried Vault was closed with seals of every domain. No one remembers who carved them, or why.',
    linkedLocationIds: [23],
  },
  {
    id: 'last-flight-nine',
    name: 'The Last Flight of the Nine',
    era: 'sundering',
    summary: 'A great serpent was brought down across Wyrmspine. The Nine-Feathered counted the feathers of the fallen.',
    linkedLocationIds: [18, 29],
  },
  {
    id: 'dimming',
    name: 'The Dimming of Aeluin',
    era: 'hollowing',
    summary: "Aeluin's song ended. The Bell was cast from her final breath. The Orchard waits for the Descent.",
    linkedLocationIds: [12, 30],
  },
  {
    id: 'mirror-fracture',
    name: 'The Fracture of the Mirror Glen',
    era: 'sundering',
    summary: 'A mortal asked to see their true self. The Glen cracked. Shards drift in spiritstorms still.',
    linkedLocationIds: [7, 36],
  },
  {
    id: 'scrawl',
    name: 'The Scrawl of the Thousand Hands',
    era: 'hollowing',
    summary: "Yal'Teveth writes each night on the Cliff of Glyphs. One page ends with every reader's name.",
    linkedLocationIds: [18, 34],
  },
];

export const FACTIONS: Faction[] = [
  {
    id: 'hollow-school',
    name: 'The Hollow School',
    status: 'Existing',
    philosophy: 'Accept the void. Walk the Lanternless way. What you forget is still yours.',
    hook: 'Initiates trace the Lanternless Walk in dream. They do not speak their own names aloud.',
  },
  {
    id: 'veiled-order',
    name: 'The Veiled Order',
    status: 'Existing',
    philosophy: 'Walk between life and death. Seek the Bell. Carry the dying a little further.',
    hook: "Clerics of the Veiled Order dream of Aeluin's Bell and wake with salt on their lips.",
  },
  {
    id: 'emberkin',
    name: 'The Emberkin',
    status: 'New',
    philosophy: 'Carry flame in breath. Honor Emberhorn. The Fire Domain is sleeping, not dead.',
    hook: 'Every summer, the Emberkin walk the Scorchtrack Plateau and leave their oldest grief in the ash.',
  },
  {
    id: 'drumkeepers',
    name: 'The Drumkeepers',
    status: 'New',
    philosophy: 'Hold the beat that wakes the world. Rhythm is older than names.',
    hook: "At Drumhold the drum has not stopped in seven generations. If it ever does, we will find out what was keeping quiet.",
  },
  {
    id: 'bonewatchers',
    name: 'The Bonewatchers',
    status: 'New',
    philosophy: 'Stand against the Bone Tide. Salt, vigil, and memory are our walls.',
    hook: 'Each moonless night, a Bonewatcher keeps the Salt Vigil at Saltspire. None who kept it alone are still speaking.',
  },
  {
    id: 'lantern-wardens',
    name: 'The Lantern Wardens',
    status: 'New',
    philosophy: "Tend the Orchard. Ring the bells of dimming. Wait for the Descent.",
    hook: 'The Wardens speak only during the Dove\'s Descent. The rest of the year, they write.',
  },
  {
    id: 'nine-feathered-cult',
    name: 'The Feather Count',
    status: 'New',
    philosophy: 'Remember what the world tries to forget. Count the feathers. Do not look away.',
    hook: "Ravens who follow the Nine-Feathered keep a ledger of grudges. They will forgive nothing, but they will forget nothing either.",
  },
];

export const TRADITIONS: Tradition[] = [
  {
    id: 'flame-trials',
    name: 'Flame Trials',
    description: 'A rite of passage for the Fire-touched. A gauntlet of rage and memory, held each summer on the Scorchtrack.',
  },
  {
    id: 'echo-weaving',
    name: 'Echo Weaving',
    description: 'A rare spirit-skill — memory turned to thread. Strongest near the Dreamroot Altar, where memory runs close to the surface.',
  },
  {
    id: 'coil-becoming',
    name: 'Coil of Becoming',
    description: 'The cycle of sleep, shedding, and self. A visual metaphor for growth, and the shape walked at the Coiling Festival.',
  },
  {
    id: 'vision-then',
    name: 'Vision of the Then',
    description: 'A mirror-shard flashback from the Fractured Glen. Prophetic, unreliable, always costly.',
  },
  {
    id: 'doves-descent',
    name: "The Dove's Descent",
    description: "A rare celestial alignment. The only time the Lantern Orchard opens and Aeluin's Bell can be heard.",
  },
  {
    id: 'coiling-festival',
    name: 'The Coiling Festival',
    description: 'Walked three times each year at the Coiling Grounds — for sleep, for shedding, for self. Outsiders walk only once.',
  },
  {
    id: 'long-drum',
    name: 'The Long Drum',
    description: 'A beat held without break, kept by the Drumkeepers of Drumhold. Used to calm storms and wake sleepers.',
  },
  {
    id: 'walk-of-names',
    name: 'The Walk of Names',
    description: 'Hollow-School initiation. Walk until you forget your name, then remember it differently.',
  },
  {
    id: 'salt-vigil',
    name: 'The Salt Vigil',
    description: 'A Bonewatcher rite. A moonless night kept at the tideline, alone. Not all watchers return speaking.',
  },
];
