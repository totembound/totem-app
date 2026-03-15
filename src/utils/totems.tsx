import { AVAILABLE_SPECIES, LOCATIONS } from '../config/constants';
import { getSpeciesById } from './species';
import { Affinity, Domain, TotemData, Rarity, Species } from '../types/types';
import { 
    Dumbbell, // Strength
    Brain, // Wisdom
    Wind, // Agility
    Cloud, // Air
    Mountain, // Earth
    Waves, // Water
    Flame, // Fire
    Sparkles, // Spirit
    Moon // Shadow
} from 'lucide-react';

interface TotemStats {
    strength: number;
    agility: number;
    wisdom: number;
    primaryStat: 'strength' | 'agility' | 'wisdom';
}

export const AFFINITY_ICONS = {
    'Strength': Dumbbell,
    'Wisdom': Brain,
    'Agility': Wind
} as const;
 
export const DOMAIN_ICONS = {
    'Air': Cloud,
    'Earth': Mountain,
    'Water': Waves,
    'Fire': Flame,
    'Spirit': Sparkles,
    'Shadow': Moon
} as const;

export const getTotemAffinityIcon = (affinity: string) => {
    switch (affinity) {
        case 'Strength': return <Dumbbell size={16} className="text-red-600 dark:text-red-400" />;
        case 'Agility': return <Wind size={16} className="text-blue-600 dark:text-blue-400" />;
        case 'Wisdom': return <Brain size={16} className="text-purple-600 dark:text-purple-400" />;
        default: return <Dumbbell size={16} className="text-cyan-600 dark:text-cyan-400" />;
    }
};

export const getTotemDomainIcon = (domain: string) => {
    switch (domain) {
        case 'Air': return <Cloud size={16} className="text-sky-100 text-white border-sky-500" />;
        case 'Earth': return <Mountain size={16} className="text-emerald-100 border-emerald-500" />;
        case 'Water': return <Waves size={16} className="text-cyan-100 border-cyan-500" />;
        case 'Fire': return <Flame size={16} className="text-red-100 border-red-500" />;
        case 'Spirit': return <Sparkles size={16} className="text-amber-100 border-amber-500" />;
        case 'Shadow': return <Moon size={16} className="text-purple-100 border-purple-500" />;
        default: return <Cloud size={16} className="text-cyan-100 dark:text-cyan-500" />;
    }
};

export const getDomainColor = (domain: Domain) => {
    switch (domain) {
        case Domain.Air:
            return "bg-sky-500/70 text-sky-100 border-sky-600";
        case Domain.Earth:
            return "bg-emerald-600/70 text-emerald-100 border-emerald-500";
        case Domain.Water:
            return "bg-cyan-500/70 text-cyan-200 border-cyan-500";
        case Domain.Fire: 
            return "bg-red-500/70 text-red-200 border-red-500";
        case Domain.Spirit:
            return "bg-amber-400/70 text-amber-100 border-amber-500";
        case Domain.Shadow:
            return "bg-purple-800/70 text-purple-200 border-purple-500";
        default:
            return "bg-gray-500/70 text-gray-200 border-gray-500";
    }
};

export const getAffinityColor = (affinity: Affinity) => {
    switch (affinity) {
        case Affinity.Strength:
            return "bg-red-100 dark:bg-red-900/30";
        case Affinity.Agility:
            return "bg-blue-100 dark:bg-blue-900/30";
        case Affinity.Wisdom:
            return "bg-purple-100 dark:bg-purple-900/30";
        default:
            return "bg-gray-100 dark:bg-gray-900/30";
    }
};

export const getRarityFontColor = (rarity: Rarity) => {
    switch(rarity) {
        case Rarity.Common: return 'text-gray-600 dark:text-gray-300';
        case Rarity.Uncommon: return 'text-green-600 dark:text-green-400';
        case Rarity.Rare: return 'text-blue-600 dark:text-blue-400';
        case Rarity.Epic: return 'text-purple-600 dark:text-purple-400';
        case Rarity.Legendary: return 'text-orange-600 dark:text-orange-400';
        case Rarity.Limited: return 'text-yellow-600 dark:text-yellow-400';
        default: return 'text-gray-600 dark:text-gray-300';
    }
};

export const getRarityBadgeColor = (rarity: Rarity) => {
    switch(rarity) {
        case Rarity.Common: return 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800';
        case Rarity.Uncommon: return 'text-green-600 dark:text-green-400 border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30';
        case Rarity.Rare: return 'text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30';
        case Rarity.Epic: return 'text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30';
        case Rarity.Legendary: return 'text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/30';
        case Rarity.Limited: return 'text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30';
        default: return 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800';
    }
};

