import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { ArrowRight, Clock, GaugeCircle, Heart, Trophy, Sparkles } from 'lucide-react';
import { DEFAULT_MAX_DAILY_ATTEMPTS } from '../../config/constants';
import { CURRENCY_NAMES } from '../../config/constants';

type AffinityType = 'strength' | 'agility' | 'wisdom' | 'balance';

interface ChallengePanelProps {
    id: string;
    title: string;
    description: string;
    image: string;
    affinityType: AffinityType;
    highScore: number;
    attemptsLeft: number;
    maxAttempts?: number;
    maxScore?: number;
    requirements: {
        stage: number;
        strength: number;
        agility: number;
        wisdom: number;
    };
    onStart: () => void;
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({
    id,
    title,
    description,
    image,
    affinityType,
    highScore,
    attemptsLeft,
    maxAttempts = DEFAULT_MAX_DAILY_ATTEMPTS,
    maxScore,
    requirements,
    onStart
}) => {
    const { getEligibleTotems } = useGame();
    const stage = requirements.stage;
    const eligibleTotems = getEligibleTotems(id);
    const meetsRequirements = eligibleTotems.length > 0;
    const ESSENCE_BY_STAGE = [10, 15, 20] as const;
    const essenceReward = ESSENCE_BY_STAGE[stage] ?? 20;
    const maxExpReward = maxScore === 1000 ? 10 : maxScore === 3000 ? 30 : 20;

    const _getAffinityColor = () => {
        switch(affinityType) {
            case 'strength':
                return "bg-red-500/10 text-red-700 dark:text-red-400";
            case 'agility':
                return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
            case 'wisdom':
                return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
            default:
                return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
        }
    };
    
    const getStageBadgeStyle = () => {
        switch(affinityType) {
            case 'strength':
                return "bg-red-400 text-white";
            case 'agility':
                return "bg-emerald-500 text-white";
            case 'wisdom':
                return "bg-blue-500 text-white";
            default:
                return "bg-purple-500 text-white";
        }
    };
    
    const RewardsSection = () => (
        <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Rewards
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GaugeCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Experience:
                    </span>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Up to {maxExpReward} XP
                </span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {CURRENCY_NAMES.SOFT}:
                    </span>
                </div>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    +{essenceReward}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Happiness:
                    </span>
                </div>
                <span className="font-semibold text-pink-600 dark:text-pink-400">
                    +10
                </span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full">
            {/* Header with background image */}
            <div className="relative h-40">
                {image && (
                    <img 
                        src={image}
                        alt={`${affinityType} challenge background`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
                    <div className="absolute inset-0 p-4 flex flex-col justify-start">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        <span className={`
                            px-3 py-1 rounded-full text-sm font-semibold shadow-md
                            ${getStageBadgeStyle()}
                        `}>
                            Stage {requirements.stage + 1}+
                        </span>
                    </div>
                    <p className="mt-4 text-sm text-gray-200 line-clamp-3">{description}</p>
                </div>
            </div>

            {/* Stats Section */}
            <div className="p-4 space-y-4">
                {/* Current Progress */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">High Score:</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {highScore > 0 ? highScore.toLocaleString() : '---'}
                    </span>
                </div>

                {/* Daily Attempts */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Daily Attempts:
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {attemptsLeft}/{maxAttempts}
                        </span>
                        <span className="text-xs text-gray-500">
                            (Resets 00:00 UTC)
                        </span>
                    </div>
                </div>

                {/* Reward Info */}
                <RewardsSection />

                {/* Requirements Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Requirements
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {affinityType === 'strength' && (
                            <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20 
                                text-red-700 dark:text-red-400">
                                Strength: {requirements.strength}
                            </div>
                        )}
                        {affinityType === 'agility' && (
                            <div className="text-sm px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 
                                text-emerald-700 dark:text-emerald-400">
                                Agility: {requirements.agility}
                            </div>
                        )}
                        {affinityType === 'wisdom' && (
                            <div className="text-sm px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 
                                text-blue-700 dark:text-blue-400">
                                Wisdom: {requirements.wisdom}
                            </div>
                        )}
                        {affinityType === 'balance' && (
                            <div className="text-sm px-3 py-1.5 rounded-md bg-purple-50 dark:bg-purple-900/20 
                            text-purple-700 dark:text-purple-400">
                                None
                            </div>
                        )}
                        <div className="text-sm px-3 py-1.5 rounded-md bg-purple-50 dark:bg-purple-900/20 
                            text-purple-700 dark:text-purple-400">
                            Stage: {requirements.stage + 1}+
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="mt-auto p-4 pt-0">
                <button
                    onClick={onStart}
                    disabled={!meetsRequirements || attemptsLeft === 0}
                    className={`w-full py-2.5 px-4 rounded-lg text-white transition-colors flex items-center justify-center gap-2
                        ${meetsRequirements && attemptsLeft > 0
                            ? 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-600'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                >
                    {!meetsRequirements
                        ? 'Requirements Not Met'
                        : attemptsLeft === 0
                            ? 'No Attempts Left'
                            : (
                                <>
                                    Start Challenge
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                </button>
            </div>
        </div>
    );
};

export default ChallengePanel;
