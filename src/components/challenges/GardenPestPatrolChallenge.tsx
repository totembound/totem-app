import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

type GameState = 'ready' | 'playing' | 'success' | 'failed';

type Hole = {
  id: number;
  hasMole: boolean;
  isHit: boolean;
  showEffect: boolean;
};

type DifficultySettings = {
  moleCount: number;
  timeLimit: number;
  moleSpeed: number;
};

interface WhackAMoleChallengeProps {
  strength?: number;
  difficulty?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const WhackAMoleChallenge: React.FC<WhackAMoleChallengeProps> = ({
  strength = 0,
  difficulty = 2,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail = () => console.log('Challenge failed')
}) => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [holes, setHoles] = useState<Hole[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [showPulse, setShowPulse] = useState(false);
  const [activeMoles, setActiveMoles] = useState<Set<number>>(new Set());

  const gameRef = useRef<HTMLDivElement>(null);
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const difficultySettings: DifficultySettings = {
    moleCount: 2,
    timeLimit: 30,
    moleSpeed: 1500,
  };

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

    setHoles(prevHoles => {
      const hole = prevHoles.find(h => h.id === holeId);
      if (!hole || !hole.hasMole || hole.isHit) return prevHoles;

      const newHoles = prevHoles.map(h => 
        h.id === holeId 
          ? { ...h, hasMole: false, isHit: true, showEffect: true }
          : h
      );

      const totalScore = 10;

      setScore(prev => prev + totalScore);
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

      return newHoles;
    });
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
        const nextSpawn = 800; // Fixed interval
        moleTimerRef.current = setTimeout(spawnInterval, nextSpawn);
      };
      
      spawnInterval();
    }

    return () => {
      if (moleTimerRef.current) {
        clearTimeout(moleTimerRef.current);
      }
    };
  }, [gameState, spawnMole]);

  useEffect(() => {
    if (gameState === 'success') {
      setShowPulse(true);
      const timer = setTimeout(() => {
        setShowPulse(false);
      }, 1000);
  
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const scoreTicker = (
    <div className="text-gray-300 font-bold">
      Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s | Score: {Math.floor(score)}
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-slate-800 rounded-lg mb-4">
        <div className="relative w-full h-96 bg-slate-700 rounded-lg overflow-hidden">
          {/* Background terrain */}
          <div className="absolute inset-0">
            <img
              src="/challenges/first-path-challenge.jpg"
              alt="Game background"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Game grid */}
          <div
            ref={gameRef}
            className="absolute inset-0 p-8 grid grid-cols-3 gap-4"
          >
            {holes.map((hole) => (
              <div
                key={hole.id}
                className="relative flex items-center justify-center"
              >
                {/* Hole */}
                <div className="w-20 h-20 relative">
                  <img
                    src="/challenges/new-hole.png"
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
                        src="/challenges/new-mole.png"
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
            ))}
          </div>
        </div>
      </div>
      
      <div>
        {gameState === 'ready' && (
          <button
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              transition-colors duration-200"
            onClick={initializeGame}
            type="button"
          >
            Start Whack-a-Mole Challenge
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
              onClick={initializeGame}
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
              onClick={initializeGame}
              type="button"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhackAMoleChallenge;