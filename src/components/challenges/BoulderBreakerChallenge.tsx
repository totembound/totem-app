import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { GameState } from '../../types/types';

type Point = {
  x: number;
  y: number;
  hit: boolean;
  active: boolean;
};

//type GameState = 'ready' | 'playing' | 'success' | 'failed';

type DifficultySettings = {
  pointCount: number;
  timeLimit: number;
  hitRadius: number;
};

interface BoulderBreakerChallengeProps {
  strength?: number;
  difficulty?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const BoulderBreakerChallenge: React.FC<BoulderBreakerChallengeProps> = ({
  strength = 0,
  difficulty = 2,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail = () => console.log('Challenge failed')
}) => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [hitPoints, setHitPoints] = useState<Point[]>([]);
  const [currentPoint, setCurrentPoint] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [showPulse, setShowPulse] = useState(false);

  const boulderRef = useRef<HTMLDivElement>(null);

  const strengthThreshold = difficulty * 20;

  const difficultySettings: DifficultySettings = {
    pointCount: 3 + difficulty * 2,
    timeLimit: 6 - difficulty,
    hitRadius: 25 - difficulty * 2,
  };

  const generatePoints = useCallback(() => {
    if (!boulderRef.current) return [];

    const boulderRect = boulderRef.current.getBoundingClientRect();
    const padding = difficultySettings.hitRadius * 2;

    // Target area is roughly centered on the boulder
    const targetWidth = boulderRect.width * 0.6;  // 60% of boulder width
    const targetHeight = boulderRect.height * 0.6; // 60% of boulder height

    // Center the target area
    const targetLeft = (boulderRect.width - targetWidth) / 8.2;
    const targetTop = (boulderRect.height - targetHeight) / 2.2;

    const points: Point[] = [];
    for (let i = 0; i < difficultySettings.pointCount; i++) {
      points.push({
        x: targetLeft + padding + Math.random() * (targetWidth - padding * 2),
        y: targetTop + padding + Math.random() * (targetHeight - padding * 2),
        hit: false,
        active: false
      });
    }
    return points;
  }, [difficultySettings.pointCount, difficultySettings.hitRadius]);

  const initializeGame = useCallback(() => {
    const points = generatePoints();
    setHitPoints(points);
    setCurrentPoint(0);
    setScore(0);
    setTimeLeft(difficultySettings.timeLimit);
    setGameState('playing');
  }, [generatePoints, difficultySettings.timeLimit]);


  const handleClick = (index: number) => {
    if (gameState !== 'playing' || index !== currentPoint) return;

    const newPoints = [...hitPoints];
    newPoints[index].hit = true;
    setHitPoints(newPoints);

    const accuracyScore = Math.floor((timeLeft! / difficultySettings.timeLimit) * 100);
    const strengthBonus = Math.max(0, strength - strengthThreshold) / 2;
    const pointScore = accuracyScore + strengthBonus;

    const newScore = score + pointScore;
    setScore(newScore);

    if (currentPoint + 1 >= hitPoints.length) {
      setGameState('success');
      onComplete(Math.floor(newScore));
    } else {
      setCurrentPoint(prev => prev + 1);
      setTimeLeft(difficultySettings.timeLimit);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (gameState === 'playing' && timeLeft !== null) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            setGameState('failed');
            onFail();
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
  }, [gameState, onFail]);

  // Recalculate points when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (gameState === 'playing') {
        const newPoints = generatePoints();
        setHitPoints(newPoints);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState, generatePoints]);

  useEffect(() => {
    if (gameState === 'success') {
      setShowPulse(true);
      const timer = setTimeout(() => {
        setShowPulse(false);
      }, 1000); // Stop pulsing after 1 second
  
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const scoreTicker = <div className="text-gray-300 font-bold">
    Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s | Score: {Math.floor(score)}
  </div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {showAlert && (
        <div className="flex p-4 mb-4 bg-red-100 border border-red-400 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Strength Check Failed</h3>
            <p className="text-red-700">
              Your totem needs {strengthThreshold} strength for this difficulty level.
              Current strength: {strength}
            </p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg mb-4">
        <div className="relative w-full h-96 bg-slate-700 rounded-lg overflow-hidden">
          {/* Background terrain */}
          <div className="absolute inset-0">
            <img
              src="/challenges/breaking-background.png"
              alt="Rocky terrain background"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Boulder container */}
          <div
            ref={boulderRef}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Large centered boulder */}
            <div className="relative w-2/3 h-4/5 mt-16">
              <img 
                src={gameState === 'success' 
                  ? "/challenges/breaking-boulder.png" 
                  : "/challenges/breaking-boulder.png"
                }
                alt="Boulder"
                className={`w-full h-full object-contain transition-opacity duration-300
                  ${showPulse ? 'animate-pulse' : ''}`}
              />

              {/* Hit points container */}
              <div className="absolute inset-0">
                {hitPoints.map((point, index) => (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      left: `${point.x}px`,
                      top: `${point.y}px`,
                    }}
                  >
                    {/* Glow effect */}
                    {currentPoint === index && (
                      <img
                        src="/challenges/breaking-glow.png"
                        alt=""
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 animate-pulse"
                        style={{
                          opacity: 0.8,
                        }}
                      />
                    )}

                    {/* Hit point target */}
                    <button
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2
                        rounded-full transition-all duration-200
                        ${point.hit ? 'opacity-50' : 'opacity-80'}
                        hover:scale-105 focus:outline-none`}
                      style={{
                        width: `${difficultySettings.hitRadius * 2}px`,
                        height: `${difficultySettings.hitRadius * 2}px`,
                        backgroundColor: point.hit ? '#22c55e' :
                          currentPoint === index ? '#ef4444' : '#eab308',
                      }}
                      onClick={() => handleClick(index)}
                      type="button"
                    >
                      {/* Number indicator */}
                      <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </span>

                      {/* Crack effect when hit */}
                      {point.hit && (
                        <img
                          src="/challenges/breaking-crack.png"
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
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

export default BoulderBreakerChallenge;