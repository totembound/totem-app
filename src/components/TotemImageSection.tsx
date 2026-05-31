import React, { useEffect, useRef } from 'react';
import { MapPin, Swords, Landmark } from 'lucide-react';
import { Rarity, Species } from '../types/types';
import ActionEffect from './effects/ActionEffect';
import { getRarityBadgeColor, getRarityGlow, getRarityHaloShadow } from '../utils/totems';
import { formatTimeRemaining } from '../utils/formats';
import { IPFS_GATEWAY_URL } from '../config/constants';
import TraitIconRow from './traits/TraitIconRow';

// Map species to their habitat backgrounds
const _HABITAT_BACKGROUNDS: Record<Species, string> = {
    [Species.Goose]: 'bg-gradient-to-b from-blue-400 to-blue-600 dark:from-blue-900 dark:to-blue-950',
    [Species.Otter]: 'bg-gradient-to-b from-blue-300 to-cyan-600 dark:from-blue-800 dark:to-cyan-950',
    [Species.Wolf]: 'bg-gradient-to-b from-gray-300 to-gray-500 dark:from-gray-700 dark:to-gray-900',
    [Species.Falcon]: 'bg-gradient-to-b from-blue-200 to-gray-400 dark:from-blue-900 dark:to-gray-800',
    [Species.Beaver]: 'bg-gradient-to-b from-amber-200 to-amber-600 dark:from-amber-800 dark:to-amber-950',
    [Species.Deer]: 'bg-gradient-to-b from-green-200 to-green-600 dark:from-green-800 dark:to-green-950',
    [Species.Woodpecker]: 'bg-gradient-to-b from-orange-200 to-red-400 dark:from-orange-900 dark:to-red-900',
    [Species.Turtle]: 'bg-gradient-to-b from-blue-200 to-indigo-500 dark:from-blue-900 dark:to-indigo-950',
    [Species.Bear]: 'bg-gradient-to-b from-amber-300 to-amber-700 dark:from-amber-800 dark:to-amber-950',
    [Species.Raven]: 'bg-gradient-to-b from-purple-300 to-gray-600 dark:from-purple-900 dark:to-gray-950',
    [Species.Snake]: 'bg-gradient-to-b from-green-200 to-emerald-600 dark:from-green-800 dark:to-emerald-950',
    [Species.Owl]: 'bg-gradient-to-b from-indigo-200 to-indigo-500 dark:from-indigo-900 dark:to-indigo-950',
    [Species.None]: 'bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-900',
};

// Stage names
const STAGE_NAMES = ["Newborn", "Youngling", "Juvenile", "Adult", "Elder"];

// Species-specific habitat elements
const _HABITAT_ELEMENTS: Record<Species, React.ReactNode> = {
    [Species.Goose]: (
        <div className="absolute bottom-0 w-full h-1/4 bg-blue-500/20 dark:bg-blue-900/30 backdrop-blur-sm" />
    ),
    [Species.Otter]: (
        <div className="absolute bottom-0 w-full h-1/4 bg-cyan-500/20 dark:bg-cyan-900/30 backdrop-blur-sm rounded-t-3xl" />
    ),
    [Species.Wolf]: (
        <div className="absolute bottom-0 w-full h-1/5 bg-gray-600/20 dark:bg-gray-900/30 backdrop-blur-sm" />
    ),
    [Species.Falcon]: (
        <>
            <div className="absolute top-1/4 left-8 w-8 h-8 rounded-full bg-white/30 dark:bg-white/10" />
            <div className="absolute top-1/3 right-12 w-6 h-6 rounded-full bg-white/20 dark:bg-white/10" />
        </>
    ),
    [Species.Beaver]: (
        <div className="absolute bottom-0 w-full h-1/5 bg-amber-700/20 dark:bg-amber-900/30 backdrop-blur-sm" />
    ),
    [Species.Deer]: (
        <div className="absolute bottom-0 w-full h-1/5 bg-green-500/20 dark:bg-green-900/30 backdrop-blur-sm" />
    ),
    [Species.Woodpecker]: (
        <div className="absolute right-8 h-3/4 w-8 rounded-t-lg bg-amber-800/30 dark:bg-amber-950/40" />
    ),
    [Species.Turtle]: (
        <div className="absolute bottom-0 w-full h-1/3 bg-blue-500/30 dark:bg-blue-900/40 backdrop-blur-sm" />
    ),
    [Species.Bear]: (
        <div className="absolute bottom-0 w-full h-1/5 bg-amber-800/20 dark:bg-amber-900/30 backdrop-blur-sm" />
    ),
    [Species.Raven]: (
        <>
            <div className="absolute top-1/4 left-12 w-6 h-6 rounded-full bg-purple-500/20 dark:bg-purple-900/20" />
            <div className="absolute top-1/3 right-10 w-4 h-4 rounded-full bg-purple-500/10 dark:bg-purple-900/10" />
        </>
    ),
    [Species.Snake]: (
        <div className="absolute bottom-0 w-full h-1/4 bg-green-500/20 dark:bg-green-900/30 backdrop-blur-sm" />
    ),
    [Species.Owl]: (
        <div className="absolute top-1/3 w-full h-1/4 border-t border-b border-indigo-300/20 dark:border-indigo-700/20" />
    ),
    [Species.None]: null,
};

