import React, { useContext, useEffect } from 'react';
import { GameState } from '../../types/types';
import { ChallengeRunStateContext } from './challenge-run-state';

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
  // Report run-state changes up to ChallengeDialog (locks the difficulty
  // selector mid-run). No-op when no listener is mounted.
  const reportRunState = useContext(ChallengeRunStateContext);
  useEffect(() => {
    reportRunState?.(gameState);
  }, [gameState, reportRunState]);

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

      {(gameState === 'success' || gameState === 'failed') && (
        <div className="flex justify-between items-center">
          {ticker}
          <button
            className={`py-2 px-4 ${gameState === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-lg transition-colors duration-200`}
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
