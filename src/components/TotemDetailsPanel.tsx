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

        // Slot pill — small tag rendered top-center on desktop, inline on mobile.
        const slotPill = (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${SLOT_COLOR_CLASSES[slot]}`}>
                {SLOT_LABEL[slot]}
            </span>
        );

        // Shell:
        // - mobile (<sm): horizontal row, icon left, content right, pill inline
        // - desktop (sm+): vertical card, pill centered on top, content stacked
        const cardShell = (icon: React.ReactNode, content: React.ReactNode) => (
            <div
                key={slot}
                className="flex flex-row sm:flex-col items-start sm:items-stretch gap-3 sm:gap-1.5 p-2.5 rounded-lg bg-white/40 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 min-w-0"
            >
                {/* Desktop-only top pill strip */}
                <div className="hidden sm:flex items-center justify-center">{slotPill}</div>
                {/* Icon — left column on mobile, top-center on desktop */}
                <div className="shrink-0 sm:flex sm:justify-center">{icon}</div>
                {/* Body */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5 sm:items-center sm:text-center">
                    {/* Mobile-only inline pill above name */}
                    <div className="sm:hidden">{slotPill}</div>
                    {content}
                </div>
            </div>
        );

        if (def) {
            return cardShell(
                <TraitIcon traitId={def.id} size={28} colorBySlot className="shrink-0" />,
                <>
                    <div className="flex items-baseline gap-2 flex-wrap sm:justify-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                            {def.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {def.category}
                        </span>
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium break-words">
                        {def.effect}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 italic break-words">
                        {def.description}
                    </div>
                </>,
            );
        }

        if (canChoose) {
            return cardShell(
                <span className={`inline-block shrink-0 w-7 h-7 rounded-full border-2 border-dashed ${SLOT_COLOR_CLASSES[slot]}`} />,
                <>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Unlocked — awaiting your choice</div>
                    <Tooltip content={tooltipContent} position="top" interactiveChild>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChooseTrait?.(slot); }}
                            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline text-left sm:text-center"
                        >
                            Choose →
                        </button>
                    </Tooltip>
                </>,
            );
        }

        return cardShell(
            <span className="inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700">
                <Lock size={14} className="text-gray-400 dark:text-gray-500" />
            </span>,
            <Tooltip content={tooltipContent} position="top">
                <div className="text-xs text-gray-500 dark:text-gray-400 cursor-help">
                    {slot === 'innate' ? 'Unknown' : `Awakens at Stage ${gate + 1}`}
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

            {/* Traits — stacked rows on mobile, 3-column cards on desktop. */}
            {traits && (
                <div>
                    <h3 className="text-md font-semibold mb-2">Traits</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        {(['innate', 'learned', 'awakened'] as TraitSlot[]).map(renderTraitCard)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TotemDetailsPanel;
