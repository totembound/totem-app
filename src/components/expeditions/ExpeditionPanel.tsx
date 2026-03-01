import React from 'react';
import { Clock, Droplets, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { formatTokenAmount, formatHoursDuration } from '../../utils/formats';
import { getDomainColor, getTotemAffinityIcon } from '../../utils/totems';
import { Affinity } from '../../types/types';
import { CURRENCY_NAMES } from '../../config/constants';

interface ExpeditionPanelProps {
    id: string;
    name: string;
    description: string;
    image: string;
    domain: number;
    domainName: string;
    duration: number;
    durationHours: number;
    essenceCost: number;
    happinessCost: number;
    baseExperience: number;
    baseEssence?: number;
    primaryAffinity: Affinity;
    runeDropChances: [number, number, number];
    minStage: number;
    enabled: boolean;
    onStart: () => void;
    canStart: boolean;
}

const ExpeditionPanel: React.FC<ExpeditionPanelProps> = ({
    id: _id,
    name,
    description,
    image,
    domain,
    domainName,
    duration: _duration,
    durationHours,
    essenceCost,
    happinessCost,
    baseExperience,
    baseEssence: _baseEssence,
    primaryAffinity,
    runeDropChances,
    enabled,
    minStage,
    onStart,
    canStart
}) => {

    const affinityName = Affinity[primaryAffinity];

    return (
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full border border-gray-300 dark:border-gray-700">
            {/* Header with background image */}
            <div className="relative h-40">
                <img
                    src={image || '/expeditions/placeholder.png'}
                    alt={`${domainName} expedition background`}
                    className="absolute inset-0 w-full h-full object-cover"
                    width={400}
                    height={160}
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    {/* Domain */}
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-200">{name}</h3>
                        <div className={`
                            px-2 py-1 rounded-lg text-sm font-semibold shadow-md
                            ${getDomainColor(domain)}
                        `}>
                            {domainName}
                        </div>
                    </div>
                    {/* Description */}
                    <p className="font-medium text-sm text-gray-200 mb-auto mt-4">
                        {description}
                    </p>
                    <div className="flex items-center space-x-2">
                        <div className={`
                            flex items-center
                            px-2 py-1 rounded-md text-xs font-bold
                            bg-white/70 text-gray-800
                        `}>
                            <Clock className="inline w-3 h-3 mr-1" />
                            {formatHoursDuration(durationHours)}
                        </div>
                        <div className={`
                            flex items-center
                            px-2 py-1 rounded-md text-xs font-bold
                            bg-white/70 text-gray-800
                        `}>
                            <Sparkles className="inline w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
                            Stage {minStage+1}+
                        </div>
                        <div className={`py-1 px-2 rounded-md bg-white/70 text-xs font-bold text-gray-800 flex flex-row items-center gap-1`}>
                            {getTotemAffinityIcon(Affinity[primaryAffinity])} {affinityName}
                        </div>
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
                        <div className="flex flex-nowrap items-center gap-1">
                            {runeDropChances[0] > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded shadow-sm shadow-blue-500/30">
                                    <img src="/runes/lesser-rune.png" alt="Lesser" className="w-3.5 h-3.5 drop-shadow shrink-0" width={14} height={14} />
                                    <span className="text-[11px] font-bold text-white tabular-nums drop-shadow whitespace-nowrap">
                                        {runeDropChances[0]}%{durationHours >= 24 ? " ×3" : durationHours >= 12 ? " ×2" : ""}
                                    </span>
                                </div>
                            )}
                            {runeDropChances[1] > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded shadow-sm shadow-amber-500/30">
                                    <img src="/runes/greater-rune.png" alt="Greater" className="w-3.5 h-3.5 drop-shadow shrink-0" width={14} height={14} />
                                    <span className="text-[11px] font-bold text-white tabular-nums drop-shadow whitespace-nowrap">{runeDropChances[1]}%</span>
                                </div>
                            )}
                            {runeDropChances[2] > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded shadow-sm shadow-purple-500/30">
                                    <img src="/runes/ancient-rune.png" alt="Ancient" className="w-3.5 h-3.5 drop-shadow shrink-0" width={14} height={14} />
                                    <span className="text-[11px] font-bold text-white tabular-nums drop-shadow whitespace-nowrap">{runeDropChances[2]}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Costs */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2 mb-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Cost
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{CURRENCY_NAMES.SOFT}:</span>
                        </div>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                            -{formatTokenAmount(essenceCost)}
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

export default React.memo(ExpeditionPanel);