import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useUser } from '../../contexts/UserContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import BoulderBreakerChallenge from './BoulderBreakerChallenge';
import TotemWrestlingChallenge from './TotemWrestlingChallenge';
import { ActionType, ChallengeInfo, TotemAttributes, RateLimitError } from '../../types/types';
import { DEFAULT_MAX_DAILY_ATTEMPTS } from '../../config/constants';
import ExperienceEffect from '../effects/ExperienceEffect';
import RockFallDefenseChallenge from './RockFallDefenseChallenge';
import SpiritPathChallenge from './SpiritPathChallenge';
import RuneDecodingChallenge from './RuneDecodingChallenge';
import RingDiveChallenge from './RingDiveChallenge';
import DrumDanceChallenge from './DrumDanceChallenge';
import RuneCraftingChallenge from './RuneCraftingChallenge';
import StarMapChallenge from './StarMapChallenge';
import GardenPestControlChallenge from './GardenPestPatrolChallenge';

interface ChallengeGameProps {
    challengeId: string;
    tokenId: string;
    attributes: TotemAttributes;
    challengeType: string;
    difficulty: number;
    onClose: () => void;
    onCompleted?: () => void;
}

interface ChallengeStatus {
    dailyAttempts: number;
    attemptsRemaining: number;
    highScore: number;
    lastAttemptTime: number;
    totalAttempts: number;
    totalScore: number;
}

const ChallengeGame: React.FC<ChallengeGameProps> = ({
    challengeId,
    tokenId,
    attributes,
    challengeType,
    difficulty,
    onClose,
    onCompleted
}) => {
    const { updateTotem, handleRateLimitError } = useUser();
    const { completeChallenge, challengeState } = useGame();
    const { refreshAchievements } = useAchievements();
    const [_currentScore, setCurrentScore] = useState<number>(0);
    const [bestScore, setBestScore] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [showScoreEffect, setShowScoreEffect] = useState(false);

    // Get current challenge status
    const userStatus: ChallengeStatus = challengeState.userStatus[challengeId] || {
        dailyAttempts: 0,
        attemptsRemaining: DEFAULT_MAX_DAILY_ATTEMPTS,
        highScore: 0,
        lastAttemptTime: 0,
        totalAttempts: 0,
        totalScore: 0
    };

    const challenge: ChallengeInfo = challengeState.challenges[challengeId];

    const maxAttempts = challenge?.maxDailyAttempts || DEFAULT_MAX_DAILY_ATTEMPTS;
    const attemptsLeft = Number(userStatus.attemptsRemaining);
    const highScore = Number(userStatus.highScore);

    const handleScore = (score: number): void => {
        setCurrentScore(score);
        if (score > bestScore) {
            setBestScore(score);
        }
    };

    const calculateXpGain = (score: number, maxScore: number): number => {
        // Determine max XP based on difficulty
        let maxXP;
        switch (maxScore) {
            case 1000:
                maxXP = 10;
                break;
            case 2000:
                maxXP = 20;
                break;
            case 3000:
                maxXP = 30;
                break;
            default:
                maxXP = 10; // Default case
        }
        
        const xp = Math.floor((score * maxXP) / maxScore);
        return score > 0 ? Math.max(1, xp) : 0;
    };

    const handleSubmit = async (): Promise<void> => {
        try {
            setIsSubmitting(true);
            setError('');
            
            await completeChallenge(challengeId, tokenId, bestScore);
            await refreshAchievements();
            setShowScoreEffect(true);

            // Update totem state after score effect plays
            setTimeout(async () => {
                await updateTotem(tokenId, ActionType.None);
                setShowSuccess(true);
                onCompleted?.();
            }, 2000);
        }
        catch (error) {
            console.error('Complete challenge failed:', error);
            
            if (error instanceof RateLimitError) {
                handleRateLimitError(error);
            } else {
                setError('Failed to submit challenge');
            }
            setIsSubmitting(false);
        }
    };

    const exp = calculateXpGain(bestScore, Number(challenge.maxScore));

    return (
        <div className="space-y-4">
            {/* Stats Bar */}
            <div className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800/50
              rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">
                    Attempts: {attemptsLeft}/{maxAttempts}
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                    High: {highScore}
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                    Current: {bestScore}
                </span>
            </div>

            {/* Challenge Game */}
            <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100
              dark:border-gray-700 shadow-sm transition-opacity duration-200
              ${isSubmitting ? 'pointer-events-none opacity-50' : ''}
              ${showSuccess ? 'hidden' : ''}`}>
                {challengeType === 'strength' && challengeId === 'chl_boulder-breaker' && (
                    <BoulderBreakerChallenge
                        strength={attributes.strength}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'strength' && challengeId === 'chl_totem-wrestling' && (
                    <TotemWrestlingChallenge
                        strength={attributes.strength}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'strength' && challengeId === 'chl_rockfall-defense' && (
                    <RockFallDefenseChallenge
                        strength={attributes.strength}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'agility' && challengeId === 'chl_spirit-path' && (
                    <SpiritPathChallenge
                        agility={attributes.agility}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'agility' && challengeId === 'chl_aerial-ring-dive' && (
                    <RingDiveChallenge
                        agility={attributes.agility}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'agility' && challengeId === 'chl_spirit-dance' && (
                    <DrumDanceChallenge
                        agility={attributes.agility}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'wisdom' && challengeId === 'chl_ancient-runes' && (
                    <RuneDecodingChallenge
                        wisdom={attributes.wisdom}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'wisdom' && challengeId === 'chl_star-mapping' && (
                    <StarMapChallenge
                        wisdom={attributes.wisdom}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'wisdom' && challengeId === 'chl_spirit-weaving' && (
                    <RuneCraftingChallenge
                        wisdom={attributes.wisdom}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'balance' && challengeId === 'chl_garden-pest-patrol' && (
                    <GardenPestControlChallenge
                        strength={attributes.strength}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {/* Score effect overlay */}
                {showScoreEffect && (
                    <ExperienceEffect 
                        exp={exp}
                        onComplete={() => setShowScoreEffect(false)}
                    />
                )}
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 
                  rounded-lg p-4 flex items-start">
                    <svg className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5" 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="ml-3 text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
            )}

            {/* Success Alert */}
            {showSuccess && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 
                  rounded-lg p-4 flex items-start">
                    <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5" 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="ml-3 text-sm text-green-700 dark:text-green-200">
                        Challenge completed! Score: {bestScore}. You get EXP: {exp}, Happiness: 10
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex mt-4 gap-4">
                {showSuccess ? (
                    <button
                        onClick={onClose}
                        type="button"
                        className="flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium
                          bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                    >
                        Done
                    </button>
                ) : (
                    <>
                        <button
                            onClick={onClose}
                            type="button"
                            className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800
                              hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors
                              border border-gray-200 dark:border-gray-700 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || bestScore === 0 || attemptsLeft == 0}
                            type="button"
                            className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium
                                ${isSubmitting || bestScore === 0 || attemptsLeft == 0
                                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'}`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Score'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChallengeGame;