import React from 'react';
import {
    LEARNED_STAGE_GATE,
    AWAKENED_STAGE_GATE,
    type TraitSlot,
} from '../../config/traits';
import TraitTooltipIcon from './TraitTooltipIcon';

interface TraitIconRowProps {
    stage: number;
    traits?: {
        innate: string | null;
        learned: string | null;
        awakened: string | null;
    } | null;
    size?: number;
    /** Show empty dashed placeholders for unlocked-but-unchosen slots. */
    showUnspentPlaceholders?: boolean;
    /** When true, always show all 3 slot positions (filled / unspent / locked). */
    showLocked?: boolean;
}

const STAGE_GATE: Record<TraitSlot, number> = {
    innate: 0,
    learned: LEARNED_STAGE_GATE,
    awakened: AWAKENED_STAGE_GATE,
};

/**
 * Compact horizontal row of trait icons — used on gallery cards, list rows,
 * and the totem detail image overlay. Each icon has a hover/tap tooltip
 * (filled trait: name + flavor; unspent: prompt to choose; locked: stage hint).
 */
const TraitIconRow: React.FC<TraitIconRowProps> = ({ stage, traits, size = 14, showUnspentPlaceholders = true, showLocked = false }) => {
    if (!traits) return null;

    const slots: TraitSlot[] = ['innate', 'learned', 'awakened'];
    const items: React.ReactNode[] = [];

    for (const slot of slots) {
        const traitId = traits[slot];
        const gate = STAGE_GATE[slot];
        const unlocked = stage >= gate;

        if (traitId) {
            items.push(<TraitTooltipIcon key={slot} slot={slot} traitId={traitId} unlocked size={size} />);
        }
        else if (unlocked && showUnspentPlaceholders && slot !== 'innate') {
            items.push(<TraitTooltipIcon key={slot} slot={slot} traitId={null} unlocked size={size} />);
        }
        else if (showLocked && slot !== 'innate') {
            items.push(<TraitTooltipIcon key={slot} slot={slot} traitId={null} unlocked={false} requiredStage={gate} size={size} />);
        }
    }

    if (items.length === 0) return null;

    return <div className="flex items-center gap-1">{items}</div>;
};

export default TraitIconRow;
