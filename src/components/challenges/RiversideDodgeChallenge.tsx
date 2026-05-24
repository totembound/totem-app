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
const TW_SHRINK_STEP = 40;
const MIN_TW = 700;
const GRACE_PERIOD_DURATION = 900;
const JUMP_MAX_DURATION = 1500;
const POINTS_PER_DODGE = 50;
const MAX_SCORE = 1000;
const TRANSITION_DURATION = 40; // ms — purely visual, hitbox logic uses ref
const ARRIVAL_FRACTION = 0.82; // fraction of telegraphWindow when piranha visually reaches player (matches 82% keyframe)

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

// Scale factor ~0.25 applied to normalized power-of-2 canvas dims (512, 768).
// All sprites exported at 512×512, 512×768 (portrait), or 768×512 (landscape).
// Ground poses anchor at bottom:'77px' — tune if otter feet don't sit on the waterline.
interface SpriteRenderConfig { w: number; h: number; bottom?: string; top?: string }

const SPRITE_CONFIG: Record<DisplaySprite, SpriteRenderConfig> = {
  idle: { w: 128, h: 128, bottom: '77px' },  // 512×512 — reference (feet at 88px from floor)
  jump: { w: 128, h: 192, top:    '18%'  },  // 512×768
  duck: { w: 220, h: 147, bottom: '48px' },  // 768×512 — 40px padding below feet at this scale
  flat: { w: 197, h: 197, bottom: '15px' },  // 512×512 — 74px padding below feet at this scale
  t1:   { w: 128, h: 192, top:    '18%'  },  // 512×768
  t2:   { w: 192, h: 128, bottom: '60px' },  // 768×512 — 28px padding below feet
  t3:   { w: 192, h: 128, bottom: '45px' },  // 768×512 — 43px padding below feet
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
  difficulty = 1,
  agility = 10,
  onComplete = (score: number) => console.log('Challenge complete:', score),
}) => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [otterPosition, setOtterPosition] = useState<DodgePosition>('idle');
  const [activeAttack, setActiveAttack] = useState<ActiveAttack | null>(null);
  const [gracePeriodActive, setGracePeriodActive] = useState(false);
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
  const removalTimerRef = useRef<number | null>(null);
  const jumpCapTimerRef = useRef<number | null>(null);
  const gracePeriodTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  // Higher agility gives more reaction time per attack — piranha crosses slower
  const telegraphWindow = Math.max(600, 1400 - (agility - 10) * 40);
  // Difficulty shifts the starting TW down — higher difficulty = faster piranhas from the start.
  // A miss resets to startingTW (not the agility max) so difficulty stays relevant throughout.
  const startingTW = Math.max(MIN_TW, telegraphWindow - (difficulty - 1) * 200);
  const currentTWRef = useRef(startingTW);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { otterPositionRef.current = otterPosition; }, [otterPosition]);
  useEffect(() => { gracePeriodRef.current = gracePeriodActive; }, [gracePeriodActive]);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (attackSchedulerRef.current) { window.clearTimeout(attackSchedulerRef.current); attackSchedulerRef.current = null; }
    if (arrivalCheckRef.current) { window.clearTimeout(arrivalCheckRef.current); arrivalCheckRef.current = null; }
    if (removalTimerRef.current) { window.clearTimeout(removalTimerRef.current); removalTimerRef.current = null; }
    if (jumpCapTimerRef.current) { window.clearTimeout(jumpCapTimerRef.current); jumpCapTimerRef.current = null; }
    if (gracePeriodTimerRef.current) { window.clearTimeout(gracePeriodTimerRef.current); gracePeriodTimerRef.current = null; }
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
    const tw = currentTWRef.current;
    const attack: ActiveAttack = {
      id: nextAttackIdRef.current++,
      height,
      telegraphWindow: tw,
      sprite: PIRANHA_SPRITES[Math.floor(Math.random() * PIRANHA_SPRITES.length)],
    };
    setActiveAttack(attack);

    // Evaluate dodge when piranha visually reaches the player (ARRIVAL_FRACTION of animation)
    arrivalCheckRef.current = window.setTimeout(() => {
      if (gameStateRef.current !== 'playing') return;
      if (gracePeriodRef.current) return; // attack passes through; removal timer schedules next

      const correctDodge = otterPositionRef.current === CORRECT_DODGE[height];
      const partialDodge = height === 'HIGH' && otterPositionRef.current === 'flat';

      if (correctDodge || partialDodge) {
        const points = partialDodge ? Math.floor(POINTS_PER_DODGE / 2) : POINTS_PER_DODGE;
        const newScore = Math.min(scoreRef.current + points, MAX_SCORE);
        scoreRef.current = newScore;
        setScore(newScore);
        currentIntervalRef.current = Math.max(MIN_GAP, currentIntervalRef.current - SHRINK_STEP);
        currentTWRef.current = Math.max(MIN_TW, currentTWRef.current - TW_SHRINK_STEP);
        if (newScore >= MAX_SCORE) {
          handleGameEnd();
          return;
        }
      } else {
        currentIntervalRef.current = MAX_GAP;
        currentTWRef.current = startingTW;
        gracePeriodRef.current = true;
        setGracePeriodActive(true);

        if (gracePeriodTimerRef.current) window.clearTimeout(gracePeriodTimerRef.current);
        gracePeriodTimerRef.current = window.setTimeout(() => {
          gracePeriodRef.current = false;
          setGracePeriodActive(false);
        }, GRACE_PERIOD_DURATION);
      }
    }, Math.round(tw * ARRIVAL_FRACTION));

    // Remove piranha and schedule next attack after full exit animation completes
    removalTimerRef.current = window.setTimeout(() => {
      if (gameStateRef.current !== 'playing') return;
      setActiveAttack(null);
      attackSchedulerRef.current = window.setTimeout(launchAttack, currentIntervalRef.current);
    }, tw);
  }, [telegraphWindow, handleGameEnd]);

  const initializeGame = useCallback(() => {
    clearAllTimers();

    scoreRef.current = 0;
    otterPositionRef.current = 'idle';
    gracePeriodRef.current = false;
    currentIntervalRef.current = MAX_GAP;
    currentTWRef.current = startingTW;
    nextAttackIdRef.current = 1;

    setScore(0);
    setTimeLeft(GAME_DURATION);
    setOtterPosition('idle');
    setDisplaySprite('idle');
    setActiveAttack(null);
    setGracePeriodActive(false);

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

  const BUTTON_SIZE: Record<'jump' | 'duck' | 'flat', number> = {
    jump: 66,
    duck: 72,
    flat: 74,
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
              height: BUTTON_SIZE[pos],
              width: BUTTON_SIZE[pos],
              filter: active
                ? 'brightness(1.25) drop-shadow(0 0 8px rgba(255,255,255,0.85))'
                : 'brightness(0.8)',
              transform: active ? 'scale(1.07)' : 'scale(1)',
              transition: 'filter 0.06s, transform 0.06s',
            }}
            onMouseDown={() => applyPosition(pos)}
            onMouseUp={returnToIdle}
            onMouseLeave={returnToIdle}
            onTouchStart={() => applyPosition(pos)}
            onTouchEnd={() => returnToIdle()}
            onTouchCancel={() => returnToIdle()}
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
              className="w-full h-full object-contain"
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
          82%  { transform: translateY(-50%) translateX(50px)  translateY(0px); }
          100% { transform: translateY(-50%) translateX(-120px) translateY(0px); }
        }
        @keyframes telegraphPulse {
          0%   { opacity: 0.5; box-shadow: 0 0 4px 2px rgba(56,189,248,0.4); }
          50%  { opacity: 1;   box-shadow: 0 0 14px 7px rgba(56,189,248,0.9); }
          100% { opacity: 0.6; box-shadow: 0 0 6px 3px rgba(56,189,248,0.5); }
        }
      `}</style>
      {renderGameContent()}
    </div>
  );
};

export default RiversideDodgeChallenge;
