import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';
import ChallengeActionBar from './ChallengeActionBar';

type DodgePosition = 'idle' | 'jump' | 'duck' | 'flat';
type AttackHeight = 'HIGH' | 'MIDDLE' | 'LOW';

interface ActiveAttack {
  id: number;
  height: AttackHeight;
  telegraphWindow: number;
  sprite: string;
}

const PIRANHA_SPRITES = [
  '/challenges/Piranha-1.png',
  '/challenges/Piranha-2.png',
  '/challenges/Piranha-3.png',
];

interface RiversideDodgeChallengeProps {
  difficulty?: number;
  agility?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const HEIGHTS: AttackHeight[] = ['HIGH', 'MIDDLE', 'LOW'];
const GAME_DURATION = 30;
const MAX_GAP = 1300;
const MIN_GAP = 400;
const SHRINK_STEP = 150;
const GRACE_PERIOD_DURATION = 900;
const JUMP_MAX_DURATION = 1500;
const POINTS_PER_DODGE = 50;
const MAX_SCORE = 1000;
const TRANSITION_DURATION = 40; // ms — purely visual, hitbox logic uses ref

// Inverted scheme: button label → dodge position → attack height it counters
const CORRECT_DODGE: Record<AttackHeight, DodgePosition> = {
  HIGH: 'duck',    // overhead attack → duck under it
  MIDDLE: 'flat',  // mid-body attack → lay flat
  LOW: 'jump',     // ground sweep → jump over it
};

// Lane vertical position (% from top of arena), one per attack height
// Calibrated for a 120px otter anchored at bottom: 20% idle → head ~49% from top
const LANE_TOP: Record<AttackHeight, number> = { HIGH: 52, MIDDLE: 61, LOW: 75 };

type DisplaySprite = DodgePosition | 't1' | 't2' | 't3';

const OTTER_SPRITE: Record<DisplaySprite, string> = {
  idle: '/challenges/Riverside-Otter-Idle.png',
  jump: '/challenges/Riverside-Otter-Jump.png',
  duck: '/challenges/Riverside-Otter-Duck.png',
  flat: '/challenges/Riverside-Otter-Flatten.png',
  t1:   '/challenges/Riverside-Otter-Transition-1.png', // idle ↔ jump
  t2:   '/challenges/Riverside-Otter-Transition-2.png', // idle ↔ duck
  t3:   '/challenges/Riverside-Otter-Transition-3.png', // duck ↔ flat
};

// Uniform scale factor: idle canvas 659×856, target render height 120px → scale ≈ 0.1402.
// Applied to every sprite's canvas dims so body mass looks consistent across all poses.
// Ground poses anchor at bottom:'77px' (feet at canvas bottom after trimming empty space).
interface SpriteRenderConfig { w: number; h: number; bottom?: string; top?: string }

const SPRITE_CONFIG: Record<DisplaySprite, SpriteRenderConfig> = {
  idle: { w:  92, h: 120, bottom: '77px' },
  jump: { w:  98, h: 144, top:    '28%'  },
  duck: { w: 118, h:  48, bottom: '77px' },
  flat: { w: 173, h:  29, bottom: '77px' },
  t1:   { w:  90, h: 175, top:    '28%'  },
  t2:   { w: 142, h:  82, bottom: '77px' },
  t3:   { w: 198, h:  40, bottom: '77px' },
};

// Returns the sprite sequence to display for a position transition (ends on the target sprite).
// Empty array = snap directly with no transition frames.
function getTransitionSequence(from: DodgePosition, to: DodgePosition): DisplaySprite[] {
  if (from === 'idle' && to === 'jump') return ['t1', 'jump'];
  if (from === 'jump' && to === 'idle') return ['t1', 'idle'];
  if (from === 'idle' && to === 'duck') return ['t2', 'duck'];
  if (from === 'duck' && to === 'idle') return ['t2', 'idle'];
  if (from === 'duck' && to === 'flat') return ['t3', 'flat'];
  if (from === 'flat' && to === 'duck') return ['t3', 'duck'];
  // Flatten from idle passes through the duck posture on the way down and back up
  if (from === 'idle' && to === 'flat') return ['t2', 'duck', 't3', 'flat'];
  if (from === 'flat' && to === 'idle') return ['t3', 'duck', 't2', 'idle'];
  return [];
}

const RiversideDodgeChallenge: React.FC<RiversideDodgeChallengeProps> = ({
  difficulty: _difficulty = 1,
  agility = 10,
  onComplete = (score: number) => console.log('Challenge complete:', score),
}) => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [otterPosition, setOtterPosition] = useState<DodgePosition>('idle');
  const [activeAttack, setActiveAttack] = useState<ActiveAttack | null>(null);
  const [gracePeriodActive, setGracePeriodActive] = useState(false);
  const [showMissFeedback, setShowMissFeedback] = useState(false);
  const [displaySprite, setDisplaySprite] = useState<DisplaySprite>('idle');

