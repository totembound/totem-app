import React from 'react';
import { Dumbbell, Wind, Brain, Heart, Drumstick, Info, Lock } from 'lucide-react';
import { TotemAttributes } from '../types/types';
import Tooltip from './Tooltip';
import { BASE_ELDER_XP, PRESTIGE_XP_REQUIREMENT, STAGE_THRESHOLDS, HUNGER_TRAIN_MIN } from '../config/constants';
import { computePrestigeLevel } from '../utils/prestige';
import { getTraitById, LEARNED_STAGE_GATE, AWAKENED_STAGE_GATE, type TraitSlot } from '../config/traits';
import { TraitIcon, SLOT_COLOR_CLASSES, getTraitTooltipContent } from '../utils/traitIcons';
import { deriveHunger, useFocusNow } from '../utils/hunger';

interface XPProgress {
    type: string;
    progress: number;
    remaining: number;
    nextThreshold: number;
    prestigeLevel: number;
}

interface TotemStatsPanelProps {
    attributes: TotemAttributes;
    traits?: {
        innate: string | null;
        learned: string | null;
        awakened: string | null;
    } | null;
    /** Open the shared trait picker for a slot. When omitted, unchosen rows are read-only. */
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

const TotemStatsPanel: React.FC<TotemStatsPanelProps> = ({ attributes, traits, onChooseTrait }) => {
    const calculateXPProgress = (attributes: TotemAttributes): XPProgress => {
        const { experience, stage } = attributes;
        
        // For non-Elder stages
        if (stage < 4) { // Remember stage is 0-based
            const nextThreshold = STAGE_THRESHOLDS[stage + 1];
            const currentThreshold = STAGE_THRESHOLDS[stage];
            const progress = ((experience - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
            const remaining = nextThreshold - experience;
            return {
                progress: Math.min(100, progress),
                remaining,
                nextThreshold,
                type: 'stage',
                prestigeLevel: 0
            };
        }
        
        // For Elder stage (Prestige calculations)
        const prestigeLevel = computePrestigeLevel(experience, stage);
        const nextPrestigeThreshold = BASE_ELDER_XP + ((prestigeLevel + 1) * PRESTIGE_XP_REQUIREMENT);
        const currentPrestigeThreshold = BASE_ELDER_XP + (prestigeLevel * PRESTIGE_XP_REQUIREMENT);
        const progress = ((experience - currentPrestigeThreshold) / PRESTIGE_XP_REQUIREMENT) * 100;
        const remaining = nextPrestigeThreshold - experience;

        return {
            progress: Math.min(100, progress),
            remaining,
            nextThreshold: nextPrestigeThreshold,
            type: 'prestige',
            prestigeLevel
        };
    };

    const xpProgress = calculateXPProgress(attributes);

    // Hunger decays ~1/hour; re-derive from the server snapshot so the value is
    // current on every render/navigation/focus without an API refetch.
    const now = useFocusNow();
    const hunger = deriveHunger(attributes, now);
    const isHungry = hunger < HUNGER_TRAIN_MIN;

    return (
        <div className="space-y-6">

            {/* Experience Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                        {xpProgress.type === 'prestige' ? 'Prestige Progress' : 'Experience Progress'}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                        {Math.round(xpProgress.progress)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className={`rounded-full h-2.5 transition-all duration-500 ${
                            xpProgress.type === 'prestige' 
                                ? 'bg-purple-600 dark:bg-purple-500'
                                : 'bg-blue-600 dark:bg-blue-500'
                        }`}
                        style={{ width: `${xpProgress.progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <span>
                        {xpProgress.type === 'prestige'
                            ? `${xpProgress.remaining.toLocaleString()} XP to Prestige ${xpProgress.prestigeLevel + 1}`
                            : `${xpProgress.remaining.toLocaleString()} XP to next stage`}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium tabular-nums">
                        {attributes.experience.toLocaleString()} XP
                    </span>
                </div>
            </div>

            {/* Vitals — current condition. Experience number is omitted because the
                progress bar above already conveys it. */}
            <div>
                <h3 className="text-md font-semibold mb-3">Vitals</h3>
                <div className="grid grid-cols-2 gap-3">
                    <Tooltip content="Happiness reflects your totem's mood. Training and expeditions lower it; feeding, treats, and completing challenges raise it. Below 20, your totem refuses to train." position="top">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 cursor-help">
                            <div className="p-1.5 rounded-md bg-pink-100 dark:bg-pink-900/30">
                                <Heart size={16} className="text-pink-600 dark:text-pink-400" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Happiness</div>
                                <div className="font-medium">{attributes.happiness}/100</div>
                            </div>
                        </div>
                    </Tooltip>
                    <Tooltip content="Hunger drops ~1 per hour and is restored by feeding (+30). Below 40 training gets your totem twice as unhappy; below 20 it's too hungry to train at all." position="top">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 cursor-help">
                            <div className={`p-1.5 rounded-md ${isHungry ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                                <Drumstick size={16} className={isHungry ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'} />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    Hunger
                                    {isHungry && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Hungry</span>
                                    )}
                                </div>
                                <div className="font-medium">{hunger}/100</div>
                            </div>
                        </div>
                    </Tooltip>
                </div>
            </div>

            {/* Base Stats */}
            <div>
                <h3 className="text-md font-semibold mb-3 flex items-center">
                    Base Stats
                    <div className="ml-1 group relative">
                        <Tooltip content="Base stats determine your Totem's strengths in challenges">
                            <Info size={14} className="text-gray-400" />
                        </Tooltip>
                    </div>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    <Tooltip content="Strength powers your totem through brute-force challenges and combat-style trials." position="top">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 cursor-help">
                            <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30">
                                <Dumbbell size={16} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Strength</div>
                                <div className="font-medium">{attributes.strength}</div>
                            </div>
                        </div>
                    </Tooltip>
                    <Tooltip content="Agility decides how quick and nimble your totem is — favored in dodge and speed-based challenges." position="top">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 cursor-help">
                            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                                <Wind size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Agility</div>
                                <div className="font-medium">{attributes.agility}</div>
                            </div>
                        </div>
                    </Tooltip>
                    <Tooltip content="Wisdom guides your totem through riddles, runes, and lore-based challenges." position="top">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 cursor-help">
                            <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                                <Brain size={16} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Wisdom</div>
                                <div className="font-medium">{attributes.wisdom}</div>
                            </div>
                        </div>
                    </Tooltip>
                </div>
            </div>

            {/* Traits — unchosen unlocked slots are tappable to open the shared picker (when
                onChooseTrait is provided); the same picker is reachable from the Details tab.
                Once Phase 2 effects ship, each filled row will also show its modifier (e.g. "+10% XP train"). */}
            {traits && (
                <div>
                    <h3 className="text-md font-semibold mb-3 flex items-center">
                        Traits
                        <div className="ml-1">
                            <Tooltip content="Every totem carries up to 3 traits — one at birth, one chosen when it matures, one when it ascends. They define personality and shape how it performs in challenges, expeditions, and care.">
                                <Info size={14} className="text-gray-400" />
                            </Tooltip>
                        </div>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(['innate', 'learned', 'awakened'] as TraitSlot[]).map((slot) => {
                            const traitId = traits[slot];
                            const def = getTraitById(traitId);
                            const gate = SLOT_GATE[slot];
                            const unlocked = attributes.stage >= gate;

                            const tooltipContent = getTraitTooltipContent({ slot, traitId, unlocked, requiredStage: gate });

                            if (def) {
                                return (
                                    <Tooltip key={slot} content={tooltipContent} position="top">
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 cursor-help">
                                            <div className="p-1.5 rounded-md bg-white dark:bg-gray-900">
                                                <TraitIcon traitId={def.id} size={16} colorBySlot />
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`text-xs ${SLOT_COLOR_CLASSES[slot]}`}>{SLOT_LABEL[slot]}</div>
                                                <div className="font-medium text-sm truncate">{def.name}</div>
                                            </div>
                                        </div>
                                    </Tooltip>
                                );
                            }

                            if (unlocked && slot !== 'innate') {
                                const chipInner = (
                                    <>
                                        <div className={`w-7 h-7 shrink-0 rounded-full border-2 border-dashed ${SLOT_COLOR_CLASSES[slot]}`} />
                                        <div className="min-w-0 text-left">
                                            <div className={`text-xs ${SLOT_COLOR_CLASSES[slot]}`}>{SLOT_LABEL[slot]}</div>
                                            <div className="font-medium text-sm text-amber-700 dark:text-amber-300">
                                                {onChooseTrait ? 'Choose →' : 'Unchosen'}
                                            </div>
                                        </div>
                                    </>
                                );
                                if (onChooseTrait) {
                                    return (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onChooseTrait(slot); }}
                                            className="w-full p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center gap-3 border border-dashed border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
                                        >
                                            {chipInner}
                                        </button>
                                    );
                                }
                                return (
                                    <Tooltip key={slot} content={tooltipContent} position="top">
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center gap-3 border border-dashed border-amber-300 dark:border-amber-700 cursor-help">
                                            {chipInner}
                                        </div>
                                    </Tooltip>
                                );
                            }

                            return (
                                <Tooltip key={slot} content={tooltipContent} position="top">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3 opacity-70 cursor-help">
                                        <div className="p-1.5 rounded-md bg-white dark:bg-gray-900 text-gray-400">
                                            <Lock size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs text-gray-500">{SLOT_LABEL[slot]}</div>
                                            <div className="text-xs text-gray-500">Stage {gate + 1}</div>
                                        </div>
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
};

export default TotemStatsPanel;