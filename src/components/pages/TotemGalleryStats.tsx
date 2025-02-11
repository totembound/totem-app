import React, { useMemo } from 'react';
import { 
    PawPrint,
    Star,
    Layers
} from 'lucide-react';
import { NFTMetadata, Rarity, Species, Color } from '../../types/types';
import _ from 'lodash';

const TotemGalleryStats: React.FC<{ nfts: NFTMetadata[] }> = ({ nfts }) => {
    // Species Distribution
    const speciesDistribution = useMemo(() => {
        const grouped = _.groupBy(nfts, nft => Species[nft.attributes.species]);
        return Object.entries(grouped).map(([species, group]) => ({
            name: species,
            count: group.length,
            percentage: Math.round((group.length / nfts.length) * 100)
        })).sort((a, b) => b.count - a.count);
    }, [nfts]);

    // Rarity Distribution
    const rarityDistribution = useMemo(() => {
        const grouped = _.groupBy(nfts, nft => Rarity[nft.attributes.rarity]);
        return Object.entries(grouped).map(([rarity, group]) => ({
            name: rarity,
            count: group.length,
            percentage: Math.round((group.length / nfts.length) * 100)
        })).sort((a, b) => b.count - a.count);
    }, [nfts]);

    // Stage Distribution
    const stageDistribution = useMemo(() => {
        const grouped = _.groupBy(nfts, nft => `Stage ${nft.attributes.stage + 1}`);
        return Object.entries(grouped).map(([stage, group]) => ({
            name: stage,
            count: group.length,
            percentage: Math.round((group.length / nfts.length) * 100)
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [nfts]);

    const RARITY_COLORS = {
        Common: 'text-gray-600 dark:text-gray-300 border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800',
        Uncommon: 'text-green-600 dark:text-green-400 border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/30',
        Rare: 'text-blue-600 dark:text-blue-400 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30',
        Epic: 'text-purple-600 dark:text-purple-400 border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30',
        Legendary: 'text-yellow-600 dark:text-yellow-400 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30'
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {/* Species Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PawPrint className="w-5 h-5 text-purple-500" />
                    Species Distribution
                </h3>
                <div className="space-y-2">
                    {speciesDistribution.map((species, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-purple-500 h-2 rounded-full" 
                                    style={{ width: `${species.percentage}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {species.name}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {species.count}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rarity Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Rarity Distribution
                </h3>
                <div className="space-y-2">
                    {rarityDistribution.map((rarity, index) => (
                        <div key={index} className="flex items-center gap-3">
                            {/* Rarity Badge */}
                            <div className="group w-32">
                                <div className={`
                                    px-2 py-1 mt-1 text-xs text-center font-medium rounded-full border
                                    ${RARITY_COLORS[rarity.name as keyof typeof RARITY_COLORS]}
                                    transition-all duration-200
                                    group-hover:scale-110
                                `}>
                                    {rarity.name}
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${rarity.percentage}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {rarity.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stage Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-green-500" />
                    Stage Distribution
                </h3>
                <div className="space-y-2">
                    {stageDistribution.map((stage, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${stage.percentage}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 text-nowrap">
                                    {stage.name}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {stage.count}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TotemGalleryStats;