interface TotemImageSectionProps {
    species: Species;
    rarity: Rarity;
    stage: number;
    prestigeLevel: number;
    imageUrl: string;
    activeEffect: 'treat' | 'feed' | 'train' | null;
    isOnExpedition?: boolean;
    expeditionEndTime?: number;
    sanctum?: { seated: boolean; onMission: boolean; missionEndsAt?: string | null };
    onEffectComplete: () => void;
    traits?: { innate: string | null; learned: string | null; awakened: string | null } | null;
}

const TotemImageSection: React.FC<TotemImageSectionProps> = ({
    species,
    rarity,
    stage,
    imageUrl,
    activeEffect,
    isOnExpedition = false,
    expeditionEndTime = 0,
    sanctum,
    onEffectComplete,
    traits,
}) => {
    // Clean up IPFS URL if needed
    const cleanImageUrl = imageUrl.replace('ipfs://', IPFS_GATEWAY_URL);

    // Intermittent idle breathing — 6s breath cycle every 15-20s
    const BREATH_DURATION = 6000;
    const imgRef = useRef<HTMLImageElement>(null);
    const breathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scheduleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const triggerBreath = () => {
            const el = imgRef.current;
            if (!el) return;
            el.classList.remove('animate-breathe');
            void el.offsetWidth;
            el.classList.add('animate-breathe');
            breathTimerRef.current = setTimeout(() => {
                el.classList.remove('animate-breathe');
            }, BREATH_DURATION);
        };

        const scheduleBreath = () => {
            const delay = 15000 + Math.random() * 5000;
            scheduleTimerRef.current = setTimeout(() => {
                triggerBreath();
                scheduleBreath();
            }, delay);
        };

        scheduleBreath();

        return () => {
            if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current);
            if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
            const el = imgRef.current;
            if (el) el.classList.remove('animate-breathe');
        };
    }, []);
    
    return (
        <div className={`
            aspect-square overflow-hidden relative
            bg-white dark:bg-gray-900
            ${getRarityHaloShadow(rarity)}
            transition-all duration-300
        `}>
            {/* Rarity-colored gradient glow IS the backdrop — mirrors the gallery cards
                so rarity reads consistently. (Replaces the old neutral gray habitat bg.) */}
            <div className={`absolute inset-0 z-0 bg-gradient-to-t ${getRarityGlow(rarity)} to-transparent`} aria-hidden="true" />

            {/* Main image - scaled to 80% and centered */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <img
                    ref={imgRef}
                    src={cleanImageUrl}
                    alt={`${Species[species]} - ${STAGE_NAMES[stage]}`}
                    className="w-4/5 h-4/5 object-contain transition-transform duration-500"
                    loading="lazy"
                />
            </div>
            
            {/* Action effects overlay */}
            <ActionEffect 
                action={activeEffect}
                onComplete={onEffectComplete}
            />
            
            {/* Status banner — bottom-of-image overlay, translucent, matching the
                gallery card. Mission takes priority over seated; expedition shows when
                not seated. Only one renders at a time. */}
            {(() => {
                const status = sanctum?.onMission
                    ? {
                        Icon: Swords,
                        label: 'On Mission',
                        time: sanctum.missionEndsAt
                            ? (new Date(sanctum.missionEndsAt).getTime() > Date.now()
                                ? formatTimeRemaining(Math.floor(new Date(sanctum.missionEndsAt).getTime() / 1000))
                                : 'Mission complete')
                            : null,
                    }
                    : sanctum?.seated
                    ? { Icon: Landmark, label: 'Seated', time: null }
                    : isOnExpedition
                    ? {
                        Icon: MapPin,
                        label: 'On Expedition',
                        time: expeditionEndTime > 0 && expeditionEndTime > Math.floor(Date.now() / 1000)
                            ? formatTimeRemaining(expeditionEndTime)
                            : 'Expedition complete',
                    }
                    : null;
                if (!status) return null;
                return (
                    <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-center gap-2 bg-blue-600/55 backdrop-blur-sm text-white text-sm font-medium px-3 py-2 leading-none">
                        <status.Icon className="w-4 h-4 flex-shrink-0 animate-pulse" />
                        <span>{status.label}</span>
                        {status.time && (
                            <>
                                <span className="opacity-60">·</span>
                                <span className="font-normal">{status.time}</span>
                            </>
                        )}
                    </div>
                );
            })()}
                    
            {/* Stage Badge — stage name (e.g. "Newborn") implies the stage number, so we skip the redundant "1/5" counter. */}
            <div className="absolute top-3 left-3 z-20">
                <div className="text-xs bg-gray-600/80 dark:bg-black/60 text-white px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                    {STAGE_NAMES[stage]}
                </div>
            </div>


            {/* Trait Badges - top center, between Stage (left) and Rarity (right) badges.
                Shows all 3 slots: filled / unspent placeholder / locked. Hover or tap each
                for tooltip with name + description or stage-gate reason. Sized to visually
                match the Stage and Rarity pills. */}
            {traits && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 h-6 inline-flex items-center bg-white dark:bg-gray-900 rounded-full px-3 border border-gray-200 dark:border-gray-700 shadow-sm leading-none">
                    <TraitIconRow stage={stage} traits={traits} size={12} showLocked />
                </div>
            )}

            {/* Rarity Badge - Absolute positioned over image */}
            <div className="absolute top-3 right-3 z-10 bg-white dark:bg-gray-900 rounded-full">
                <span className={`text-xs px-3 py-1 rounded-full border ${getRarityBadgeColor(rarity)}`}>
                    {Rarity[rarity]}
                </span>
            </div>

        </div>
    );
};

export default TotemImageSection;