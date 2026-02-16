import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';

type GameSettings = {
  initialPlayerScore: number;
  initialComputerScore: number;
  computerIncreaseRate: number;
  playerClickValue: number;
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
  const [_showAlert, setShowAlert] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(1000);
  const [finalScore, setFinalScore] = useState<number>(0);
  
  // Position smoothing state
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  
  // Particle effects state
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    timestamp: number;
    size: number;
    color: string;
    directionX: number;
    directionY: number;
    rotation: number;
    blur: boolean;
  }>>([]);

  // References for timer implementation and animation
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const targetPositionRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);

  // Calculate game settings based on difficulty and strength
  const gameSettings: GameSettings = {
    initialPlayerScore: 50,
    initialComputerScore: 50,
    computerIncreaseRate: 0.4 + (difficulty * 0.2),
    playerClickValue: (strength + difficulty) * 0.5,
    timeLimit: 12 - (difficulty * 2),
  };

  // Use relative sizes based on container width
  const backgroundWidth = containerWidth;
  const characterWidth = containerWidth * 0.43; // 43% of container width (512/1184 ≈ 0.43)

  // Calculate the maximum movement distance
  const maxMovement = backgroundWidth - characterWidth;

  // Calculate final game score based on win condition and time elapsed
  const calculateGameScore = useCallback((isWin: boolean, timeElapsed: number, timeLimit: number): number => {
    if (!isWin) return 0;

    if (timeElapsed >= timeLimit) {
      // Player won when the timer ran out
      return 1000;
    }

    // Player won by reaching the instant win condition
    // Calculate score based on how quickly they won, up to 2000 points 
    const timePercentage = 1 - (timeElapsed / timeLimit);
    return 1000 + Math.round(timePercentage * 1000); // 1000 to 2000 range 

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

  // Update target position when scores change (using ref to avoid re-renders)
  useEffect(() => {
    targetPositionRef.current = calculatePosition(playerScore, computerScore);
  }, [playerScore, computerScore, calculatePosition]);

  // Smooth position animation with constant movement speed
  useEffect(() => {
    if (gameState !== 'playing') return;

    const movementSpeed = 0.3;
    
    const animate = () => {
      setCurrentPosition(current => {
        const target = targetPositionRef.current;
        const diff = target - current;
        
        // If we're close enough, snap to target
        if (Math.abs(diff) < 1) {
          return target;
        }
        
        // Move toward target at constant rate
        const direction = diff > 0 ? 1 : -1;
        const nextPosition = current + (direction * movementSpeed);
        
        // Don't overshoot the target
        if (direction > 0) {
          return Math.min(nextPosition, target);
        } else {
          return Math.max(nextPosition, target);
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [gameState]);

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

        // End game based on final scores - player must have higher score to win
        handleGameEnd(playerScore > computerScore);
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
    
    // Initialize positions to center
    const centerPosition = maxMovement / 2;
    setCurrentPosition(centerPosition);
    targetPositionRef.current = centerPosition;

    // Start the timer
    startTimer();
  }, [gameSettings.initialPlayerScore, gameSettings.initialComputerScore, startTimer, maxMovement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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

      // Create particle effect at click position
      const relativeX = x - gameAreaRect.left;
      const relativeY = y - gameAreaRect.top;

      const dustColors = [
        'bg-stone-600 bg-opacity-60',
        'bg-gray-500 bg-opacity-55', 
        'bg-amber-800 bg-opacity-50',
        'bg-stone-700 bg-opacity-65',
        'bg-gray-600 bg-opacity-60',
        'bg-yellow-800 bg-opacity-45'
      ];
      
      // Create multiple particles for each click - clustered dust cloud
      const newParticles: Array<{
        id: number;
        x: number;
        y: number;
        timestamp: number;
        size: number;
        color: string;
        directionX: number;
        directionY: number;
        rotation: number;
        blur: boolean;
      }> = [];
      
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const initialRadius = Math.random() * 10;
        const expansionRadius = Math.random() * 40 + 25;
        
        newParticles.push({
          id: particleIdRef.current++,
          x: relativeX + Math.cos(angle) * initialRadius,
          y: relativeY + Math.sin(angle) * initialRadius,
          timestamp: Date.now() + i * 15,
          size: Math.random() * 3 + 3,
          color: dustColors[Math.floor(Math.random() * dustColors.length)],
          directionX: Math.cos(angle) * expansionRadius,
          directionY: Math.sin(angle) * expansionRadius - Math.random() * 20,
          rotation: Math.random() * 90,
          blur: Math.random() > 0.3
        });
      }
      
      setParticles(prev => [...prev, ...newParticles]);
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

  // Check for instant win condition - based on visual position
  useEffect(() => {
    if (gameState !== 'playing' || endTimeRef.current === null) return;

    // Check if character has visually reached the right edge (player wins)
    const winThreshold = maxMovement * 0.95; // 95% of the way to the right edge
    if (currentPosition >= winThreshold) {
      // Calculate time elapsed for the instant win
      const now = Date.now();
      const elapsed = (gameSettings.timeLimit * 1000) - (endTimeRef.current - now);
      const elapsedSeconds = Math.min(gameSettings.timeLimit, elapsed / 1000);

      // End game with win
      handleGameEnd(true, elapsedSeconds);
    }
  }, [currentPosition, gameSettings.timeLimit, gameState, handleGameEnd, maxMovement]);

  // Check for instant lose condition - based on visual position
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Check if character has visually reached the left edge (computer wins)
    const loseThreshold = maxMovement * 0.05; // 5% of the way from the left edge
    if (currentPosition <= loseThreshold) {
      // End game with loss
      handleGameEnd(false);
    }
  }, [currentPosition, gameState, handleGameEnd, maxMovement]);

  // Show alert when time is running low
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 5 && gameState === 'playing') {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [timeLeft, gameState]);

  // Clean up old particles
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setParticles(prev => prev.filter(particle => now - particle.timestamp < 1000)); // Match longer particle lifetime
    }, 100);

    return () => clearInterval(cleanupInterval);
  }, []);

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
        <div className="bg-slate-800 rounded-lg mb-4 max-w-2xl mx-auto">
          <div 
            ref={gameAreaRef}
            className="relative w-full h-96 bg-slate-700 rounded-lg overflow-hidden cursor-pointer"
            onClick={handleGameAreaClick}
          >
            {/* Tug-of-War Progress Bar - Top of game area */}
            <div className="absolute top-4 left-4 right-4 h-6 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
              {/* Calculate progress based on current position */}
              {(() => {
                const progressPercentage = maxMovement > 0 ? (currentPosition / maxMovement) * 100 : 50;
                const clampedProgress = Math.max(5, Math.min(95, progressPercentage)); // Keep between 5-95% for visual purposes
                
                // Intensity effects based on how close to winning
                const centerDistance = Math.abs(clampedProgress - 50);
                const intensity = centerDistance / 45; // 0 to 1 scale
                const isPlayerWinning = clampedProgress > 50;
                const isComputerWinning = clampedProgress < 50;
                
                return (
                  <>
                    {/* Single container approach - avoid overlapping */}
                    <div className="relative w-full h-full">
                      {/* Player (Left/Blue) Section */}
                      <div 
                        className={`absolute top-0 left-0 h-full transition-transform duration-300 ${
                          isPlayerWinning ? 'bg-blue-600' : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: '100%',
                          transform: `scaleX(${clampedProgress / 100})`,
                          transformOrigin: 'left',
                          boxShadow: isPlayerWinning && intensity > 0.6 ? `inset 0 0 ${intensity * 10}px rgba(59, 130, 246, 0.8)` : ''
                        }}
                      />
                      
                      {/* Computer (Right/Red) Section - fills remaining space */}
                      <div 
                        className={`absolute top-0 right-0 h-full transition-transform duration-300 ${
                          isComputerWinning ? 'bg-red-600' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: '100%',
                          transform: `scaleX(${(100 - clampedProgress) / 100})`,
                          transformOrigin: 'right',
                          boxShadow: isComputerWinning && intensity > 0.6 ? `inset 0 0 ${intensity * 10}px rgba(239, 68, 68, 0.8)` : ''
                        }}
                      />
                    </div>
                    
                    {/* Dramatic Effects for Near-Win States */}
                    {intensity > 0.8 && (
                      <div 
                        className={`absolute top-0 h-full w-full animate-pulse ${
                          isPlayerWinning ? 'bg-blue-400' : 'bg-red-400'
                        } opacity-20`}
                        style={{ animationDuration: '0.3s' }}
                      />
                    )}
                  </>
                );
              })()}
            </div>

            {/* Static Background Image */}
            <img
              src="/challenges/forest-background.png"
              alt="Background"
              className="w-full h-full object-cover"
            />

            {/* Moving Character (Foreground) - using currentPosition for smooth constant-rate movement */}
            <div
              className="absolute bottom-0"
              style={{
                width: `${(characterWidth / backgroundWidth) * 100}%`,
                left: `${(currentPosition / backgroundWidth) * 100}%`,
              }}
            >
              <img
                src="/challenges/bearwolfstandoff.png"
                alt="Game Character"
                className="w-full h-auto"
              />
            </div>

            {/* Particle Effects */}
            {particles.map(particle => {
              const age = Date.now() - particle.timestamp;
              const maxAge = 1000;
              const progress = Math.min(age / maxAge, 1);
              const opacity = Math.max(0, (1 - progress) * 0.9);
              
              // Gradual expansion from center point - starts slow, speeds up
              const expansionProgress = progress * progress;
              const translateX = particle.directionX * expansionProgress;
              const translateY = particle.directionY * expansionProgress;
              const rotation = particle.rotation + (progress * 45);
              
              // Progressive blur and settling effect
              const blur = particle.blur || progress > 0.4 ? 'blur-sm' : '';
              const settling = progress > 0.7 ? 'opacity-60' : '';
              
              return (
                <div
                  key={particle.id}
                  className={`absolute pointer-events-none ${particle.color} rounded-full ${blur} ${settling}`}
                  style={{
                    left: particle.x,
                    top: particle.y,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    opacity: opacity,
                    transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
                    transition: 'none',
                    boxShadow: '0 0 3px rgba(92, 92, 92, 0.5)',
                    filter: progress > 0.6 ? 'blur(0.5px)' : ''
                  }}
                />
              );
            })}
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