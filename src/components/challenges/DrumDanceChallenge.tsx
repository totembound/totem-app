import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';
import ChallengeActionBar from './ChallengeActionBar';

type Ring = {
  id: number;
  targetTime: number;
  spawnTime: number;
  bongo: 'left' | 'right';
  active: boolean;
  scored: boolean;
  hitType?: 'perfect' | 'good' | 'ok' | 'miss';
  visibleSince?: number;
  despawnTime?: number;
};

interface DrumDanceChallengeProps {
  difficulty?: number;
  agility?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const DrumDanceChallenge: React.FC<DrumDanceChallengeProps> = ({
  difficulty = 2,
  agility = 10,
  onComplete = (score: number) => console.log('Challenge complete:', score),
}) => {
  const SONG_DURATION = 30;
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [rings, setRings] = useState<Ring[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(SONG_DURATION);
  const [lastHitType, setLastHitType] = useState<'perfect' | 'good' | 'ok' | 'miss' | null>(null);
  const [showHitFeedback, setShowHitFeedback] = useState<boolean>(false);
  const [_pendingRings, setPendingRings] = useState<Ring[]>([]);
  const [lastHitBongo, setLastHitBongo] = useState<'left' | 'right' | null>(null);
  const [isVerticalLayout, setIsVerticalLayout] = useState<boolean>(false);

  // Refs to prevent re-renders and manage game loop
  const gameStateRef = useRef<GameState>('ready');
  const ringsRef = useRef<Ring[]>([]);
  const pendingRingsRef = useRef<Ring[]>([]);
  const scoreRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(SONG_DURATION);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const leftBongoRef = useRef<HTMLDivElement>(null);
  const rightBongoRef = useRef<HTMLDivElement>(null);
  const lastHitTypeRef = useRef<'perfect' | 'good' | 'ok' | 'miss' | null>(null);
  const lastHitBongoRef = useRef<'left' | 'right' | null>(null);
  const lastPatternEndTimeRef = useRef<number>(0);

  // Game configuration based on difficulty and agility
  const gameConfig = useRef({
    bongoSize: 120,
    ringAnimationDuration: 4000 - (agility * 150),
    maxRingSize: 300,
    minRingSize: 110,
    // Score ranges proportional to animation duration
    get perfectScoreRange() { return Math.round(this.ringAnimationDuration * 0.015) },
    get goodScoreRange() { return Math.round(this.ringAnimationDuration * 0.03) },
    get okScoreRange() { return Math.round(this.ringAnimationDuration * 0.6) },
    perfectScore: 250,
    goodScore: 150,
    okScore: 75,
    missScore: 0,
    maxScore: 3000,
    // Ring patterns with appropriate spacing
    ringPatterns: [
      [0, 2.25, 4.75, 7.25, 9.75, 12.25, 14.75],
      [0, 2.75, 5.75, 8.75, 11.75, 14.75],
      [0, 1.75, 4.25, 6.75, 9.25, 11.75, 14.25],
    ],
    minimumTimeBetweenHits: 1.75,
    // Interval between pattern groups - reduced to eliminate awkward pauses
    spawnInterval: 12000,
    feedbackDuration: 300,
    ringDespawnDelay: 200,
    scoreColors: {
      perfect: '#FFD700', // Gold
      good: '#4CAF50',    // Green
      ok: '#FFC107',      // Amber
      miss: '#F44336'     // Red
    }
  });

  useEffect(() => {
    const checkViewportSize = () => {
      const breakpoint = 500;
      
      if (gameAreaRef.current) {
        const width = gameAreaRef.current.clientWidth;
        const newIsVertical = width < breakpoint;
        
        if (newIsVertical !== isVerticalLayout) {
          console.log(`Layout changed: width=${width}px, isVertical=${newIsVertical}`);
          setIsVerticalLayout(newIsVertical);
        }
      }
    };
    
    // Check on mount and whenever window resizes
    checkViewportSize();
    window.addEventListener('resize', checkViewportSize);
    
    return () => {
      window.removeEventListener('resize', checkViewportSize);
    };
  }, [isVerticalLayout]);

  // Get ring size based on time progress
  const getRingSize = useCallback((ring: Ring, currentTime: number) => {
    const config = gameConfig.current;
    
    // If we have a visibleSince timestamp, use that instead of spawnTime
    const startTime = ring.visibleSince || ring.spawnTime;
    const elapsedTime = currentTime - startTime;
    
    // Calculate the target time when animation should end
    const animationEndTime = startTime + config.ringAnimationDuration;
    
    // If the current time is past animation end, the ring should be despawned
    if (currentTime > animationEndTime && ring.active) {
      // We need to mark this ring as inactive so it can be despawned
      // This will be handled in the next game loop cycle
      ring.active = false;
      ring.scored = true;
      ring.hitType = 'miss';
      ring.despawnTime = currentTime; // Despawn immediately when animation ends
      
      // Show MISS feedback when ring despawns without being clicked
      lastHitTypeRef.current = 'miss';
      lastHitBongoRef.current = ring.bongo;

      // Use setTimeout to ensure state updates happen after the current execution
      setTimeout(() => {
        setLastHitType('miss');
        setShowHitFeedback(true);
        setLastHitBongo(ring.bongo);
        setTimeout(() => setShowHitFeedback(false), gameConfig.current.feedbackDuration);
      }, 0);
    }
    
    // Calculate size based on progress
    const progress = Math.min(elapsedTime / config.ringAnimationDuration, 1);
    return config.maxRingSize - progress * (config.maxRingSize - config.minRingSize);
  }, []);

  // Check if ring is in perfect zone - adjusted to use visibleSince
  const isInPerfectZone = useCallback((ring: Ring, currentTime: number) => {
    const config = gameConfig.current;
    
    // Calculate adjusted target time based on visibleSince
    let adjustedTargetTime = ring.targetTime;
    if (ring.visibleSince) {
      const spawnDelay = ring.visibleSince - ring.spawnTime;
      adjustedTargetTime = ring.targetTime + spawnDelay;
    }
    
    const timeToTarget = adjustedTargetTime - currentTime;
    
    // Use perfectScoreRange for consistent timing
    return timeToTarget > 0 && timeToTarget < config.perfectScoreRange;
  }, []);

  // Evaluate hit accuracy - adjusted to use visibleSince for timing
  const evaluateHit = useCallback((ring: Ring, currentTime: number) => {
    const config = gameConfig.current;
    
    // If the ring has a visibleSince timestamp, recalculate a new adjusted target time
    // This ensures the scoring is in sync with the visual animation
    let adjustedTargetTime = ring.targetTime;
    if (ring.visibleSince) {
      // Calculate how much later the ring actually appeared compared to when it was supposed to
      const spawnDelay = ring.visibleSince - ring.spawnTime;
      // Adjust the target time by the same amount to keep timing consistent
      adjustedTargetTime = ring.targetTime + spawnDelay;
    }
    
    const timeDifference = Math.abs(currentTime - adjustedTargetTime);
    const timeRatio = config.ringAnimationDuration;
    const distanceFromPerfect = (timeDifference / timeRatio) * (config.maxRingSize - config.minRingSize);
    
    if (distanceFromPerfect <= config.perfectScoreRange) {
      return { score: config.perfectScore, type: 'perfect', color: config.scoreColors.perfect };
    } else if (distanceFromPerfect <= config.goodScoreRange) {
      return { score: config.goodScore, type: 'good', color: config.scoreColors.good };
    } else if (distanceFromPerfect <= config.okScoreRange) {
      return { score: config.okScore, type: 'ok', color: config.scoreColors.ok };
    } else {
      return { score: config.missScore, type: 'miss', color: config.scoreColors.miss };
    }
  }, []);
  
  // Start the game immediately without countdown
  const startGame = useCallback(() => {
    // Start actual game immediately
    setGameState('playing');
    gameStateRef.current = 'playing';
    setTimeLeft(SONG_DURATION);
    setScore(0);
    setRings([]);
    setPendingRings([]);
    setLastHitBongo(null);
    
    timeLeftRef.current = SONG_DURATION;
    scoreRef.current = 0;
    ringsRef.current = [];
    pendingRingsRef.current = [];
    lastHitTypeRef.current = null;
    lastHitBongoRef.current = null;
    lastPatternEndTimeRef.current = 0;
    
    // Generate first pattern of rings immediately at game start
    generateRings(performance.now());
  }, []);
  
  // Validate timing pattern - ensure minimum gap between hits
  const validatePattern = useCallback((pattern: number[]) => {
    const minimumGap = gameConfig.current.minimumTimeBetweenHits;
    const validatedPattern: number[] = [];

    if (pattern.length === 0) return validatedPattern;

    validatedPattern.push(pattern[0]);

    for (let i = 1; i < pattern.length; i++) {
      const previousTiming = validatedPattern[validatedPattern.length - 1];
      const currentTiming = pattern[i];
      
      // Enforce minimum gap between consecutive hits
      validatedPattern.push(Math.max(previousTiming + minimumGap, currentTiming));
    }

    return validatedPattern;
  }, []);

  // Generate rings based on rhythm patterns
  const generateRings = useCallback((startTime: number) => {
    const config = gameConfig.current;
    
    const patternIndex = Math.floor(Math.random() * config.ringPatterns.length);
    const pattern = validatePattern([...config.ringPatterns[patternIndex]]);
    
    let lastBongo: 'left' | 'right' | null = null;
    
    const newRings = pattern.map((timingOffset, index) => {
      let bongo: 'left' | 'right';
      
      if (lastBongo === null) {
        bongo = Math.random() > 0.5 ? 'left' : 'right';
      } else if (
        difficulty > 2 && 
        Math.random() < 0.3 && 
        (index > 0 && (pattern[index] - pattern[index-1]) >= 0.8)
      ) {
        bongo = lastBongo;
      } else {
        bongo = lastBongo === 'left' ? 'right' : 'left';
      }
      
      lastBongo = bongo;
      
      const ringTargetTime = startTime + (timingOffset * 1000);
      const ringSpawnTime = ringTargetTime - config.ringAnimationDuration;
      
      return {
        id: Date.now() + index,
        targetTime: ringTargetTime,
        spawnTime: ringSpawnTime,
        bongo,
        active: true,
        scored: false
      };
    });
    
    // Update the last pattern end time reference
    if (pattern.length > 0) {
      const lastPatternTime = pattern[pattern.length - 1] * 1000;
      lastPatternEndTimeRef.current = startTime + lastPatternTime;
    }
    
    // Push rings to the pending queue
    pendingRingsRef.current = [...pendingRingsRef.current, ...newRings];
    setPendingRings(prevRings => [...prevRings, ...newRings]);
  }, [difficulty, validatePattern]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
  
    const timerInterval = setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 0.1);
      setTimeLeft(timeLeftRef.current);
  
      if (timeLeftRef.current <= 0 || scoreRef.current >= gameConfig.current.maxScore) {
        clearInterval(timerInterval);
        clearInterval(checkPatternInterval);
        setGameState('success');
        gameStateRef.current = 'success';
        onComplete(scoreRef.current);
      }
    }, 100);
    
