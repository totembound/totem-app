import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';
import ChallengeActionBar from './ChallengeActionBar';

type GameSettings = {
  numConstellations: number;
  minStars: number;
  maxStars: number;
  numDistractorStars: number;
  timeLimit: number;
}

interface Constellation {
  id: string;
  name: string;
  difficulty: number;
  stars: Star[];
  connections: [string, string][]; // Pairs of star IDs that should be connected
}

interface Star {
  id: string;
  x: number;
  y: number;
  isDistractor?: boolean;
}

interface ConstellationChallengeProps {
  difficulty?: number;
  wisdom?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

// Calculate direction between two points (for glow direction)
const _calculateDirection = (fromX: number, fromY: number, toX: number, toY: number): number => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  return angle * (180 / Math.PI); // Convert to degrees
};

// Generate distractor stars
const generateDistractorStars = (count: number, existingStars: Star[]) => {
  const distractors: Star[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random position (0-100)
    const x = Math.floor(Math.random() * 100);
    const y = Math.floor(Math.random() * 100);

    // Keep distractor stars away from real stars (minimum distance)
    const tooClose = existingStars.some(star => {
      const distance = Math.sqrt(Math.pow(star.x - x, 2) + Math.pow(star.y - y, 2));
      return distance < 10; // Minimum distance units
    });

    if (!tooClose) {
      distractors.push({
        id: `distractor-${i}`,
        x,
        y,
        isDistractor: true
      });
    } else {
      // Try again if the star was too close
      i--;
    }
  }

  return distractors;
};

