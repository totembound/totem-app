import React from 'react';
import { Clock, Heart, ArrowRight, Sparkles, GaugeCircle } from 'lucide-react';
import { formatTokenAmount, formatHoursDuration } from '../../utils/formats';
import { getDomainColor, getTotemAffinityIcon, getTotemDomainIcon } from '../../utils/totems';
import { Affinity } from '../../types/types';

interface ExpeditionPanelCompactProps {
    id: string;
    name: string;
    description: string;
    image: string;
    domain: number;
    domainName: string;
    duration: number;
    durationHours: number;
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

const ExpeditionPanelCompact: React.FC<ExpeditionPanelCompactProps> = ({
    id: _id,
    name,
    description: _description,
    image,
    domain,
    domainName,
    duration: _duration,
    durationHours,
    happinessCost,
    baseExperience,
    baseEssence,
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
            {/* Header with background image - shorter on mobile */}
            <div className="relative h-28 sm:h-36">
                <img
                    src={image || '/expeditions/placeholder.png'}
                    alt={`${domainName} expedition background`}
                    className="absolute inset-0 w-full h-full object-cover"
                    width={400}
                    height={144}
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    {/* Top: Name + Domain */}
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white leading-tight">{name}</h3>
                        <div className={`
                            flex items-center gap-1
                            px-2 py-0.5 rounded text-xs font-semibold shadow-md shrink-0
                            ${getDomainColor(domain)}
                        `}>
                            {getTotemDomainIcon(domainName)}
                            {domainName}
                        </div>
                    </div>
                    {/* Bottom: Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <div className="flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-white/80 text-gray-800">
                            <Clock className="w-3 h-3 mr-0.5" />
                            {formatHoursDuration(durationHours)}
                        </div>
                        <div className="flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-white/80 text-gray-800">
                            <Sparkles className="w-3 h-3 text-blue-500 mr-0.5" />
                            S{minStage+1}+
                        </div>
                        <div className="flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-white/80 text-gray-800 gap-0.5">
                            {getTotemAffinityIcon(Affinity[primaryAffinity])}
                            <span className="hidden sm:inline">{affinityName}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact info section */}
            <div className="px-3 py-2 flex-1 flex flex-col">
                {/* XP + Rune Drops row */}
                <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <GaugeCircle className="w-4 h-4 text-emerald-500" />
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{baseExperience} XP</span>
                        </div>
                        {baseEssence != null && baseEssence > 0 && (
                            <div className="flex items-center gap-1">
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                                <span className="font-semibold text-yellow-600 dark:text-yellow-400">+{formatTokenAmount(baseEssence)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-nowrap items-center gap-1">
                        {runeDropChances[0] > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded shadow-sm shadow-blue-500/30">
                                <img src="/runes/lesser-rune.png" alt="L" className="w-3 h-3 drop-shadow shrink-0" width={12} height={12} />
                                <span className="text-[10px] font-bold text-white drop-shadow whitespace-nowrap">
                                    {runeDropChances[0]}%{durationHours >= 24 ? "×3" : durationHours >= 12 ? "×2" : ""}
                                </span>
                            </div>
                        )}
                        {runeDropChances[1] > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded shadow-sm shadow-amber-500/30">
                                <img src="/runes/greater-rune.png" alt="G" className="w-3 h-3 drop-shadow shrink-0" width={12} height={12} />
                                <span className="text-[10px] font-bold text-white drop-shadow whitespace-nowrap">{runeDropChances[1]}%</span>
                            </div>
                        )}
                        {runeDropChances[2] > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded shadow-sm shadow-purple-500/30">
                                <img src="/runes/ancient-rune.png" alt="A" className="w-3 h-3 drop-shadow shrink-0" width={12} height={12} />
                                <span className="text-[10px] font-bold text-white drop-shadow whitespace-nowrap">{runeDropChances[2]}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Costs row */}
                <div className="flex items-center gap-3 text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mb-3">
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Cost:</span>
                    <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                        <span className="font-semibold text-pink-600 dark:text-pink-400">-{happinessCost}</span>
                    </div>
                </div>

                {/* Action Button - pushed to bottom */}
                <div className="mt-auto">
                    <button
                        onClick={onStart}
                        disabled={!canStart || !enabled}
                        className={`w-full py-2 px-3 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2
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
                                        Start
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ExpeditionPanelCompact);