export const getRarityBorderColor = (rarity: Rarity) => {
    const colors = {
        [Rarity.Common]: {
            border: 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
            ring: 'ring-gray-300 dark:ring-gray-600 hover:ring-gray-400 dark:hover:ring-gray-500',
        },
        [Rarity.Uncommon]: {
            border: 'border-green-300 dark:border-green-600 hover:border-green-400 dark:hover:border-green-500',
            ring: 'ring-green-300 dark:ring-green-600 hover:ring-green-400 dark:hover:ring-green-500',
        },
        [Rarity.Rare]: {
            border: 'border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500',
            ring: 'ring-blue-300 dark:ring-blue-600 hover:ring-blue-400 dark:hover:ring-blue-500',
        },
        [Rarity.Epic]: {
            border: 'border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500',
            ring: 'ring-purple-300 dark:ring-purple-600 hover:ring-purple-400 dark:hover:ring-purple-500',
        },
        [Rarity.Legendary]: {
            border: 'border-orange-300 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500',
            ring: 'ring-orange-300 dark:ring-orange-600 hover:ring-orange-400 dark:hover:ring-orange-500',
        },
        [Rarity.Limited]: {
            border: 'border-yellow-300 dark:border-yellow-600 hover:border-yellow-400 dark:hover:border-yellow-500',
            ring: 'ring-yellow-300 dark:ring-yellow-600 hover:ring-yellow-400 dark:hover:ring-yellow-500',
        }
    };
    return colors[rarity] || colors[Rarity.Common];
};

export const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
        case Rarity.Common:
            return 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300';
        case Rarity.Uncommon:
            return 'from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-900/50 border-green-300';
        case Rarity.Rare:
            return 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-900/50 border-blue-300';
        case Rarity.Epic:
            return 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-900/50 border-purple-300';
        case Rarity.Legendary:
            return 'from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-900/50 border-yellow-300';
        case Rarity.Limited:
            return 'from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-900/50 border-yellow-300';
        default:
            return 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300';
    }
};

export function getRarityBonusStat(rarity: Rarity): number {
    if (rarity === Rarity.Common || rarity === Rarity.Uncommon) {
        return 0;
    }
    if (rarity === Rarity.Rare) {
        return 1;
    }
    if (rarity === Rarity.Epic || rarity === Rarity.Limited) {
        return 2;
    }
    if (rarity === Rarity.Legendary) {
        return 4;
    }
    return 0;
}

export function getSpeciesBaseStats(species: Species, rarity: Rarity): TotemStats {
    const bonus = getRarityBonusStat(rarity);
    const speciesData = getSpeciesById(species);

    if (!speciesData) {
        return { strength: 0, agility: 0, wisdom: 0, primaryStat: 'strength' };
    }

    return {
        strength: speciesData.baseStats.strength + bonus,
        agility: speciesData.baseStats.agility + bonus,
        wisdom: speciesData.baseStats.wisdom + bonus,
        primaryStat: speciesData.affinity.toLowerCase() as 'strength' | 'agility' | 'wisdom',
    };
}

// Helper to get emoji for species
export function getSpeciesEmoji(species: Species): string {
    const emojiMap: Record<Species, string> = {
        [Species.Bear]: '🐻',
        [Species.Wolf]: '🐺',
        [Species.Beaver]: '🦫',
        [Species.Turtle]: '🐢',
        [Species.Owl]: '🦉',
        [Species.Raven]: '🦅',
        [Species.Goose]: '🦢',
        [Species.Snake]: '🐍',
        [Species.Falcon]: '🦅',
        [Species.Deer]: '🦌',
        [Species.Otter]: '🦦',
        [Species.Woodpecker]: '🐦',
        [Species.None]: '❓'

    };

    return emojiMap[species] || emojiMap[Species.None];
}

export const getTotemStage = (totem: TotemData) => {
    if (!totem) return 0;
    return totem.attributes.stage+1;
}

export function getCurrentMonth() {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentDate = new Date();
    const monthIndex = currentDate.getUTCMonth();

    return months[monthIndex];
}

export const getGameDifficulty = (totem: TotemData, reqStage: number) => {
    if (!totem) return 0;
    const totemStage = totem.attributes.stage + 1;
    const prestigeLevel = Number(totem.attributes.prestigeLevel);

    if (reqStage === 2) {
        if (totemStage <= 2) {
            return 1;
        }
        else if (totemStage <= 3) {
            return 2;
        }
        else {
            return 3;
        }        
    }
    if (reqStage === 3) {
        if (totemStage <= 3) {
            return 1;
        }
        else if (totemStage <= 4) {
            return 2;
        }
        else {
            return 3;
        }
    }
    if (reqStage === 4) {
        if (totemStage <= 4) {
            return 1;
        }
        else if (totemStage <= 5 &&  prestigeLevel === 0) {
            return 2;
        }
        else {
            return 3;
        }
    }
    return 1;
}

// Helper to get display info
export function getSpeciesInfo(species: Species, rarity: Rarity) {
    const stats = getSpeciesBaseStats(species, rarity);
    const emoji = getSpeciesEmoji(species);

    return {
        ...stats,
        emoji,
        displayName: Species[species],
        statDescription: `Primary: ${stats.primaryStat.charAt(0).toUpperCase() + stats.primaryStat.slice(1)} (${stats[stats.primaryStat]})`
    };
}

export const getSpeciesMetadata = (species: Species): any => {
    return AVAILABLE_SPECIES.find(s => s.species === species);
};

export const getSpeciesHabitat = (species: Species): any => {
    const metadata = getSpeciesMetadata(species);
    return LOCATIONS.find(l => l.id === metadata.locationId);
}