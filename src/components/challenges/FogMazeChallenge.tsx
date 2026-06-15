import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GameState } from '../../types/types';
import ChallengeActionBar from './ChallengeActionBar';

type Cell = {
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  isExit: boolean;
};

type MazeGrid = Cell[][];
type Pos = { x: number; y: number };

interface FogMazeChallengeProps {
  difficulty?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

// Score = completionPoints + (time remaining ratio × speedBonus).
// Intended ceilings (perfect run): d1 1500, d2 2250, d3 3000 (= server maxScore).
// Higher difficulty grants more time overall but less time per cell
// (90s/81 ≈ 1.1s, 120s/169 ≈ 0.7s, 150s/289 ≈ 0.5s), so it's harder per move
// while offering a strictly higher score ceiling.
const SETTINGS = {
  1: { cols: 9,  rows: 9,  timeLimit: 90,  viewRadius: 2, completionPoints: 1200, speedBonus: 300 },
  2: { cols: 13, rows: 13, timeLimit: 120, viewRadius: 2, completionPoints: 1800, speedBonus: 450 },
  3: { cols: 17, rows: 17, timeLimit: 150, viewRadius: 2, completionPoints: 2400, speedBonus: 600 },
} as const;

const OPPOSITE = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' } as const;
type Dir = keyof typeof OPPOSITE;

function generateMaze(cols: number, rows: number): MazeGrid {
  const grid: MazeGrid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      walls: { top: true, right: true, bottom: true, left: true },
      isExit: false,
    }))
  );

  const visited = new Set<string>();
  const cellKey = (x: number, y: number) => `${x},${y}`;

  const getUnvisitedNeighbors = (x: number, y: number) => {
    const dirs: Array<{ x: number; y: number; dir: Dir }> = [
      { x, y: y - 1, dir: 'top' },
      { x: x + 1, y, dir: 'right' },
      { x, y: y + 1, dir: 'bottom' },
      { x: x - 1, y, dir: 'left' },
    ];
    return dirs.filter(
      d => d.x >= 0 && d.x < cols && d.y >= 0 && d.y < rows && !visited.has(cellKey(d.x, d.y))
    );
  };

  const stack: Pos[] = [{ x: 0, y: 0 }];
  visited.add(cellKey(0, 0));

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(cur.x, cur.y);
    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[cur.y][cur.x].walls[next.dir] = false;
      grid[next.y][next.x].walls[OPPOSITE[next.dir]] = false;
      visited.add(cellKey(next.x, next.y));
      stack.push({ x: next.x, y: next.y });
    }
  }

  grid[rows - 1][cols - 1].isExit = true;
  return grid;
}

function computeLitCells(maze: MazeGrid, pos: Pos, cols: number, rows: number, radius: number): Map<string, number> {
  const lit = new Map<string, number>();
  const queue: Array<{ pos: Pos; dist: number }> = [{ pos, dist: 0 }];
  lit.set(`${pos.x},${pos.y}`, 0);
  while (queue.length > 0) {
    const { pos: cur, dist } = queue.shift()!;
    if (dist >= radius) continue;
    const cell = maze[cur.y]?.[cur.x];
    if (!cell) continue;
    const neighbors: Array<{ x: number; y: number; wall: Dir }> = [
      { x: cur.x,     y: cur.y - 1, wall: 'top'    },
      { x: cur.x + 1, y: cur.y,     wall: 'right'  },
      { x: cur.x,     y: cur.y + 1, wall: 'bottom' },
      { x: cur.x - 1, y: cur.y,     wall: 'left'   },
    ];
    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (n.x < 0 || n.x >= cols || n.y < 0 || n.y >= rows) continue;
      if (lit.has(key)) continue;
      if (cell.walls[n.wall]) continue;
      lit.set(key, dist + 1);
      queue.push({ pos: { x: n.x, y: n.y }, dist: dist + 1 });
    }
  }
  return lit;
}

// Returns true if the wall between (cx,cy) and (nx,ny) should be rendered from the (cx,cy) side.
// Walls are only drawn from the brighter side to avoid double-rendering at light boundaries.
function wallOwnedByCell(
  litCells: Map<string, number>,
  cx: number, cy: number,
  nx: number, ny: number,
  lightRadius: number
): boolean {
  const cd = litCells.get(`${cx},${cy}`);
  const nd = litCells.get(`${nx},${ny}`);
  const cellBright = cd !== undefined ? lightRadius - cd : -1;
  const adjBright  = nd !== undefined ? lightRadius - nd  : -1;
  return cellBright >= adjBright;
}

