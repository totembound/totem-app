import React from 'react';
import { Dumbbell, Wind, Brain, Heart, Sparkles, Info } from 'lucide-react';
import { TotemAttributes } from '../types/types';
import Tooltip from './Tooltip';
import { BASE_ELDER_XP, PRESTIGE_XP_REQUIREMENT, STAGE_THRESHOLDS } from '../config/constants';

interface XPProgress {
    type: string;
    progress: number;
    remaining: number;
    nextThreshold: number;
    prestigeLevel: number;
}

interface TotemStatsPanelProps {
    attributes: TotemAttributes;
}

const TotemStatsPanel: React.FC<TotemStatsPanelProps> = ({ attributes }) => {
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
        const prestigeLevel = calculatePrestigeLevel(experience);
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

    const calculatePrestigeLevel = (experience: number): number => {
        if (experience <= BASE_ELDER_XP) return 0;
        return Math.floor((experience - BASE_ELDER_XP) / PRESTIGE_XP_REQUIREMENT);
    };

    const xpProgress = calculateXPProgress(attributes);

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
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {xpProgress.type === 'prestige'
                        ? `${xpProgress.remaining.toLocaleString()} XP to Prestige ${xpProgress.prestigeLevel + 1}`
                        : `${xpProgress.remaining.toLocaleString()} XP to next stage`}
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
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30">
                            <Dumbbell size={16} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Strength</div>
                            <div className="font-medium">{attributes.strength}</div>
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                            <Wind size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Agility</div>
                            <div className="font-medium">{attributes.agility}</div>
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                            <Brain size={16} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Wisdom</div>
                            <div className="font-medium">{attributes.wisdom}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Stats */}
            <div>
                <h3 className="text-md font-semibold mb-3">Current Status</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-pink-100 dark:bg-pink-900/30">
                            <Heart size={16} className="text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Happiness</div>
                            <div className="font-medium">{attributes.happiness}/100</div>
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
                            <Sparkles size={16} className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Experience</div>
                            <div className="font-medium">{attributes.experience.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TotemStatsPanel;