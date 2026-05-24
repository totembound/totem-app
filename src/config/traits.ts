/** Trait definitions (bundled at build time). Source of truth for frontend. */

export type TraitSlot = 'innate' | 'learned' | 'awakened';
export type TraitCategory = 'passive' | 'active';

export interface TraitDefinition {
    id: string;
    name: string;
    description: string;
    slot: TraitSlot;
    category: TraitCategory;
    tags: string[];
    /** Lucide-react icon name. Phase 2.5 swaps these for image paths like "/assets/traits/curious.png". */
    icon: string;
}

export interface TotemTraits {
    innate: string | null;
    learned: string | null;
    awakened: string | null;
}

export const TRAITS: TraitDefinition[] = [
    // ============ Innate (12) ============
    { id: 'trt_curious',  name: 'Curious',  description: 'Always wandering off.',            slot: 'innate', category: 'passive', tags: ['expeditions'],         icon: 'Compass' },
    { id: 'trt_brave',    name: 'Brave',    description: 'First into the fray.',             slot: 'innate', category: 'passive', tags: ['challenges', 'arena'], icon: 'Sword' },
    { id: 'trt_gentle',   name: 'Gentle',   description: 'Softens hearts.',                  slot: 'innate', category: 'passive', tags: ['care', 'social'],      icon: 'Heart' },
    { id: 'trt_stubborn', name: 'Stubborn', description: 'Refuses to back down.',            slot: 'innate', category: 'passive', tags: ['challenges', 'arena'], icon: 'Anchor' },
    { id: 'trt_playful',  name: 'Playful',  description: 'Finds joy in everything.',         slot: 'innate', category: 'passive', tags: ['care'],                icon: 'Sparkles' },
    { id: 'trt_shy',      name: 'Shy',      description: 'Hides at first; warms up slowly.', slot: 'innate', category: 'passive', tags: ['sanctum', 'social'],   icon: 'Cloud' },
    { id: 'trt_clever',   name: 'Clever',   description: 'Figures things out fast.',         slot: 'innate', category: 'passive', tags: ['challenges', 'expeditions'], icon: 'Lightbulb' },
    { id: 'trt_loyal',    name: 'Loyal',    description: 'Bonds deeply.',                    slot: 'innate', category: 'passive', tags: ['sanctum', 'social'],   icon: 'Users' },
    { id: 'trt_restless', name: 'Restless', description: "Can't sit still.",                 slot: 'innate', category: 'passive', tags: ['expeditions', 'care'], icon: 'Wind' },
    { id: 'trt_lucky',    name: 'Lucky',    description: 'Things just work out.',            slot: 'innate', category: 'passive', tags: ['loot', 'shop'],        icon: 'Clover' },
    { id: 'trt_hardy',    name: 'Hardy',    description: 'Weathers anything.',               slot: 'innate', category: 'passive', tags: ['care', 'arena'],       icon: 'Shield' },
    { id: 'trt_dreamer',  name: 'Dreamer',  description: 'Eyes always on the horizon.',      slot: 'innate', category: 'passive', tags: ['sanctum', 'lore'],     icon: 'Moon' },

    // ============ Learned (10) ============
    { id: 'trt_quick_learner',     name: 'Quick Learner',     description: 'Trains faster than most.',      slot: 'learned', category: 'active', tags: ['care:train', 'xp'],          icon: 'Zap' },
    { id: 'trt_diligent_forager',  name: 'Diligent Forager',  description: 'Knows where the food is.',      slot: 'learned', category: 'active', tags: ['care:feed'],                  icon: 'Wheat' },
    { id: 'trt_skilled_fighter',   name: 'Skilled Fighter',   description: 'Mastered the basics of combat.', slot: 'learned', category: 'active', tags: ['challenges:strength', 'arena'], icon: 'Swords' },
    { id: 'trt_nimble',            name: 'Nimble',            description: 'Hard to catch off guard.',       slot: 'learned', category: 'active', tags: ['challenges:agility', 'arena'],  icon: 'Feather' },
    { id: 'trt_studious',          name: 'Studious',          description: 'Reads the old runes.',           slot: 'learned', category: 'active', tags: ['challenges:wisdom', 'sanctum'], icon: 'BookOpen' },
    { id: 'trt_pathfinder',        name: 'Pathfinder',        description: 'Knows the shortcuts.',           slot: 'learned', category: 'active', tags: ['expeditions', 'timer'],         icon: 'Map' },
    { id: 'trt_treasure_seeker',   name: 'Treasure Seeker',   description: 'Has a nose for shiny things.',   slot: 'learned', category: 'active', tags: ['expeditions', 'runes'],         icon: 'Gem' },
    { id: 'trt_merchant_eye',      name: "Merchant's Eye",    description: 'Knows what things are worth.',   slot: 'learned', category: 'active', tags: ['shop', 'marketplace'],          icon: 'Coins' },
    { id: 'trt_thrifty',           name: 'Thrifty',           description: 'Makes resources last.',          slot: 'learned', category: 'active', tags: ['care', 'economy'],              icon: 'PiggyBank' },
    { id: 'trt_persistent',        name: 'Persistent',        description: 'Tries one more time.',           slot: 'learned', category: 'active', tags: ['challenges', 'daily_quests'],   icon: 'RotateCw' },

    // ============ Awakened (8) ============
    { id: 'trt_mentor',         name: 'Mentor',         description: 'Teaches others by example.',          slot: 'awakened', category: 'passive', tags: ['global', 'xp_aura'],           icon: 'GraduationCap' },
    { id: 'trt_sage',           name: 'Sage',           description: 'The forest whispers to it.',          slot: 'awakened', category: 'passive', tags: ['sanctum', 'mission'],          icon: 'Sparkle' },
    { id: 'trt_warden',         name: 'Warden',         description: 'Stands watch over the realm.',        slot: 'awakened', category: 'passive', tags: ['arena', 'defense'],            icon: 'ShieldCheck' },
    { id: 'trt_emissary',       name: 'Emissary',       description: 'Speaks for the spirits.',             slot: 'awakened', category: 'passive', tags: ['sanctum', 'diplomacy'],        icon: 'MessageCircle' },
    { id: 'trt_kindred_soul',   name: 'Kindred Soul',   description: 'Heart links to others of its kind.',  slot: 'awakened', category: 'passive', tags: ['social', 'same_species'],      icon: 'HeartHandshake' },
    { id: 'trt_relic_bearer',   name: 'Relic Bearer',   description: 'Touched by ancient things.',          slot: 'awakened', category: 'passive', tags: ['loot', 'runes'],               icon: 'Crown' },
    { id: 'trt_wanderer_lord',  name: 'Wanderer Lord',  description: 'Calls the long roads home.',          slot: 'awakened', category: 'passive', tags: ['expeditions', '24h_tier'],     icon: 'Mountain' },
    { id: 'trt_ascendant',      name: 'Ascendant',      description: 'Light follows where it walks.',       slot: 'awakened', category: 'passive', tags: ['global', 'prestige'],          icon: 'Sun' },
];

