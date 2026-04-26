import React from 'react';
import { GameState } from '../../types/types';

interface ChallengeActionBarProps {
  gameState: GameState;
  score: number;
  timeLeft: number | null;
  onStart: () => void;
  onRestart: () => void;
  startLabel?: string;
  restartLabel?: string;
  extraStats?: React.ReactNode;
}

const ChallengeActionBar: React.FC<ChallengeActionBarProps> = ({
  gameState,
  score,
  timeLeft,
  onStart,
  onRestart,
  startLabel = 'Start Challenge',
  restartLabel = 'Try Again',
  extraStats,
}) => {
  const ticker = (
    <div className="text-gray-300 font-bold">
      Time: {timeLeft !== null ? timeLeft.toFixed(1) : '-'}s{extraStats} | Score: {Math.floor(score)}
    </div>
  );

  return (
    <div className="mt-4">
      {gameState === 'ready' && (
        <button
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700
            transition-colors duration-200"
          onClick={onStart}
          type="button"
        >
          {startLabel}
        </button>
      )}

      {gameState === 'playing' && (
        <button
          className="w-full py-2 px-4 bg-gray-400 dark:bg-gray-600 text-white rounded-lg cursor-not-allowed"
          disabled={true}
          type="button"
        >
          {ticker}
        </button>
      )}

      {gameState === 'success' && (
        <div className="flex justify-between items-center">
          {ticker}
          <button
            className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700
              transition-colors duration-200"
            onClick={onRestart}
            type="button"
          >
            {restartLabel}
          </button>
        </div>
      )}

      {gameState === 'failed' && (
        <div className="flex justify-between items-center">
          {ticker}
          <button
            className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700
              transition-colors duration-200"
            onClick={onRestart}
            type="button"
          >
            {restartLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChallengeActionBar;
