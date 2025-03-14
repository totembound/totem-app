import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useUser } from '../../contexts/UserContext';
import BoulderBreakerChallenge from './BoulderBreakerChallenge';
import TotemWrestlingChallenge from './TotemWrestlingChallenge';
import { ActionType, ChallengeInfo, TotemAttributes } from '../../types/types';
import { ethers } from 'ethers';
import ExperienceEffect from '../effects/ExperienceEffect';
import RockFallDefenseChallenge from './RockFallDefenseChallenge';
import SpiritPathChallenge from './SpiritPathChallenge';

interface ChallengeGameProps {
    challengeId: string;
    tokenId: string;
    attributes: TotemAttributes;
    challengeType: string;
    difficulty: number;
    onClose: () => void;
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
    onClose
}) => {
    const { updateTotem } = useUser();
    const { completeChallenge, challengeState } = useGame();
    const [currentScore, setCurrentScore] = useState<number>(0);
    const [bestScore, setBestScore] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [showScoreEffect, setShowScoreEffect] = useState(false);

    // Get current challenge status
    const userStatus: ChallengeStatus = challengeState.userStatus[ethers.id(challengeId)] || {
        dailyAttempts: 0,
        attemptsRemaining: 5,
        highScore: 0,
        lastAttemptTime: 0,
        totalAttempts: 0,
        totalScore: 0
    };
    
    const challenge: ChallengeInfo = challengeState.challenges[ethers.id(challengeId)];

    const attemptsLeft = 5 - Number(userStatus.dailyAttempts);
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
        
        return Math.floor((score * maxXP) / maxScore);
    };

    const handleSubmit = async (): Promise<void> => {
        try {
            setIsSubmitting(true);
            setError('');
            
            await completeChallenge(challengeId, tokenId, bestScore);
            setShowScoreEffect(true);

             // Update totem state after delay
             setTimeout(async () => {
                await updateTotem(BigInt(tokenId), ActionType.None);
                setShowSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 2000);
            }, 2000); // Wait for score effect to complete
        }
        catch (error) {
            console.error('Complete challenge failed:', error);
            setError('Failed to submit challenge');
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
                    Attempts: {attemptsLeft}/5
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                    High: {highScore}
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                    Current: {bestScore}
                </span>
            </div>

            {/* Challenge Game */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 
              dark:border-gray-700 shadow-sm">
                {challengeType === 'strength' && challengeId === 'strength-challenge-1' && (
                    <BoulderBreakerChallenge
                        strength={attributes.strength}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'strength' && challengeId === 'strength-challenge-2' && (
                    <TotemWrestlingChallenge
                        strength={attributes.strength}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'strength' && challengeId === 'strength-challenge-3' && (
                    <RockFallDefenseChallenge
                        strength={attributes.strength}
                        difficulty={difficulty}
                        onComplete={handleScore}
                    />
                )}
                {challengeType === 'agility' && challengeId === 'agility-challenge-1' && (
                    <SpiritPathChallenge
                        agility={attributes.agility}
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
            <div className="flex justify-between mt-4 gap-4">
                <button
                    onClick={onClose}
                    type="button"
                    className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 
                      hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors
                      border border-gray-200 dark:border-gray-700"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || bestScore === 0 || attemptsLeft == 0}
                    type="button"
                    className={`px-4 py-2 text-white rounded-lg transition-colors
                        ${isSubmitting || bestScore === 0 || attemptsLeft == 0
                            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'}`}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Score'}
                </button>
            </div>
        </div>
    );
};

export default ChallengeGame;