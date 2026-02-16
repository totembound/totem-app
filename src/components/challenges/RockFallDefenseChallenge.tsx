import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';

type Rock = {
  id: number;
  x: number;  // horizontal position (percentage)
  y: number;  // vertical position (percentage)
  speed: number; // falling speed
  clicked: boolean; // whether the rock has been clicked
  clickedTime: number | null; // timestamp when the rock was clicked
  markedForRemoval: boolean; // flag to mark rock for removal
};

type GameSettings = {
  rockSize: number;
  initialRockCount: number;
  maxRocks: number;
  rockSpawnRate: number; 
  rockSpeedMin: number;
  rockSpeedMax: number;
  pointsPerRock: number;
  rockClickDisplayTime: number;
  timeLimit: number;
  maxScore: number;
};

interface RockFallDefenseChallengeProps {
  difficulty?: number;
  strength?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const RockFallDefenseChallenge: React.FC<RockFallDefenseChallengeProps> = ({
  difficulty = 2,
  strength = 10,
  onComplete = (score: number) => console.log('Challenge complete:', score),
}) => {
  // Game state management
  const [gameState, setGameState] = useState<GameState>('ready');
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("Time's Running Out!");
  
  // Create refs for various game state tracking
  const nextRockIdRef = useRef<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const rockSpawnTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const initialRocksSpawnedRef = useRef<boolean>(false);
  const gameStateRef = useRef<GameState>('ready');
  const rocksRef = useRef<Rock[]>([]);
  
  // Calculate game settings based on difficulty and strength
  const gameSettings: GameSettings = {
    rockSize: 10,
    initialRockCount: 5 + difficulty,
    maxRocks: 10 + (difficulty * 3),
    rockSpawnRate: 800 - (difficulty * 100),
    rockSpeedMin: 15 + (difficulty * 5),
    rockSpeedMax: 25 + (difficulty * 5),
    pointsPerRock: 10 * strength,
    rockClickDisplayTime: 500,
    timeLimit: 30 - (difficulty * 3),
    maxScore: 3000,
  };

  // Keep gameStateRef in sync with gameState
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Keep rocksRef in sync with rocks state
  useEffect(() => {
    rocksRef.current = rocks;
  }, [rocks]);

  // Create a single rock with the given ID
  const createRock = useCallback((): Rock => {
    const id = nextRockIdRef.current++;
    const x = Math.random() * (100 - gameSettings.rockSize);
    const speed = gameSettings.rockSpeedMin + Math.random() * (gameSettings.rockSpeedMax - gameSettings.rockSpeedMin);
    
    return {
      id,
      x,
      y: 0,
      speed,
      clicked: false,
      clickedTime: null,
      markedForRemoval: false
    };
  }, [gameSettings]);

  // Spawn initial rocks as a batch
  const spawnInitialRocks = useCallback(() => {
    if (gameStateRef.current !== 'playing' || initialRocksSpawnedRef.current) return;
    
    initialRocksSpawnedRef.current = true;
    
    const initialRocks: Rock[] = [];
    for (let i = 0; i < gameSettings.initialRockCount; i++) {
      initialRocks.push(createRock());
    }
    
    setRocks(initialRocks);
  }, [gameSettings.initialRockCount, createRock]);

  // Spawn a single new rock
  const spawnRock = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (rocks.length >= gameSettings.maxRocks) return;
    
    const newRock = createRock();
    setRocks(currentRocks => [...currentRocks, newRock]);
  }, [gameSettings.maxRocks, createRock, rocks.length]);

  // Game animation loop - update rock positions
  const updateRockPositions = useCallback((timestamp: number) => {
    if (gameStateRef.current !== 'playing') return;

    const deltaTime = timestamp - lastUpdateTimeRef.current;
    lastUpdateTimeRef.current = timestamp;

    if (deltaTime > 0 && deltaTime < 100) {
      setRocks(currentRocks => {
        return currentRocks
          .map(rock => {
            // Skip updating clicked rocks that still need to be displayed
            if (rock.clicked && rock.clickedTime) {
              const elapsedSinceClick = timestamp - rock.clickedTime;
              if (elapsedSinceClick >= gameSettings.rockClickDisplayTime) {
                return { ...rock, markedForRemoval: true };
              }
              return rock; // Keep clicked rocks in place
            }
            
            // Move unclicked rocks down
            const newY = rock.y + (rock.speed * deltaTime / 1000);
            if (newY >= 100) {
              return { ...rock, markedForRemoval: true };
            }
            return { ...rock, y: newY };
          })
          .filter(rock => !rock.markedForRemoval); // Remove only marked rocks
      });
    }

    // Continue the animation loop
    animationFrameRef.current = requestAnimationFrame(updateRockPositions);
  }, [gameSettings.rockClickDisplayTime]);

  // Start all the game timers and animation loops
  const startGameLoop = useCallback(() => {
    // Start the animation loop
    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateRockPositions);
    
    // Spawn initial rocks
    spawnInitialRocks();
    
    // Start the rock spawner timer
    rockSpawnTimerRef.current = window.setInterval(() => {
      if (rocks.length < gameSettings.maxRocks) {
        spawnRock();
      }
    }, gameSettings.rockSpawnRate);
  }, [updateRockPositions, spawnInitialRocks, spawnRock, gameSettings, rocks.length]);

  // Start the countdown timer
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    const now = Date.now();
    const duration = gameSettings.timeLimit * 1000;
    endTimeRef.current = now + duration;
    setTimeLeft(gameSettings.timeLimit);

    timerRef.current = window.setInterval(() => {
      if (endTimeRef.current === null) return;

      const now = Date.now();
      const remaining = Math.max(0, endTimeRef.current - now);
      const remainingSeconds = remaining / 1000;

      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        handleGameEnd('timeout');
      }
    }, 100);
  }, [gameSettings.timeLimit]);

  // Handle game ending
  const handleGameEnd = useCallback((_reason: 'timeout' | 'maxScore' = 'timeout') => {
    // Clear all timers
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (rockSpawnTimerRef.current) {
      clearInterval(rockSpawnTimerRef.current);
      rockSpawnTimerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setGameState('success');
    onComplete(playerScore);
  }, [playerScore, onComplete]);

  // Initialize the game
  const startGame = useCallback(() => {
    // Reset game state
    setPlayerScore(0);
    setRocks([]);
    setGameState('playing');
    nextRockIdRef.current = 1;
    setAlertMessage("Time's Running Out!");
    
    // Reset refs
    initialRocksSpawnedRef.current = false;
    
    // Start timers and animations
    startTimer();
    startGameLoop();
  }, [startTimer, startGameLoop]);

  // Clean up all timers and animation frames when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (rockSpawnTimerRef.current) clearInterval(rockSpawnTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Optimized rock click handler
  const handleRockClick = useCallback((e: React.MouseEvent<HTMLDivElement>, rockId: number) => {
    e.stopPropagation();
    
    if (gameStateRef.current !== 'playing') return;
    
    setRocks(prevRocks => {
      const rockIndex = prevRocks.findIndex(rock => rock.id === rockId);
      
      if (rockIndex === -1 || prevRocks[rockIndex].clicked) {
        return prevRocks;
      }
      
      const updatedRocks = [...prevRocks];
      updatedRocks[rockIndex] = { 
        ...updatedRocks[rockIndex], 
        clicked: true, 
        clickedTime: performance.now() 
      };
      
      return updatedRocks;
    });
    
    setPlayerScore(prevScore => {
      const newScore = prevScore + gameSettings.pointsPerRock;
      
      if (newScore >= gameSettings.maxScore) {
        setAlertMessage("Maximum Score Reached!");
        setShowAlert(true);
        
        setTimeout(() => {
          handleGameEnd('maxScore');
        }, 1000);
        
        return gameSettings.maxScore;
      }
      
      return newScore;
    });
  }, [gameSettings.pointsPerRock, gameSettings.maxScore, handleGameEnd]);

  // Show alert when time is running low
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 5 && gameState === 'playing') {
      setAlertMessage("Time's Running Out!");
      setShowAlert(true);
    } else if (alertMessage === "Time's Running Out!" && timeLeft !== null && timeLeft > 5) {
      setShowAlert(false);
    }
  }, [timeLeft, gameState, alertMessage]);

  // Simplified score ticker component (removed rocks counter and max score)
  const scoreTicker = (
    <div className="text-gray-300 font-bold">
      Time: {timeLeft !== null ? timeLeft.toFixed(1) : '-'}s | Score: {Math.floor(playerScore)}
    </div>
  );

  // Game content rendering
  const renderGameContent = () => {
    return (
      <>
        <div className="bg-slate-800 rounded-lg mb-4">
          <div 
            className="relative w-full h-96 bg-slate-700 rounded-lg overflow-hidden"
          >
            <img
              src="/challenges/rockfall-defense-background.png"
              alt="Background"
              className="w-full h-full object-cover absolute"
            />

            {rocks.map(rock => (
              <div
                key={rock.id}
                className="absolute"
                style={{
                  left: `${rock.x}%`,
                  top: `${rock.y}%`,
                  width: `${gameSettings.rockSize}%`,
                  height: 'auto',
                  pointerEvents: 'auto',
                  cursor: rock.clicked ? 'default' : 'pointer',
                  zIndex: 10
                }}
                onClick={(e) => handleRockClick(e, rock.id)}
              >
                <img
                  src={rock.clicked ? "/challenges/FallingRocksBroken.png" : "/challenges/FallingRocks.png"}
                  alt={rock.clicked ? "FallingRocksBroken" : "FallingRocks"}
                  className={`w-full h-auto ${rock.clicked ? "animate-pulse" : ""}`}
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            ))}

            {showAlert && (
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                ${alertMessage === "Maximum Score Reached!" ? "bg-green-600" : "bg-red-600"} 
                bg-opacity-70 text-white px-4 py-2 rounded-lg text-xl font-bold animate-pulse z-20`}>
                {alertMessage}
              </div>
            )}
          </div>
        </div>

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

export default RockFallDefenseChallenge;