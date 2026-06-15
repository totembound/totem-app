import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { ArrowRight, Clock, GaugeCircle, Heart, Trophy, Sparkles, Award, Dumbbell, Wind, Brain, Scale } from 'lucide-react';
import { DEFAULT_MAX_DAILY_ATTEMPTS } from '../../config/constants';
import { CURRENCY_NAMES } from '../../config/constants';
import { getMasteryTierByIndex } from '../../config/config-loader';
import MasteryFrame from './MasteryFrame';
import { MASTERY_TIER_COLOR } from './mastery-tier-colors';

type AffinityType = 'strength' | 'agility' | 'wisdom' | 'balance';

/** Progress-bar fill tint for the tier being worked TOWARD — matches the MasteryFrame ring colors. */
const MASTERY_TIER_BAR: Record<number, string> = {
    1: 'bg-amber-600 dark:bg-amber-500',        // toward Bronze
    2: 'bg-gray-400 dark:bg-gray-300',          // toward Silver
    3: 'bg-yellow-500 dark:bg-yellow-400',      // toward Gold
    4: 'bg-slate-400 dark:bg-slate-300',        // toward Platinum
    5: 'bg-cyan-500 dark:bg-cyan-400',          // toward Diamond
};

/** Affinity icon + label + tint (matches the codex wording; colors follow the card's own convention). */
const AFFINITY_META: Record<AffinityType, { label: string; Icon: React.ElementType; color: string }> = {
    strength: { label: 'Strength', Icon: Dumbbell, color: 'text-red-500' },
    agility:  { label: 'Agility',  Icon: Wind,     color: 'text-emerald-500' },
    wisdom:   { label: 'Wisdom',   Icon: Brain,    color: 'text-blue-500' },
    balance:  { label: 'Balance',  Icon: Scale,    color: 'text-purple-500' },
};

