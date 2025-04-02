import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';
import { useScoreMessages } from '../../hooks/useScoreMessages';
import ScoreMessages from '../../components/effects/ScoreMessage';

type Hoop = {
  id: number;
  x: number;
  y: number;
  width: number;
};

interface RingDiveChallengeProps {
  agility?: number;
  difficulty?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const RingDiveChallenge: React.FC<RingDiveChallengeProps> = ({
  agility = 10,
  difficulty = 2,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail = () => console.log('Challenge failed')
}) => {
  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [hoops, setHoops] = useState<Hoop[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Use the score messages hook
  const { scoreMessages, addScoreMessage } = useScoreMessages(1000); // 1 second duration

  // Refs to prevent re-renders and manage game loop
  const gameStateRef = useRef<GameState>('ready');
  const hoopsRef = useRef<Hoop[]>([]);
  const scoreRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(30);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const scoredHoopsRef = useRef<Set<number>>(new Set());

  // Player state
  const playerRef = useRef({
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    velocity: 0
  });

  // Dynamic game configuration based on difficulty and agility
  const gameConfig = useRef({
    gameWidth: 800,
    gameHeight: 384,
    playerWidth: 50,
    playerHeight: 50,
    hoopHeight: 100,
    hoopWidth: 50,
    hoopSpeed: 7 + (difficulty * 1.5),
    gravity: 0.06,
    jumpStrength: -1.5 - (agility * 0.1),
    spawnInterval: Math.max(500, 1500 - (difficulty * 200)),
    hoopScore: 10 * agility,
    maxScore: 2000,
    playerXPosition: 160, // 20% of 800px (fixed position horizontally)
    scoreDetectionBuffer: 10, // Buffer to make scoring more forgiving
    debugMode: false // Set to true to visualize collision boxes
  });

  // Check if player is passing through a hoop
  const checkHoopCollision = useCallback((player: { x: number, y: number, width: number, height: number }, hoop: Hoop) => {
    const config = gameConfig.current;
    const buffer = config.scoreDetectionBuffer;
    
    // Player bounding box (slightly smaller than visual for more forgiving scoring)
    const playerLeft = player.x + buffer;
    const playerRight = player.x + player.width - buffer;
    const playerTop = player.y + buffer;
    const playerBottom = player.y + player.height - buffer;
    
    // Hoop center area (the opening)
    const hoopLeft = hoop.x;
    const hoopRight = hoop.x + config.hoopWidth;
    const hoopTop = hoop.y + buffer;
    const hoopBottom = hoop.y + hoop.width - buffer;
    
    // Check if player is within the horizontal bounds of hoop
    const horizontalOverlap = 
      (playerLeft <= hoopRight && playerRight >= hoopLeft) ||
      (playerRight >= hoopLeft && playerLeft <= hoopRight);
      
    // Check if player's center is within the vertical bounds of hoop opening
    const verticalOverlap = 
      playerTop >= hoopTop && playerBottom <= hoopBottom;
    
    // For scoring, we want the player to be passing through the hoop
    return horizontalOverlap && verticalOverlap;
  }, []);
  
  const initializeGame = useCallback(() => {
    const config = gameConfig.current;
    
    // Reset all game states
    setGameState('playing');
    setTimeLeft(30);
    setScore(0);
    setHoops([]);
    
    // Reset refs
    gameStateRef.current = 'playing';
    timeLeftRef.current = 30;
    scoreRef.current = 0;
    hoopsRef.current = [];
    scoredHoopsRef.current.clear();
    
    // Start player in the middle of the screen
    const startY = config.gameHeight / 2 - config.playerHeight / 2;
    playerRef.current = {
      x: config.playerXPosition,
      y: startY,
      width: config.playerWidth,
      height: config.playerHeight,
      velocity: 0
    };
  
    console.log('Game initialized, starting player at:', startY);
  }, []);

  // Game loop
  useEffect(() => {
    // Only set up the game loop when gameState is 'playing'
    if (gameState !== 'playing') return;
  
    // Timer interval
    const timerInterval = setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 0.1);
      setTimeLeft(timeLeftRef.current);
  
      // Check for game end conditions
      if (
        timeLeftRef.current <= 0 || 
        scoreRef.current >= gameConfig.current.maxScore
      ) {
        clearInterval(timerInterval);
        setGameState('success');
        onComplete(scoreRef.current);
      }
    }, 100);
  
    // Hoop spawn interval
    const spawnInterval = setInterval(() => {
      const config = gameConfig.current;
      const newHoop: Hoop = {
        id: Date.now(),
        x: config.gameWidth,
        y: Math.random() * (config.gameHeight - config.hoopHeight),
        width: config.hoopHeight
      };
  
      hoopsRef.current = [...hoopsRef.current, newHoop];
      setHoops(hoopsRef.current);
    }, gameConfig.current.spawnInterval);
  
    // Game animation loop
    const updateGameState = (timestamp: number) => {
      if (gameStateRef.current !== 'playing') return;
    
      const config = gameConfig.current;
      const deltaTime = timestamp - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = timestamp;
    
      // Player physics and constraints
      const player = playerRef.current;
      player.velocity += config.gravity;
      player.y += player.velocity;
    
      if (player.y + config.playerHeight > config.gameHeight) {
        player.y = config.gameHeight - config.playerHeight;
        player.velocity = 0;
      } else if (player.y < 0) {
        player.y = 0;
        player.velocity = 0;
      }
    
      // Process hoops (move, check scoring, remove off-screen)
      const updatedHoops = hoopsRef.current.map(hoop => ({
        ...hoop,
        x: hoop.x - (config.hoopSpeed * deltaTime) / 16
      }));
      
      // Check for scoring and filter out off-screen hoops
      const remainingHoops = updatedHoops.filter(hoop => {
        // Check scoring conditions if not already scored
        if (!scoredHoopsRef.current.has(hoop.id)) {
          // Use the dedicated collision detection function
          if (checkHoopCollision(player, hoop)) {
            // Score points
            const scoreValue = config.hoopScore;
            const potentialScore = scoreRef.current + scoreValue;
            const newScore = Math.min(potentialScore, config.maxScore);
            
            // Update the score
            scoreRef.current = newScore;
            setScore(newScore);
    
            // Mark hoop as scored
            scoredHoopsRef.current.add(hoop.id);
            
            // Calculate position for the score message (center of hoop)
            const messageX = hoop.x + config.hoopWidth / 2;
            const messageY = hoop.y + hoop.width / 2;
            
            // Add a floating score message using our hook
            addScoreMessage(messageX, messageY, scoreValue);
    
            // Check if the max score has been reached
            if (newScore >= config.maxScore) {
              gameStateRef.current = 'success';
              setGameState('success');
              setTimeout(() => {
                onComplete(Math.floor(config.maxScore));
              }, 0);
            }
          }
        }
    
        // Remove hoops that are off-screen
        return hoop.x + config.hoopWidth > 0;
      });
      
      // Update hoops state
      hoopsRef.current = remainingHoops;
      setHoops(remainingHoops);
    
      // Continue animation loop if still playing
      if (gameStateRef.current === 'playing') {
        animationFrameRef.current = requestAnimationFrame(updateGameState);
      }
    };
  
    // Start the animation loop
    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateGameState);
  
