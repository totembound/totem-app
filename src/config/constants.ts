import { Species } from "../types/types";

// Constants for progression calculations
export const PRESTIGE_XP_REQUIREMENT = 2500;
export const BASE_ELDER_XP = 7500;
export const STAGE_THRESHOLDS = [0, 500, 1500, 3500, 7500];

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
    accountType: 'totem-account-type'
};

export const AVAILABLE_SPECIES = [
  {
    id: 0, name: 'Goose', species: Species.Goose, 
    title: 'The Watchful Guardian',
    desc: 'The Goose represents protection, vigilance, and leadership. Known for its strong instincts and devotion to its flock, it ensures the safety of all who travel under its watchful eye.',
    affinity: 'Wisdom',
    domain: 'Air',
    available: false,
    image: '/totems/gooseplacecard.png'
  }, {
    id: 1, name: 'Otter', species: Species.Otter, 
    title: 'The Joyful Trickster',
    desc: 'The Otter represents adaptability, curiosity, and playfulness. It approaches challenges with an open mind, embracing creativity and joy even in difficult situations.',
    affinity: 'Agility',
    domain: 'Water',
    available: true,
    image: '/totems/otterplacecard.png'
  }, {
    id: 2, name: 'Wolf', species: Species.Wolf, 
    title: 'The Pack Leader',
    desc: 'The Wolf represents strategy, loyalty, and teamwork. As a natural pack hunter, it excels in coordination and thrives when working together with others.',
    affinity: 'Strength',
    domain: 'Land',
    available: true,
    image: '/totems/wolfplacecard.png'
  }, {
    id: 3, name: 'Falcon', species: Species.Falcon, 
    title: 'The Swift Hunter',
    desc: 'The Falcon represents precision, agility, and speed. With unmatched vision and lightning-fast reflexes, it never loses sight of its target.',
    affinity: 'Agility',
    domain: 'Air',
    available: true,
    image: '/totems/falconplacecard.png'
  }, {
    id: 4, name: 'Beaver', species: Species.Beaver, 
    title: 'The Tireless Builder',
    desc: 'The Beaver represents ingenuity, determination, and resourcefulness. It constructs solutions to any problem, always working toward long-term success.',
    affinity: 'Strength',
    domain: 'Water',
    available: false,
    image: '/totems/beaverplacecard.png'
  }, {
    id: 5, name: 'Deer', species: Species.Deer, 
    title: 'The Gentle Pathfinder',
    desc: 'The Deer represents grace, awareness, and intuition. It moves with ease through difficult terrain, staying alert to potential dangers.',
    affinity: 'Agility',
    domain: 'Land',
    available: false,
    image: '/totems/deerplacecard.png'
  }, {
    id: 6, name: 'Woodpecker', species: Species.Woodpecker, 
    title: 'The Relentless Worker',
    desc: 'The Woodpecker represents persistence, rhythm, and focus. It never tires in its pursuit, chiseling away at obstacles until success is achieved.',
    affinity: 'Agility',
    domain: 'Air',
    available: false,
    image: '/totems/woodpeckerplacecard.png'
  }, {
    id: 7, name: 'Turtle', species: Species.Turtle, 
    title: 'The Unyielding Navigator',
    desc: 'The Turtle symbolizes resilience, grounded strength, and patient resolve. It carries its world while navigating waters with quiet, ancient wisdom.',
    affinity: 'Strength',
    domain: 'Water',
    available: false,
    image: '/totems/turtleplacecard.png'
  }, {
    id: 8, name: 'Bear', species: Species.Bear, 
    title: 'The Unstoppable Force',
    desc: 'The Bear represents strength, resilience, and dominance. It relies on brute force to overcome adversity, clearing obstacles through sheer power.',
    affinity: 'Strength',
    domain: 'Land',
    available: false,
    image: '/totems/bearplacecard.png'
  }, {
    id: 9, name: 'Raven', species: Species.Raven, 
    title: 'The Shadowed Trickster',
    desc: 'The Raven represents intelligence, cunning, and mystery. A master of deception, it sees paths unseen by others.',
    affinity: 'Wisdom',
    domain: 'Air',
    available: false,
    image: '/totems/ravenplacecard.png'
  }, {
    id: 10, name: 'Snake', species: Species.Snake, 
    title: 'The Silent Observer',
    desc: 'The Snake represents stealth, transformation, and wisdom. It moves unnoticed, striking only when the time is right.',
    affinity: 'Wisdom',
    domain: 'Land',
    available: false,
    image: '/totems/snakeplacecard.png'
  }, {
    id: 11, name: 'Owl', species: Species.Owl, 
    title: 'The Eternal Watcher', 
    desc: 'The Owl represents knowledge, insight, and patience. It sees beyond the present, guiding those who seek the truth.',
    affinity: 'Wisdom',
    domain: 'Air',
    available: true,
    image: '/totems/owlplacecard.png'
  }
];