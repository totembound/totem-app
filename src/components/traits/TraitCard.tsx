import React from 'react';
import { type TraitDefinition } from '../../config/traits';
import { TraitIcon, SLOT_COLOR_CLASSES } from '../../utils/traitIcons';

interface TraitCardProps {
    trait: TraitDefinition;
    /** Show "Choose" button when this is a selectable slot. */
    selectable?: boolean;
    /** Called when "Choose" is clicked. */
    onChoose?: (traitId: string) => void;
    /** Disable interaction (e.g. while a request is in flight). */
    disabled?: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
    passive: 'Passive',
    active: 'Active',
};

const SLOT_BADGE_LABEL: Record<string, string> = {
    innate: 'Innate',
    learned: 'Learned',
    awakened: 'Awakened',
};

export const TraitCard: React.FC<TraitCardProps> = ({ trait, selectable = false, onChoose, disabled = false }) => {
    return (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
            <div className="flex items-center gap-2 w-full">
                <TraitIcon traitId={trait.id} size={28} colorBySlot className="shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">{trait.name}</div>
                    <div className="flex gap-1.5 mt-0.5 text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded ${SLOT_COLOR_CLASSES[trait.slot]} bg-stone-100 dark:bg-gray-700`}>
                            {SLOT_BADGE_LABEL[trait.slot]}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-gray-700/50">
                            {CATEGORY_LABEL[trait.category]}
                        </span>
                    </div>
                </div>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 italic">"{trait.description}"</p>
            {trait.effect && (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{trait.effect}</p>
            )}
            {selectable && (
                <button
                    type="button"
                    onClick={() => onChoose?.(trait.id)}
                    disabled={disabled}
                    className="mt-1 w-full px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                >
                    Choose
                </button>
            )}
        </div>
    );
};

export default TraitCard;
