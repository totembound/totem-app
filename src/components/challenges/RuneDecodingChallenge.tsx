import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';

type GameSettings = {
  gridSize: number;
  patternLength: number;
  displaySpeed: number;
  maxAttempts: number;
  timeLimit: number;
};

interface RuneMemoryChallengeProps {
  difficulty?: number;
  wisdom?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const RuneMemoryChallenge: React.FC<RuneMemoryChallengeProps> = ({
  difficulty = 2,
  wisdom = 10,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail = () => console.log('Challenge failed')
}) => {
  // Game state management
  const [gameState, setGameState] = useState<GameState>('ready');
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerPattern, setPlayerPattern] = useState<number[]>([]);
  const [currentDisplay, setCurrentDisplay] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(0);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [gridSize, setGridSize] = useState<number>(0);
  const [isDisplayingPattern, setIsDisplayingPattern] = useState<boolean>(false);

  // References for timer implementation
  const containerRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const displayTimerRef = useRef<number | null>(null);
  const pausedTimeLeftRef = useRef<number | null>(null);

  // Calculate game settings based on difficulty and wisdom
  const gameSettings: GameSettings = {
    gridSize: 3, // Fixed 3x3 grid
    patternLength: Math.min(9, Math.max(5, Math.floor(difficulty * 2 + 3))), // 5 to 9 runes based on difficulty
    displaySpeed: Math.max(500, 1250 - (difficulty * 250)), // 500ms to 1000ms display time
    maxAttempts: wisdom - 9, // Wisdom determines number of attempts
    timeLimit: 20, // 20 seconds time limit
  };