  // Refs shadow all state consumed inside timer callbacks
  const gameStateRef = useRef<GameState>('ready');
  const scoreRef = useRef(0);
  const otterPositionRef = useRef<DodgePosition>('idle');
  const gracePeriodRef = useRef(false);
  const currentIntervalRef = useRef(MAX_GAP);
  const nextAttackIdRef = useRef(1);

  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const attackSchedulerRef = useRef<number | null>(null);
  const arrivalCheckRef = useRef<number | null>(null);
  const jumpCapTimerRef = useRef<number | null>(null);
  const gracePeriodTimerRef = useRef<number | null>(null);
  const missFeedbackTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  // Higher agility gives more reaction time per attack — piranha crosses slower
  const telegraphWindow = Math.max(600, 1400 - (agility - 10) * 40);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { otterPositionRef.current = otterPosition; }, [otterPosition]);
  useEffect(() => { gracePeriodRef.current = gracePeriodActive; }, [gracePeriodActive]);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (attackSchedulerRef.current) { window.clearTimeout(attackSchedulerRef.current); attackSchedulerRef.current = null; }
    if (arrivalCheckRef.current) { window.clearTimeout(arrivalCheckRef.current); arrivalCheckRef.current = null; }
    if (jumpCapTimerRef.current) { window.clearTimeout(jumpCapTimerRef.current); jumpCapTimerRef.current = null; }
    if (gracePeriodTimerRef.current) { window.clearTimeout(gracePeriodTimerRef.current); gracePeriodTimerRef.current = null; }
    if (missFeedbackTimerRef.current) { window.clearTimeout(missFeedbackTimerRef.current); missFeedbackTimerRef.current = null; }
    if (transitionTimerRef.current) { window.clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null; }
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const handleGameEnd = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    clearAllTimers();
    setActiveAttack(null);
    setGameState('success');
    gameStateRef.current = 'success';
    onComplete(scoreRef.current);
  }, [clearAllTimers, onComplete]);

  const launchAttack = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    const height = HEIGHTS[Math.floor(Math.random() * HEIGHTS.length)];
    const attack: ActiveAttack = {
      id: nextAttackIdRef.current++,
      height,
      telegraphWindow,
      sprite: PIRANHA_SPRITES[Math.floor(Math.random() * PIRANHA_SPRITES.length)],
    };
    setActiveAttack(attack);

    // Piranha reaches player hitbox after telegraphWindow ms — evaluate dodge here
    arrivalCheckRef.current = window.setTimeout(() => {
      if (gameStateRef.current !== 'playing') return;
      setActiveAttack(null);

      if (gracePeriodRef.current) {
        // Attack passes through with no consequence during invincibility window
        attackSchedulerRef.current = window.setTimeout(launchAttack, currentIntervalRef.current);
        return;
      }

      const correctDodge = otterPositionRef.current === CORRECT_DODGE[height];
      const partialDodge = height === 'HIGH' && otterPositionRef.current === 'flat';

      if (correctDodge || partialDodge) {
        const points = partialDodge ? Math.floor(POINTS_PER_DODGE / 2) : POINTS_PER_DODGE;
        const newScore = Math.min(scoreRef.current + points, MAX_SCORE);
        scoreRef.current = newScore;
        setScore(newScore);
        currentIntervalRef.current = Math.max(MIN_GAP, currentIntervalRef.current - SHRINK_STEP);
        if (newScore >= MAX_SCORE) {
          handleGameEnd();
          return;
        }
      } else {
        currentIntervalRef.current = MAX_GAP;
        gracePeriodRef.current = true;
        setGracePeriodActive(true);
        setShowMissFeedback(true);

        if (gracePeriodTimerRef.current) window.clearTimeout(gracePeriodTimerRef.current);
        gracePeriodTimerRef.current = window.setTimeout(() => {
          gracePeriodRef.current = false;
          setGracePeriodActive(false);
        }, GRACE_PERIOD_DURATION);

        if (missFeedbackTimerRef.current) window.clearTimeout(missFeedbackTimerRef.current);
        missFeedbackTimerRef.current = window.setTimeout(() => setShowMissFeedback(false), 600);
      }

      attackSchedulerRef.current = window.setTimeout(launchAttack, currentIntervalRef.current);
    }, telegraphWindow);
  }, [telegraphWindow, handleGameEnd]);

  const initializeGame = useCallback(() => {
    clearAllTimers();

    scoreRef.current = 0;
    otterPositionRef.current = 'idle';
    gracePeriodRef.current = false;
    currentIntervalRef.current = MAX_GAP;
    nextAttackIdRef.current = 1;

    setScore(0);
    setTimeLeft(GAME_DURATION);
    setOtterPosition('idle');
    setDisplaySprite('idle');
    setActiveAttack(null);
    setGracePeriodActive(false);
    setShowMissFeedback(false);

    endTimeRef.current = Date.now() + GAME_DURATION * 1000;
    gameStateRef.current = 'playing';
    setGameState('playing');

    timerRef.current = window.setInterval(() => {
      if (!endTimeRef.current) return;
      const remaining = Math.max(0, (endTimeRef.current - Date.now()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) handleGameEnd();
    }, 100);

    attackSchedulerRef.current = window.setTimeout(launchAttack, MAX_GAP);
  }, [clearAllTimers, launchAttack, handleGameEnd]);

  // Displays a sequence of sprites in order, each held for TRANSITION_DURATION ms.
  // Only one timer is live at a time — cancelling transitionTimerRef stops the sequence.
  const showSpriteSequence = useCallback((sequence: DisplaySprite[]) => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (sequence.length === 0) return;
    setDisplaySprite(sequence[0]);
    const step = (index: number) => {
      if (index >= sequence.length) { transitionTimerRef.current = null; return; }
      setDisplaySprite(sequence[index]);
      transitionTimerRef.current = window.setTimeout(() => step(index + 1), TRANSITION_DURATION);
    };
    step(0);
  }, []);

  const applyPosition = useCallback((pos: DodgePosition) => {
    if (gameStateRef.current !== 'playing') return;
    const prev = otterPositionRef.current;
    setOtterPosition(pos);
    otterPositionRef.current = pos;

    const sequence = getTransitionSequence(prev, pos);
    if (sequence.length > 0) {
      showSpriteSequence(sequence);
    } else {
      if (transitionTimerRef.current) { window.clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null; }
      setDisplaySprite(pos);
    }

    if (pos === 'jump') {
      if (jumpCapTimerRef.current) window.clearTimeout(jumpCapTimerRef.current);
      jumpCapTimerRef.current = window.setTimeout(() => {
        if (gameStateRef.current !== 'playing') return;
        setOtterPosition('idle');
        otterPositionRef.current = 'idle';
        showSpriteSequence(['t1', 'idle']);
        jumpCapTimerRef.current = null;
      }, JUMP_MAX_DURATION);
    } else {
      if (jumpCapTimerRef.current) {
        window.clearTimeout(jumpCapTimerRef.current);
        jumpCapTimerRef.current = null;
      }
    }
  }, [showSpriteSequence]);

  const returnToIdle = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (jumpCapTimerRef.current) {
      window.clearTimeout(jumpCapTimerRef.current);
      jumpCapTimerRef.current = null;
    }
    const prev = otterPositionRef.current;
    setOtterPosition('idle');
    otterPositionRef.current = 'idle';

    const sequence = getTransitionSequence(prev, 'idle');
    if (sequence.length > 0) {
      showSpriteSequence(sequence);
    } else {
      if (transitionTimerRef.current) { window.clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null; }
      setDisplaySprite('idle');
    }
  }, [showSpriteSequence]);


  const getOtterStyle = (): React.CSSProperties => {
    const cfg = SPRITE_CONFIG[displaySprite];
    return {
      position: 'absolute',
      left: 48,
      width: cfg.w,
      height: cfg.h,
      zIndex: 15,
      opacity: gracePeriodActive ? 0.4 : 1,
      transition: 'opacity 0.15s',
      ...(cfg.top !== undefined
        ? { top: cfg.top, bottom: 'auto' }
        : { bottom: cfg.bottom, top: 'auto' }),
    };
  };

  const BUTTON_IMAGE: Record<DodgePosition, string> = {
    jump: '/challenges/Riverside-Button-Jump.png',
    duck: '/challenges/Riverside-Button-Duck.png',
    flat: '/challenges/Riverside-Button-Flatten.png',
    idle: '',
  };

  const handleButtonTouchMove = useCallback((e: React.TouchEvent) => {
    if (gameStateRef.current !== 'playing') return;
    const touch = e.touches[0];
    if (!touch) return;
    let el: Element | null = document.elementFromPoint(touch.clientX, touch.clientY);
    while (el && !(el instanceof HTMLButtonElement)) el = el.parentElement;
    if (el instanceof HTMLButtonElement) {
      const pos = (el as HTMLButtonElement).dataset.dodgePos as DodgePosition | undefined;
      if (pos) applyPosition(pos);
    }
  }, [applyPosition]);

  const renderButtons = () => (
    <div
      className="absolute bottom-3 left-0 right-0 flex justify-center gap-4 px-4 z-20"
      onTouchMove={handleButtonTouchMove}
    >
      {(['jump', 'duck', 'flat'] as const).map(pos => {
        const active = otterPosition === pos;
        return (
          <button
            key={pos}
            type="button"
            data-dodge-pos={pos}
            className="select-none touch-none"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              height: 72,
              width: 72,
              filter: active
                ? 'brightness(1.25) drop-shadow(0 0 8px rgba(255,255,255,0.85))'
                : 'brightness(0.8)',
              transform: active ? 'scale(1.07)' : 'scale(1)',
              transition: 'filter 0.06s, transform 0.06s',
            }}
            onMouseDown={() => applyPosition(pos)}
            onMouseUp={returnToIdle}
            onMouseLeave={returnToIdle}
            onTouchStart={e => { e.preventDefault(); applyPosition(pos); }}
            onTouchEnd={e => { e.preventDefault(); returnToIdle(); }}
            onTouchCancel={e => { e.preventDefault(); returnToIdle(); }}
          >
            <img
              src={BUTTON_IMAGE[pos]}
              alt={pos}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </button>
        );
      })}
    </div>
  );

  const renderGameContent = () => (
    <>
      <div className="rounded-lg mb-4">
        <div className="relative w-full h-96 rounded-lg overflow-hidden select-none touch-none">
          <img
            src="/challenges/Riverside-Background.png"
            alt="Riverside"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {gracePeriodActive && (
            <div className="absolute inset-0 bg-red-500 opacity-10 animate-pulse z-20 pointer-events-none" />
          )}

          {showMissFeedback && (
            <div
              className="absolute left-1/2 top-1/3 z-30 pointer-events-none text-red-400 text-3xl font-bold"
              style={{
                transform: 'translate(-50%, -50%)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                animation: 'missFlash 0.6s ease-out forwards',
              }}
            >
              MISS!
            </div>
          )}

          {/* Subtle lane guide lines */}
          {(['HIGH', 'MIDDLE', 'LOW'] as AttackHeight[]).map(h => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-white border-opacity-10"
              style={{ top: `${LANE_TOP[h]}%` }}
            />
          ))}

          {activeAttack && (
            <>
              {/* Telegraph indicator: glowing dot on the right at the arrival height */}
              <div
                className="absolute right-4 rounded-full bg-sky-400 z-10"
                style={{
                  top: `${LANE_TOP[activeAttack.height]}%`,
                  transform: 'translateY(-50%)',
                  width: 20,
                  height: 20,
                  animation: `telegraphPulse ${activeAttack.telegraphWindow}ms ease-in-out`,
                }}
              />
              {/*
                Piranha arc animation:
                  0%  — below the lane, right off-screen (emerging from water)
                  45% — peaks 25px above the lane (mid-arc)
                  100%— arrives exactly on the lane at the player hitbox

                key={activeAttack.id} ensures a fresh DOM node (and fresh animation) per attack.
              */}
              <div
                key={activeAttack.id}
                className="absolute z-10"
                style={{
                  top: `${LANE_TOP[activeAttack.height]}%`,
                  left: 0,
                  width: 64,
                  height: 40,
                  transform: 'translateY(-50%) translateX(900px) translateY(40px)',
                  animation: `piranhaArc ${activeAttack.telegraphWindow}ms linear forwards`,
                }}
              >
                <img
                  src={activeAttack.sprite}
                  alt="Piranha"
                  className="w-full h-full object-contain"
                  style={{ transform: 'none' }}
                  draggable={false}
                />
              </div>
            </>
          )}

          {/* Otter — container sized per SPRITE_CONFIG so character is ~100px tall with feet at a consistent ground position */}
          <div style={getOtterStyle()}>
            <img
              src={OTTER_SPRITE[displaySprite]}
              alt="Otter"
              className="w-full h-full"
              style={{
                filter: gracePeriodActive ? 'grayscale(70%)' : 'none',
                transition: 'filter 0.15s',
              }}
              draggable={false}
            />
          </div>

          {gameState === 'playing' && renderButtons()}
        </div>
      </div>

      <ChallengeActionBar
        gameState={gameState}
        score={score}
        timeLeft={timeLeft}
        onStart={initializeGame}
        onRestart={initializeGame}
      />
    </>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <style>{`
        @keyframes piranhaArc {
          0%   { transform: translateY(-50%) translateX(900px) translateY(40px); }
          45%  { transform: translateY(-50%) translateX(350px) translateY(-25px); }
          100% { transform: translateY(-50%) translateX(50px)  translateY(0px); }
        }
        @keyframes telegraphPulse {
          0%   { opacity: 0.5; box-shadow: 0 0 4px 2px rgba(56,189,248,0.4); }
          50%  { opacity: 1;   box-shadow: 0 0 14px 7px rgba(56,189,248,0.9); }
          100% { opacity: 0.6; box-shadow: 0 0 6px 3px rgba(56,189,248,0.5); }
        }
        @keyframes missFlash {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
        }
      `}</style>
      {renderGameContent()}
    </div>
  );
};

export default RiversideDodgeChallenge;
