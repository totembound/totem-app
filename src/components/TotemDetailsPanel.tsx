import React from 'react';
import { Unlock, MapPin, Landmark, Lock } from 'lucide-react';
import { Species, Color, Rarity } from '../types/types';
import { AVAILABLE_SPECIES } from '../config/constants';
import { splitWords } from '../utils/formats';
import { getTotemAffinityIcon, getTotemDomainIcon } from '../utils/totems';
import { getTraitById, LEARNED_STAGE_GATE, AWAKENED_STAGE_GATE, type TraitSlot } from '../config/traits';
import { TraitIcon, SLOT_COLOR_CLASSES, getTraitTooltipContent } from '../utils/traitIcons';
import Tooltip from './Tooltip';

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
    /** Trait state. Pass null/undefined for legacy totems with no traits field. */
    traits?: {
        innate: string | null;
        learned: string | null;
        awakened: string | null;
    } | null;
    /** Open the shared trait picker for a slot. When omitted, trait rows are read-only. */
    onChooseTrait?: (slot: TraitSlot) => void;
}

const SLOT_LABEL: Record<TraitSlot, string> = {
    innate: 'Innate',
    learned: 'Learned',
    awakened: 'Awakened',
};

const SLOT_GATE: Record<TraitSlot, number> = {
    innate: 0,
    learned: LEARNED_STAGE_GATE,
    awakened: AWAKENED_STAGE_GATE,
};

/**
 * Tier theme — earth for Innate, study for Learned, gold for Awakened.
 * Class strings are kept literal so Tailwind picks them up at build time.
 */
const TIER_THEME: Record<TraitSlot, {
    cardBg: string;
    cardBorder: string;
    halo: string;
    pillBg: string;
    chipBg: string;
    chipText: string;
}> = {
    innate: {
        cardBg: 'bg-gradient-to-br from-stone-100/80 to-stone-200/50 dark:from-stone-900/80 dark:to-stone-800/40',
        cardBorder: 'border-stone-300/40 dark:border-stone-700/70',
        halo: 'bg-stone-400/20 dark:bg-stone-300/15',
        pillBg: 'bg-stone-200/90 text-stone-700 ring-1 ring-stone-400/40 dark:bg-stone-800/90 dark:text-stone-200 dark:ring-stone-600/40',
        chipBg: 'bg-stone-100/80 ring-1 ring-stone-400/40 dark:bg-stone-900/60 dark:ring-stone-600/50',
        chipText: 'text-stone-800 dark:text-stone-100',
    },
    learned: {
        cardBg: 'bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-950/60 dark:to-blue-900/30',
        cardBorder: 'border-blue-300/40 dark:border-blue-800/70',
        halo: 'bg-blue-400/25 dark:bg-blue-500/25',
        pillBg: 'bg-blue-200/90 text-blue-800 ring-1 ring-blue-400/40 dark:bg-blue-900/80 dark:text-blue-100 dark:ring-blue-700/40',
        chipBg: 'bg-blue-100/80 ring-1 ring-blue-400/40 dark:bg-blue-950/60 dark:ring-blue-700/50',
        chipText: 'text-blue-900 dark:text-blue-100',
    },
    awakened: {
        cardBg: 'bg-gradient-to-br from-amber-50/80 to-amber-100/50 dark:from-amber-950/60 dark:to-amber-900/30',
        cardBorder: 'border-amber-300/50 dark:border-amber-700/70',
        halo: 'bg-amber-400/30 dark:bg-amber-500/30',
        pillBg: 'bg-amber-200/90 text-amber-900 ring-1 ring-amber-400/50 dark:bg-amber-800/80 dark:text-amber-100 dark:ring-amber-600/50',
        chipBg: 'bg-amber-100/80 ring-1 ring-amber-400/50 dark:bg-amber-950/60 dark:ring-amber-600/50',
        chipText: 'text-amber-900 dark:text-amber-100',
    },
};