// Sample constellation data
const CONSTELLATIONS = [
  // Difficulty 1 - Easy
  {
    id: 'big-dipper',
    name: 'Big Dipper',
    difficulty: 1,
    stars: [
      { id: 'a', x: 20, y: 15 },  // Alkaid - end of handle
      { id: 'b', x: 32, y: 25 },  // Mizar/Alcor - handle
      { id: 'c', x: 45, y: 30 },  // Alioth - handle
      { id: 'd', x: 56, y: 32 },  // Megrez - joins handle to bowl
      { id: 'e', x: 62, y: 20 },  // Phecda - bottom of bowl
      { id: 'f', x: 75, y: 15 },  // Merak - bottom of bowl
      { id: 'g', x: 80, y: 30 },  // Dubhe - top of bowl
    ],
    connections: [['a', 'b'] as [string, string], ['b', 'c'] as [string, string],
    ['c', 'd'] as [string, string], ['d', 'e'] as [string, string],
    ['e', 'f'] as [string, string], ['f', 'g'] as [string, string]]
  },
  {
    id: 'cassiopeia',
    name: 'Cassiopeia',
    difficulty: 1,
    stars: [
      { id: 'a', x: 15, y: 40 },  // Caph
      { id: 'b', x: 35, y: 25 },  // Shedar
      { id: 'c', x: 50, y: 45 },  // Gamma Cassiopeiae
      { id: 'd', x: 70, y: 25 },  // Ruchbah
      { id: 'e', x: 85, y: 40 },  // Segin
    ],
    connections: [['a', 'b'] as [string, string], ['b', 'c'] as [string, string],
    ['c', 'd'] as [string, string], ['d', 'e'] as [string, string]]
  },
  {
    id: 'pleiades',
    name: 'Pleiades',
    difficulty: 1,
    stars: [
      { id: 'a', x: 50, y: 35 },  // Alcyone (central star)
      { id: 'b', x: 40, y: 25 },  // Atlas
      { id: 'c', x: 42, y: 43 },  // Merope
      { id: 'd', x: 60, y: 45 },  // Electra
      { id: 'e', x: 65, y: 30 },  // Maia
      { id: 'f', x: 35, y: 35 },  // Taygeta
      { id: 'g', x: 50, y: 18 },  // Celaeno
    ],
    connections: [['a', 'b'] as [string, string], ['a', 'c'] as [string, string],
    ['a', 'd'] as [string, string], ['a', 'e'] as [string, string],
    ['a', 'f'] as [string, string], ['a', 'g'] as [string, string]]
  },

  // Difficulty 2 - Medium
  {
    id: 'orion',
    name: 'Orion',
    difficulty: 2,
    stars: [
      { id: 'a', x: 50, y: 10 },  // Betelgeuse (top right shoulder)
      { id: 'b', x: 25, y: 20 },  // Bellatrix (top left shoulder)
      { id: 'c', x: 38, y: 40 },  // Belt star 1
      { id: 'd', x: 50, y: 45 },  // Belt star 2
      { id: 'e', x: 62, y: 40 },  // Belt star 3
      { id: 'f', x: 75, y: 70 },  // Rigel (bottom right foot)
      { id: 'g', x: 30, y: 75 },  // Saiph (bottom left foot)
      { id: 'h', x: 50, y: 28 },  // Head star
      { id: 'i', x: 55, y: 60 },  // Sword nebula
    ],
    connections: [
      ['a', 'h'] as [string, string], ['h', 'b'] as [string, string],
      ['b', 'c'] as [string, string], ['a', 'e'] as [string, string],
      ['c', 'd'] as [string, string], ['d', 'e'] as [string, string],
      ['c', 'g'] as [string, string], ['e', 'f'] as [string, string],
      ['d', 'i'] as [string, string]
    ]
  },
  {
    id: 'lyra',
    name: 'Lyra',
    difficulty: 2,
    stars: [
      { id: 'a', x: 50, y: 15 },  // Vega (brightest)
      { id: 'b', x: 40, y: 30 },  // Sheliak
      { id: 'c', x: 60, y: 30 },  // Sulafat
      { id: 'd', x: 35, y: 45 },  // Delta Lyrae
      { id: 'e', x: 50, y: 50 },  // Zeta Lyrae
      { id: 'f', x: 65, y: 45 },  // Beta Lyrae
    ],
    connections: [
      ['a', 'b'] as [string, string], ['a', 'c'] as [string, string],
      ['b', 'd'] as [string, string], ['c', 'f'] as [string, string],
      ['d', 'e'] as [string, string], ['e', 'f'] as [string, string]
    ]
  },
  {
    id: 'cygnus',
    name: 'Cygnus',
    difficulty: 2,
    stars: [
      { id: 'a', x: 50, y: 10 },  // Deneb (tail)
      { id: 'b', x: 50, y: 30 },  // Sadr (body)
      { id: 'c', x: 50, y: 50 },  // Center
      { id: 'd', x: 50, y: 80 },  // Albireo (head)
      { id: 'e', x: 25, y: 35 },  // Left wing tip
      { id: 'f', x: 75, y: 35 },  // Right wing tip
    ],
    connections: [
      ['a', 'b'] as [string, string], ['b', 'c'] as [string, string],
      ['c', 'd'] as [string, string], ['c', 'e'] as [string, string],
      ['c', 'f'] as [string, string]
    ]
  },

  // Difficulty 3 - Hard
  {
    id: 'hercules',
    name: 'Hercules',
    difficulty: 3,
    stars: [
      { id: 'a', x: 30, y: 15 },  // Pi Herculis
      { id: 'b', x: 45, y: 20 },  // Eta Herculis
      { id: 'c', x: 60, y: 15 },  // Zeta Herculis
      { id: 'd', x: 70, y: 30 },  // Beta Herculis
      { id: 'e', x: 65, y: 45 },  // Gamma Herculis
      { id: 'f', x: 50, y: 55 },  // Epsilon Herculis
      { id: 'g', x: 35, y: 45 },  // Delta Herculis
      { id: 'h', x: 20, y: 30 },  // Theta Herculis
      { id: 'i', x: 25, y: 55 },  // Iota Herculis
      { id: 'j', x: 40, y: 65 },  // Tau Herculis
      { id: 'k', x: 55, y: 75 },  // Sigma Herculis
    ],
    connections: [
      ['a', 'b'] as [string, string], ['b', 'c'] as [string, string],
      ['c', 'd'] as [string, string], ['d', 'e'] as [string, string],
      ['e', 'f'] as [string, string], ['f', 'g'] as [string, string],
      ['g', 'h'] as [string, string], ['h', 'a'] as [string, string],
      ['g', 'i'] as [string, string], ['i', 'j'] as [string, string],
      ['j', 'k'] as [string, string], ['k', 'f'] as [string, string]
    ]
  },
  {
    id: 'scorpius',
    name: 'Scorpius',
    difficulty: 3,
    stars: [
      { id: 'a', x: 50, y: 10 },  // Antares (heart)
      { id: 'b', x: 40, y: 20 },  // Graffias (head)
      { id: 'c', x: 25, y: 25 },  // Acrab (head)
      { id: 'd', x: 15, y: 35 },  // Dschubba (forehead)
      { id: 'e', x: 60, y: 25 },  // Sigma (body)
      { id: 'f', x: 65, y: 40 },  // Epsilon (body)
      { id: 'g', x: 70, y: 55 },  // Mu (tail)
      { id: 'h', x: 75, y: 65 },  // Zeta (tail)
      { id: 'i', x: 80, y: 75 },  // Eta (tail)
      { id: 'j', x: 85, y: 85 },  // Theta (first stinger)
      { id: 'k', x: 88, y: 90 },  // Iota (second stinger)
    ],
    connections: [
      ['d', 'c'] as [string, string], ['c', 'b'] as [string, string],
      ['b', 'a'] as [string, string], ['a', 'e'] as [string, string],
      ['e', 'f'] as [string, string], ['f', 'g'] as [string, string],
      ['g', 'h'] as [string, string], ['h', 'i'] as [string, string],
      ['i', 'j'] as [string, string], ['j', 'k'] as [string, string]
    ]
  },
  {
    id: 'pegasus',
    name: 'Pegasus',
    difficulty: 3,
    stars: [
      { id: 'a', x: 25, y: 25 },  // Markab
      { id: 'b', x: 75, y: 25 },  // Scheat
      { id: 'c', x: 75, y: 75 },  // Algenib
      { id: 'd', x: 25, y: 75 },  // Alpheratz
      { id: 'e', x: 15, y: 15 },  // Enif
      { id: 'f', x: 15, y: 50 },  // Homam
      { id: 'g', x: 50, y: 15 },  // Matar
      { id: 'h', x: 85, y: 50 },  // Baham
      { id: 'i', x: 50, y: 85 },  // Biham
    ],
    connections: [
      ['a', 'b'] as [string, string], ['b', 'c'] as [string, string],
      ['c', 'd'] as [string, string], ['d', 'a'] as [string, string],
      ['a', 'e'] as [string, string], ['a', 'f'] as [string, string],
      ['b', 'g'] as [string, string], ['b', 'h'] as [string, string],
      ['d', 'i'] as [string, string], ['c', 'i'] as [string, string]
    ]
  },
];


