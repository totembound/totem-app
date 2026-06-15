import React, { useMemo } from 'react';
import {
    PawPrint,
    Star,
    Layers,
    Sparkle,
    ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TotemData, Rarity, Species } from '../../types/types';
import _ from 'lodash';
import { getRarityBadgeColor } from '../../utils/totems';
import { LEARNED_STAGE_GATE, AWAKENED_STAGE_GATE, TRAITS, getTraitById, type TraitSlot } from '../../config/traits';
import { TraitIcon, SLOT_COLOR_CLASSES } from '../../utils/traitIcons';
import Tooltip from '../Tooltip';

const TotemGalleryStats: React.FC<{ nfts: TotemData[] }> = ({ nfts }) => {
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

    // Traits — unique traits the player has collected, grouped by tier (Innate / Learned / Awakened)
    // with per-trait counts. Compact so we never approach 30 rows.
    const traitCollection = useMemo(() => {
        const counts = new Map<string, number>();
        let unspent = 0;
        for (const nft of nfts) {
            const t = nft.traits;
            if (!t) continue;
            for (const id of [t.innate, t.learned, t.awakened]) {
                if (id) counts.set(id, (counts.get(id) || 0) + 1);
            }
            if (nft.attributes.stage >= LEARNED_STAGE_GATE && !t.learned) unspent++;
            if (nft.attributes.stage >= AWAKENED_STAGE_GATE && !t.awakened) unspent++;
        }
        const tierOrder: TraitSlot[] = ['innate', 'learned', 'awakened'];
        const grouped = tierOrder.map((slot) => {
            const items = Array.from(counts.entries())
                .map(([id, count]) => ({ id, count, def: getTraitById(id)! }))
                .filter((x) => x.def && x.def.slot === slot)
                .sort((a, b) => (b.count - a.count) || a.def.name.localeCompare(b.def.name));
            return { slot, items };
        });
        return { grouped, unspent, uniqueCount: counts.size };
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            {/* Species Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PawPrint className="w-5 h-5 text-purple-500" />
                    Species Distribution
                </h3>
                <div className="space-y-2">
                    {speciesDistribution.map((species, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="group w-32">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {species.name}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-purple-500 h-2 rounded-full" 
                                    style={{ width: `${species.percentage}%` }}
                                />
                            </div>
                            <div className="group">
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
                                    ${getRarityBadgeColor(Rarity[rarity.name as keyof typeof Rarity])}
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

            {/* Traits — collected unique traits, each with a count badge. Compact grid so we don't
                blow up to 30 rows. Tap an icon for the name/description. Link to codex for the full set. */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    <Sparkle className="w-5 h-5 text-amber-500" />
                    Traits
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{traitCollection.uniqueCount}</span> of {TRAITS.length} unique traits collected
                    {traitCollection.unspent > 0 && (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">
                            · {traitCollection.unspent} unchosen
                        </span>
                    )}
                </p>
                {traitCollection.uniqueCount === 0 ? (
                    <p className="text-xs text-gray-400 italic">No traits yet — your totems will earn them as they grow.</p>
                ) : (
                    <div className="space-y-2">
                        {traitCollection.grouped.map(({ slot, items }) => (
                            <div key={slot}>
                                <div className={`text-[10px] uppercase tracking-wide mb-1 ${SLOT_COLOR_CLASSES[slot]}`}>
                                    {slot.charAt(0).toUpperCase() + slot.slice(1)}
                                </div>
                                {items.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">none yet</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {items.map(({ id, count, def }) => (
                                            <Tooltip key={id} content={`${def.name} — ${def.description}`} position="top">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 cursor-help">
                                                    <TraitIcon traitId={id} size={14} colorBySlot />
                                                    {count > 1 && (
                                                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">×{count}</span>
                                                    )}
                                                </span>
                                            </Tooltip>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <Link
                    to="/guides/codex/traits"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    See all traits <ExternalLink size={12} />
                </Link>
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
                            <div className="group w-32">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 text-nowrap">
                                    {stage.name}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${stage.percentage}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
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