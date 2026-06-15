/**
 * Trait icon helper — maps trait IDs to lucide-react icons.
 *
 * Phase 1: lucide icons (named in traits.ts via the `icon` field).
 * Phase 2.5: when custom illustrated icons ship, this helper detects an
 *            asset-path icon value (starts with '/') and renders <img> instead.
 */

import React from 'react';
import {
    Anchor,
    BookOpen,
    Cloud,
    Clover,
    Coins,
    Compass,
    Crown,
    Feather,
    Gem,
    GraduationCap,
    Heart,
    HeartHandshake,
    HelpCircle,
    Lightbulb,
    Map,
    MessageCircle,
    Moon,
    Mountain,
    PiggyBank,
    RotateCw,
    Shield,
    ShieldCheck,
    Sparkle,
    Sparkles,
    Sun,
    Sword,
    Swords,
    Users,
    Wheat,
    Wind,
    Zap,
    type LucideIcon,
} from 'lucide-react';

import { getTraitById, type TraitSlot } from '../config/traits';

const SLOT_LABEL: Record<TraitSlot, string> = {
    innate: 'Innate',
    learned: 'Learned',
    awakened: 'Awakened',
};

/**
 * Single source of truth for trait tooltip text. Used wherever a trait icon
 * (or trait slot placeholder) has a hover/tap tooltip — gallery, image overlay,
 * details tab, stats tab.
 */
export function getTraitTooltipContent(args: {
    slot: TraitSlot;
    traitId: string | null;
    unlocked: boolean;
    requiredStage?: number;
}): string {
    const def = getTraitById(args.traitId);
    if (def) {
        // Second line surfaces the gameplay bonus (curated `effect` copy), so the
        // tooltip reads: name + flavor, then the actual modifier.
        const bonus = def.effect ? `\n${def.effect}` : '';
        return `${def.name} (${SLOT_LABEL[args.slot]}) — ${def.description}${bonus}`;
    }
    if (args.unlocked && args.slot !== 'innate') {
        return `${SLOT_LABEL[args.slot]} trait unchosen — choose one.`;
    }
    if (args.requiredStage !== undefined) {
        return `${SLOT_LABEL[args.slot]} trait awakens at Stage ${args.requiredStage + 1}.`;
    }
    return `${SLOT_LABEL[args.slot]} locked.`;
}

const ICON_MAP: Record<string, LucideIcon> = {
    Anchor, BookOpen, Cloud, Clover, Coins, Compass, Crown, Feather, Gem,
    GraduationCap, Heart, HeartHandshake, Lightbulb, Map, MessageCircle, Moon,
    Mountain, PiggyBank, RotateCw, Shield, ShieldCheck, Sparkle, Sparkles, Sun,
    Sword, Swords, Users, Wheat, Wind, Zap,
};

/** Slot-tier color classes used wherever trait icons render. */
export const SLOT_COLOR_CLASSES: Record<TraitSlot, string> = {
    innate: 'text-stone-600 dark:text-stone-300',
    learned: 'text-blue-600 dark:text-blue-400',
    awakened: 'text-amber-500 dark:text-amber-400',
};

export interface TraitIconProps {
    traitId: string | null | undefined;
    size?: number;
    className?: string;
    /** When true, applies the slot-tier color class automatically. */
    colorBySlot?: boolean;
}

/**
 * Render the icon for a given trait ID.
 * Falls back to a HelpCircle if the trait or its icon isn't recognized.
 */
export const TraitIcon: React.FC<TraitIconProps> = ({ traitId, size = 16, className = '', colorBySlot = false }) => {
    const def = getTraitById(traitId);
    if (!def) {
        return <HelpCircle size={size} className={className} aria-hidden />;
    }

    const tierClass = colorBySlot ? SLOT_COLOR_CLASSES[def.slot] : '';
    const composedClass = `${tierClass} ${className}`.trim();

    // Phase 2.5 hook: if icon value is an asset path, render <img>.
    if (def.icon.startsWith('/')) {
        return (
            <img
                src={def.icon}
                alt={def.name}
                width={size}
                height={size}
                className={composedClass}
                draggable={false}
            />
        );
    }

    const IconComponent = ICON_MAP[def.icon];
    if (!IconComponent) {
        return <HelpCircle size={size} className={composedClass} aria-hidden />;
    }

    return <IconComponent size={size} className={composedClass} aria-label={def.name} />;
};

/** Convenience: render an icon with a tooltip via `title`. */
export const TraitIconWithTooltip: React.FC<TraitIconProps> = (props) => {
    const def = getTraitById(props.traitId);
    if (!def) return <TraitIcon {...props} />;
    return (
        <span title={`${def.name} — ${def.description}`} className="inline-flex">
            <TraitIcon {...props} />
        </span>
    );
};