const ConstellationChallenge: React.FC<ConstellationChallengeProps> = ({
  difficulty = 2,
  wisdom = 10,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail = () => console.log('Challenge failed')
}) => {
  // Game state management
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentConstellation, setCurrentConstellation] = useState<Constellation | null>(null);
  const [availableConstellations, _setAvailableConstellations] = useState<Constellation[]>(
    CONSTELLATIONS.filter(c => c.difficulty === difficulty)
  );
  const [selectedStars, setSelectedStars] = useState<string[]>([]);
  const [_distractorStars, setDistractorStars] = useState<Star[]>([]);
  const [allStars, setAllStars] = useState<Star[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [showTurnMessage, setShowTurnMessage] = useState<boolean>(false);
  const [squareSize, setSquareSize] = useState(0);

  // State for valid next stars
  const [validNextStars, setValidNextStars] = useState<string[]>([]);

  // NEW: Progressive hint system state
  const [lastActionTime, setLastActionTime] = useState(Date.now());

  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Calculate game settings based on difficulty and wisdom
  const gameSettings: GameSettings = {
    numConstellations: 3, // Choose from 3 constellations per difficulty level
    minStars: 5 + difficulty,
    maxStars: 7 + (difficulty * 2),
    numDistractorStars: Math.max(0, (difficulty * 5) - (wisdom - 10)),
    timeLimit: 30 + (wisdom - 9) * 5, // More wisdom gives more time
  };

  // Calculate final game score - MODIFIED TO USE timeLeft INSTEAD OF timeElapsed
  const calculateGameScore = useCallback((
    numConnections: number,
    totalConnections: number
  ): number => {
    // Base score depends on completion percentage
    const completionPercentage = numConnections / totalConnections;
    const baseScore = 1000 * completionPercentage;

    // Time bonus: Use timeLeft and gameSettings.timeLimit directly
    // timeLeft is frozen when game ends, so this will be consistent
    const timeUsed = gameSettings.timeLimit - (timeLeft || 0);
    const timePercentage = 1 - (timeUsed / gameSettings.timeLimit);
    const timeBonus = baseScore * 0.5 * Math.max(0, timePercentage);

    // Difficulty bonus
    const difficultyBonus = difficulty * 100;

    return Math.round(Math.max(0, baseScore + timeBonus + difficultyBonus));
  }, [difficulty, gameSettings.timeLimit, timeLeft]);

  // Calculate star position based on percentage coordinates within the square
  const getStarPosition = useCallback((x: number, y: number) => {
    // Convert from percentage (0-100) to actual position in the square
    const offsetX = (squareSize * x) / 100;
    const offsetY = (squareSize * y) / 100;

    // Calculate the position of the top-left corner of the square to center it
    const gameAreaWidth = gameAreaRef.current?.clientWidth || 0;
    const gameAreaHeight = gameAreaRef.current?.clientHeight || 0;
    const squareLeft = (gameAreaWidth - squareSize) / 2;
    const squareTop = (gameAreaHeight - squareSize) / 2;

    return {
      x: squareLeft + offsetX,
      y: squareTop + offsetY
    };
  }, [squareSize]);

  const getHintIntensity = useCallback(() => {
    const timeSinceAction = Date.now() - lastActionTime;
    
    // Base timing depends on difficulty
    const baseDelay = difficulty === 1 ? 2000 : difficulty === 2 ? 3000 : 4000;
    const moderateDelay = baseDelay * 2;
    const obviousDelay = baseDelay * 4;
    
    if (timeSinceAction < baseDelay) return 'none';
    if (timeSinceAction < moderateDelay) return 'subtle';
    if (timeSinceAction < obviousDelay) return 'moderate';
    return 'obvious';
  }, [lastActionTime, difficulty]);

  const drawConstellationGhost = useCallback(() => {
    if (!currentConstellation || gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    const hintIntensity = getHintIntensity();
    if (hintIntensity === 'none') return;
    
    // Opacity based on difficulty and hint intensity
    const difficultyOpacity = {
      1: { subtle: 0.18, moderate: 0.30, obvious: 0.40 },
      2: { subtle: 0.18, moderate: 0.28, obvious: 0.38 },
      3: { subtle: 0.15, moderate: 0.24, obvious: 0.34 }
    }[difficulty];
    
    const baseOpacity = difficultyOpacity?.[hintIntensity] ?? 0.1;
    const opacity = baseOpacity;
    
    ctx.strokeStyle = `rgba(135, 206, 235, ${opacity})`;
    ctx.lineWidth = difficulty === 1 ? 1.5 : difficulty === 2 ? 1.25 : 1.5;
    
    // Dash pattern becomes more subtle with higher difficulty
    const dashPattern = difficulty === 1 ? [4, 4] : difficulty === 2 ? [3, 6] : [2, 8];
    ctx.setLineDash(dashPattern);
    
    // Only show connections that haven't been made by the player yet
    currentConstellation.connections.forEach(([a, b]) => {
      // Check if this connection has been made by the player
      const aIndex = selectedStars.indexOf(a);
      const bIndex = selectedStars.indexOf(b);
      const isConnected = aIndex !== -1 && bIndex !== -1 && Math.abs(aIndex - bIndex) === 1;
      
      if (!isConnected) {
        const starA = allStars.find(s => s.id === a);
        const starB = allStars.find(s => s.id === b);
        if (starA && starB) {
          const posA = getStarPosition(starA.x, starA.y);
          const posB = getStarPosition(starB.x, starB.y);
          
          ctx.beginPath();
          ctx.moveTo(posA.x, posA.y);
          ctx.lineTo(posB.x, posB.y);
          ctx.stroke();
        }
      }
    });
    
    ctx.setLineDash([]); // Reset line dash
  }, [currentConstellation, gameState, getHintIntensity, difficulty, selectedStars, allStars, getStarPosition]);

  // Find valid next stars based on the current constellation's connections
  const findValidNextStars = useCallback(() => {
    if (!currentConstellation || selectedStars.length === 0) {
      setValidNextStars([]);
      return;
    }

    const lastSelectedStar = selectedStars[selectedStars.length - 1];
    const validNextStarIds: string[] = [];

    // Find all connections that include the last selected star
    currentConstellation.connections.forEach(([a, b]) => {
      if (a === lastSelectedStar && !selectedStars.includes(b)) {
        validNextStarIds.push(b);
      } else if (b === lastSelectedStar && !selectedStars.includes(a)) {
        validNextStarIds.push(a);
      }
    });

    setValidNextStars(validNextStarIds);
  }, [currentConstellation, selectedStars]);

  // Update valid next stars when selected stars change
  useEffect(() => {
    findValidNextStars();
  }, [selectedStars, findValidNextStars]);

  const drawConnections = useCallback(() => {
    if (!canvasRef.current || !currentConstellation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match game area and adjust for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = gameAreaRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Scale context for high DPI displays
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw constellation ghost first (behind player connections)
    drawConstellationGhost();

    // Draw player connections
    if (selectedStars.length > 1) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      for (let i = 0; i < selectedStars.length - 1; i++) {
        const starA = allStars.find(s => s.id === selectedStars[i]);
        const starB = allStars.find(s => s.id === selectedStars[i + 1]);

        if (starA && starB) {
          const posA = getStarPosition(starA.x, starA.y);
          const posB = getStarPosition(starB.x, starB.y);

          ctx.beginPath();
          ctx.moveTo(posA.x, posA.y);
          ctx.lineTo(posB.x, posB.y);
          ctx.stroke();
        }
      }
      
      ctx.lineCap = 'butt'; // Reset lineCap
    }
  }, [currentConstellation, selectedStars, allStars, getStarPosition, drawConstellationGhost]);

  // Function to handle game ending
  const handleGameEnd = useCallback((timeExpired: boolean) => {
    // Update game state to prevent further interaction
    setGameState(timeExpired ? 'failed' : 'success');

    // Clear any active timers
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!currentConstellation) return;

    // Create a set of player connections (regardless of order)
    const playerConnections = new Set();

    // Add all connections in both directions
    for (let i = 0; i < selectedStars.length - 1; i++) {
      const a = selectedStars[i];
      const b = selectedStars[i + 1];
      playerConnections.add(`${a}-${b}`);
      playerConnections.add(`${b}-${a}`);
    }

    // Count correct connections
    let correctConnections = 0;
    currentConstellation.connections.forEach(([a, b]) => {
      if (playerConnections.has(`${a}-${b}`) || playerConnections.has(`${b}-${a}`)) {
        correctConnections++;
      }
    });

    // Calculate score using the new simplified function
    const score = calculateGameScore(
      correctConnections,
      currentConstellation.connections.length
    );

    setFinalScore(score);

    // Determine if the challenge was successfully completed
    // Success criteria: completed 100% of the connections
    const success = correctConnections === currentConstellation.connections.length;

    if (success) {
      setGameState('success');
      onComplete(score);
    } else {
      setGameState('failed');
      onFail();
    }
  }, [
    currentConstellation,
    selectedStars,
    calculateGameScore,
    onComplete,
    onFail
  ]);

  // Check if player has completed the constellation
  const checkCompletion = useCallback(() => {
    if (!currentConstellation || selectedStars.length < 2) return;

    // Create a set of player connections (regardless of order)
    const playerConnections = new Set();

    // Add all connections in both directions
    for (let i = 0; i < selectedStars.length - 1; i++) {
      const a = selectedStars[i];
      const b = selectedStars[i + 1];
      playerConnections.add(`${a}-${b}`);
      playerConnections.add(`${b}-${a}`);
    }

    // Count how many required connections are made
    let correctConnections = 0;
    currentConstellation.connections.forEach(([a, b]) => {
      if (playerConnections.has(`${a}-${b}`) || playerConnections.has(`${b}-${a}`)) {
        correctConnections++;
      }
    });

    // Perfect completion - all connections made
    if (correctConnections === currentConstellation.connections.length) {
      handleGameEnd(false);
    }
  }, [currentConstellation, selectedStars, handleGameEnd]);

  // Update connections when selected stars change
  useEffect(() => {
    drawConnections();
    checkCompletion();
  }, [selectedStars, drawConnections, checkCompletion, validNextStars, gameState]);

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

        handleGameEnd(true);
      }
    }, 100); // Update more frequently for smoother countdown
  }, [gameSettings.timeLimit, handleGameEnd]);


  const handleStarClick = useCallback((starId: string) => {
    // Only allow interaction when game is in playing state
    if (gameState !== 'playing') return;

    // Update last action time whenever player clicks a star
    setLastActionTime(Date.now());

    // If clicking the last selected star, remove it (undo functionality)
    if (selectedStars.length > 0 && selectedStars[selectedStars.length - 1] === starId) {
      setSelectedStars(prev => prev.slice(0, -1));
      return;
    }

    // Otherwise add the star to selections
    setSelectedStars(prev => [...prev, starId]);
  }, [gameState, selectedStars]);

  // Reset all game states for a fresh start
  const resetGameStates = useCallback(() => {
    setSelectedStars([]);
    setValidNextStars([]);
    setGameState('ready');
    setFinalScore(0);
    setTimeLeft(null);
    setShowAlert(false);
    setShowTurnMessage(false);

    // Clear any existing timers
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    endTimeRef.current = null;
  }, []);


  const startGame = useCallback(() => {
    // Reset all game states
    resetGameStates();

    // Use a short timeout to ensure state is reset
    setTimeout(() => {
      setGameState('playing');
      setLastActionTime(Date.now()); // Reset the stuck timer

      // Select a random constellation from the available ones
      if (availableConstellations.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableConstellations.length);
        const selected = availableConstellations[randomIndex];
        setCurrentConstellation(selected);

        // Generate distractor stars
        const distractors = generateDistractorStars(
          gameSettings.numDistractorStars,
          selected.stars
        );
        setDistractorStars(distractors);

        // Combine real stars and distractors
        setAllStars([...selected.stars, ...distractors]);

        // Show turn message
        setShowTurnMessage(true);

        // Hide turn message after 1.5 seconds
        setTimeout(() => {
          setShowTurnMessage(false);
        }, 1500);

        // Start the timer
        startTimer();
      }
    }, 50);
  }, [
    resetGameStates,
    availableConstellations,
    generateDistractorStars,
    gameSettings.numDistractorStars,
    startTimer
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  // Show alert when time is running low
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 5 && gameState === 'playing') {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [timeLeft, gameState]);

  // Resize canvas and handle orientation changes
  useEffect(() => {
    const handleResize = () => {
      drawConnections();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [drawConnections]);

  // Add pulsing animation for glow effect
  useEffect(() => {
    // Animate the glow intensity for selected stars
    let animationFrame: number;
    const animate = () => {
      drawConnections();
      animationFrame = requestAnimationFrame(animate);
    };

    if (gameState === 'playing') {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [gameState, selectedStars, validNextStars, drawConnections]);

  // Calculate the optimal square size based on container dimensions
  useEffect(() => {
    const updateSquareSize = () => {
      if (gameAreaRef.current) {
        // Get container dimensions
        const containerWidth = gameAreaRef.current.clientWidth;
        const containerHeight = gameAreaRef.current.clientHeight;

        // Calculate the maximum square that can fit (with some padding)
        const maxSize = Math.min(containerWidth, containerHeight) * 0.9;

        setSquareSize(maxSize);
      }
    };

    updateSquareSize();
    window.addEventListener('resize', updateSquareSize);
    window.addEventListener('orientationchange', updateSquareSize);
    return () => {
      window.removeEventListener('resize', updateSquareSize);
      window.removeEventListener('orientationchange', updateSquareSize);
    };
  }, []);


  const renderStar = (star: Star) => {
    const isSelected = selectedStars.includes(star.id);
    const isLastSelected = selectedStars.length > 0 && selectedStars[selectedStars.length - 1] === star.id;
    const isValidNext = validNextStars.includes(star.id);
    const hintIntensity = getHintIntensity();

    // Calculate position within the square
    const position = getStarPosition(star.x, star.y);

    // Progressive glow for valid next stars
    let glowClasses = '';
    let hintBrightness = 1;
    if (isValidNext && gameState === 'playing' && hintIntensity !== 'none') {
      const intensityConfig = {
        'subtle': {
          brightness: difficulty === 1 ? 1.08 : difficulty === 2 ? 1.05 : 1.03,
          shadow: difficulty === 1 ? 'shadow-sm shadow-amber-300/20' :
                  difficulty === 2 ? 'shadow-sm shadow-amber-300/15' :
                  'shadow-sm shadow-amber-300/10',
          animation: ''
        },
        'moderate': {
          brightness: difficulty === 1 ? 1.15 : difficulty === 2 ? 1.10 : 1.05,
          shadow: difficulty === 1 ? 'shadow-md shadow-amber-400/30' :
                  difficulty === 2 ? 'shadow-md shadow-amber-400/20' :
                  'shadow-sm shadow-amber-400/15',
          animation: ''
        },
        'obvious': {
          brightness: difficulty === 1 ? 1.25 : difficulty === 2 ? 1.18 : 1.10,
          shadow: difficulty === 1 ? 'shadow-lg shadow-amber-500/40' :
                  difficulty === 2 ? 'shadow-md shadow-amber-500/25' :
                  'shadow-md shadow-amber-500/15',
          animation: ''
        }
      };

      const config = intensityConfig[hintIntensity];
      glowClasses = `${config.animation} ${config.shadow}`;
      hintBrightness = config.brightness;
    }

    const imgBrightness = isSelected ? 1.5 : hintBrightness;

    return (
      <div
        key={star.id}
        className={`
          absolute w-4 h-4 transform -translate-x-1/2 -translate-y-1/2
          ${gameState === 'playing' ? 'cursor-pointer' : 'cursor-default'}
          flex items-center justify-center transition-all duration-300
          ${isSelected ? 'scale-125' : 'scale-100'}
          ${isLastSelected ? 'ring-1 ring-amber-500 rounded-full' : ''}
          ${glowClasses}
        `}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
        onClick={() => handleStarClick(star.id)}
      >
        <img
          src="/challenges/16bit-star.png"
          alt="Star"
          className={`w-full h-full object-contain transition-all duration-300 ${isSelected ? 'animate-pulse' : ''}`}
          style={{ filter: `brightness(${imgBrightness})` }}
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      <div
        className="relative bg-slate-800 rounded-lg w-full h-96 mx-auto p-0 overflow-hidden"
      >
        <div
          ref={gameAreaRef}
          className="absolute inset-0 flex flex-col"
        >
          {/* Background image */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <img
              src="/challenges/starmap-nightsky.jpg"
              alt="Night sky background"
              className="w-full h-full object-cover opacity-80"
            />
          </div>

          {/* Turn Message Overlay */}
          {showTurnMessage && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="bg-black/70 text-white text-2xl font-bold px-6 py-4 rounded-lg animate-pulse">
                Connect the Stars!
              </div>
            </div>
          )}

          {/* Alert for low time */}
          {showAlert && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-red-500/80 text-white px-4 py-2 rounded-lg animate-pulse">
                Time running out!
              </div>
            </div>
          )}

          {/* Canvas for drawing connections */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-10"
          />

          {/* Stars */}
          <div className="relative z-10 h-full">
            {allStars.map(star => renderStar(star))}
          </div>
        </div>
      </div>

      <ChallengeActionBar
        gameState={gameState}
        score={finalScore}
        timeLeft={timeLeft}
        onStart={startGame}
        onRestart={startGame}
      />
    </div>
  );
};

export default ConstellationChallenge;