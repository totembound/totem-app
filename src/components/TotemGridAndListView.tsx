import React from 'react';
import { NFTMetadata, Rarity, Species } from '../types/types';
import { Heart, Star, Sparkles, ScrollText, Circle } from 'lucide-react';
import { 
    Dumbbell, // Strength
    Brain, // Wisdom
    Wind, // Agility
    Cloud, // Air
    Mountain, // Land
    Waves // Water
} from 'lucide-react';
import { getRarityBadgeColor, getRarityBorderColor } from '../utils/totems';

interface TotemViewProps {
    nft: NFTMetadata;
    onClick: () => void;
    isSelected: boolean;
    isLoading?: boolean;
}

const getRarityBadge = (rarity: Rarity) => {
    return (
        <span className={`px-2 py-0.5 text-xs rounded-full border ${getRarityBadgeColor(rarity)}`}>
            {Rarity[rarity]}
        </span>
    );
};

const STAGE_THRESHOLDS = [0, 500, 1500, 3500, 7500];

// Add these mappings at component level
const AFFINITY_ICONS = {
    'Strength': Dumbbell,
    'Wisdom': Brain,
    'Agility': Wind
} as const;

const DOMAIN_ICONS = {
    'Air': Cloud,
    'Land': Mountain,
    'Water': Waves
} as const;

export const TotemGridCard: React.FC<TotemViewProps> = ({ nft, onClick, isSelected, isLoading }) => {
    const nextThreshold = STAGE_THRESHOLDS[nft.attributes.stage + 1] || STAGE_THRESHOLDS[nft.attributes.stage];
    const currentStageThreshold = STAGE_THRESHOLDS[nft.attributes.stage];
    const progressToNext = Math.min(100, 
        ((nft.attributes.experience - currentStageThreshold) / 
        (nextThreshold - currentStageThreshold)) * 100);

    const rarityBorderColors = getRarityBorderColor(nft.attributes.rarity);

    return (
        <div 
            onClick={onClick}
            className={`
                bg-white dark:bg-gray-900 rounded-lg border 
                ${rarityBorderColors.border}
                transition-all duration-200 cursor-pointer 
                hover:shadow-lg dark:hover:shadow-xl
                ${isSelected 
                    ? `ring-2 ${rarityBorderColors.ring}` 
                    : ''
                }
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                transform hover:scale-105 active:scale-100
                relative z-0 hover:z-10
            `}
        >
            {/* Top Content Section */}
            <div className="flex items-start justify-between gap-3 p-4">
                {/* Name Section */}
                <div className="group">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {nft.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {nft.attributes.displayName.length > 0
                            ? `"${nft.attributes.displayName}"` 
                            : Species[nft.attributes.species]}
                    </p>
                </div>

                {/* Rarity Badge */}
                <div className="group">
                    <div className={`
                        px-2 py-1 mt-1 text-xs font-medium rounded-full border
                        ${getRarityBadgeColor(nft.attributes.rarity)}
                        transition-all duration-200
                        group-hover:scale-110
                    `}>
                        {Rarity[nft.attributes.rarity]}
                    </div>
                </div>
            </div>
            {/* Image Section */}
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
                <img 
                    src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
            
            {/* Content Section */}
            <div className="p-4">
                {/* Affinity & Domain */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5">
                        {/* Affinity */}
                        <div className="p-1 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                            {React.createElement(AFFINITY_ICONS[nft.affinity as keyof typeof AFFINITY_ICONS], {
                                size: 14,
                                className: "text-yellow-600 dark:text-yellow-400"
                            })}
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {nft.affinity}
                        </span>
                    </div>
                    
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    
                    {/* Domain */}
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-cyan-50 dark:bg-cyan-900/20">
                            {React.createElement(DOMAIN_ICONS[nft.domain as keyof typeof DOMAIN_ICONS], {
                                size: 14,
                                className: "text-cyan-600 dark:text-cyan-400"
                            })}
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {nft.domain}
                        </span>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-3 gap-2 mr-6">
                    <div className="flex items-center gap-1">
                        <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/20">
                            <Sparkles size={14} className="text-blue-500 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-none">Stage</div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{nft.attributes.stage + 1}/5</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <div className="relative p-1">
                            <Circle size={16} className="text-gray-200 dark:text-gray-700" />
                            <div 
                                className="absolute inset-0 flex items-center justify-center"
                                style={{
                                    background: `conic-gradient(#6366f1 ${progressToNext}%, transparent ${progressToNext}%)`,
                                    borderRadius: '50%',
                                    width: '14px',
                                    height: '14px',
                                    margin: '4px'
                                }}
                            />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-none">EXP</div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{Math.round(progressToNext)}%</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <div className="p-1 rounded-md bg-pink-50 dark:bg-pink-900/20">
                            <Heart size={14} className="text-pink-500 dark:text-pink-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-none">Happiness</div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{nft.attributes.happiness}/100</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TotemListRow: React.FC<TotemViewProps> = ({ nft, onClick, isSelected, isLoading }) => {
    const rarityBorderColors = getRarityBorderColor(nft.attributes.rarity);

    return (
        <div 
            onClick={onClick}
            className={`
                bg-white dark:bg-gray-900 rounded-lg border 
                ${rarityBorderColors.border}
                shadow-sm hover:shadow-md 
                transition-all duration-200 cursor-pointer p-4
                ${isSelected 
                    ? `ring-2 ${rarityBorderColors.ring}` 
                    : ''
                }
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                transform hover:scale-[1.02] active:scale-100
                relative z-0 hover:z-10
            `}
        >
            <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                        src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Main Info */}
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {nft.attributes.displayName.length > 0
                                ? `${nft.attributes.displayName} the ${Species[nft.attributes.species]}` 
                                : nft.name || Species[nft.attributes.species]}
                        </h3>
                        {getRarityBadge(nft.attributes.rarity)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {nft.affinity} • {nft.domain}
                    </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex gap-4 lg:gap-6 ml-4">
                    <div className="flex flex-col items-center">
                        <div className="text-gray-500 dark:text-gray-400 text-xs">Stage</div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{nft.attributes.stage + 1}/5</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-gray-500 dark:text-gray-400 text-xs">Experience</div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{nft.attributes.experience}</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-gray-500 dark:text-gray-400 text-xs">Happiness</div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{nft.attributes.happiness}/100</div>
                    </div>
                </div>
            </div>
        </div>
    );
};