import React from 'react';
import { Clock, Droplets, Heart, ArrowRight, Coins, Sparkles } from 'lucide-react';
import { formatTokenAmount } from '../../utils/formats';

interface ExpeditionPanelProps {
    id: string;
    name: string;
    description: string;
    image: string;
    domain: number;
    domainName: string;
    duration: number;
    durationHours: number;
    totemCost: string;
    happinessCost: number;
    baseExperience: number;
    primaryAffinity: string;
    runeDropChances: [number, number, number];
    enabled: boolean;
    onStart: () => void;
    canStart: boolean;
}

const ExpeditionPanel: React.FC<ExpeditionPanelProps> = ({
    id,
    name,
    description,
    image,
    domain,
    domainName,
    duration,
    durationHours,
    totemCost,
    happinessCost,
    baseExperience,
    primaryAffinity,
    runeDropChances,
    enabled,
    onStart,
    canStart
}) => {

    const getDomainColor = () => {
        switch (domain) {
            case 0: // Land
                return "bg-stone-500/70 text-stone-200 border-stone-500";
            case 1: // Air
                return "bg-blue-500/70 text-blue-200 border-blue-500";
            case 2: // Water
                return "bg-cyan-500/70 text-cyan-200 border-cyan-500";
            default:
                return "bg-gray-500/70 text-gray-200 border-gray-500";
        }
    };

    const getAffinityColor = () => {
        switch (primaryAffinity) {
            case 'Strength':
                return "bg-red-500/80 text-red-200 border-red-500";
            case 'Agility':
                return "bg-emerald-500/80 text-emerald-200 border-emerald-500";
            case 'Wisdom':
                return "bg-indigo-500/80 text-indigo-200 border-indigo-500";
            default:
                return "bg-gray-500/80 text-gray-200 border-gray-500";
        }
    };

    return (
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full border border-gray-300 dark:border-gray-700">
            {/* Header with background image */}
            <div className="relative h-40">
                {image && (
                    <img 
                        src={image || '/expeditions/placeholder.png'}
                        alt={`${domainName} expedition background`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-200">{name}</h3>
                        <div className={`
                            px-2 py-1 rounded-lg text-sm font-semibold shadow-md
                            ${getDomainColor()}
                        `}>
                            {domainName}
                        </div>
                    </div>
                    {/* Description */}
                    <p className="font-medium text-sm text-gray-200">
                        {description}
                    </p>
                    <div className="flex items-center space-x-2">
                        <div className={`
                            flex items-center
                            px-2 py-1 rounded-md text-xs font-bold
                            bg-white/90 text-gray-800
                        `}>
                            <Clock className="inline w-3 h-3 mr-1" />
                            {durationHours} hours
                        </div>
                        <span className={`
                            px-2 py-1 rounded-md text-xs font-semibold
                            ${getAffinityColor()}
                        `}>
                            {primaryAffinity}
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-4 mt-4">
                {/* Rewards */}
                <div className="space-y-2 mb-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Rewards
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Sparkles className="w-5 h-5 text-emerald-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Experience:</span>
                        </div>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {baseExperience} XP
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Droplets className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Rune Chances:</span>
                        </div>
                        <div className="text-xs space-x-1">
                            {runeDropChances[0] > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                    L:{runeDropChances[0]}%{durationHours >= 24 ? " (×3)" : durationHours >= 12 ? " (×2)" : ""}
                                </span>
                            )}
                            {runeDropChances[1] > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                    G:{runeDropChances[1]}%
                                </span>
                            )}
                            {runeDropChances[2] > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                    A:{runeDropChances[2]}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Costs */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2 mb-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Requirements
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Coins className="w-5 h-5 text-yellow-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Cost:</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {formatTokenAmount(totemCost)} TOTEM
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Heart className="w-5 h-5 text-pink-500 fill-pink-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Happiness:</span>
                        </div>
                        <span className="font-semibold text-pink-600 dark:text-pink-400">
                            -{happinessCost}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="p-4 pt-0">
                <button
                    onClick={onStart}
                    disabled={!canStart || !enabled}
                    className={`w-full py-2.5 px-4 rounded-lg text-white transition-colors flex items-center justify-center gap-2
                        ${canStart && enabled
                        ? 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-600'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                >
                    {!enabled
                        ? 'Unavailable'
                        : !canStart
                            ? 'Team Not Ready'
                            : (
                                <>
                                    Start Expedition
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                </button>
            </div>
        </div>
    );
};

export default ExpeditionPanel;