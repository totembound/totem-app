import React, { useEffect, useRef } from 'react';
import { MapPin, Star, Swords, Landmark } from 'lucide-react';
import { Rarity, Species } from '../types/types';
import ActionEffect from './effects/ActionEffect';
import { getRarityBadgeColor } from '../utils/totems';
import { formatTimeRemaining } from '../utils/formats';
import { IPFS_GATEWAY_URL } from '../config/constants';
import TraitIconRow from './traits/TraitIconRow';

// Map species to their habitat backgrounds
const HABITAT_BACKGROUNDS: Record<Species, string> = {
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
    prestigeLevel,
    imageUrl,
    activeEffect,
    isOnExpedition = false,
    expeditionEndTime = 0,
    sanctum,
    onEffectComplete,
    traits,
}) => {
    //const habitatBackground = HABITAT_BACKGROUNDS[species] || HABITAT_BACKGROUNDS[Species.None];
    //const habitatElement = HABITAT_ELEMENTS[species] || null;
    const habitatBackground = HABITAT_BACKGROUNDS[Species.None];
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
            ${habitatBackground}
            transition-all duration-300
        `}>
            {/* Habitat elements in the background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                
            </div>
            
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
            
            {/* Status Overlay — On Mission */}
            {sanctum?.onMission && (
                <div className="absolute top-2/3 left-0 right-0 z-20 flex flex-col items-center">
                    <div className="bg-blue-600/80 dark:bg-blue-800/90 text-white px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 shadow-lg">
                        <Swords className="w-5 h-5 animate-pulse" />
                        <span className="font-medium">On Mission</span>
                    </div>
                    {sanctum.missionEndsAt && (
                        <div className="bg-white/80 dark:bg-gray-900/80 text-blue-700 dark:text-blue-300 px-4 py-1 rounded-full mt-2 backdrop-blur-sm text-sm">
                            {new Date(sanctum.missionEndsAt).getTime() > Date.now()
                                ? formatTimeRemaining(Math.floor(new Date(sanctum.missionEndsAt).getTime() / 1000))
                                : 'Mission complete'}
                        </div>
                    )}
                </div>
            )}
            {/* Status Overlay — Seated (not on mission) */}
            {sanctum?.seated && !sanctum?.onMission && (
                <div className="absolute top-2/3 left-0 right-0 z-20 flex flex-col items-center">
                    <div className="bg-blue-600/80 dark:bg-blue-800/90 text-white px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 shadow-lg">
                        <Landmark className="w-5 h-5" />
                        <span className="font-medium">Seated</span>
                    </div>
                </div>
            )}
            {/* Status Overlay — On Expedition (not seated) */}
            {isOnExpedition && !sanctum?.seated && (
                <div className="absolute top-2/3 left-0 right-0 z-20 flex flex-col items-center">
                    <div className="bg-blue-600/80 dark:bg-blue-800/90 text-white px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 shadow-lg">
                        <MapPin className="w-5 h-5 animate-pulse" />
                        <span className="font-medium">On Expedition</span>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-900/80 text-blue-700 dark:text-blue-300 px-4 py-1 rounded-full mt-2 backdrop-blur-sm text-sm">
                        {expeditionEndTime > 0 && expeditionEndTime > Math.floor(Date.now() / 1000)
                            ? formatTimeRemaining(expeditionEndTime)
                            : 'Expedition complete'}
                    </div>
                </div>
            )}
                    
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

            {/* Prestige Badge */}
            {prestigeLevel > 0 && (
                <div className="absolute top-3 right-3 bg-purple-700/80 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-1 z-20">
                    <Star size={14} className="text-yellow-300" />
                    <span>Prestige {prestigeLevel}</span>
                </div>
            )}
        </div>
    );
};

export default TotemImageSection;