export interface ChallengeMastery {
    tier: number;
    tierName: string;
    completions: number;
    nextTierAt: number | null;
    completionsToNext: number | null;
    xpMultiplier: number;
    difficultyUnlocked: boolean;
    maxDifficulty: number;
    preferredDifficulty: number | null;
}

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
    /** Account/challenge-level mastery — renders the frame regardless of selected totem. */
    mastery?: ChallengeMastery;
    /** Transient — true right after this challenge tiered up; MasteryFrame plays a one-shot glow. */
    justTieredUp?: boolean;
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
    mastery,
    justTieredUp = false,
    requirements,
    onStart
}) => {
    const { getEligibleTotems } = useGame();
    const stage = requirements.stage;
    const eligibleTotems = getEligibleTotems(id);
    const meetsRequirements = eligibleTotems.length > 0;
    // Stage curve mirrors the backend per-challenge essenceReward values
    // (challenges-service.js) — all 12 follow 10/15/20 by required stage.
    const ESSENCE_BY_STAGE = [10, 15, 20] as const;
    const essenceReward = ESSENCE_BY_STAGE[stage] ?? 20;
    // Base XP ceiling = maxScore / 100 (10/20/30 by minStage). The mastery tier multiplier
    // scales it; difficulty does NOT (maxScore is fixed — difficulty only affects how much
    // of the ceiling you can reach). So a Diamond (×3) Garden Pest Patrol tops out at 30 XP.
    const baseMaxXp = maxScore === 1000 ? 10 : maxScore === 3000 ? 30 : 20;
    const maxExpReward = Math.round(baseMaxXp * (mastery?.xpMultiplier ?? 1));
    const affinity = AFFINITY_META[affinityType];
    const AffinityIcon = affinity.Icon;
    const affinityRequirement =
        affinityType === 'strength' ? `${requirements.strength}+`
        : affinityType === 'agility' ? `${requirements.agility}+`
        : affinityType === 'wisdom' ? `${requirements.wisdom}+`
        : 'Any totem';

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
        <div className="flex flex-col gap-2 pt-1">
            <div className="text-sm text-gray-500 dark:text-gray-300 font-medium">
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

    const masteryTier = mastery?.tier ?? 0;

    return (
        <MasteryFrame tier={masteryTier} justTieredUp={justTieredUp}>
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
            <div className="p-4 space-y-2">
                
                {/* Daily Attempts */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Daily Attempts:
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                            (Resets 00:00 UTC)
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {attemptsLeft}/{maxAttempts}
                        </span>
                    </div>
                </div>
                
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

                {/* Mastery — account/challenge-level inline stat, shown regardless of selected totem */}
                {mastery && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Award className={`w-5 h-5 ${MASTERY_TIER_COLOR[mastery.tier] ?? MASTERY_TIER_COLOR[0]}`} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Mastery:</span>
                        </div>
                        <span className={`font-semibold ${mastery.tier > 0
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-500 dark:text-gray-400'}`}>
                            {mastery.tier > 0
                                ? `${mastery.tierName} · ×${parseFloat(mastery.xpMultiplier.toFixed(2))} XP`
                                : 'Novice'}
                        </span>
                    </div>
                )}

                {/* Mastery progress — a COMPLETIONS tally toward the next tier (not an XP bar).
                    Thin tier-tinted bar + "N to <Tier>" label; nudges gently when ≤5 away.
                    At Diamond there is no next tier, so a maxed state replaces the bar. */}
                {mastery && (() => {
                    const nextTierName = getMasteryTierByIndex(mastery.tier + 1)?.name;
                    if (mastery.nextTierAt != null && mastery.completionsToNext != null && nextTierName) {
                        // Bar shows progress WITHIN the current tier band (diff from the tier's
                        // own threshold), so it starts empty right after a tier-up rather than
                        // carrying over the lifetime completion count.
                        const curTierMin = getMasteryTierByIndex(mastery.tier)?.minCompletions ?? 0;
                        const span = Math.max(1, mastery.nextTierAt - curTierMin);
                        const inTier = Math.max(0, mastery.completions - curTierMin);
                        const pct = Math.min(100, Math.max(0, (inTier / span) * 100));
                        const isNudge = mastery.completionsToNext > 0 && mastery.completionsToNext <= 5;
                        return (
                            <div className="flex items-center gap-2">
                                <div
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={span}
                                    aria-valuenow={inTier}
                                    aria-label={`${inTier} of ${span} completions in this tier toward ${nextTierName} mastery`}
                                    title={`${inTier}/${span} completions this tier (not XP)`}
                                    className="flex-1 min-w-0 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
                                >
                                    <div
                                        className={`h-full rounded-full ${MASTERY_TIER_BAR[mastery.tier + 1] ?? MASTERY_TIER_BAR[5]}
                                            ${isNudge ? 'animate-pulse motion-reduce:animate-none' : ''}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className={`shrink-0 text-xs ${isNudge
                                    ? 'font-semibold text-amber-600 dark:text-amber-400 animate-pulse motion-reduce:animate-none'
                                    : 'text-gray-500 dark:text-gray-400'}`}>
                                    {mastery.completionsToNext} to {nextTierName}{isNudge ? '!' : ''}
                                </span>
                            </div>
                        );
                    }
                    if (mastery.tier > 0 && !nextTierName) {
                        // Diamond — top tier reached, no bar to fill.
                        return (
                            <div className="flex items-center justify-end gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" aria-hidden="true" />
                                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                                    Max mastery — {mastery.completions} completions
                                </span>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Reward Info */}
                <RewardsSection />

                {/* Requirements — affinity row doubles as the challenge's type indicator.
                    Stage is intentionally omitted here (already shown as the badge on the image). */}
                <div className="pt-1">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">
                        Requirements
                    </h4>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AffinityIcon className={`w-5 h-5 ${affinity.color}`} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{affinity.label}:</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {affinityRequirement}
                        </span>
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
        </MasteryFrame>
    );
};

export default ChallengePanel;