    // Cleanup function
    return () => {
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, onComplete, addScoreMessage, checkHoopCollision]);

  // Player jump handler
  const handlePlayerJump = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const player = playerRef.current;
    const config = gameConfig.current;
    player.velocity = config.jumpStrength;
    
  }, [gameState, agility]);
  
  const scoreTicker = <div className="text-gray-300 font-bold">
    Time: {timeLeft.toFixed(1)}s | Score: {Math.floor(score)}
  </div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        ref={gameAreaRef}
        className="relative h-96 w-full bg-cover bg-center rounded-lg overflow-hidden select-none touch-none"
        style={{ 
          backgroundImage: 'url(/challenges/aerial-ring-background.png)'
        }}
        onClick={handlePlayerJump}
      >
        {/* Render hoops */}
        {hoops.map(hoop => (
          <React.Fragment key={hoop.id}>
            {/* Back half of hoop */}
            <div
              className="absolute"
              style={{
                left: `${hoop.x}px`,
                top: `${hoop.y}px`,
                width: '50px', 
                height: '100px',
                zIndex: 10,
                clipPath: 'inset(0 50% 0 0)',
              }}
            >
              <img
                src="/challenges/ring.png"
                alt="Hoop Back"
                style={{
                  width: '50px',
                  height: '100px',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            {/* Front half of hoop */}
            <div
              className="absolute"
              style={{
                left: `${hoop.x}px`,
                top: `${hoop.y}px`,
                width: '50px',
                height: '100px',
                zIndex: 30,
                clipPath: 'inset(0 0 0 50%)',
              }}
            >
              <img
                src="/challenges/ring.png"
                alt="Hoop Front"
                style={{
                  width: '50px',
                  height: '100px',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            {/* Debug collision box */}
            {gameConfig.current.debugMode && (
              <div
                className="absolute border-2 border-green-500"
                style={{
                  left: `${hoop.x}px`,
                  top: `${hoop.y + gameConfig.current.scoreDetectionBuffer}px`,
                  width: '50px',
                  height: `${hoop.width - (gameConfig.current.scoreDetectionBuffer * 2)}px`,
                  zIndex: 40,
                  borderColor: scoredHoopsRef.current.has(hoop.id) ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)',
                  backgroundColor: 'rgba(0, 255, 0, 0.1)'
                }}
              />
            )}
          </React.Fragment>
        ))}

        {/* Player Character */}
        <img 
          src="/challenges/ringbird.png"
          alt="Player"
          className="absolute"
          style={{
            left: `${playerRef.current.x}px`,
            top: `${playerRef.current.y}px`,
            width: '50px',
            height: '50px',
            objectFit: 'fill',
            zIndex: 20
          }}
        />
        
        {/* Debug collision box for player */}
        {gameConfig.current.debugMode && (
          <div
            className="absolute border-2 border-blue-500"
            style={{
              left: `${playerRef.current.x + gameConfig.current.scoreDetectionBuffer}px`,
              top: `${playerRef.current.y + gameConfig.current.scoreDetectionBuffer}px`,
              width: `${playerRef.current.width - (gameConfig.current.scoreDetectionBuffer * 2)}px`,
              height: `${playerRef.current.height - (gameConfig.current.scoreDetectionBuffer * 2)}px`,
              zIndex: 40,
              borderColor: 'rgba(0, 0, 255, 0.5)',
              backgroundColor: 'rgba(0, 0, 255, 0.1)'
            }}
          />
        )}
        
        {/* Score Messages using our new component */}
        <ScoreMessages 
          messages={scoreMessages} 
          duration={1000}
          floatDistance={40}
          textClass="font-bold text-xl text-yellow-300 shadow-sm"
        />
      </div>

      {/* Game Controls */}
      <div className="mt-4">
        {gameState === 'ready' && (
          <button
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
            transition-colors duration-200"
            onClick={initializeGame}
            type="button"
          >
            Start Challenge
          </button>
        )}

        {gameState === 'playing' && (
          <button
            className="w-full py-2 px-4 bg-gray-400 dark:bg-gray-600 text-white rounded-lg cursor-not-allowed"
            onClick={initializeGame}
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
              onClick={initializeGame}
              type="button"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RingDiveChallenge;