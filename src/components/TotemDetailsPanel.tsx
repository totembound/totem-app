import React from 'react';
import { Cloud, Mountain, Waves, Dumbbell, Brain, Wind, Lock, Unlock, MapPin } from 'lucide-react';
import { Species, Color, Rarity } from '../types/types';
import { AVAILABLE_SPECIES } from '../config/constants';
import { formatTimeRemaining } from '../utils/formats';

interface TotemDetailsPanelProps {
    stage: number;
    species: Species;
    rarity: Rarity;
    color: Color;
    affinity: string;
    domain: string;
    isStaked: boolean;
    isOnExpedition?: boolean;
    expeditionEndTime?: number;
}

const TotemDetailsPanel: React.FC<TotemDetailsPanelProps> = ({
    stage,
    species,
    rarity,
    color,
    affinity,
    domain,
    isStaked,
    isOnExpedition = false,
    expeditionEndTime = 0
}) => {
    // Get icons based on affinity and domain
    const getAffinityIcon = () => {
        switch (affinity) {
            case 'Strength': return <Dumbbell size={16} className="text-yellow-600 dark:text-yellow-400" />;
            case 'Agility': return <Wind size={16} className="text-yellow-600 dark:text-yellow-400" />;
            case 'Wisdom': return <Brain size={16} className="text-yellow-600 dark:text-yellow-400" />;
            default: return <Dumbbell size={16} className="text-yellow-600 dark:text-yellow-400" />;
        }
    };
    
    const getDomainIcon = () => {
        switch (domain) {
            case 'Air': return <Cloud size={16} className="text-cyan-600 dark:text-cyan-400" />;
            case 'Earth': return <Mountain size={16} className="text-cyan-600 dark:text-cyan-400" />;
            case 'Water': return <Waves size={16} className="text-cyan-600 dark:text-cyan-400" />;
            default: return <Cloud size={16} className="text-cyan-600 dark:text-cyan-400" />;
        }
    };

    const getSpeciesDescription = (species: Species): string => {
        return AVAILABLE_SPECIES.find(s => s.species === species)?.desc || '';
    };

    return (
        <div className="space-y-6">
            {/* Totem Description */}
            <div>
                <h3 className="text-md font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {getSpeciesDescription(species)}
                </p>
            </div>
            
            {/* Properties List */}
            <div>
                <h3 className="text-md font-semibold mb-3">Properties</h3>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Stage</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {stage+1}/5
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Species</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {Species[species]}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Rarity</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {Rarity[rarity]}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Color</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {Color[color].replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Affinity</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                                {getAffinityIcon()}
                            </div>
                            {affinity}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Domain</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-cyan-50 dark:bg-cyan-900/20">
                                {getDomainIcon()}
                            </div>
                            {domain}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            {isStaked ? (
                                <>
                                    <Lock size={14} className="text-blue-500" />
                                    <span className="text-blue-600 dark:text-blue-400">Staked</span>
                                </>
                            ) : (
                                <>
                                    <Unlock size={14} className="text-gray-500" />
                                    <span>Unstaked</span>
                                </>
                            )}
                        </span>
                    </div>

                    {/* Expedition Status Row */}
                    {isOnExpedition && (
                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Expedition</span>
                            <span className="text-sm font-medium flex items-center gap-1.5">
                                <MapPin size={14} className="text-blue-500" />
                                <span className="text-blue-600 dark:text-blue-400">
                                    {formatTimeRemaining(expeditionEndTime)}
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TotemDetailsPanel;