export const TRAIT_BY_ID: Record<string, TraitDefinition> = Object.fromEntries(
    TRAITS.map((t) => [t.id, t])
);

export const INNATE_POOL: string[]   = TRAITS.filter((t) => t.slot === 'innate').map((t) => t.id);
export const LEARNED_POOL: string[]  = TRAITS.filter((t) => t.slot === 'learned').map((t) => t.id);
export const AWAKENED_POOL: string[] = TRAITS.filter((t) => t.slot === 'awakened').map((t) => t.id);

/** Stage at which the Learned slot unlocks (Adult). */
export const LEARNED_STAGE_GATE = 2;
/** Stage at which the Awakened slot unlocks (Ascended). */
export const AWAKENED_STAGE_GATE = 4;

export function getTraitById(traitId: string | null | undefined): TraitDefinition | null {
    if (!traitId) return null;
    return TRAIT_BY_ID[traitId] || null;
}

export function getTraitsBySlot(slot: TraitSlot): TraitDefinition[] {
    return TRAITS.filter((t) => t.slot === slot);
}

export function getPoolForSlot(slot: TraitSlot): string[] {
    if (slot === 'innate') return INNATE_POOL;
    if (slot === 'learned') return LEARNED_POOL;
    return AWAKENED_POOL;
}

/** True when this totem has an unlocked-but-unchosen trait slot the player can fill. */
export function hasUnspentTraitChoice(stage: number, traits: TotemTraits | null | undefined): TraitSlot | null {
    if (!traits) return null;
    if (stage >= LEARNED_STAGE_GATE && !traits.learned) return 'learned';
    if (stage >= AWAKENED_STAGE_GATE && !traits.awakened) return 'awakened';
    return null;
}

/** Returns the list of trait IDs currently filled on a totem (1-3 items). */
export function getFilledTraits(traits: TotemTraits | null | undefined): string[] {
    if (!traits) return [];
    return [traits.innate, traits.learned, traits.awakened].filter((t): t is string => !!t);
}