    // Instead of using a fixed interval for pattern generation,
    // check more frequently if we need to spawn a new pattern
    const checkPatternInterval = setInterval(() => {
      const currentTime = performance.now();
      
      // If there are no active or pending rings, or if the last pattern has ended plus a small buffer
      // and enough time has passed since the last pattern ended, generate a new pattern
      const shouldGenerateNewPattern = (
        (ringsRef.current.length === 0 && pendingRingsRef.current.length === 0) ||
        (lastPatternEndTimeRef.current > 0 && 
         currentTime > lastPatternEndTimeRef.current + 2000 && // Small buffer after last pattern ends
         currentTime > lastPatternEndTimeRef.current + (gameConfig.current.spawnInterval / 4)) // At least 1/4 of spawn interval passed
      );
      
      if (shouldGenerateNewPattern) {
        generateRings(currentTime);
      }
    }, 1000); // Check every second if we need to generate a new pattern
  
    const updateGameState = (timestamp: number) => {
      if (gameStateRef.current !== 'playing') return;
    
      lastUpdateTimeRef.current = timestamp;
      
      // Process the pending rings queue
      // Move rings from pending to active when it's time to display them
      if (pendingRingsRef.current.length > 0) {
        const ringsToActivate: Ring[] = [];
        const remainingPendingRings: Ring[] = [];
        
        pendingRingsRef.current.forEach(ring => {
          if (timestamp >= ring.spawnTime) {
            // It's time to display this ring - add visibleSince timestamp
            ringsToActivate.push({
              ...ring,
              visibleSince: timestamp  // Mark when this ring actually became visible
            });
          } else {
            // Not time to display yet, keep in pending
            remainingPendingRings.push(ring);
          }
        });
        
        if (ringsToActivate.length > 0) {
          // Add newly activated rings to active rings
          ringsRef.current = [...ringsRef.current, ...ringsToActivate];
          setRings(prevRings => [...prevRings, ...ringsToActivate]);
          
          // Update pending rings
          pendingRingsRef.current = remainingPendingRings;
          setPendingRings(remainingPendingRings);
        }
      }
    
      const currentRings = ringsRef.current.map(ring => {
        // Use visibleSince for animation calculations
        
        // Calculate adjusted target time based on visibleSince
        let adjustedTargetTime = ring.targetTime;
        if (ring.visibleSince) {
          const spawnDelay = ring.visibleSince - ring.spawnTime;
          adjustedTargetTime = ring.targetTime + spawnDelay;
        }
        
        // Check for rings that need to be marked as missed using adjusted target time
        if (ring.active && !ring.scored && timestamp > adjustedTargetTime + gameConfig.current.okScoreRange) {
          ring.active = false;
          ring.scored = true;
          ring.hitType = 'miss';
          // Set despawn time to exactly when the animation ends
          const startTime = ring.visibleSince || ring.spawnTime;
          const _animationEndTime = startTime + gameConfig.current.ringAnimationDuration;
          ring.despawnTime = timestamp + gameConfig.current.ringDespawnDelay;
          
          lastHitTypeRef.current = 'miss';
          setLastHitType('miss');
          setShowHitFeedback(true);
          setTimeout(() => setShowHitFeedback(false), gameConfig.current.feedbackDuration);
          
          // Set last hit bongo
          lastHitBongoRef.current = ring.bongo;
          setLastHitBongo(ring.bongo);
        }
        
        return ring;
      });
      
      // Only keep rings that haven't been despawned yet
      const remainingRings = currentRings.filter(ring => 
        (ring.active) || // Keep active rings
        (ring.despawnTime && timestamp < ring.despawnTime) // Keep scored rings until despawn time
      );
      
      ringsRef.current = remainingRings;
      setRings(remainingRings);
    
      if (gameStateRef.current === 'playing') {
        animationFrameRef.current = requestAnimationFrame(updateGameState);
      }
    };
  
    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateGameState);
  
    return () => {
      clearInterval(timerInterval);
      clearInterval(checkPatternInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, onComplete, generateRings]);

  // Handle bongo clicks
  const handleBongoClick = useCallback((bongo: 'left' | 'right') => {
    if (gameState !== 'playing') return;
    
    const currentTime = performance.now();
    const config = gameConfig.current;
    
    const bongoRings = ringsRef.current.filter(
      ring => ring.active && !ring.scored && ring.bongo === bongo
    );
    
    if (bongoRings.length === 0) {
      lastHitTypeRef.current = 'miss';
      setLastHitType('miss');
      setShowHitFeedback(true);
      setTimeout(() => setShowHitFeedback(false), config.feedbackDuration);
      
      // Set last hit bongo
      lastHitBongoRef.current = bongo;
      setLastHitBongo(bongo);
      
      return;
    }
    
    // Find closest ring to target time
    const closestRing = bongoRings.reduce((closest, ring) => {
      return Math.abs(currentTime - ring.targetTime) < Math.abs(currentTime - closest.targetTime) 
        ? ring : closest;
    }, bongoRings[0]);
    
    const hitResult = evaluateHit(closestRing, currentTime);
    
    const updatedRings = ringsRef.current.map(ring => {
      if (ring.id === closestRing.id) {
        // Calculate when the animation should end
        const startTime = ring.visibleSince || ring.spawnTime;
        const _animationEndTime = startTime + config.ringAnimationDuration;
        
        return { 
          ...ring, 
          scored: true, 
          active: false, // Always set to inactive once scored
          hitType: hitResult.type as 'perfect' | 'good' | 'ok' | 'miss',
          despawnTime: currentTime + config.ringDespawnDelay
        };
      }
      return ring;
    });
    
    ringsRef.current = updatedRings;
    setRings(updatedRings);
    
    // Update score
    const pointsEarned = hitResult.score;
    const newScore = Math.min(scoreRef.current + pointsEarned, config.maxScore);
    scoreRef.current = newScore;
    setScore(newScore);
    
    // Update hit type for visual feedback
    lastHitTypeRef.current = hitResult.type as 'perfect' | 'good' | 'ok' | 'miss';
    setLastHitType(hitResult.type as 'perfect' | 'good' | 'ok' | 'miss');
    setShowHitFeedback(true);
    setTimeout(() => setShowHitFeedback(false), config.feedbackDuration);
    
    // Set last hit bongo
    lastHitBongoRef.current = bongo;
    setLastHitBongo(bongo);
    
    if (newScore >= config.maxScore) {
      gameStateRef.current = 'success';
      setGameState('success');
      onComplete(Math.floor(config.maxScore));
    }
  }, [gameState, evaluateHit]);
  
  // Render a ring using the image
  const renderRing = useCallback((ring: Ring) => {
    const currentTime = performance.now();
    
    // Don't render rings that haven't been visible yet
    if (!ring.visibleSince) return null;
    
    const size = getRingSize(ring, currentTime);
    const inPerfectZone = isInPerfectZone(ring, currentTime);
    
    const bongo = ring.bongo === 'left' ? leftBongoRef.current : rightBongoRef.current;
    if (!bongo || !gameAreaRef.current) return null;
    
    const bongoRect = bongo.getBoundingClientRect();
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
    
    const centerX = bongoRect.left - gameAreaRect.left + bongoRect.width / 2;
    const centerY = bongoRect.top - gameAreaRect.top + bongoRect.height / 2;
    
    // Only show next hit highlight for active rings
    const timeToTarget = ring.targetTime - currentTime;
    const isNextHit = ring.active && timeToTarget > 0 && timeToTarget === Math.min(
      ...ringsRef.current
        .filter(r => r.active && !r.scored && r.visibleSince && r.targetTime > currentTime)
        .map(r => r.targetTime - currentTime)
    );
    
    // Only show glow for active rings in perfect zone
    const glowClass = ring.active && inPerfectZone ? 'animate-pulse' : '';
    const nextHitClass = isNextHit ? 'ring-highlight' : '';
    
    // Fade out scored rings as they despawn
    let opacity = 0.8;
    if (!ring.active && ring.despawnTime) {
      const fadeProgress = 1 - Math.min(1, (ring.despawnTime - currentTime) / gameConfig.current.ringDespawnDelay);
      opacity = Math.max(0, 0.8 - fadeProgress);
    } else if (inPerfectZone) {
      opacity = 1;
    }
      
    return (
      <div
        key={ring.id}
        className={`absolute ${glowClass} ${nextHitClass}`}
        style={{
          left: `${centerX - size/2}px`,
          top: `${centerY - size/2}px`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: opacity,
          zIndex: 30,
          pointerEvents: 'none',
          filter: ring.active && inPerfectZone ? 'drop-shadow(0 0 12px gold) brightness(1.2)' : 'none',
          transition: 'opacity 0.2s ease-in-out, filter 0.1s ease-in-out'
        }}
      >
        <img
          src="/challenges/hoop1.png"
          alt="Ring"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: ring.bongo === 'right' ? 'sepia(100%) saturate(500%) hue-rotate(330deg) brightness(120%)' : 'none'
          }}
        />
      </div>
    );
  }, [getRingSize, isInPerfectZone]);

  // Get the appropriate hit feedback message and style
  const getHitFeedbackStyle = useCallback(() => {
    if (!lastHitType || !showHitFeedback) return { message: '', style: {} };
    
    const config = gameConfig.current;
    let message = '';
    const style: React.CSSProperties = {
      position: 'absolute',
      top: '20%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '3rem',
      fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
      zIndex: 40,
      animation: 'fadeInOut 0.3s ease-in-out',
    };
    
    switch(lastHitType) {
      case 'perfect':
        message = 'PERFECT!';
        style.color = config.scoreColors.perfect;
        style.fontSize = '3.5rem';
        style.animation = 'growAndFade 0.3s ease-in-out';
        break;
      case 'good':
        message = 'GOOD!';
        style.color = config.scoreColors.good;
        style.fontSize = '3rem';
        break;
      case 'ok':
        message = 'OK';
        style.color = config.scoreColors.ok;
        style.fontSize = '2.5rem';
        break;
      case 'miss':
        message = 'MISS';
        style.color = config.scoreColors.miss;
        style.fontSize = '2rem';
        break;
    }
    
    return { message, style };
  }, [lastHitType, showHitFeedback]);

  const hitFeedback = getHitFeedbackStyle();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <style>
        {`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
        
        @keyframes growAndFade {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }
        
        @keyframes bongoHit {
          0% { transform: scale(1); }
          50% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }

        .ring-highlight {
          animation: ringPulse 1s infinite;
        }
        
        @keyframes ringPulse {
          0% { filter: drop-shadow(0 0 5px rgba(255,255,255,0.8)); }
          50% { filter: drop-shadow(0 0 15px rgba(255,255,255,0.9)); }
          100% { filter: drop-shadow(0 0 5px rgba(255,255,255,0.8)); }
        }
        `}
      </style>
      <div 
        ref={gameAreaRef}
        className="relative h-96 w-full bg-cover bg-center rounded-lg overflow-hidden select-none"
        style={{ backgroundImage: 'url(/challenges/totem-spirit-background.png)' }}
      >
        {/* Responsive Bongo Container - will switch between horizontal/vertical layout */}
        <div
          className={`absolute inset-0 w-full h-full flex ${isVerticalLayout ? 'flex-col' : 'flex-row'} items-center justify-around`}
          style={{
            zIndex: 20,
          }}
        >
          {/* Left Bongo */}
          <div
            ref={leftBongoRef}
            className="cursor-pointer transition-transform duration-100 flex-shrink-0 m-4"
            style={{
              width: `${gameConfig.current.bongoSize}px`,
              height: `${gameConfig.current.bongoSize}px`,
              animation: showHitFeedback && lastHitBongo === 'left' ? 'bongoHit 0.2s ease-in-out' : 'none',
            }}
            onClick={() => handleBongoClick('left')}
          >
            <img
              src="/challenges/bongo.png"
              alt="Left Bongo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Right Bongo */}
          <div
            ref={rightBongoRef}
            className="cursor-pointer transition-transform duration-100 flex-shrink-0 m-4"
            style={{
              width: `${gameConfig.current.bongoSize}px`,
              height: `${gameConfig.current.bongoSize}px`,
              animation: showHitFeedback && lastHitBongo === 'right' ? 'bongoHit 0.2s ease-in-out' : 'none',
            }}
            onClick={() => handleBongoClick('right')}
          >
            <img
              src="/challenges/bongo.png"
              alt="Right Bongo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        {/* Render active rings */}
        {rings.map(ring => renderRing(ring))}
        
        {/* Hit Feedback Display */}
        {showHitFeedback && hitFeedback.message && (
          <div style={hitFeedback.style}>
            {hitFeedback.message}
          </div>
        )}
      </div>

      <ChallengeActionBar
        gameState={gameState}
        score={score}
        timeLeft={timeLeft}
        onStart={startGame}
        onRestart={startGame}
      />
    </div>
  );
};

export default DrumDanceChallenge