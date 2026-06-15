import React from 'react';
import { Lock } from 'lucide-react';
import { getTraitById, type TraitSlot } from '../../config/traits';
import { TraitIcon, SLOT_COLOR_CLASSES, getTraitTooltipContent } from '../../utils/traitIcons';
import Tooltip from '../Tooltip';

interface TraitTooltipIconProps {
    slot: TraitSlot;
    traitId: string | null;
    /** True when the totem has reached the stage gate for this slot. */
    unlocked: boolean;
    /** Required stage if the slot is currently locked. */
    requiredStage?: number;
    size?: number;
}

/**
 * A single trait icon (filled / unspent / locked) wrapped in the shared
 * Tooltip component so hover (desktop) and tap (mobile) both work.
 * Tooltip content comes from `getTraitTooltipContent` — used everywhere
 * traits show up so wording stays consistent.
 */
const TraitTooltipIcon: React.FC<TraitTooltipIconProps> = ({ slot, traitId, unlocked, requiredStage, size = 16 }) => {
    const def = getTraitById(traitId);
    const content = getTraitTooltipContent({ slot, traitId, unlocked, requiredStage });

    let glyph: React.ReactNode;
    if (def) {
        glyph = <TraitIcon traitId={def.id} size={size} colorBySlot />;
    }
    else if (unlocked && slot !== 'innate') {
        glyph = (
            <span
                className={`inline-block rounded-full border-2 border-dashed ${SLOT_COLOR_CLASSES[slot]}`}
                style={{ width: size, height: size }}
            />
        );
    }
    else {
        glyph = <Lock size={size} className="text-stone-400 dark:text-stone-500" />;
    }

    return (
        <Tooltip content={content} position="bottom">
            <span className="inline-flex items-center justify-center" aria-label={content}>
                {glyph}
            </span>
        </Tooltip>
    );
};

export default TraitTooltipIcon;
