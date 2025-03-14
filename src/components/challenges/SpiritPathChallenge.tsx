import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';
import { ImageIcon } from 'lucide-react';

interface Position {
  row: number;
  col: number;
}

type TileState = 'visible' | 'disappearing' | 'hidden';

interface Tile {
  position: Position;
  state: TileState;
  disappearTimer?: number | null;
  imageIndex: number;
}

interface SpiritPathProps {
  difficulty?: number;
  agility?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const SpiritPath: React.FC<SpiritPathProps> = ({
  difficulty = 1,
  agility = 10,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail = () => console.log('Challenge failed')
}) => {
  // Game state management
  const [gameState, setGameState] = useState<GameState>('ready');
  const [playerPosition, setPlayerPosition] = useState<Position | null>(null);
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [pathIntegrityChecks, setPathIntegrityChecks] = useState<number>(0);

  // References for timer implementation
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const tileDisappearTimersRef = useRef<Record<string, number>>({});
  // New ref to track current player position for use in closures
  const playerPositionRef = useRef<Position | null>(null);
  const pathCheckTimerRef = useRef<number | null>(null);
  const gridRef = useRef<Tile[][]>([]);

  const tileImages = [
    '/challenges/tile1.png',
    '/challenges/tile2.png',
    '/challenges/tile3.png',
    '/challenges/tile4.png'
  ];

  // Update player position ref whenever playerPosition state changes
  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  // Update grid ref whenever grid state changes
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  // Calculate game settings based on difficulty and agility
  const gameSettings = {
    gridSize: 3 + difficulty, // Use agility to determine grid size
    timeLimit: 30 - (difficulty * 5),
    disappearChance: 0.35 + (difficulty * 0.1),
    disappearWarningTime: 0.8 + (agility * 0.1),
    reappearChance: 0.45,
    initialVisibleTiles: 0.75 - (difficulty * 0.05), // percentage of tiles visible at start
    pathCheckInterval: 500, // Check path integrity every 500ms
    pathFixedTileLifetime: 3000, // Tiles restored for path integrity will remain for at least this long (ms)
  };

  // Function to check if a path exists from start to end
  const pathExists = useCallback((currentGrid: Tile[][], start: Position, end: Position): boolean => {
    // Using breadth-first search to find a path
    const queue: Position[] = [start];
    const visited = new Set<string>();
    visited.add(`${start.row}-${start.col}`);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // Found the end
      if (current.row === end.row && current.col === end.col) {
        return true;
      }
      
      // Check all adjacent tiles
      const adjacentPositions = [
        {row: current.row - 1, col: current.col}, // up
        {row: current.row + 1, col: current.col}, // down
        {row: current.row, col: current.col - 1}, // left
        {row: current.row, col: current.col + 1}  // right
      ];
      
      for (const pos of adjacentPositions) {
        const key = `${pos.row}-${pos.col}`;
        if (pos.row >= 0 && pos.row < currentGrid.length && 
            pos.col >= 0 && pos.col < currentGrid[0].length && 
            currentGrid[pos.row][pos.col].state !== 'hidden' &&
            !visited.has(key)) {
          queue.push(pos);
          visited.add(key);
        }
      }
    }
    
    return false; // No path found
  }, []);

