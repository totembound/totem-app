import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';

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
  const [availableConstellations, setAvailableConstellations] = useState<Constellation[]>([]);
  const [selectedStars, setSelectedStars] = useState<string[]>([]);
  const [distractorStars, setDistractorStars] = useState<Star[]>([]);
  const [allStars, setAllStars] = useState<Star[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [showTurnMessage, setShowTurnMessage] = useState<boolean>(false);
  const [squareSize, setSquareSize] = useState(0);

  // State for valid next stars
  const [validNextStars, setValidNextStars] = useState<string[]>([]);

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
    numDistractorStars: Math.max(0, (difficulty * 5) - (wisdom - 9)),
    timeLimit: 30 + (wisdom - 10) * 5, // More wisdom gives more time
  };

  // Filter constellations based on difficulty
  useEffect(() => {
    const filteredConstellations = CONSTELLATIONS.filter(c => c.difficulty === difficulty);
    setAvailableConstellations(filteredConstellations);
  }, [difficulty]);

  // Generate distractor stars
  const generateDistractorStars = useCallback((count: number, existingStars: Star[]) => {
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
  }, []);

  // Calculate final game score
  const calculateGameScore = useCallback((
    timeElapsed: number,
    timeLimit: number,
    numConnections: number,
    totalConnections: number
  ): number => {
    // Base score depends on completion percentage
    const completionPercentage = numConnections / totalConnections;
    const baseScore = 1000 * completionPercentage;

    // Time bonus: Up to 50% bonus for quick completion
    const timePercentage = 1 - (timeElapsed / timeLimit);
    const timeBonus = baseScore * 0.5 * timePercentage;

    // Difficulty bonus
    const difficultyBonus = difficulty * 100;

    return Math.round(Math.max(0, baseScore + timeBonus + difficultyBonus));
  }, [difficulty]);

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

  // Calculate direction between two points (for glow direction)
  const calculateDirection = useCallback((fromX: number, fromY: number, toX: number, toY: number) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    return angle * (180 / Math.PI); // Convert to degrees
  }, []);

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

  // Draw connections between stars
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

    // Set up line style for connections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;

    // Draw player connections
    if (selectedStars.length > 1) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'; // Gold color for player connections

      for (let i = 0; i < selectedStars.length - 1; i++) {
        const starA = allStars.find(s => s.id === selectedStars[i]);
        const starB = allStars.find(s => s.id === selectedStars[i + 1]);

        if (starA && starB) {
          // Convert percentage coordinates to actual canvas coordinates using square scaling
          const posA = getStarPosition(starA.x, starA.y);
          const posB = getStarPosition(starB.x, starB.y);

          ctx.beginPath();
          ctx.moveTo(posA.x, posA.y);
          ctx.lineTo(posB.x, posB.y);
          ctx.stroke();
        }
      }
    }

    // Draw directional hint glows with visibility based on difficulty
    if (selectedStars.length > 0 && validNextStars.length > 0 && gameState === 'playing') {
      const lastSelectedStar = allStars.find(s => s.id === selectedStars[selectedStars.length - 1]);

      if (lastSelectedStar) {
        const lastPos = getStarPosition(lastSelectedStar.x, lastSelectedStar.y);

        // Calculate opacity based on difficulty (more visible for easy, less visible for hard)
        const baseOpacity = Math.max(0.1, 1 - (difficulty * 0.25));

        // Draw glow hints for each valid next star
        validNextStars.forEach(nextStarId => {
          const nextStar = allStars.find(s => s.id === nextStarId);
          if (nextStar) {
            const nextPos = getStarPosition(nextStar.x, nextStar.y);

            // Create gradient for glow effect with opacity based on difficulty
            const gradient = ctx.createLinearGradient(lastPos.x, lastPos.y, nextPos.x, nextPos.y);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${baseOpacity})`); // Near the selected star
            gradient.addColorStop(0.5, `rgba(255, 215, 0, ${baseOpacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)'); // Fade out

            // Draw directional glow line
            ctx.strokeStyle = gradient;
            ctx.lineWidth = Math.max(2, 6 - difficulty); // Thinner lines for higher difficulty
            ctx.lineCap = 'round';

            // Calculate direction from last selected star to next star
            const dx = nextPos.x - lastPos.x;
            const dy = nextPos.y - lastPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Normalize direction vector
            const nx = dx / distance;
            const ny = dy / distance;

            // Make the glow length shorter for higher difficulties
            const glowLength = distance * Math.max(0.3, 0.7 - (difficulty * 0.1));

            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(lastPos.x + nx * glowLength, lastPos.y + ny * glowLength);
            ctx.stroke();

            // Reset lineCap
            ctx.lineCap = 'butt';
          }
        });
      }
    }
  }, [currentConstellation, selectedStars, allStars, getStarPosition, difficulty, validNextStars, gameState]);

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

    // Calculate elapsed time
    let elapsedTime = gameSettings.timeLimit;
    if (endTimeRef.current !== null) {
      const now = Date.now();
      const elapsed = Math.min(
        gameSettings.timeLimit * 1000,
        endTimeRef.current - now > 0 ? gameSettings.timeLimit * 1000 - (endTimeRef.current - now) : gameSettings.timeLimit * 1000
      );
      elapsedTime = elapsed / 1000;
    }

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

    // Calculate score
    const score = calculateGameScore(
      elapsedTime,
      gameSettings.timeLimit,
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
    gameSettings.timeLimit,
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

        // Time's up - calculate score based on completed connections
        handleGameEnd(true);
      }
    }, 100); // Update more frequently for smoother countdown
  }, [gameSettings.timeLimit, handleGameEnd]);

  // Handle star clicks
  const handleStarClick = useCallback((starId: string) => {
    // Only allow interaction when game is in playing state
    if (gameState !== 'playing') return;

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

  // Initialize or restart the game
  const startGame = useCallback(() => {
    // Reset all game states
    resetGameStates();

    // Use a short timeout to ensure state is reset
    setTimeout(() => {
      setGameState('playing');

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

    if (gameState === 'playing' && selectedStars.length > 0 && validNextStars.length > 0) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [gameState, selectedStars, validNextStars, drawConnections]);

  // Score ticker component
  const scoreTicker = (
    <div className="text-gray-300 font-bold">
      Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s |
      Score: {Math.floor(finalScore)}
    </div>
  );

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

  // Render a single star
  const renderStar = (star: Star) => {
    const isSelected = selectedStars.includes(star.id);
    const isLastSelected = selectedStars.length > 0 && selectedStars[selectedStars.length - 1] === star.id;
    const isValidNext = validNextStars.includes(star.id);

    // Calculate position within the square
    const position = getStarPosition(star.x, star.y);

    // Calculate glow classes based on difficulty and whether this is a valid next star
    let glowClasses = '';

    if (isValidNext && gameState === 'playing') {
      // Adjust shadow intensity based on difficulty
      const shadowIntensity = difficulty === 1 ? 'shadow-lg' :
        difficulty === 2 ? 'shadow-md' :
          'shadow-sm';

      // Adjust animation speed based on difficulty (slower pulse is more subtle)
      const animationSpeed = difficulty === 1 ? 'animate-pulse' :
        difficulty === 2 ? 'animate-pulse' :
          '';

      glowClasses = `${animationSpeed} ${shadowIntensity} shadow-amber-500/${Math.max(10, 50 - (difficulty * 15))}`;
    }

    return (
      <div
        key={star.id}
        className={`
          absolute w-4 h-4 transform -translate-x-1/2 -translate-y-1/2 
          ${gameState === 'playing' ? 'cursor-pointer' : 'cursor-default'}
          flex items-center justify-center transition-all duration-200
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
          className={`
            w-full h-full object-contain
            ${isSelected ? 'brightness-150' : 'brightness-100'}
            ${isSelected ? 'animate-pulse' : ''}
            ${isValidNext && gameState === 'playing' ? `brightness-${Math.min(125, 100 + (25 / difficulty))}` : ''}
          `}
        />

        {/* Add directional indicator for valid next stars */}
        {isLastSelected && validNextStars.length > 0 && gameState === 'playing' && (
          <div className="absolute inset-0 z-10">
            {validNextStars.map(nextStarId => {
              const nextStar = allStars.find(s => s.id === nextStarId);
              if (!nextStar) return null;

              // Calculate direction to the next star
              const nextPos = getStarPosition(nextStar.x, nextStar.y);
              const direction = calculateDirection(position.x, position.y, nextPos.x, nextPos.y);

              // Determine glow intensity based on difficulty
              const glowOpacity = Math.max(0.2, 0.8 - (difficulty * 0.2));

              return (
                <div
                  key={`indicator-${nextStarId}`}
                  className="absolute w-3 h-3 top-0.5 left-0.5 pointer-events-none"
                  style={{
                    transform: `rotate(${direction}deg)`,
                    opacity: glowOpacity
                  }}
                >
                  {/* Only show indicators on easiest difficulty */}
                  {difficulty === 1 && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      <>
        {/* Game area with background - using aspect ratio box */}
        <div
          className="relative bg-slate-800 rounded-lg mb-4 max-w-2xl mx-auto p-0 overflow-hidden"
          style={{ aspectRatio: '16/9' }} // Fixed aspect ratio container
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

        {/* Controls and buttons section */}
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
            <div className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg">
              {scoreTicker}
            </div>
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

export default ConstellationChallenge;