import React from 'react';
import { Lock, Unlock, MapPin, Landmark } from 'lucide-react';
import { Species, Color, Rarity } from '../types/types';
import { AVAILABLE_SPECIES } from '../config/constants';
import { splitWords } from '../utils/formats';
import { getTotemAffinityIcon, getTotemDomainIcon } from '../utils/totems';

interface TotemDetailsPanelProps {
    stage: number;
    species: Species;
    rarity: Rarity;
    color: Color;
    affinity: string;
    domain: string;
    sanctum?: {
        seated: boolean;
        seatIndex: number;
        seatedAt: string;
        onMission: boolean;
    };
    isOnExpedition?: boolean;
    stageDescription?: string;
}

const TotemDetailsPanel: React.FC<TotemDetailsPanelProps> = ({
    stage,
    species,
    rarity,
    color,
    affinity,
    domain,
    sanctum,
    isOnExpedition = false,
    stageDescription
}) => {
    // Fallback to species-level description if stage description not available
    const getSpeciesDescription = (species: Species): string => {
        return AVAILABLE_SPECIES.find(s => s.species === species)?.desc || '';
    };

    const description = stageDescription || getSpeciesDescription(species);

    return (
        <div className="space-y-6">
            {/* Totem Description - Stage-specific */}
            <div>
                <h3 className="text-md font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {description}
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
                            {splitWords(Color[color])}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Affinity</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                                {getTotemAffinityIcon(affinity)}
                            </div>
                            {affinity}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Domain</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-cyan-50 dark:bg-cyan-900/20">
                                {getTotemDomainIcon(domain)}
                            </div>
                            {domain}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            {sanctum?.seated ? (
                                <>
                                    <Landmark size={14} className="text-amber-500" />
                                    <span className="text-amber-600 dark:text-amber-400">
                                        Council Seat {sanctum.seatIndex + 1}
                                        {sanctum.onMission && ' (On Mission)'}
                                    </span>
                                </>
                            ) : isOnExpedition ? (
                                <>
                                    <MapPin size={14} className="text-blue-500" />
                                    <span className="text-blue-600 dark:text-blue-400">
                                        On Expedition
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Unlock size={14} className="text-gray-500" />
                                    <span>Available</span>
                                </>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TotemDetailsPanel;