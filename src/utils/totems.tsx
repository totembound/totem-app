import { NFTMetadata, Rarity, Species } from '../types/types';

interface TotemStats {
    strength: number;
    agility: number;
    wisdom: number;
    primaryStat: 'strength' | 'agility' | 'wisdom';
}

export const getRarityStyle = (rarity: number) => {
    switch (rarity) {
        case 0: // Common
            return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
        case 1: // Uncommon
            return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50';
        case 2: // Rare
            return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
        case 3: // Epic
            return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
        case 4: // Legendary
            return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
};

export function getRarityBonusStat(rarity: Rarity): number {
    if (rarity === Rarity.Common || rarity === Rarity.Uncommon || rarity === Rarity.Rare) {
        return 0;
    }
    if (rarity === Rarity.Epic) {
        return 1;
    }
    if (rarity === Rarity.Legendary) {
        return 2;
    }
    return 0;
}

export function getSpeciesBaseStats(species: Species, rarity: Rarity): TotemStats {
    const bonus = getRarityBonusStat(rarity);

    const statsMap: Record<Species, TotemStats> = {
        [Species.Bear]: {
            strength: 12 + bonus,
            wisdom: 7 + bonus,
            agility: 5 + bonus,
            primaryStat: 'strength'
        },
        [Species.Wolf]: {
            strength: 11 + bonus,
            agility: 8 + bonus,
            wisdom: 5 + bonus,
            primaryStat: 'strength'
        },
        [Species.Beaver]: {
            strength: 10 + bonus,
            wisdom: 9 + bonus,
            agility: 5 + bonus,
            primaryStat: 'strength'
        },
        [Species.Salmon]: {
            strength: 10 + bonus,
            agility: 8 + bonus,
            wisdom: 6 + bonus,
            primaryStat: 'strength'
        },
        [Species.Owl]: {
            wisdom: 12 + bonus,
            agility: 7 + bonus,
            strength: 5 + bonus,
            primaryStat: 'wisdom'
        },
        [Species.Raven]: {
            wisdom: 11 + bonus,
            agility: 8 + bonus,
            strength: 5 + bonus,
            primaryStat: 'wisdom'
        },
        [Species.Goose]: {
            wisdom: 10 + bonus,
            strength: 8 + bonus,
            agility: 6 + bonus,
            primaryStat: 'wisdom'
        },
        [Species.Snake]: {
            wisdom: 11 + bonus,
            strength: 7 + bonus,
            agility: 6 + bonus,
            primaryStat: 'wisdom'
        },
        [Species.Falcon]: {
            agility: 12 + bonus,
            wisdom: 7 + bonus,
            strength: 5 + bonus,
            primaryStat: 'agility'
        },
        [Species.Deer]: {
            agility: 11 + bonus,
            wisdom: 8 + bonus,
            strength: 5 + bonus,
            primaryStat: 'agility'
        },
        [Species.Otter]: {
            agility: 10 + bonus,
            strength: 9 + bonus,
            wisdom: 5 + bonus,
            primaryStat: 'agility'
        },
        [Species.Woodpecker]: {
            agility: 11 + bonus,
            strength: 7 + bonus,
            wisdom: 6 + bonus,
            primaryStat: 'agility'
        },
        [Species.None]: {
            strength: 0 + bonus,
            agility: 0 + bonus,
            wisdom: 0 + bonus,
            primaryStat: 'strength'
        }
    };

    return statsMap[species] || statsMap[Species.None];
}

// Helper to get emoji for species
export function getSpeciesEmoji(species: Species): string {
    const emojiMap: Record<Species, string> = {
        [Species.Bear]: '🐻',
        [Species.Wolf]: '🐺',
        [Species.Beaver]: '🦫',
        [Species.Salmon]: '🐟',
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

export const getTotemStage = (totem: NFTMetadata) => {
    if (!totem) return 0;
    return totem.attributes.stage+1;
}

export const getGameDifficulty = (totem: NFTMetadata, reqStage: number) => {
    if (!totem) return 0;
    const totemStage = totem.attributes.stage + 1;

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
        else if (totemStage <= 5 && totem.attributes.prestigeLevel === 0) {
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