  // Find all potential paths (for the path restoration logic)
  const findShortestPath = useCallback((currentGrid: Tile[][], start: Position, end: Position): Position[] | null => {
    const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
    const visited = new Set<string>();
    visited.add(`${start.row}-${start.col}`);
    
    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      
      // Found the end
      if (pos.row === end.row && pos.col === end.col) {
        return path;
      }
      
      // Check all adjacent tiles
      const adjacentPositions = [
        {row: pos.row - 1, col: pos.col}, // up
        {row: pos.row + 1, col: pos.col}, // down
        {row: pos.row, col: pos.col - 1}, // left
        {row: pos.row, col: pos.col + 1}  // right
      ];
      
      for (const nextPos of adjacentPositions) {
        const key = `${nextPos.row}-${nextPos.col}`;
        if (nextPos.row >= 0 && nextPos.row < currentGrid.length && 
            nextPos.col >= 0 && nextPos.col < currentGrid[0].length && 
            !visited.has(key)) {
          
          // For path finding, consider both visible and hidden tiles (we'll restore hidden ones if needed)
          visited.add(key);
          const newPath = [...path, nextPos];
          queue.push({ pos: nextPos, path: newPath });
        }
      }
    }
    
    return null; // No path found
  }, []);

  // Restore a critical path to ensure game is solvable
  const restoreCriticalPath = useCallback((start: Position, end: Position) => {
    // Find the shortest path, including hidden tiles
    const shortestPath = findShortestPath(gridRef.current, start, end);
    
    if (!shortestPath) return false; // No path can be created
    
    // Restore only the necessary hidden tiles along this path
    let tilesRestored = false;
    const tempGrid = JSON.parse(JSON.stringify(gridRef.current)); // Deep clone for testing
    
    for (const position of shortestPath) {
      if (tempGrid[position.row][position.col].state === 'hidden') {
        // Make this tile visible in our temp grid
        tempGrid[position.row][position.col].state = 'visible';
        
        // Check if this creates a valid path
        if (pathExists(tempGrid, start, end)) {
          // Actually restore this tile in the real grid
          makeTileReappear(position.row, position.col);
          tilesRestored = true;
          
          // Prevent this tile from disappearing too quickly (or during next path check)
          const tileKey = `${position.row}-${position.col}`;
          tileDisappearTimersRef.current[`protected-${tileKey}`] = window.setTimeout(() => {
            delete tileDisappearTimersRef.current[`protected-${tileKey}`];
          }, gameSettings.pathFixedTileLifetime);
        }
      }
    }
    
    // If we restored any tiles, also add some random ones to make it less obvious
    if (tilesRestored) {
      const extraTilesToRestore = Math.floor(Math.random() * 2) + 1; // 1-2 random tiles
      
      for (let i = 0; i < extraTilesToRestore; i++) {
        const randomRow = Math.floor(Math.random() * gameSettings.gridSize);
        const randomCol = Math.floor(Math.random() * gameSettings.gridSize);
        
        // Skip start, end, and already visible tiles
        if ((randomRow === 0 && randomCol === 0) || 
            (randomRow === gameSettings.gridSize - 1 && randomCol === gameSettings.gridSize - 1) ||
            gridRef.current[randomRow][randomCol].state !== 'hidden') {
          continue;
        }
        
        makeTileReappear(randomRow, randomCol);
      }
    }
    
    return tilesRestored;
  }, [pathExists, findShortestPath, gameSettings.gridSize, gameSettings.pathFixedTileLifetime]);

  // Path integrity check
  const maintainPath = useCallback(() => {
    if (gameState !== 'playing' || !playerPositionRef.current) return;
    
    const goal = {row: 0, col: gameSettings.gridSize - 1};
    
    // Check if a path exists
    if (!pathExists(gridRef.current, playerPositionRef.current, goal)) {
      // Attempt to restore a critical path
      restoreCriticalPath(playerPositionRef.current, goal);
      setPathIntegrityChecks(prev => prev + 1);
    }
  }, [gameState, pathExists, restoreCriticalPath, gameSettings.gridSize]);

  // Calculate final game score based on win condition and time elapsed
  const calculateGameScore = useCallback((isWin: boolean, timeElapsed: number, movesCount: number): number => {
    if (!isWin) return 0; // No score for losing
    
    // Time bonus (proportional to time left)
    const maxTimeBonus = 600; // 60% of max score
    const timeRatio = Math.max(0, gameSettings.timeLimit - timeElapsed) / gameSettings.timeLimit;
    const timeBonus = Math.round(timeRatio * maxTimeBonus);
    
    // Move efficiency bonus (40% of max score)
    const maxMoveBonus = 400; 
    const minPossibleMoves = gameSettings.gridSize - 1; // Minimum moves required (from start to end)
    const moveEfficiency = Math.max(0, 1 - ((movesCount - minPossibleMoves) / (gameSettings.gridSize * 2)));
    const moveBonus = Math.round(moveEfficiency * maxMoveBonus);
    
    // Cap total score at 1000
    return Math.min(1000, timeBonus + moveBonus);
  }, [gameSettings.timeLimit, gameSettings.gridSize]);

  // Initialize the grid
  const initializeGrid = useCallback(() => {
    const newGrid: Tile[][] = [];
    
    for (let row = 0; row < gameSettings.gridSize; row++) {
      const newRow: Tile[] = [];
      for (let col = 0; col < gameSettings.gridSize; col++) {
        // Determine if this tile should be initially visible
        const isVisible = Math.random() < gameSettings.initialVisibleTiles;
        const imageIndex = Math.floor(Math.random() * tileImages.length);

        newRow.push({
          position: { row, col },
          state: isVisible ? 'visible' : 'hidden',
          disappearTimer: null,
          imageIndex: imageIndex
        });
      }
      newGrid.push(newRow);
    }
    
    // Always ensure start and end tiles are visible
    newGrid[gameSettings.gridSize - 1][0].state = 'visible';
    newGrid[0][gameSettings.gridSize - 1].state = 'visible';
    
    // Check if there's a valid path initially - if not, create one
    const start = {row: 0, col: 0};
    const end = {row: gameSettings.gridSize - 1, col: gameSettings.gridSize - 1};
    
    if (!pathExists(newGrid, start, end)) {
      const path = findShortestPath(newGrid, start, end);
      
      if (path) {
        for (const position of path) {
          newGrid[position.row][position.col].state = 'visible';
        }
      }
    }
    
    return newGrid;
  }, [gameSettings.gridSize, gameSettings.initialVisibleTiles, pathExists, findShortestPath]);

  // Function to handle game ending
  const handleGameEnd = useCallback((success: boolean, elapsedTime: number | null = null) => {
    // Clear any active timers
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Clear path integrity check timer
    if (pathCheckTimerRef.current) {
      window.clearInterval(pathCheckTimerRef.current);
      pathCheckTimerRef.current = null;
    }
    
    // Clear all tile disappear timers
    Object.values(tileDisappearTimersRef.current).forEach(timerId => {
      window.clearTimeout(timerId);
    });
    tileDisappearTimersRef.current = {};

    if (success) {
      const finalElapsedTime = elapsedTime !== null ? elapsedTime : gameSettings.timeLimit;
      const score = calculateGameScore(true, finalElapsedTime, moves);
      setFinalScore(score);
      setGameState('success');
      onComplete(score);
    } else {
      setFinalScore(0);
      setGameState('failed');
      onFail();
    }
  }, [gameSettings.timeLimit, calculateGameScore, onComplete, onFail, moves]);

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

        // End game as failed due to time out
        handleGameEnd(false);
      }
    }, 100); // Update more frequently for smoother countdown
  }, [gameSettings.timeLimit, handleGameEnd]);

  // Initialize the game
  const startGame = useCallback(() => {
    // Initialize the grid
    const newGrid = initializeGrid();
    setGrid(newGrid);
    
    // Set player at starting position (top-left)
    setPlayerPosition({ row: gameSettings.gridSize - 1, col: 0 });
    
    // Reset moves counter
    setMoves(0);
    setPathIntegrityChecks(0);
    
    // Set game state to playing
    setGameState('playing');
    setFinalScore(0);

    // Clear any existing timers
    Object.values(tileDisappearTimersRef.current).forEach(timerId => {
      window.clearTimeout(timerId);
    });
    tileDisappearTimersRef.current = {};

    // Start the timer
    startTimer();
    
    // Start path integrity checks
    if (pathCheckTimerRef.current) {
      window.clearInterval(pathCheckTimerRef.current);
    }
    
    pathCheckTimerRef.current = window.setInterval(() => {
      maintainPath();
    }, gameSettings.pathCheckInterval);
  }, [initializeGrid, startTimer, maintainPath, gameSettings.pathCheckInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      if (pathCheckTimerRef.current) {
        window.clearInterval(pathCheckTimerRef.current);
      }
      
      // Clear all tile disappear timers
      Object.values(tileDisappearTimersRef.current).forEach(timerId => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  // Modified function to make a tile disappear with path checking
  const startTileDisappearing = useCallback((row: number, col: number) => {
    // Skip start and end tiles
    if ((row === gameSettings.gridSize - 1 && col === 0) || (row === 0 && col === gameSettings.gridSize - 1)) {
      return;
    }
    
    // Create a proper key for the timer
    const tileKey = `${row}-${col}`;
    
    // Skip if tile is already hidden or disappearing or if a timer is already set
    if (grid[row][col].state !== 'visible' || 
        tileDisappearTimersRef.current[tileKey] ||
        tileDisappearTimersRef.current[`protected-${tileKey}`]) {
      return;
    }
    
    // Check if making this tile disappear would break the path
    if (playerPosition) {
      const goal = {row: 0, col: gameSettings.gridSize - 1};
      
      // Make a temporary deep copy of the grid for testing
      const testGrid = JSON.parse(JSON.stringify(grid));
      testGrid[row][col].state = 'hidden';
      
      // If this would break all paths to the goal, don't let it disappear
      if (!pathExists(testGrid, playerPosition, goal)) {
        return;
      }
    }
    
    // First, update the tile to 'disappearing' state
    setGrid(prevGrid => {
      const newGrid = JSON.parse(JSON.stringify(prevGrid)); // Deep clone to ensure React detects the changes
      newGrid[row][col] = {
        ...newGrid[row][col],
        state: 'disappearing',
      };
      return newGrid;
    });
    
    // Set timer to fully hide the tile
    const timerId = window.setTimeout(() => {
      // Get the CURRENT player position at the time this callback executes
      const currentPlayerPosition = playerPositionRef.current;
      
      setGrid(prevGrid => {
        const newGrid = JSON.parse(JSON.stringify(prevGrid)); // Deep clone
        newGrid[row][col] = {
          ...newGrid[row][col],
          state: 'hidden',
        };
        return newGrid;
      });
      
      // Use the current player position from the ref for the check
      if (currentPlayerPosition && 
          currentPlayerPosition.row === row && 
          currentPlayerPosition.col === col) {
        handleGameEnd(false);
      }
      
      // Remove this timer from the ref
      delete tileDisappearTimersRef.current[tileKey];
    }, gameSettings.disappearWarningTime * 1000);
    
    // Store the timer ID
    tileDisappearTimersRef.current[tileKey] = timerId;
    
    return timerId;
  }, [grid, playerPosition, gameSettings.disappearWarningTime, handleGameEnd, gameSettings.gridSize, pathExists]);

  // Function to make a tile reappear
  const makeTileReappear = useCallback((row: number, col: number) => {
    const tileKey = `${row}-${col}`;
    
    // Skip if the tile is already visible
    if (gridRef.current[row]?.[col]?.state === 'visible') {
      return;
    }
    
    // Clear any existing disappear timer for this tile
    if (tileDisappearTimersRef.current[tileKey]) {
      window.clearTimeout(tileDisappearTimersRef.current[tileKey]);
      delete tileDisappearTimersRef.current[tileKey];
    }
    
    setGrid(prevGrid => {
      const newGrid = JSON.parse(JSON.stringify(prevGrid)); // Deep clone
      if (newGrid[row] && newGrid[row][col]) {
        newGrid[row][col] = {
          ...newGrid[row][col],
          state: 'visible',
          // The imageIndex will be preserved with spread operator
        };
      }
      return newGrid;
    });
  }, []);

  // Random tile disappearing effect
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const intervalId = setInterval(() => {
      // Make a copy of the current grid to check states
      const currentGrid = [...grid];
      
      // For each tile, there's a chance it will start disappearing or reappearing
      for (let row = 0; row < gameSettings.gridSize; row++) {
        for (let col = 0; col < gameSettings.gridSize; col++) {
          // Skip start and end tiles
          if ((row === gameSettings.gridSize - 1 && col === 0) || (row === 0 && col === gameSettings.gridSize - 1)) {
            continue;
          }
          
          // Get current tile state
          const currentState = currentGrid[row][col].state;
          
          // If tile is visible, check for random disappearance
          if (currentState === 'visible') {
            if (Math.random() < gameSettings.disappearChance / 10) { // Reduced chance for smoother gameplay
              startTileDisappearing(row, col);
            }
          }
          // If tile is hidden, check for random reappearance
          else if (currentState === 'hidden') {
            if (Math.random() < gameSettings.reappearChance / 10) { // Reduced chance for smoother gameplay
              makeTileReappear(row, col);
            }
          }
          // We don't touch tiles that are in the 'disappearing' state
        }
      }
    }, 100); // More frequent checks with lower probabilities
    
    return () => clearInterval(intervalId);
  }, [gameState, grid, startTileDisappearing, makeTileReappear, gameSettings.disappearChance, gameSettings.reappearChance, gameSettings.gridSize]);

  // Handle player movement - click only version
  const movePlayer = useCallback((newRow: number, newCol: number) => {
    if (gameState !== 'playing' || !playerPosition) return;
    
    // Check if move is valid (must be adjacent)
    const rowDiff = Math.abs(newRow - playerPosition.row);
    const colDiff = Math.abs(newCol - playerPosition.col);
    const isAdjacent = (rowDiff + colDiff === 1);
    
    // Check if tile exists and is visible
    const isValidTile = newRow >= 0 && newRow < gameSettings.gridSize && 
                        newCol >= 0 && newCol < gameSettings.gridSize &&
                        grid[newRow][newCol].state !== 'hidden';
    
    if (isAdjacent && isValidTile) {
      // Update player position
      setPlayerPosition({ row: newRow, col: newCol });
      
      // Increment move counter
      setMoves(prev => prev + 1);
      
      // Check if player reached the end
      if (newRow === 0 && newCol === gameSettings.gridSize - 1) {
        // Calculate elapsed time
        if (endTimeRef.current) {
          const now = Date.now();
          const elapsed = (gameSettings.timeLimit * 1000) - (endTimeRef.current - now);
          const elapsedSeconds = Math.min(gameSettings.timeLimit, elapsed / 1000);
          
          // End game with win
          handleGameEnd(true, elapsedSeconds);
        } else {
          handleGameEnd(true);
        }
      }
    }
  }, [gameState, playerPosition, grid, handleGameEnd, gameSettings.timeLimit, gameSettings.gridSize]);

  // Handle tile click
  const handleTileClick = useCallback((row: number, col: number) => {
    movePlayer(row, col);
  }, [movePlayer]);

  // Get adjacent tiles to show which are available
  const getAdjacentTiles = useCallback((position: Position | null): Position[] => {
    if (!position) return [];
    
    const { row, col } = position;
    const adjacentPositions: Position[] = [
      { row: row - 1, col },  // up
      { row: row + 1, col },  // down
      { row, col: col - 1 },  // left
      { row, col: col + 1 }   // right
    ];
    
    // Filter out positions that are out of bounds
    return adjacentPositions.filter(pos => 
      pos.row >= 0 && pos.row < gameSettings.gridSize && 
      pos.col >= 0 && pos.col < gameSettings.gridSize
    );
  }, [gameSettings.gridSize]);

  // Score ticker component
  const scoreTicker = (
    <div className="text-gray-300 font-bold">
      Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s | Score: {Math.floor(finalScore)}
    </div>
  );

  // Render a tile with proper styling based on its state
  const renderTile = (tile: Tile, hasPlayer: boolean) => {
    const { row, col } = tile.position;
    const adjacentTiles = getAdjacentTiles(playerPosition);
    const isAdjacent = adjacentTiles.some(pos => pos.row === row && pos.col === col);
    
    let tileClasses = "w-full h-full rounded-lg transition-all duration-200 ";
    
    // Base styling for the tile container
    switch(tile.state) {
      case 'visible':
        tileClasses += isAdjacent && gameState === 'playing' 
          ? "cursor-pointer" 
          : "";
        break;
      case 'disappearing':
        tileClasses += isAdjacent && gameState === 'playing'
          ? "animate-pulse cursor-pointer"
          : "animate-pulse";
        break;
      case 'hidden':
        tileClasses += "opacity-0";
        break;
    }
    
    if (hasPlayer) {
      tileClasses += " border-4 border-yellow-400";
    }
    
    // Highlight adjacent tiles to show they're clickable
    if (isAdjacent && tile.state !== 'hidden' && gameState === 'playing') {
      tileClasses += " ring-2 ring-yellow-300";
    }
  
    // Get the image for this tile
    const tileImage = tileImages[tile.imageIndex];
    
    // Special styling for start and end tiles - you might want special images for these
    const isSpecialTile = (tile.position.row === gameSettings.gridSize - 1 && tile.position.col === 0) || 
                          (tile.position.row === 0 && tile.position.col === gameSettings.gridSize - 1);
    
    return (
      <div 
        className={tileClasses} 
        style={{
          backgroundImage: `url(${tileImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: tile.state === 'hidden' ? 'grayscale(100%)' : 'none'
        }}
        onClick={() => {
          if (tile.state !== 'hidden' && isAdjacent && gameState === 'playing') {
            handleTileClick(tile.position.row, tile.position.col);
          }
        }}
      >
        {hasPlayer && (
          <div className="flex items-center justify-center h-full">
            <div className="bg-yellow-300 w-3/4 h-3/4 rounded-full opacity-80"></div>
          </div>
        )}
      </div>
    );
  };

  // Game content rendering based on state
  const renderGameContent = () => {
    return (
      <>
        {/* Game area with grid */}
        <div className="rounded-lg mb-4">
          <div className="relative w-full h-96 rounded-lg flex items-center justify-center overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src="/challenges/spiritpath-background.png"
                alt="Game background"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Square grid container - this will maintain aspect ratio */}
            <div className="relative z-10 mx-auto" style={{
              maxWidth: "90%",
              width: "min(90vw, 350px)",
              height: "min(90vw, 350px)"
            }}>
              {/* The actual grid - fills the square container */}
              <div className="grid gap-1 w-full h-full" style={{
                gridTemplateColumns: `repeat(${gameSettings.gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gameSettings.gridSize}, 1fr)`
              }}>
                {grid.map((row, rowIndex) =>
                  row.map((tile, colIndex) => (
                    <div key={`${rowIndex}-${colIndex}`}>
                      {renderTile(
                        tile,
                        playerPosition !== null &&
                        playerPosition.row === rowIndex &&
                        playerPosition.col === colIndex
                      )}
                    </div>
                  ))
                )}
              </div>
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
    <div ref={containerRef} className="w-full mx-auto">
      {/* Game content */}
      {renderGameContent()}
    </div>
  );
};

export default SpiritPath;