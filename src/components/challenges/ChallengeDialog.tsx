import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Heart, X } from 'lucide-react';
import { GameState, TotemData } from '../../types/types';
import { useGame } from '../../contexts/GameContext';
import { getGameDifficulty, getTotemStage, getRarityBorderColor } from '../../utils/totems';
import { getBusyReason } from '../../utils/totem-availability';
import ChallengeGame from './ChallengeGame';
import { ChallengeRunStateContext } from './challenge-run-state';
import { IPFS_GATEWAY_URL } from '../../config/constants';

interface ChallengeDialogProps {
    isOpen: boolean;
    challengeId: string;
    title: string;
    onClose: () => void;
    challengeType: string;
    requirements: {
        stage: number;
        strength: number;
        agility: number;
        wisdom: number;
    };
}

const TotemSelectionCard: React.FC<{
    totem: TotemData;
    challengeType: string;
    isSelected: boolean;
    isAvailable: boolean;
    busyReason: string | null;
    onClick: () => void;
}> = ({ totem, challengeType, isSelected, onClick, isAvailable, busyReason }) => {
    const rarityBorderColors = getRarityBorderColor(totem.attributes.rarity);
    const happiness = totem.attributes.happiness;
    // Color-code so a low-happiness totem (the one you'd start a challenge to cheer up) stands out.
    const happinessColor = happiness >= 60
        ? 'text-green-400'
        : happiness >= 30
            ? 'text-amber-400'
            : 'text-red-400';
    return (
    <div
        onClick={isAvailable ? onClick : undefined}
        className={`relative transition-all duration-200 transform rounded-lg overflow-hidden border
        ${rarityBorderColors.border}
        ${!isAvailable
            ? 'cursor-not-allowed'
            : `cursor-pointer ${isSelected ? `scale-105 ring-2 ${rarityBorderColors.ring}` : 'hover:scale-102'}`
        }`}
    >
        <div className="aspect-square relative">
            <div className={`w-full h-full transition-all duration-200 ${!isAvailable ? 'opacity-50 grayscale brightness-75' : ''}`}>
                <img
                    src={totem.image.replace('ipfs://', IPFS_GATEWAY_URL)}
                    alt={totem.displayName || totem.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Current happiness — challenges raise it, so surface which totem needs the boost */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 rounded-full px-1.5 py-0.5">
                <Heart size={12} className="text-pink-400" fill="currentColor" />
                <span className={`text-xs font-semibold ${happinessColor}`}>{happiness}</span>
            </div>

            {/* Unavailable overlay */}
            {!isAvailable && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="relative">
                        <img
                            src="/challenges/owl_walk.gif"
                            alt="Unavailable"
                            className="w-full h-full object-contain"
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-red-800 text-shadow-outline font-bold text-center px-1">
                            {busyReason || 'On Expedition'}
                        </span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-2">
                <h3 className="text-white truncate">{totem.displayName || totem.name}</h3>
            </div>
        </div>
        <div className="p-2 bg-white dark:bg-gray-700">
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">Stage: {getTotemStage(totem)}</span>
                <span className="text-gray-600 dark:text-gray-300">
                    {challengeType === 'strength' &&
                        <span>Str: {totem.attributes.strength}</span>
                    }
                    {challengeType === 'agility' &&
                        <span>Agi: {totem.attributes.agility}</span>
                    }
                    {challengeType === 'wisdom' &&
                        <span>Wis: {totem.attributes.wisdom}</span>
                    }
                </span>
            </div>
        </div>
    </div>
    );
};

/**
 * Difficulty selector — a 1/2/3 segmented control.
 *
 * - Lowering is always available (1..auto), pure accessibility.
 * - Raising above the stage-locked `auto` requires Gold+ mastery (raiseUnlocked),
 *   which extends the range to 1..maxSelectable.
 * - Levels above `maxSelectable` render disabled with a small lock hint so the
 *   gate is legible but never offered as a selectable out-of-range value.
 */
const DifficultySelector: React.FC<{
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    maxSelectable: number;
    auto: number;
    raiseUnlocked: boolean;
    disabled?: boolean;
    /** True when disabled because a run is in progress — adds the "locked during a run" hint. */
    lockedByRun?: boolean;
}> = ({ value, onChange, min, max, maxSelectable, auto, disabled, lockedByRun }) => {
    const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Difficulty</span>
            <div
                role="radiogroup"
                aria-label={`Challenge difficulty${lockedByRun ? ' (locked during a run)' : ''}`}
                title={lockedByRun ? 'Locked during a run' : undefined}
                className="inline-flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600"
            >
                {levels.map((level) => {
                    const isSelected = value === level;
                    const isLocked = level > maxSelectable;
                    const isAutoLevel = level === auto;
                    return (
                        <button
                            key={level}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`Difficulty ${level}${isAutoLevel ? ' (your stage)' : ''}${isLocked ? ' (locked — reach Gold mastery)' : lockedByRun ? ' (locked during a run)' : ''}`}
                            title={isLocked ? 'Reach Gold mastery to raise difficulty above your stage' : lockedByRun ? 'Locked during a run' : isAutoLevel ? 'Your stage-matched difficulty' : undefined}
                            disabled={disabled || isLocked}
                            onClick={() => !isLocked && onChange(level)}
                            className={`w-8 h-8 text-xs font-semibold transition-colors
                                ${isSelected
                                    ? 'bg-purple-600 text-white'
                                    : isLocked
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                        >
                            {level}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const ChallengeDialog: React.FC<ChallengeDialogProps> = ({
    isOpen,
    challengeId,
    title,
    onClose,
    challengeType,
    requirements
}) => {
    const { getEligibleTotems, isTotemAvailable, challengeState } = useGame();
    const [selectedTotem, setSelectedTotem] = useState<TotemData | null>(null);
    const [showSelection, setShowSelection] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    const handleCompleted = useCallback(() => setIsCompleted(true), []);
    const stage = requirements.stage;
    const name = selectedTotem?.displayName || selectedTotem?.name;

    // Mini-game run state, reported by ChallengeActionBar via context. Changing
    // difficulty remounts ChallengeGame (it's keyed on difficulty), which would
    // silently discard the run — so the selector locks while a run is in
    // progress ('playing') or has an unsubmitted score pending ('success'),
    // and re-enables when the game is idle ('ready') or failed with nothing
    // to lose (the accessibility flow: fail → lower difficulty → retry).
    const [runState, setRunState] = useState<GameState>('ready');
    const reportRunState = useCallback((state: GameState) => setRunState(state), []);
    const runLocked = runState === 'playing' || runState === 'success';

    // Stage-derived "auto" difficulty (today's forced value = the default).
    const auto = selectedTotem ? getGameDifficulty(selectedTotem, requirements.stage) : 1;

    // Account/challenge-level mastery drives whether difficulty can be raised.
    const mastery = challengeState?.challenges?.[challengeId]?.mastery;
    const maxDifficulty = mastery?.maxDifficulty ?? 3;
    const raiseUnlocked = mastery?.difficultyUnlocked ?? false; // Gold+
    // Range: lowering is always allowed (1..auto); Gold+ unlocks raising (1..maxDifficulty).
    const maxSelectable = raiseUnlocked ? maxDifficulty : auto;
    const minSelectable = 1;

    // Selected difficulty — defaults to the player's remembered choice, else auto.
    const [selectedDifficulty, setSelectedDifficulty] = useState<number>(auto);

    // Reset/clamp the chosen difficulty whenever the totem (and thus auto) changes.
    useEffect(() => {
        if (!selectedTotem) return;
        const preferred = mastery?.preferredDifficulty ?? auto;
        const clamped = Math.min(maxSelectable, Math.max(minSelectable, preferred));
        setSelectedDifficulty(clamped);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTotem, auto, maxSelectable]);

    const difficulty = Math.min(maxSelectable, Math.max(minSelectable, selectedDifficulty));

    if (!isOpen) return null;

    const eligibleTotems = getEligibleTotems(challengeId);

    const handleTotemSelect = (totem: TotemData) => {
        setSelectedTotem(totem);
        setShowSelection(false);
        setRunState('ready'); // fresh game mount — clear any stale run lock
    };

    return createPortal(
        <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-800 sm:bg-transparent sm:dark:bg-transparent sm:flex sm:items-center sm:justify-center sm:p-4">
            {/* Backdrop - visible on desktop only */}
            <div className="hidden sm:block fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[calc(100vh-2rem)] bg-white dark:bg-gray-800 sm:rounded-lg shadow-xl flex flex-col overflow-hidden">
                {/* Header Section - Always Visible */}
                <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                        {showSelection ? 'Select a Totem' : title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {showSelection ? (
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                        {eligibleTotems.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 dark:text-gray-400">
                                    None of your totems meet the requirements for this challenge:
                                    <br />
                                    {challengeType === 'strength' && `Strength: ${requirements.strength}`}
                                    {challengeType === 'agility' && `Agility: ${requirements.agility}`}
                                    {challengeType === 'wisdom' && `Wisdom: ${requirements.wisdom}`}
                                    <br />
                                    Stage: {stage + 1}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                                {eligibleTotems.map((totem) => (
                                    <TotemSelectionCard
                                        key={totem.id}
                                        totem={totem}
                                        challengeType={challengeType}
                                        isSelected={selectedTotem?.id === totem.id}
                                        isAvailable={isTotemAvailable(totem.id)}
                                        busyReason={getBusyReason(totem.attributes)}
                                        onClick={() => handleTotemSelect(totem)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 min-h-0">
                        {/* Info Bar */}
                        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900">
                            <div className="flex flex-row items-center justify-between gap-2 p-3 sm:p-4 pb-1.5 sm:pb-2">
                                {/* Selected Totem Info — min-w-0 + truncate so long nicknames
                                    never crowd the difficulty selector at 375px. */}
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {!isCompleted && (
                                        <button
                                            onClick={() => { setShowSelection(true); setRunState('ready'); }}
                                            className="shrink-0 p-1.5 sm:p-2 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-800 rounded transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                    <img
                                        src={selectedTotem?.image.replace('ipfs://', IPFS_GATEWAY_URL)}
                                        alt={name}
                                        className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
                                    />
                                    <div className="min-w-0 text-gray-900 dark:text-gray-100">
                                        <p className="text-sm sm:text-base truncate">{name}</p>
                                        <p className="text-xs sm:text-sm opacity-80">Stage {getTotemStage(selectedTotem!)}</p>
                                    </div>
                                </div>
                                {/* Difficulty selector — always shown so the mechanic is visible; levels above
                                    what's unlocked render locked/disabled, and a single available level is
                                    non-changeable. Locked while a run is in progress (changing difficulty
                                    remounts the game and would discard the run). */}
                                <div className="shrink-0">
                                    <DifficultySelector
                                        value={difficulty}
                                        onChange={setSelectedDifficulty}
                                        min={minSelectable}
                                        max={maxDifficulty}
                                        maxSelectable={maxSelectable}
                                        auto={auto}
                                        raiseUnlocked={raiseUnlocked}
                                        disabled={isCompleted || runLocked}
                                        lockedByRun={runLocked && !isCompleted}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Challenge Game Area */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                            {selectedTotem && (
                                <ChallengeRunStateContext.Provider value={reportRunState}>
                                    <ChallengeGame
                                        key={`${selectedTotem.id}-${difficulty}`}
                                        challengeId={challengeId}
                                        tokenId={selectedTotem.id}
                                        attributes={selectedTotem.attributes}
                                        challengeType={challengeType}
                                        difficulty={difficulty}
                                        onClose={onClose}
                                        onCompleted={handleCompleted}
                                    />
                                </ChallengeRunStateContext.Provider>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ChallengeDialog;