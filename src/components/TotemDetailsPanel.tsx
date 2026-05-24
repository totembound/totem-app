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

    const renderTraitRow = (slot: TraitSlot) => {
        const traitId = traits?.[slot] ?? null;
        const def = getTraitById(traitId);
        const gate = SLOT_GATE[slot];
        const unlocked = stage >= gate;
        const canChoose = unlocked && !traitId && slot !== 'innate' && !!onChooseTrait;
        const tooltipContent = getTraitTooltipContent({ slot, traitId, unlocked, requiredStage: gate });

        // Left: tier name (Innate / Learned / Awakened). Right: the chosen trait
        // (icon + name) or the choose CTA / lock state.
        const tierLabel = (
            <span className={`text-sm text-gray-600 dark:text-gray-400`}>
                {SLOT_LABEL[slot]}
            </span>
        );

        if (def) {
            return (
                <div key={slot} className="flex items-center justify-between gap-3">
                    {tierLabel}
                    <Tooltip content={tooltipContent} position="top">
                        <span className="inline-flex items-center gap-1.5 cursor-help">
                            <TraitIcon traitId={def.id} size={16} colorBySlot className="shrink-0" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{def.name}</span>
                        </span>
                    </Tooltip>
                </div>
            );
        }

        if (canChoose) {
            return (
                <div key={slot} className="flex items-center justify-between gap-3">
                    {tierLabel}
                    <Tooltip content={tooltipContent} position="top" interactiveChild>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChooseTrait?.(slot); }}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline"
                        >
                            <span className={`inline-block shrink-0 w-3 h-3 rounded-full border-2 border-dashed ${SLOT_COLOR_CLASSES[slot]}`} />
                            Choose →
                        </button>
                    </Tooltip>
                </div>
            );
        }

        return (
            <div key={slot} className="flex items-center justify-between gap-3 py-0.5">
                {tierLabel}
                <Tooltip content={tooltipContent} position="top">
                    <span className="inline-flex items-center gap-1.5 cursor-help text-sm text-gray-500 dark:text-gray-400">
                        <Lock size={14} className="shrink-0 text-gray-400 dark:text-gray-500" />
                        {slot === 'innate' ? 'Unknown' : `Stage ${gate + 1}`}
                    </span>
                </Tooltip>
            </div>
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

            {/* Traits — own section, styled to match Properties */}
            {traits && (
                <div>
                    <h3 className="text-md font-semibold mb-2">Traits</h3>
                    <div className="space-y-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        {(['innate', 'learned', 'awakened'] as TraitSlot[]).map(renderTraitRow)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TotemDetailsPanel;
