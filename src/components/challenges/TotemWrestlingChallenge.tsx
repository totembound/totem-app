import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, AlertCircle } from 'lucide-react';

type GameState = 'ready' | 'playing' | 'success' | 'failed';

type GameSettings = {
  initialPlayerScore: number;
  initialComputerScore: number;
  computerIncreaseRate: number;
  playerClickValue: number;
  minimumScore: number;
  timeLimit: number;
};

interface TotemWrestlingChallengeProps {
  difficulty?: number;
  strength?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const TotemWrestlingChallenge: React.FC<TotemWrestlingChallengeProps> = ({
  difficulty = 2,
  strength = 10,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail = () => console.log('Challenge failed')
}) => {
  // Game state management
  const [gameState, setGameState] = useState<GameState>('ready');
  const [playerScore, setPlayerScore] = useState<number>(50);
  const [computerScore, setComputerScore] = useState<number>(50);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(1000);
  const [finalScore, setFinalScore] = useState<number>(0);

  // References for timer implementation
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Calculate game settings based on difficulty and strength
  const gameSettings: GameSettings = {
    initialPlayerScore: 50,
    initialComputerScore: 50,
    computerIncreaseRate: 0.3 + (difficulty * 0.2),
    playerClickValue: strength * 0.5,
    minimumScore: 80 + (difficulty * 20),
    timeLimit: 12 - (difficulty * 2),
  };

  // Use relative sizes based on container width
  const backgroundWidth = containerWidth;
  const characterWidth = containerWidth * 0.43; // 43% of container width (512/1184 ≈ 0.43)

  // Calculate the maximum movement distance
  const maxMovement = backgroundWidth - characterWidth;

  // Calculate final game score based on win condition and time elapsed
  const calculateGameScore = useCallback((isWin: boolean, timeElapsed: number, timeLimit: number): number => {
    if (!isWin) return 0; // No score for losing

    if (timeElapsed >= timeLimit) {
      // Player won when the timer ran out
      return 1000;
    }

    // Player won by reaching the instant win condition
    // Calculate score based on how quickly they won, up to 2000 points (changed from 5000)
    const timePercentage = 1 - (timeElapsed / timeLimit);
    return 1000 + Math.round(timePercentage * 1000); // 1000 to 2000 range (changed from 4000)

  }, []);

  // Update container width on mount and window resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    // Initial width calculation
    updateWidth();

    // Add resize listener
    window.addEventListener('resize', updateWidth);

    // Cleanup
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate character position based on scores using ratio
  const calculatePosition = useCallback((player: number, computer: number): number => {
    // Calculate ratio between scores
    const ratio = player / computer;

    // Map ratio from 0.5 to 2.0 to normalized position from 0 to 1
    // When ratio is 1.0 (equal scores), normalizedPosition will be 0.5 (center)
    let normalizedPosition;

    if (ratio >= 2) {
      // Player score is double or more, max position (right)
      normalizedPosition = 1;
    } else if (ratio <= 0.5) {
      // Computer score is double or more, min position (left)
      normalizedPosition = 0;
    } else {
      // For ratios between 0.5 and 2.0, create smooth transition
      // This maps 0.5 -> 0, 1.0 -> 0.5, and 2.0 -> 1.0
      normalizedPosition = (ratio - 0.5) / 1.5;
    }

    // Convert normalized position (0 to 1) to actual pixel position
    const position = normalizedPosition * maxMovement;

    // Ensure position stays within bounds (shouldn't be necessary but added for safety)
    return Math.max(0, Math.min(maxMovement, position));
  }, [maxMovement]);

  const characterPosition = calculatePosition(playerScore, computerScore);

  // Function to handle game ending (extracted to avoid duplication)
  const handleGameEnd = useCallback((success: boolean, elapsedTime: number | null = null) => {
    // Clear any active timers
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (success) {
      const finalElapsedTime = elapsedTime !== null ? elapsedTime : gameSettings.timeLimit;
      const score = calculateGameScore(true, finalElapsedTime, gameSettings.timeLimit);
      setFinalScore(score);
      setGameState('success');
      onComplete(score);
    } else {
      setFinalScore(0);
      setGameState('failed');
      onFail();
    }
  }, [gameSettings.timeLimit, calculateGameScore, onComplete, onFail]);

  // Start the timer - fixed implementation
  const startTimer = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    // Calculate when the timer should end
    const now = Date.now();
    const duration = gameSettings.timeLimit * 1000; // convert seconds to milliseconds
    endTimeRef.current = now + duration;

    // Set initial timeLeft
    setTimeLeft(gameSettings.timeLimit);

    // Start a new timer that updates every 100ms for smoother countdown
    timerRef.current = window.setInterval(() => {
      if (endTimeRef.current === null) return;

      const now = Date.now();
      const remaining = Math.max(0, endTimeRef.current - now);
      const remainingSeconds = remaining / 1000;

      // Update timeLeft
      setTimeLeft(remainingSeconds);

      // Check if timer has expired
      if (remainingSeconds <= 0) {
        // Clear timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Get latest scores for comparison (not using state variables directly)
        const currentPlayerScore = playerScore;
        const currentComputerScore = computerScore;

        // End game based on final scores
        handleGameEnd(currentPlayerScore > currentComputerScore);
      }
    }, 100); // Update more frequently for smoother countdown

  }, [gameSettings.timeLimit, handleGameEnd, playerScore, computerScore]);

  // Initialize the game
  const startGame = useCallback(() => {
    // Set both scores to be equal at start
    setPlayerScore(gameSettings.initialPlayerScore);
    setComputerScore(gameSettings.initialComputerScore);
    setGameState('playing');
    setFinalScore(0);

    // Start the timer
    startTimer();
  }, [gameSettings.initialPlayerScore, gameSettings.initialComputerScore, startTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle player clicks on the game area
  const handleGameAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;

    // Get the game area element's bounding rectangle
    const gameAreaRect = gameAreaRef.current?.getBoundingClientRect();

    if (!gameAreaRect) return;

    // Check if the click is within the bounds of the game area
    const x = e.clientX;
    const y = e.clientY;

    if (
      x >= gameAreaRect.left &&
      x <= gameAreaRect.right &&
      y >= gameAreaRect.top &&
      y <= gameAreaRect.bottom
    ) {
      // Click is within the game area boundaries
      setPlayerScore(prev => prev + gameSettings.playerClickValue);
    }
  }, [gameState, gameSettings.playerClickValue]);

  // Computer score increase effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setComputerScore(prev => prev + gameSettings.computerIncreaseRate);
    }, 100);

    return () => clearInterval(timer);
  }, [gameState, gameSettings.computerIncreaseRate]);

  // Check for instant win condition
  useEffect(() => {
    if (gameState !== 'playing' || endTimeRef.current === null) return;

    if (playerScore >= gameSettings.minimumScore && playerScore >= computerScore * 2) {
      // Calculate time elapsed for the instant win
      const now = Date.now();
      const elapsed = (gameSettings.timeLimit * 1000) - (endTimeRef.current - now);
      const elapsedSeconds = Math.min(gameSettings.timeLimit, elapsed / 1000);

      // End game with win
      handleGameEnd(true, elapsedSeconds);
    }
  }, [playerScore, computerScore, gameSettings.minimumScore, gameSettings.timeLimit, gameState, handleGameEnd]);

  // Check for instant lose condition
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (computerScore >= gameSettings.minimumScore && computerScore >= playerScore * 2) {
      // End game with loss
      handleGameEnd(false);
    }
  }, [playerScore, computerScore, gameSettings.minimumScore, gameState, handleGameEnd]);

  // Show alert when time is running low
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 5 && gameState === 'playing') {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [timeLeft, gameState]);

  // Score ticker component - similar to second code
  const scoreTicker = (
    <div className="text-gray-300 font-bold">
      Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s | Score: {Math.floor(finalScore)}
    </div>
  );

  // Game content rendering based on state
  const renderGameContent = () => {
    return (
      <>
        {/* Game area with flexible height */}
        <div className="bg-slate-800 rounded-lg mb-4">
          <div 
            ref={gameAreaRef}
            className="relative w-full bg-slate-700 rounded-lg overflow-hidden cursor-pointer"
            onClick={handleGameAreaClick}
          >
            {/* Static Background Image */}
            <img
              src="/challenges/forest-background.png"
              alt="Background"
              className="w-full object-cover"
            />

            {/* Moving Character (Foreground) */}
            <div
              className="absolute bottom-0 transition-all duration-100"
              style={{
                width: `${(characterWidth / backgroundWidth) * 100}%`,
                left: `${(characterPosition / backgroundWidth) * 100}%`,
              }}
            >
              <img
                src="/challenges/bearwolfstandoff.png"
                alt="Game Character"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Controls and buttons section - below the game area */}
        <div>
          {gameState === 'ready' && (
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                transition-colors duration-200"
              onClick={startGame}
              type="button"
            >
              Start Challenge
            </button>
          )}

          {gameState === 'playing' && (
            <button
              className="w-full py-2 px-4 bg-gray-400 dark:bg-gray-600 text-white rounded-lg cursor-not-allowed"
              disabled={true}
              type="button"
            >
              {scoreTicker}
            </button>
          )}

          {gameState === 'success' && (
            <div className="flex justify-between items-center">
              {scoreTicker}
              <button
                className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 
                  transition-colors duration-200"
                onClick={startGame}
                type="button"
              >
                Try Again
              </button>
            </div>
          )}

          {gameState === 'failed' && (
            <div className="flex justify-between items-center">
              {scoreTicker}
              <button
                className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 
                  transition-colors duration-200"
                onClick={startGame}
                type="button"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      {renderGameContent()}
    </div>
  );
};

export default TotemWrestlingChallenge;