  // Calculate the optimal grid size based on container dimensions
  useEffect(() => {
    const updateGridSize = () => {
      if (containerRef.current && gameAreaRef.current) {
        // Get container dimensions
        const containerWidth = gameAreaRef.current.clientWidth;
        const containerHeight = gameAreaRef.current.clientHeight;
        
        // Calculate the maximum square that can fit (with some padding)
        const maxSize = Math.min(containerWidth, containerHeight) * 0.9;
        
        setGridSize(maxSize);
      }
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  // Handle orientation changes for grid sizing
  useEffect(() => {
    const handleOrientationChange = () => {
      // Force re-render of grid when orientation changes
      if (containerRef.current && gameAreaRef.current) {
        const containerWidth = gameAreaRef.current.clientWidth;
        const containerHeight = gameAreaRef.current.clientHeight;
        const maxSize = Math.min(containerWidth, containerHeight) * 0.9;
        setGridSize(maxSize);
      }
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  // Calculate final game score based on win condition, attempts used, and time elapsed
  const calculateGameScore = useCallback((
    timeElapsed: number, 
    timeLimit: number, 
    attemptsUsed: number, 
  ): number => {
    // Base score depends on pattern length
    const baseScore = 1000;
    
    // Time bonus: Up to 50% bonus for quick completion
    const timePercentage = 1 - (timeElapsed / timeLimit);
    const timeBonus = baseScore * 0.5 * timePercentage;
    
    // Attempts bonus: Up to 50% bonus for using fewer attempts
    const attemptsBonus = baseScore * 0.5 - (attemptsUsed * 100);
    
    return Math.round(Math.max(0, timeBonus + attemptsBonus));
  }, []);

  // Generate a random pattern
  const generatePattern = useCallback(() => {
    const totalRunes = gameSettings.gridSize * gameSettings.gridSize;
    const newPattern: number[] = [];
    
    for (let i = 0; i < gameSettings.patternLength; i++) {
      newPattern.push(Math.floor(Math.random() * totalRunes));
    }
    
    setPattern(newPattern);
    return newPattern;
  }, [gameSettings.gridSize, gameSettings.patternLength]);

  // Pause the timer when displaying pattern
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (timeLeft !== null) {
      pausedTimeLeftRef.current = timeLeft;
    }
  }, [timeLeft]);

  // Function to handle game ending
  const handleGameEnd = useCallback((success: boolean, elapsedTime: number | null = null) => {
    // Clear any active timers
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (displayTimerRef.current) {
      window.clearInterval(displayTimerRef.current);
      displayTimerRef.current = null;
    }

    if (success) {
      const finalElapsedTime = elapsedTime !== null ? elapsedTime : gameSettings.timeLimit;
      const attemptsUsed = gameSettings.maxAttempts - attemptsLeft;
      const score = calculateGameScore(
        finalElapsedTime, 
        gameSettings.timeLimit, 
        attemptsUsed, 
      );
      
      setFinalScore(score);
      setGameState('success');
      onComplete(score);
    } else {
      setFinalScore(0);
      setGameState('failed');
      onFail();
    }
  }, [
    gameSettings.timeLimit, 
    gameSettings.maxAttempts, 
    calculateGameScore, 
    onComplete, 
    onFail, 
    attemptsLeft
  ]);

  const resumeTimer = useCallback(() => {
    // Use either the pausedTimeLeftRef value or fall back to the timeLeft state
    const remainingTime = pausedTimeLeftRef.current !== null ? 
      pausedTimeLeftRef.current : 
      (timeLeft !== null ? timeLeft : gameSettings.timeLimit);
    
    // Calculate new end time based on remaining time
    const now = Date.now();
    const remainingMs = remainingTime * 1000;
    endTimeRef.current = now + remainingMs;
    
    // Start timer with the remaining time
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
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
  
        // Time's up - game over
        handleGameEnd(false);
      }
    }, 100);
    
    pausedTimeLeftRef.current = null;
  }, [handleGameEnd, timeLeft, gameSettings.timeLimit]);

  // Display the pattern sequence to the player
  const displayPattern = useCallback((patternToDisplay: number[]) => {
    setIsDisplayingPattern(true);
    setCurrentDisplay(null);
    
    // Pause the timer while displaying the pattern
    pauseTimer();
    
    // Clear any existing display timer
    if (displayTimerRef.current) {
      window.clearInterval(displayTimerRef.current);
    }
    
    // Create a flat sequence that includes "off" states between each display
    // This ensures consecutive identical runes are visible as separate pulses
    const displaySequence: Array<number | null> = [];
    
    // For each item in the pattern, add the item followed by null (off state)
    patternToDisplay.forEach(item => {
      displaySequence.push(item);  // Show the rune
      displaySequence.push(null);  // Turn off before showing the next one
    });
    
    let step = 0;
    
    // Display each rune in sequence with clear "off" states between
    displayTimerRef.current = window.setInterval(() => {
      if (step < displaySequence.length) {
        setCurrentDisplay(displaySequence[step]);
        step++;
      } else {
        // End of pattern display
        setCurrentDisplay(null);
        
        if (displayTimerRef.current) {
          window.clearInterval(displayTimerRef.current);
          displayTimerRef.current = null;
        }
        
        setIsDisplayingPattern(false);
        
        // Resume the timer after pattern display
        resumeTimer();
      }
    }, Math.floor(gameSettings.displaySpeed / 2)); // Use half the display speed for a more snappy feel
    
  }, [gameSettings.displaySpeed, pauseTimer, resumeTimer]);

  // Start the timer
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

        // Time's up - game over
        handleGameEnd(false);
      }
    }, 100); // Update more frequently for smoother countdown

  }, [gameSettings.timeLimit, handleGameEnd]);

  // Initialize the game
  const startGame = useCallback(() => {
    setPlayerPattern([]);
    setAttemptsLeft(gameSettings.maxAttempts);
    setGameState('playing');
    setFinalScore(0);
    setCurrentDisplay(null);
    setIsDisplayingPattern(false);
    pausedTimeLeftRef.current = null;
    
    // Generate a new pattern
    const newPattern = generatePattern();
    
    // Start the timer
    startTimer();
    
    // Display the pattern after a short delay
    setTimeout(() => {
      displayPattern(newPattern);
    }, 1000);
  }, [gameSettings.maxAttempts, generatePattern, displayPattern, startTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (displayTimerRef.current) {
        window.clearInterval(displayTimerRef.current);
      }
    };
  }, []);

  // Handle player clicks on a rune
  const handleRuneClick = useCallback((index: number) => {
    if (gameState !== 'playing' || isDisplayingPattern) return;

    // Flash the clicked rune
    setCurrentDisplay(index);
    setTimeout(() => setCurrentDisplay(null), 300);
    
    // Update player pattern
    const newPlayerPattern = [...playerPattern, index];
    setPlayerPattern(newPlayerPattern);
    
    // Check if the player's selection matches the pattern so far
    const isCorrect = newPlayerPattern.every(
      (runeIndex, i) => runeIndex === pattern[i]
    );
    
    if (!isCorrect) {
      // Incorrect selection
      setAttemptsLeft(prev => prev - 1);
      setPlayerPattern([]);
      
      if (attemptsLeft <= 1) {
        // No more attempts - game over
        handleGameEnd(false);
      } else {
        // Show pattern again
        setTimeout(() => {
          displayPattern(pattern);
        }, 1000);
      }
    } else if (newPlayerPattern.length === pattern.length) {
      // Player has correctly matched the entire pattern - they win
      if (endTimeRef.current === null) return;
      
      // Calculate time elapsed
      const now = Date.now();
      const elapsed = (gameSettings.timeLimit * 1000) - (endTimeRef.current - now);
      const elapsedSeconds = Math.min(gameSettings.timeLimit, elapsed / 1000);
      
      // End game with win
      handleGameEnd(true, elapsedSeconds);
    }
  }, [
    gameState, 
    isDisplayingPattern, 
    playerPattern, 
    pattern, 
    attemptsLeft, 
    handleGameEnd, 
    gameSettings.timeLimit, 
    displayPattern
  ]);

  // Show alert when time is running low
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 5 && gameState === 'playing' && !isDisplayingPattern) {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [timeLeft, gameState, isDisplayingPattern]);

  // Score ticker component
  const scoreTicker = (
    <div className="text-gray-300 font-bold">
      Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s | 
      Attempts: {attemptsLeft} | 
      Score: {Math.floor(finalScore)}
    </div>
  );

  // Render a single rune
  const renderRune = (index: number) => {
    const isActive = currentDisplay === index;
    
    return (
      <div
        key={index}
        className={`
          aspect-square rounded-lg overflow-hidden cursor-pointer
          flex items-center justify-center transition-all duration-200
          ${isActive ? 'ring-4 ring-amber-500 brightness-150' : ''}
          ${isDisplayingPattern ? 'pointer-events-none' : ''}
        `}
        onClick={() => handleRuneClick(index)}
      >
        <img
          src={`/challenges/runetile${(index % 9) + 1}.png`}
          alt={`Rune ${index}`}
          className={`w-full h-full object-contain transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      <>
        {/* Game area with original height and background */}
        <div 
          ref={gameAreaRef}
          className="relative bg-slate-800 rounded-lg mb-4 max-w-2xl mx-auto p-4 h-96 flex flex-col"
        >
          {/* Background image - absolute positioned behind content */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <img 
              src="/challenges/ancient-runes-background.png" 
              alt="Ancient runes background" 
              className="w-full h-full object-cover opacity-60"
            />
          </div>
          
          {/* Content positioned above background with proper sizing */}
          <div className="relative z-10 h-full flex items-center justify-center p-2">
            {/* Rune grid with responsive size calculations */}
            <div 
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${gameSettings.gridSize}, 1fr)`,
                width: `${gridSize}px`,
                height: `${gridSize}px`
              }}
            >
              {Array.from({ length: gameSettings.gridSize * gameSettings.gridSize }).map((_, index) => renderRune(index))}
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

          {(gameState === 'success' || gameState === 'failed') && (
            <div className="flex justify-between items-center">
              {scoreTicker}
              <button
                className={`py-2 px-4 ${gameState === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} 
                  text-white rounded-lg transition-colors duration-200`}
                onClick={startGame}
                type="button"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </>
    </div>
  );
};

export default RuneMemoryChallenge;