import React, { useState, useEffect, useCallback, useRef } from 'react';
// AlertCircle removed - unused import
import { useUser } from '../../contexts/UserContext';
import { GameState } from '../../types/types';
import ChallengeActionBar from './ChallengeActionBar';

type Hole = {
  id: number;
  hasMole: boolean;
  isHit: boolean;
  showEffect: boolean;
};

type DifficultySettings = {
  timeLimit: number;
  /** How long a mole stays up before hiding (ms) — lower = harder to hit. */
  moleSpeed: number;
  /** Delay between spawns (ms) — lower = more moles = higher score ceiling. */
  spawnInterval: number;
};

// Flat points awarded per mole whacked. d1 spawns ~1 mole/sec (≈30 spawns over 30s),
// so a near-perfect d1 run tops out around 750 against the locked maxScore 1000 (the
// "relatively easy" target). Faster d2/d3 spawns give diehards enough whacks to
// saturate the 1000 cap.
const POINTS_PER_WHACK = 25;

// Higher difficulty spawns faster (more whack opportunities against the fixed
// maxScore 1000) but each mole hides sooner.
const DIFFICULTY_SETTINGS: Record<number, DifficultySettings> = {
  1: { timeLimit: 30, moleSpeed: 1800, spawnInterval: 1000 },
  2: { timeLimit: 30, moleSpeed: 1300, spawnInterval: 600 },
  3: { timeLimit: 30, moleSpeed: 900, spawnInterval: 350 },
};

interface GardenPestControlChallengeProps {
  strength?: number;
  difficulty?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const GardenPestControlChallenge: React.FC<GardenPestControlChallengeProps> = ({
  strength: _strength = 0,
  difficulty = 2,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail: _onFail = () => console.log('Challenge failed')
}) => {
  const { tutorialWizardVisible } = useUser();
  const [gameState, setGameState] = useState<GameState>('ready');
  const [holes, setHoles] = useState<Hole[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [_showAlert, _setShowAlert] = useState<boolean>(false);
  const [showPulse, setShowPulse] = useState(false);
  const [_activeMoles, setActiveMoles] = useState<Set<number>>(new Set());

  const gameRef = useRef<HTMLDivElement>(null);
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const difficultySettings: DifficultySettings =
    DIFFICULTY_SETTINGS[difficulty] ?? DIFFICULTY_SETTINGS[2];

  const initializeHoles = useCallback(() => {
    const newHoles: Hole[] = Array.from({ length: 9 }, (_, index) => ({
      id: index,
      hasMole: false,
      isHit: false,
      showEffect: false,
    }));
    return newHoles;
  }, []);

  const spawnMole = useCallback(() => {
    if (gameState !== 'playing') return;

    setHoles(prevHoles => {
      const availableHoles = prevHoles.filter(hole => !hole.hasMole);
      if (availableHoles.length === 0) return prevHoles;

      const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      const newHoles = prevHoles.map(hole => 
        hole.id === randomHole.id 
          ? { ...hole, hasMole: true, isHit: false }
          : hole
      );

      setActiveMoles(prev => new Set([...prev, randomHole.id]));

      // Hide mole after a delay
      setTimeout(() => {
        setHoles(currentHoles => 
          currentHoles.map(hole => 
            hole.id === randomHole.id 
              ? { ...hole, hasMole: false }
              : hole
          )
        );
        setActiveMoles(prev => {
          const newSet = new Set(prev);
          newSet.delete(randomHole.id);
          return newSet;
        });
      }, difficultySettings.moleSpeed);

      return newHoles;
    });
  }, [gameState, difficultySettings.moleSpeed]);

  const initializeGame = useCallback(() => {
    const newHoles = initializeHoles();
    setHoles(newHoles);
    setScore(0);
    setTimeLeft(difficultySettings.timeLimit);
    setGameState('playing');
    setActiveMoles(new Set());
  }, [initializeHoles, difficultySettings.timeLimit]);

  const handleWhack = (holeId: number) => {
    if (gameState !== 'playing') return;

    // Guard against re-hitting the same mole using committed state, then flip the hole
    // with a pure updater. Side effects (score, active set) stay OUT of the setHoles
    // updater — React StrictMode double-invokes updaters in dev, and a setScore nested
    // inside would fire twice, doubling points in dev vs prod.
    const hole = holes.find(h => h.id === holeId);
    if (!hole || !hole.hasMole || hole.isHit) return;

    setHoles(prevHoles =>
      prevHoles.map(h =>
        h.id === holeId
          ? { ...h, hasMole: false, isHit: true, showEffect: true }
          : h
      )
    );

    setScore(prev => prev + POINTS_PER_WHACK);
    setActiveMoles(prev => {
      const newSet = new Set(prev);
      newSet.delete(holeId);
      return newSet;
    });

    // Hide hit effect after animation
    setTimeout(() => {
      setHoles(currentHoles =>
        currentHoles.map(h =>
          h.id === holeId
            ? { ...h, showEffect: false, isHit: false }
            : h
        )
      );
    }, 500);
  };

  // Game timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (gameState === 'playing' && timeLeft !== null) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            setGameState('success');
            // Always win when timer runs out - defer the callback
            setTimeout(() => {
              onComplete(Math.floor(score));
            }, 0);
            return 0;
          }
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [gameState, timeLeft, score, onComplete]);

