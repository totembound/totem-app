import React from 'react';
import { NFTMetadata, Rarity } from '../types/types';
import { Heart, Sparkles } from 'lucide-react';
import { AFFINITY_ICONS, DOMAIN_ICONS, getRarityBadgeColor, getRarityBorderColor } from '../utils/totems';
import { STAGE_THRESHOLDS } from '../config/constants';

interface TotemViewProps {
    nft: NFTMetadata;
    onClick: () => void;
    isSelected: boolean;
    isLoading?: boolean;
}

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
                hover:shadow-md shadow-sm
                ${isSelected 
                    ? `ring-2 ${rarityBorderColors.ring}` 
                    : ''
                }
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                relative z-0 hover:z-10 h-full flex flex-col
            `}
        >
            {/* Rarity Badge - Absolute positioned over image */}
            <div className="absolute top-2 right-2 z-10 hidden sm:block">
                <span className={`
                    px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full border
                    shadow-sm backdrop-blur-sm bg-opacity-90 bg-white dark:bg-opacity-80 dark:bg-gray-900
                    ${getRarityBadgeColor(nft.attributes.rarity)}
                `}>
                    {Rarity[nft.attributes.rarity]}
                </span>
            </div>
            
            {/* Image Section */}
            <div className="aspect-square relative overflow-hidden rounded-t-lg flex-shrink-0 mt-2">
                <img 
                    src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
            
            {/* Content Section */}
            <div className="p-1 sm:p-2 flex-grow flex flex-col">
                {/* Name Section */}
                <div className="mb-2">
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-100 truncate">
                        {nft.name} {nft.attributes.displayName && (<span className="font-italic font-normal">"{nft.attributes.displayName}"</span>)}
                    </h3>
                </div>

                {/* Stats Section - Mobile Column Layout / Desktop 2-column grid */}
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                    
                    {/* Stage */}
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/20">
                            <Sparkles size={12} className="text-blue-500 dark:text-blue-400" />
                        </div>
                        <div className="flex items-center">
                            <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">
                                {nft.attributes.stage + 1}/5
                            </span>
                        </div>
                    </div>
                    
                    {/* Happiness */}
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-pink-50 dark:bg-pink-900/20">
                            <Heart size={12} className="text-pink-500 dark:text-pink-400" />
                        </div>
                        <div className="flex items-center">
                            <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">
                                {nft.attributes.happiness}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex sm:flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2 mt-1 sm:mt-2">
                    {/* Affinity */}
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                            {React.createElement(AFFINITY_ICONS[nft.affinity as keyof typeof AFFINITY_ICONS], {
                                size: 12,
                                className: "text-yellow-600 dark:text-yellow-400"
                            })}
                        </div>
                        <span className="sm:inline hidden text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {nft.affinity}
                        </span>
                    </div>
                    
                    {/* Domain */}
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-cyan-50 dark:bg-cyan-900/20">
                            {React.createElement(DOMAIN_ICONS[nft.domain as keyof typeof DOMAIN_ICONS], {
                                size: 12,
                                className: "text-cyan-600 dark:text-cyan-400"
                            })}
                        </div>
                        <span className="sm:inline hidden text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {nft.domain}
                        </span>
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
                transition-all duration-200 cursor-pointer p-1.5 sm:p-2 md:p-4
                ${isSelected 
                    ? `ring-2 ${rarityBorderColors.ring}` 
                    : ''
                }
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                relative z-0 hover:z-10
            `}
        >
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
                {/* Thumbnail */}
                <div className="w-10 h-10 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 mr-2">
                    <img 
                        src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Main Info */}
                <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm sm:text-lg text-gray-900 dark:text-gray-100 truncate">
                            {nft.name} {nft.attributes.displayName && (<span className="font-italic font-normal">"{nft.attributes.displayName}"</span>)}
                        </h3>
                        <span className={`
                            text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full border w-fit mr-auto ml-2
                            ${getRarityBadgeColor(nft.attributes.rarity)}
                        `}>
                            {Rarity[nft.attributes.rarity]}
                        </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                        {React.createElement(AFFINITY_ICONS[nft.affinity as keyof typeof AFFINITY_ICONS], {
                            size: 12,
                            className: "text-yellow-600 dark:text-yellow-400"
                        })}
                        <span className="truncate">{nft.affinity}</span>
                        <span className="mx-1">•</span>
                        {React.createElement(DOMAIN_ICONS[nft.domain as keyof typeof DOMAIN_ICONS], {
                            size: 12,
                            className: "text-cyan-600 dark:text-cyan-400"
                        })}
                        <span className="truncate">{nft.domain}</span>
                    </div>
                </div>

                {/* Stats - Simplified for mobile */}
                <div className="flex gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            <Sparkles size={12} className="text-blue-500" />
                            <span className="font-semibold text-xs sm:text-lg text-gray-700 dark:text-gray-300">{nft.attributes.stage + 1}/5</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            <Heart size={12} className="text-pink-500" />
                            <span className="font-semibold text-xs sm:text-lg text-gray-700 dark:text-gray-300">{nft.attributes.happiness}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};