const FogMazeChallenge: React.FC<FogMazeChallengeProps> = ({
  difficulty = 1,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail = () => console.log('Challenge failed'),
}) => {
  const settings = SETTINGS[difficulty as 1 | 2 | 3] ?? SETTINGS[1];
  const { cols, rows, timeLimit, viewRadius, completionPoints, speedBonus } = settings;
  const lightRadius = 2;
  const viewSize = viewRadius * 2 + 1;

  const [gameState, setGameState] = useState<GameState>('ready');
  const [maze, setMaze] = useState<MazeGrid>([]);
  const [playerPos, setPlayerPos] = useState<Pos>({ x: 0, y: 0 });
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [tileSize, setTileSize] = useState(76);
  const [viewColRadius, setViewColRadius] = useState(2);

  const gameStateRef = useRef<GameState>('ready');
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const mazeRef = useRef<MazeGrid>([]);
  const playerPosRef = useRef<Pos>({ x: 0, y: 0 });
  const arenaRef = useRef<HTMLDivElement>(null);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { mazeRef.current = maze; }, [maze]);
  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);

  // Computed once per player move, not on every timer tick.
  const litCells = useMemo(
    () => maze.length ? computeLitCells(maze, playerPos, cols, rows, lightRadius) : new Map<string, number>(),
    [maze, playerPos, cols, rows]
  );

  // Accumulate visited cells whenever the lit set changes (i.e. on each move).
  useEffect(() => {
    if (gameState !== 'playing' || !maze.length) return;
    setVisited(prev => {
      const next = new Set(prev);
      for (const key of litCells.keys()) next.add(key);
      return next;
    });
  }, [litCells, gameState]);

  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const ts = Math.max(1, Math.floor(height / viewSize));
      setTileSize(ts);
      setViewColRadius(Math.max(viewRadius, Math.round(width / (2 * ts))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewSize]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const handleFail = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    clearTimer();
    gameStateRef.current = 'failed';
    setGameState('failed');
    onFail();
  }, [clearTimer, onFail]);

  const handleComplete = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    clearTimer();
    const remaining = endTimeRef.current
      ? Math.max(0, (endTimeRef.current - Date.now()) / 1000)
      : 0;
    const finalScore = completionPoints + Math.floor((remaining / timeLimit) * speedBonus);
    setScore(finalScore);
    gameStateRef.current = 'success';
    setGameState('success');
    onComplete(finalScore);
  }, [clearTimer, timeLimit, completionPoints, speedBonus, onComplete]);

  const initializeGame = useCallback(() => {
    clearTimer();
    const newMaze = generateMaze(cols, rows);

    gameStateRef.current = 'playing';
    mazeRef.current = newMaze;
    playerPosRef.current = { x: 0, y: 0 };

    setMaze(newMaze);
    setPlayerPos({ x: 0, y: 0 });
    setVisited(new Set(['0,0']));
    setScore(0);
    setTimeLeft(timeLimit);
    setGameState('playing');

    endTimeRef.current = Date.now() + timeLimit * 1000;
    timerRef.current = window.setInterval(() => {
      if (!endTimeRef.current) return;
      const remaining = Math.max(0, (endTimeRef.current - Date.now()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) handleFail();
    }, 100);
  }, [clearTimer, cols, rows, timeLimit, handleFail]);

  const handleTileClick = useCallback((targetX: number, targetY: number) => {
    if (gameStateRef.current !== 'playing') return;
    const cur = playerPosRef.current;
    const dx = targetX - cur.x;
    const dy = targetY - cur.y;

    if (Math.abs(dx) + Math.abs(dy) !== 1) return;

    const cell = mazeRef.current[cur.y]?.[cur.x];
    if (!cell) return;
    if (dx === 1  && cell.walls.right)  return;
    if (dx === -1 && cell.walls.left)   return;
    if (dy === 1  && cell.walls.bottom) return;
    if (dy === -1 && cell.walls.top)    return;

    playerPosRef.current = { x: targetX, y: targetY };
    setPlayerPos({ x: targetX, y: targetY });
    // visited is updated by the litCells useEffect — no redundant setVisited here

    if (mazeRef.current[targetY]?.[targetX]?.isExit) {
      handleComplete();
    }
  }, [handleComplete]);

  const renderMaze = () => {
    if (!maze.length) return null;

    const wallThickness = Math.max(4, Math.round(tileSize * 0.1));
    const halfWall = Math.floor(wallThickness / 2);
    const spriteSize = Math.floor(tileSize * 0.4);
    const cells: React.ReactNode[] = [];
    const currentCell = maze[playerPos.y]?.[playerPos.x];

    for (let dy = -viewRadius; dy <= viewRadius; dy++) {
      for (let dx = -viewColRadius; dx <= viewColRadius; dx++) {
        const mx = playerPos.x + dx;
        const my = playerPos.y + dy;
        const isPlayer = dx === 0 && dy === 0;
        const inBounds = mx >= 0 && mx < cols && my >= 0 && my < rows;
        const litDist = litCells.get(`${mx},${my}`);
        const isLit = litDist !== undefined;
        const warmOpacity = isLit && !isPlayer ? (1 - litDist! / (lightRadius + 1)) * 0.22 : 0;
        const warmth = isPlayer ? 1 : isLit ? 1 - litDist! / (lightRadius + 1) : 0;
        const wallFilter = (!isLit && !isPlayer)
          ? 'brightness(0.3)'
          : `brightness(${(1 + warmth * 0.15).toFixed(2)}) sepia(${(warmth * 0.6).toFixed(2)}) saturate(${(1 + warmth).toFixed(2)})`;
        const wasVisited = visited.has(`${mx},${my}`);
        const fullyVisible = isPlayer || isLit || wasVisited;

        const cell = inBounds ? maze[my][mx] : null;
        const isAdjacent = Math.abs(dx) + Math.abs(dy) === 1;
        let wallBlocked = false;
        if (isAdjacent && currentCell) {
          if (dx === 1  && currentCell.walls.right)  wallBlocked = true;
          if (dx === -1 && currentCell.walls.left)   wallBlocked = true;
          if (dy === 1  && currentCell.walls.bottom) wallBlocked = true;
          if (dy === -1 && currentCell.walls.top)    wallBlocked = true;
        }
        const canMove = isAdjacent && inBounds && fullyVisible && !wallBlocked;

        const isFog = !inBounds || !fullyVisible;
        const fogDelay = `${-((Math.abs(dx * 3 + dy * 7)) % 40) / 10}s`;
        const useAltFog = (dx + dy) % 2 === 0;

        cells.push(
          <div
            key={`${dx},${dy}`}
            onClick={() => canMove ? handleTileClick(mx, my) : undefined}
            style={{
              width: tileSize,
              height: tileSize,
              position: 'relative',
              cursor: canMove ? 'pointer' : 'default',
              backgroundColor: isFog ? '#08070a' : undefined,
              backgroundImage: !isFog && inBounds
                ? isPlayer
                  ? `linear-gradient(rgba(80,55,0,0.35), rgba(80,55,0,0.35)), url('/challenges/Fog-Maze-Tile.png')`
                  : cell?.isExit
                  ? `linear-gradient(rgba(26,17,0,0.6), rgba(26,17,0,0.6)), url('/challenges/Fog-Maze-Tile.png')`
                  : `url('/challenges/Fog-Maze-Tile.png')`
                : undefined,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {isFog && (
              <div
                className={useAltFog ? 'maze-fog-wisp-alt' : 'maze-fog-wisp'}
                style={{ position: 'absolute', inset: 0, animationDelay: fogDelay }}
              />
            )}
            {!isFog && !isLit && !isPlayer && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.62)', zIndex: 1, pointerEvents: 'none' }} />
            )}
            {warmOpacity > 0 && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(255,185,40,${warmOpacity.toFixed(3)})`, zIndex: 1, pointerEvents: 'none' }} />
            )}
            {isPlayer && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <div className="wisp-float" style={{ position: 'relative', width: spriteSize * 1.7, height: spriteSize * 1.7 }}>
                  <div className="wisp-pulse" style={{
                    position: 'absolute', inset: '-15%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,195,50,0.28) 0%, rgba(255,150,20,0.1) 55%, transparent 100%)',
                  }} />
                  <div className="wisp-morph" style={{
                    position: 'absolute', inset: '12%',
                    background: 'radial-gradient(circle, rgba(255,235,110,0.95) 0%, rgba(255,185,40,0.65) 50%, rgba(255,130,15,0.15) 100%)',
                    filter: 'blur(2.5px)',
                  }} />
                  <div className="wisp-flicker" style={{
                    position: 'absolute', inset: '33%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #fffef0 0%, #fff8c0 55%, rgba(255,225,80,0.4) 100%)',
                    boxShadow: '0 0 5px 3px rgba(255,245,160,0.85)',
                  }} />
                </div>
              </div>
            )}
            {cell?.isExit && fullyVisible && !isPlayer && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <div style={{ position: 'relative', width: spriteSize * 1.9, height: spriteSize * 1.9 }}>
                  <div className="portal-pulse" style={{
                    position: 'absolute', inset: '-15%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(35,0,65,0.38) 0%, rgba(15,0,30,0.12) 55%, transparent 100%)',
                  }} />
                  <div className="portal-morph" style={{
                    position: 'absolute', inset: '10%',
                    background: 'radial-gradient(circle, rgba(55,0,95,0.96) 0%, rgba(25,0,45,0.82) 50%, rgba(5,0,10,0.2) 100%)',
                    filter: 'blur(2px)',
                  }} />
                  <div className="portal-spin" style={{
                    position: 'absolute', inset: '14%',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, rgba(8,0,15,0.4), rgba(55,0,95,0.65), rgba(8,0,15,0.4))',
                    filter: 'blur(1.5px)',
                  }} />
                  <div className="portal-flicker" style={{
                    position: 'absolute', inset: '34%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #1a0030 0%, #07000e 65%, rgba(20,0,35,0.3) 100%)',
                    boxShadow: '0 0 8px 4px rgba(65,0,120,0.5)',
                  }} />
                </div>
              </div>
            )}
            {fullyVisible && inBounds && (cell?.walls.top    ?? false) && wallOwnedByCell(litCells, mx, my, mx,     my - 1, lightRadius) && (
              <div style={{ position: 'absolute', top: -halfWall, left: 0, right: 0, height: wallThickness, backgroundImage: "url('/challenges/Fog-Maze-Horizontal-Wall.png')", backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x', zIndex: 3, pointerEvents: 'none', filter: wallFilter }} />
            )}
            {fullyVisible && inBounds && (cell?.walls.bottom ?? false) && wallOwnedByCell(litCells, mx, my, mx,     my + 1, lightRadius) && (
              <div style={{ position: 'absolute', bottom: -halfWall, left: 0, right: 0, height: wallThickness, backgroundImage: "url('/challenges/Fog-Maze-Horizontal-Wall.png')", backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x', zIndex: 3, pointerEvents: 'none', filter: wallFilter }} />
            )}
            {fullyVisible && inBounds && (cell?.walls.left   ?? false) && wallOwnedByCell(litCells, mx, my, mx - 1, my,     lightRadius) && (
              <div style={{ position: 'absolute', top: 0, left: -halfWall, width: wallThickness, height: tileSize, backgroundImage: "url('/challenges/Fog-Maze-Vertical-Wall.png')", backgroundSize: '100% auto', backgroundRepeat: 'repeat-y', zIndex: 3, pointerEvents: 'none', filter: wallFilter }} />
            )}
            {fullyVisible && inBounds && (cell?.walls.right  ?? false) && wallOwnedByCell(litCells, mx, my, mx + 1, my,     lightRadius) && (
              <div style={{ position: 'absolute', top: 0, left: tileSize - halfWall, width: wallThickness, height: tileSize, backgroundImage: "url('/challenges/Fog-Maze-Vertical-Wall.png')", backgroundSize: '100% auto', backgroundRepeat: 'repeat-y', zIndex: 3, pointerEvents: 'none', filter: wallFilter }} />
            )}
          </div>
        );
      }
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${viewColRadius * 2 + 1}, ${tileSize}px)`,
        gap: 0,
      }}>
        {cells}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-slate-800 rounded-lg mb-4">
        <div
          ref={arenaRef}
          className="relative w-full h-96 flex flex-col items-center justify-center rounded-lg overflow-hidden"
          style={{ backgroundColor: '#0d0b0f' }}
        >
          <img
            src="/challenges/Fog-Maze-Cover.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          />
          <div className="relative z-10 flex flex-col items-center gap-3">
            {gameState === 'ready' && (
              <p className="text-gray-300 text-center text-sm px-6 max-w-xs">
                Navigate the spirit labyrinth. Tap adjacent tiles to move. Find the exit before time runs out.
              </p>
            )}
            {gameState !== 'ready' && renderMaze()}
            {gameState === 'failed' && (
              <p className="text-red-400 text-sm mt-2">The maze claimed you. Try again.</p>
            )}
            {gameState === 'success' && (
              <p className="text-emerald-400 text-sm mt-2">Escaped! Score: {score}</p>
            )}
          </div>
        </div>
      </div>

      <ChallengeActionBar
        gameState={gameState}
        score={score}
        timeLeft={timeLeft}
        onStart={initializeGame}
        onRestart={initializeGame}
        extraStats={` | ${cols}×${rows} maze`}
      />
    </div>
  );
};

export default FogMazeChallenge;