const TotemDetailsPanel: React.FC<TotemDetailsPanelProps> = ({
    stage,
    species,
    rarity,
    color,
    affinity,
    domain,
    sanctum,
    isOnExpedition = false,
    stageDescription,
    traits,
    onChooseTrait,
}) => {
    const getSpeciesDescription = (species: Species): string => {
        return AVAILABLE_SPECIES.find(s => s.species === species)?.desc || '';
    };

    const description = stageDescription || getSpeciesDescription(species);

    const renderTraitCard = (slot: TraitSlot) => {
        const traitId = traits?.[slot] ?? null;
        const def = getTraitById(traitId);
        const gate = SLOT_GATE[slot];
        const unlocked = stage >= gate;
        const canChoose = unlocked && !traitId && slot !== 'innate' && !!onChooseTrait;
        const tooltipContent = getTraitTooltipContent({ slot, traitId, unlocked, requiredStage: gate });
        const theme = TIER_THEME[slot];

        // Slot pill — always rendered in the body column, so all three pills
        // line up vertically across mobile rows and along the top of desktop cards.
        const slotPill = (
            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full ${theme.pillBg}`}>
                {SLOT_LABEL[slot]}
            </span>
        );

        // Icon medallion — circle with tier-colored halo glow behind the lucide icon.
        // Sized by viewport: 44px on mobile rows, 56px on desktop cards.
        const iconMedallion = (centerContent: React.ReactNode) => (
            <div className="relative shrink-0 w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center">
                <span className={`absolute inset-0 rounded-full blur-xl ${theme.halo}`} aria-hidden />
                <span className={`relative inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-full ${theme.cardBg} ring-1 ${theme.cardBorder}`}>
                    {centerContent}
                </span>
            </div>
        );

        // Card shell:
        //   mobile (<sm): horizontal row, fixed-width icon column on the left so
        //     all three pills line up flush at the same x position.
        //   desktop (sm+): vertical card, pill + medallion centered on top, body
        //     stacked with breathing room.
        const cardShell = (icon: React.ReactNode, body: React.ReactNode) => (
            <div
                key={slot}
                className={`relative overflow-hidden flex flex-row items-start gap-3 p-3 sm:p-4 rounded-xl border ${theme.cardBg} ${theme.cardBorder} shadow-sm hover:shadow-md transition-shadow min-w-0`}
            >
                {/* Icon — fixed left column so all three rows align */}
                <div className="shrink-0">{icon}</div>
                {/* Body — left-aligned row content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {slotPill}
                    {body}
                </div>
            </div>
        );

        if (def) {
            const isPassive = def.category === 'passive';
            return cardShell(
                iconMedallion(
                    <>
                        <TraitIcon traitId={def.id} size={26} colorBySlot className="shrink-0 sm:hidden" />
                        <TraitIcon traitId={def.id} size={30} colorBySlot className="shrink-0 hidden sm:inline-block" />
                    </>,
                ),
                <>
                    {/* Name + Passive/Active share one row (wraps gracefully if tight). */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-50 leading-tight break-words">
                            {def.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 font-medium">
                            {isPassive ? 'Passive' : 'Active'}
                        </span>
                    </div>
                    {/* Effect chip — tier-tinted callout instead of bare green text. */}
                    <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${theme.chipBg} ${theme.chipText} w-fit break-words text-left`}>
                        {def.effect}
                    </div>
                    {/* Flavor as a quoted inscription. Smart quotes added if not already. */}
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 italic mt-1 break-words leading-snug">
                        &ldquo;{def.description.replace(/[“”"]/g, '').replace(/\.$/, '')}.&rdquo;
                    </div>
                </>,
            );
        }

        if (canChoose) {
            return cardShell(
                iconMedallion(
                    <span className={`inline-block w-6 h-6 sm:w-9 sm:h-9 rounded-full border-2 border-dashed ${SLOT_COLOR_CLASSES[slot]}`} />,
                ),
                <>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Unlocked &mdash; awaiting your choice
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChooseTrait?.(slot); }}
                        className={`mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${theme.chipBg} ${theme.chipText} hover:brightness-110 transition`}
                    >
                        Choose a {SLOT_LABEL[slot].toLowerCase()} trait →
                    </button>
                </>,
            );
        }

        return cardShell(
            iconMedallion(
                <Lock size={18} className="text-gray-400 dark:text-gray-500" aria-hidden />,
            ),
            <Tooltip content={tooltipContent} position="top">
                <div className="cursor-help">
                    <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-1">
                        {slot === 'innate' ? 'Unknown' : 'Awakens at'}
                    </div>
                    {slot !== 'innate' && (
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-0.5">
                            Stage {gate + 1}
                        </div>
                    )}
                </div>
            </Tooltip>,
        );
    };

    return (
        <div className="space-y-4">
            {/* Totem Description - Stage-specific */}
            <div>
                <h3 className="text-md font-semibold mb-1">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {description}
                </p>
            </div>

            {/* Properties List */}
            <div>
                <h3 className="text-md font-semibold mb-2">Properties</h3>
                <div className="space-y-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    {/* Status moved to top — it's the most time-sensitive info (where is this totem RIGHT NOW). */}
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

                </div>
            </div>

            {/* Traits — full-width stacked rows at every breakpoint (icon left,
                details right). Container matches the Properties panel above (same
                bg + padding) so the section reads as one panel-width. */}
            {traits && (
                <div>
                    <h3 className="text-md font-semibold mb-2">Traits</h3>
                    <div className="flex flex-col gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        {(['innate', 'learned', 'awakened'] as TraitSlot[]).map(renderTraitCard)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TotemDetailsPanel;