  // Separate effect to check for instant win at 1000 points
  useEffect(() => {
    if (gameState === 'playing' && score >= 1000) {
      setGameState('success');
      setTimeout(() => {
        onComplete(Math.floor(score));
      }, 0);
    }
  }, [gameState, score, onComplete]);

  // Mole spawning
  useEffect(() => {
    if (gameState === 'playing') {
      const spawnInterval = () => {
        spawnMole();
        moleTimerRef.current = setTimeout(spawnInterval, difficultySettings.spawnInterval);
      };
      
      spawnInterval();
    }

    return () => {
      if (moleTimerRef.current) {
        clearTimeout(moleTimerRef.current);
      }
    };
  }, [gameState, spawnMole, difficultySettings.spawnInterval]);

  useEffect(() => {
    if (gameState === 'success') {
      setShowPulse(true);
      const timer = setTimeout(() => {
        setShowPulse(false);
      }, 1000);
  
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Define hole positions with perspective scaling and positioning
  const getHolePosition = (index: number) => {
    const _row = Math.floor(index / 3);
    const _col = index % 3;
    
    // Base positions for perspective effect
    const basePositions = [
      // Front row (largest, bottom)
      { left: '20%', top: '80%', scale: 1.0 },
      { left: '50%', top: '80%', scale: 1.0 },
      { left: '80%', top: '80%', scale: 1.0 },
      // Middle row (medium, middle)
      { left: '25%', top: '55%', scale: 0.85 },
      { left: '50%', top: '55%', scale: 0.85 },
      { left: '75%', top: '55%', scale: 0.85 },
      // Back row (smallest, top)
      { left: '30%', top: '35%', scale: 0.7 },
      { left: '50%', top: '35%', scale: 0.7 },
      { left: '70%', top: '35%', scale: 0.7 },
    ];
    
    return basePositions[index];
  };


  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-slate-800 rounded-lg mb-4">
        <div className={`relative w-full ${tutorialWizardVisible ? 'h-56' : 'h-80'} sm:h-96 bg-slate-700 rounded-lg overflow-hidden`}>
          {/* Background terrain */}
          <div className="absolute inset-0">
            <img
              src="/challenges/first-path-challenge.jpg"
              alt="Game background"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Game grid with perspective positioning */}
          <div
            ref={gameRef}
            className="absolute inset-0"
          >
            {holes.map((hole, index) => {
              const position = getHolePosition(index);
              
              return (
                <div
                  key={hole.id}
                  className="absolute"
                  style={{
                    left: position.left,
                    top: position.top,
                    transform: `translate(-50%, -50%) scale(${position.scale})`,
                  }}
                >
                  {/* Hole */}
                  <div className="w-20 h-20 relative">
                    <img
                      src="/challenges/mole-hole.png"
                      alt="Mole hole"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Mole */}
                    {hole.hasMole && (
                      <button
                        className={`absolute transition-all duration-200 hover:scale-105 outline-none
                          animate-bounce cursor-pointer z-10
                          ${showPulse ? 'animate-pulse' : ''}`}
                        onClick={() => handleWhack(hole.id)}
                        type="button"
                        style={{
                          width: '140%',
                          height: '140%',
                          top: '-20%',
                          left: '-20%'
                        }}
                      >
                        <img
                          src="/challenges/whack-a-mole.png"
                          alt="Mole"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}

                    {/* Hit effect */}
                    {hole.showEffect && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute text-2xl">💥</div>
                      </div>
                    )}
                  </div>

                  {/* Glow effect for active holes */}
                  {hole.hasMole && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <ChallengeActionBar
        gameState={gameState}
        score={score}
        timeLeft={timeLeft}
        onStart={initializeGame}
        onRestart={initializeGame}
      />
    </div>
  );
};

export default GardenPestControlChallenge;