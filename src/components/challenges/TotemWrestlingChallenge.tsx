import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';
import ChallengeActionBar from './ChallengeActionBar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChargePhase = 'idle' | 'charging' | 'peaked' | 'declining';

type ImpactParticle = {
    id: number;
    x: number;       // px from left of game area
    yPercent: number; // % from top
    dirX: number;
    dirY: number;
    size: number;
    timestamp: number;
    color: string;
};

type GameSettings = {
    chargeRate: number;             // charge points added per animation frame
    peakZoneMin: number;            // lower bound of peak zone (0–100)
    peakZoneMax: number;            // upper bound of peak zone (0–100)
    declineRate: number;            // charge points removed per frame after peak
    basePushPower: number;          // position delta at 100% charge
    peakPushMultiplier: number;     // bonus multiplier when releasing in peak zone
    opponentBaseInterval: number;   // ms between opponent charges
    opponentChargeRate:   number;   // charge points added per frame for opponent
    opponentPushPower:    number;   // multiplier on opponent push power
    timeLimit: number;              // seconds
};

interface TotemWrestlingChallengeProps {
    difficulty?: number;
    strength?: number;
    onComplete?: (score: number) => void;
    onFail?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TotemWrestlingChallenge: React.FC<TotemWrestlingChallengeProps> = ({
    difficulty = 2,
    strength = 10,
    onComplete = (score: number) => console.log('Challenge complete:', score),
    onFail = () => console.log('Challenge failed'),
}) => {

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    const [gameState, setGameState]           = useState<GameState>('ready');
    const [playerCharge, setPlayerCharge]     = useState<number>(0);
    const [chargePhase, setChargePhase]       = useState<ChargePhase>('idle');
    const [opponentCharge, setOpponentCharge] = useState<number>(0);
    const [isOpponentCharging, setIsOpponentCharging] = useState<boolean>(false);

    const [displayPosition, setDisplayPosition] = useState<number>(0.5);

    const [timeLeft, setTimeLeft]         = useState<number | null>(null);
    const [finalScore, setFinalScore]     = useState<number>(0);
    const [impactParticles, setImpactParticles] = useState<ImpactParticle[]>([]);

    // -----------------------------------------------------------------------
    // Refs  (avoid stale closures in loops / event handlers)
    // -----------------------------------------------------------------------

    const gameAreaRef          = useRef<HTMLDivElement>(null);
    const timerRef             = useRef<number | null>(null);
    const endTimeRef           = useRef<number | null>(null);
    const chargeAnimRef        = useRef<number | null>(null);
    const smoothingRef         = useRef<number | null>(null);
    const opponentTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
    const opponentIntervalRef  = useRef<number | null>(null);
    const particleIdRef        = useRef<number>(0);
    const displayPositionRef   = useRef<number>(0.5);

    // Ref mirrors for use inside rAF / setTimeout closures
    const chargeValueRef       = useRef<number>(0);
    const chargePhaseRef       = useRef<ChargePhase>('idle');
    const contactPositionRef   = useRef<number>(0.5);
    const isHoldingRef         = useRef<boolean>(false);
    const gameStateRef         = useRef<GameState>('ready');
    const gameEndedRef         = useRef<boolean>(false);
    // Ref so applyPush can call handleGameEnd without a circular useCallback dep
    const handleGameEndRef     = useRef<(success: boolean) => void>(() => {});

    // Keep refs in sync with state
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    // Smooth display position toward contact position each animation frame
    useEffect(() => {
        if (gameState !== 'playing') return;

        const smooth = () => {
            const target  = contactPositionRef.current;
            const current = displayPositionRef.current;
            const diff    = target - current;

            if (Math.abs(diff) > 0.001) {
                const next = current + diff * 0.15;
                displayPositionRef.current = next;
                setDisplayPosition(next);
            } else if (current !== target) {
                displayPositionRef.current = target;
                setDisplayPosition(target);
            }

            smoothingRef.current = requestAnimationFrame(smooth);
        };

        smoothingRef.current = requestAnimationFrame(smooth);
        return () => {
            if (smoothingRef.current) cancelAnimationFrame(smoothingRef.current);
        };
    }, [gameState]);

    // -----------------------------------------------------------------------
    // Game settings — strength scales charge speed, peak width, push power
    // -----------------------------------------------------------------------

    const gameSettings: GameSettings = {
        chargeRate:            0.6 + (strength * 0.06),           // str=13→1.38, str=20→1.8 pts/frame (~1.1–1.5s to peak)
        peakZoneMin:           Math.max(60, 80 - strength),       // wider peak with more strength
        peakZoneMax:           95,
        declineRate:           2.2,
        basePushPower:         0.015 + (strength * 0.001),       // str=13→0.028, str=20→0.035 — weak outside peak
        peakPushMultiplier:    2.5,                               // peak release is ~3.5x a non-peak at same charge
        opponentBaseInterval:  Math.max(1000, 1800 - (difficulty * 200)),
        opponentChargeRate:    1.4 + (difficulty * 0.4),
        opponentPushPower:     2.1 + (difficulty * 0.225),
        timeLimit:             20,
    };

    // -----------------------------------------------------------------------
    // Visual helpers
    // -----------------------------------------------------------------------

    const inPeakZone = chargePhase !== 'declining'
        && playerCharge >= gameSettings.peakZoneMin
        && playerCharge <= gameSettings.peakZoneMax;

    const getAuraStyle = (): React.CSSProperties => {
        if (playerCharge === 0) return {};
        const t = playerCharge / 100;
        if (inPeakZone) {
            return {
                filter: `drop-shadow(0 0 ${14 + t * 18}px gold) brightness(1.35)`,
                transform: `scale(${1 + t * 0.09})`,
                transition: 'filter 0.08s ease-out, transform 0.08s ease-out',
            };
        }
        if (chargePhase === 'declining') {
            return {
                filter: `drop-shadow(0 0 ${6 + t * 10}px rgba(249, 115, 22, 0.9)) brightness(1.1)`,
                transition: 'filter 0.08s ease-out',
            };
        }
        return {
            filter: `drop-shadow(0 0 ${4 + t * 14}px rgba(147, 197, 253, 0.9)) brightness(${1 + t * 0.18})`,
            transform: `scale(${1 + t * 0.05})`,
            transition: 'filter 0.08s ease-out, transform 0.08s ease-out',
        };
    };

    const getOpponentAuraStyle = (): React.CSSProperties => {
        if (opponentCharge === 0) return {};
        const t = opponentCharge / 100;
        // transform is intentionally omitted here — always set via inline style below
        // so translateX(-50%) is never dropped when transitioning between charge states
        return {
            filter: `drop-shadow(0 0 ${4 + t * 14}px rgba(239, 68, 68, 0.9)) brightness(${1 + t * 0.18})`,
            transition: 'filter 0.08s ease-out, transform 0.08s ease-out',
        };
    };

    // -----------------------------------------------------------------------
    // Impact particles
    // -----------------------------------------------------------------------

    const spawnImpactParticles = useCallback((xPx: number) => {
        const palette = [
            'bg-amber-400', 'bg-orange-500', 'bg-yellow-300',
            'bg-red-400', 'bg-stone-400',
        ];
        const newParticles: ImpactParticle[] = [];
        for (let i = 0; i < 14; i++) {
            const angle = (Math.PI * 2 * i) / 14;
            newParticles.push({
                id: particleIdRef.current++,
                x: xPx,
                yPercent: 78,
                dirX: Math.cos(angle) * (Math.random() * 55 + 20),
                dirY: Math.sin(angle) * (Math.random() * 35 + 10),
                size: Math.random() * 4 + 3,
                timestamp: Date.now(),
                color: palette[Math.floor(Math.random() * palette.length)],
            });
        }
        setImpactParticles(prev => [...prev, ...newParticles]);
    }, []);

    // -----------------------------------------------------------------------
    // Push application — updates the shared contact position
    // -----------------------------------------------------------------------

    const applyPush = useCallback((power: number, direction: 'player' | 'opponent') => {
        // Player pushes opponent toward right edge (contact increases toward 1 = opponent out).
        //   contactPosition 0 → player side fully out (player LOSES)
        //   contactPosition 1 → opponent side fully out (player WINS)
        // Player push moves contact toward 1; opponent push moves it toward 0.
        const delta = direction === 'player' ? power : -power;

        // Compute next position synchronously so ring-out checks and particle spawn
        // all use the same post-push value (state setter updater runs asynchronously).
        const next = Math.max(0, Math.min(1, contactPositionRef.current + delta));
        contactPositionRef.current = next;

        // Ring-out checks
        if (next >= 0.97) {
            handleGameEndRef.current(true);
        } else if (next <= 0.03) {
            handleGameEndRef.current(false);
        }

        // Spawn particles at the post-push contact point
        const gameAreaWidth = gameAreaRef.current?.clientWidth || 400;
        spawnImpactParticles(next * gameAreaWidth);
    }, [spawnImpactParticles]);

    // -----------------------------------------------------------------------
    // Score calculation
    // -----------------------------------------------------------------------

    const calculateScore = useCallback((won: boolean): number => {
        if (!won) return 0;
        const timeUsed = endTimeRef.current
            ? Math.max(0, gameSettings.timeLimit - (endTimeRef.current - Date.now()) / 1000)
            : gameSettings.timeLimit;
        const timeFraction  = Math.max(0, 1 - (timeUsed / gameSettings.timeLimit));
        // How far did player push the opponent? (contactPosition close to 1 = further)
        const pushFraction  = Math.max(0, (contactPositionRef.current - 0.5) * 2);
        return Math.round(1000 + (timeFraction * 600) + (pushFraction * 400));
    }, [gameSettings.timeLimit]);

    // -----------------------------------------------------------------------
    // Game end
    // -----------------------------------------------------------------------

    const handleGameEnd = useCallback((success: boolean) => {
        if (gameEndedRef.current) return;
        gameEndedRef.current = true;

        if (timerRef.current)          { window.clearInterval(timerRef.current);          timerRef.current = null; }
        if (opponentTimerRef.current)  { clearTimeout(opponentTimerRef.current);           opponentTimerRef.current = null; }
        if (opponentIntervalRef.current) { window.clearInterval(opponentIntervalRef.current); opponentIntervalRef.current = null; }
        if (chargeAnimRef.current)     { cancelAnimationFrame(chargeAnimRef.current);      chargeAnimRef.current = null; }
        isHoldingRef.current = false;

        if (success) {
            const score = calculateScore(true);
            setFinalScore(score);
            setGameState('success');
            onComplete(score);
        } else {
            setFinalScore(0);
            setGameState('failed');
            onFail();
        }
    }, [calculateScore, onComplete, onFail]);

    // Keep handleGameEndRef in sync so applyPush can call it without stale closure
    useEffect(() => { handleGameEndRef.current = handleGameEnd; }, [handleGameEnd]);

    // -----------------------------------------------------------------------
    // Charge animation loop (rAF)
    // -----------------------------------------------------------------------

    const runChargeLoop = useCallback(() => {
        if (!isHoldingRef.current || gameStateRef.current !== 'playing') return;

        const current = chargeValueRef.current;
        const phase   = chargePhaseRef.current;

        if (phase === 'charging') {
            const next = current + gameSettings.chargeRate;
            if (next >= gameSettings.peakZoneMax) {
                chargeValueRef.current  = gameSettings.peakZoneMax;
                chargePhaseRef.current  = 'peaked';
                setChargePhase('peaked');
            } else {
                chargeValueRef.current = next;
            }
            setPlayerCharge(chargeValueRef.current);

        } else if (phase === 'peaked') {
            // One-frame hold at peak so the UI can flash "RELEASE!"
            chargePhaseRef.current = 'declining';
            setChargePhase('declining');

        } else if (phase === 'declining') {
            const next = Math.max(0, current - gameSettings.declineRate);
            chargeValueRef.current = next;
            setPlayerCharge(next);
        }

        chargeAnimRef.current = requestAnimationFrame(runChargeLoop);
    }, [gameSettings.chargeRate, gameSettings.peakZoneMax, gameSettings.declineRate]);

    // -----------------------------------------------------------------------
    // Press start / end  (works for both mouse and touch)
    // -----------------------------------------------------------------------

    const handlePressStart = useCallback(() => {
        if (gameStateRef.current !== 'playing') return;
        if (isHoldingRef.current) return; // ignore multi-touch duplicates

        isHoldingRef.current    = true;
        chargeValueRef.current  = 0;
        chargePhaseRef.current  = 'charging';
        setChargePhase('charging');
        setPlayerCharge(0);

        if (chargeAnimRef.current) cancelAnimationFrame(chargeAnimRef.current);
        chargeAnimRef.current = requestAnimationFrame(runChargeLoop);
    }, [runChargeLoop]);

    const handlePressEnd = useCallback(() => {
        if (!isHoldingRef.current) return;
        isHoldingRef.current = false;

        if (chargeAnimRef.current) {
            cancelAnimationFrame(chargeAnimRef.current);
            chargeAnimRef.current = null;
        }

        const charge = chargeValueRef.current;
        const phase  = chargePhaseRef.current;

        if (charge > 4 && gameStateRef.current === 'playing') {
            const isInPeak = phase !== 'declining' && charge >= gameSettings.peakZoneMin;
            const rawPower = gameSettings.basePushPower * (charge / 100);
            const power    = isInPeak ? rawPower * gameSettings.peakPushMultiplier : rawPower;
            applyPush(power, 'player');
        }

        chargeValueRef.current = 0;
        chargePhaseRef.current = 'idle';
        setPlayerCharge(0);
        setChargePhase('idle');
    }, [gameSettings.peakZoneMin, gameSettings.basePushPower, gameSettings.peakPushMultiplier, applyPush]);

    // -----------------------------------------------------------------------
    // Opponent AI — charges visibly then releases
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (gameState !== 'playing') return;

        const scheduleNext = () => {
            const delay = gameSettings.opponentBaseInterval + (Math.random() * 800 - 400);
            opponentTimerRef.current = setTimeout(() => {
                if (gameStateRef.current !== 'playing') return;

                setIsOpponentCharging(true);
                let oppCharge = 0;

                opponentIntervalRef.current = window.setInterval(() => {
                    oppCharge = Math.min(100, oppCharge + gameSettings.opponentChargeRate);
                    setOpponentCharge(oppCharge);

                    // Release somewhere in the 80–100 range
                    if (oppCharge >= 80 + Math.random() * 20) {
                        if (opponentIntervalRef.current) {
                            window.clearInterval(opponentIntervalRef.current);
                            opponentIntervalRef.current = null;
                        }
                        setIsOpponentCharging(false);
                        setOpponentCharge(0);

                        if (gameStateRef.current === 'playing') {
                            const power = gameSettings.basePushPower * (oppCharge / 100) * gameSettings.opponentPushPower;
                            applyPush(power, 'opponent');
                            if (gameStateRef.current === 'playing') scheduleNext();
                        }
                    }
                }, 30);
            }, delay);
        };

        scheduleNext();

        return () => {
            if (opponentTimerRef.current)   clearTimeout(opponentTimerRef.current);
            if (opponentIntervalRef.current) window.clearInterval(opponentIntervalRef.current);
        };
    }, [gameState, gameSettings.opponentBaseInterval, gameSettings.basePushPower, applyPush]);

    // -----------------------------------------------------------------------
    // Countdown timer
    // -----------------------------------------------------------------------

    const startTimer = useCallback(() => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        const now = Date.now();
        endTimeRef.current = now + gameSettings.timeLimit * 1000;
        setTimeLeft(gameSettings.timeLimit);

        timerRef.current = window.setInterval(() => {
            if (endTimeRef.current === null) return;
            const remaining = Math.max(0, (endTimeRef.current - Date.now()) / 1000);
            setTimeLeft(remaining);

            if (remaining <= 0) {
                if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
                // Whoever has better position wins at time-up
                handleGameEndRef.current(contactPositionRef.current > 0.5);
            }
        }, 100);
    }, [gameSettings.timeLimit]);

    // -----------------------------------------------------------------------
    // Start / reset game
    // -----------------------------------------------------------------------

    const startGame = useCallback(() => {
        // Clear any running timers from a previous round
        if (timerRef.current)            { window.clearInterval(timerRef.current); timerRef.current = null; }
        if (opponentTimerRef.current)    { clearTimeout(opponentTimerRef.current); opponentTimerRef.current = null; }
        if (opponentIntervalRef.current) { window.clearInterval(opponentIntervalRef.current); opponentIntervalRef.current = null; }
        if (chargeAnimRef.current)       { cancelAnimationFrame(chargeAnimRef.current); chargeAnimRef.current = null; }

        isHoldingRef.current       = false;
        chargeValueRef.current     = 0;
        chargePhaseRef.current     = 'idle';
        contactPositionRef.current = 0.5;
        displayPositionRef.current = 0.5;
        gameEndedRef.current       = false;

        setDisplayPosition(0.5);
        setPlayerCharge(0);
        setOpponentCharge(0);
        setChargePhase('idle');
        setIsOpponentCharging(false);
        setFinalScore(0);
        setImpactParticles([]);
        setGameState('playing');

        startTimer();
    }, [startTimer]);

    // -----------------------------------------------------------------------
    // Cleanup on unmount
    // -----------------------------------------------------------------------

    useEffect(() => {
        return () => {
            if (timerRef.current)            window.clearInterval(timerRef.current);
            if (opponentTimerRef.current)    clearTimeout(opponentTimerRef.current);
            if (opponentIntervalRef.current) window.clearInterval(opponentIntervalRef.current);
            if (chargeAnimRef.current)       cancelAnimationFrame(chargeAnimRef.current);
            if (smoothingRef.current)        cancelAnimationFrame(smoothingRef.current);
        };
    }, []);

    // Particle cleanup
    useEffect(() => {
        const id = setInterval(() => {
            const now = Date.now();
            setImpactParticles(prev => prev.filter(p => now - p.timestamp < 850));
        }, 100);
        return () => clearInterval(id);
    }, []);

    // -----------------------------------------------------------------------
    // Derived layout values
    // -----------------------------------------------------------------------

    // displayPosition is a smoothed version of contactPosition used for all visuals.
    // contactPosition drives game logic (ring-out, score); displayPosition drives rendering.
    const contactXPercent   = displayPosition * 100;
    // offset = half of player width (20) + half of opponent width (17) = 18
    // keeps sprites just touching at the contact point
    const playerXPercent    = contactXPercent - 18;   // player sprite left-center
    const opponentXPercent  = contactXPercent + 18;   // opponent sprite left-center

    // Lean angle: losing spirit leans away from contact point
    const playerLean   = Math.min(15, (0.5 - displayPosition) * 40);  // leans right if losing
    const opponentLean = Math.min(15, (displayPosition - 0.5) * 40);  // leans left if losing

    // Compute player aura once so filter and transform can be split without calling twice
    const playerAuraStyle = getAuraStyle();
    const playerAuraScale = playerAuraStyle.transform ?? '';

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="w-full max-w-2xl mx-auto">

            {/* ---- Game Area ---- */}
            <div
                ref={gameAreaRef}
                className="relative w-full h-96 rounded-lg overflow-hidden select-none touch-none mb-4
                    cursor-pointer"
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }}
                onTouchEnd={(e)   => { e.preventDefault(); handlePressEnd(); }}
                onTouchCancel={(e) => { e.preventDefault(); handlePressEnd(); }}
            >
                {/* Background — sumo spirit ring */}
                <img
                    src="/challenges/wrestling-ring-background.png"
                    alt="Spirit wrestling ring"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable={false}
                />

                {/* Subtle edge danger zones */}
                <div
                    className="absolute top-0 left-0 h-full bg-blue-500/10 pointer-events-none transition-opacity duration-300"
                    style={{ width: '12%', opacity: displayPosition < 0.2 ? 0.7 : 0.15 }}
                />
                <div
                    className="absolute top-0 right-0 h-full bg-red-500/10 pointer-events-none transition-opacity duration-300"
                    style={{ width: '12%', opacity: displayPosition > 0.8 ? 0.7 : 0.15 }}
                />

                {/* Player spirit */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left:     `${playerXPercent}%`,
                        bottom:   '8%',
                        width:    '40%',
                        ...playerAuraStyle,
                        // always include translateX(-50%) and lean; append scale if aura provides one
                        transform: `translateX(-50%) rotate(${playerLean}deg)${playerAuraScale ? ` ${playerAuraScale}` : ''}`,
                    }}
                >
                    <img
                        src="/challenges/player-bear-sprite.png"
                        alt="Your spirit"
                        className="w-full h-auto"
                        draggable={false}
                    />
                </div>

                {/* Opponent spirit */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left:     `${opponentXPercent}%`,
                        bottom:   '8%',
                        width:    '34%',
                        ...getOpponentAuraStyle(),
                        // translateX(-50%) always applied so sprite stays centered on opponentXPercent;
                        // scale only when charging, lean always applied
                        transform: opponentCharge === 0
                            ? `translateX(-50%) rotate(${-opponentLean}deg)`
                            : `translateX(-50%) scale(${1 + (opponentCharge / 100) * 0.05}) rotate(${-opponentLean}deg)`,
                    }}
                >
                    <img
                        src="/challenges/opponent-wolf-sprite.png"
                        alt="Guardian spirit"
                        className="w-full h-auto"
                        draggable={false}
                    />
                </div>

                {/* Impact particles */}
                {impactParticles.map(particle => {
                    const age      = Date.now() - particle.timestamp;
                    const progress = Math.min(age / 850, 1);
                    const opacity  = Math.max(0, 1 - progress);
                    return (
                        <div
                            key={particle.id}
                            className={`absolute pointer-events-none rounded-full ${particle.color}`}
                            style={{
                                left:      `${particle.x}px`,
                                top:       `${particle.yPercent}%`,
                                width:     `${particle.size}px`,
                                height:    `${particle.size}px`,
                                opacity,
                                transform: `translate(-50%, -50%)
                                    translate(${particle.dirX * progress * progress}px,
                                              ${particle.dirY * progress * progress}px)`,
                            }}
                        />
                    );
                })}

                {/* ---- HUD elements ---- */}

                {/* Position bar — top of arena */}
                <div className="absolute top-3 left-4 right-4 h-2.5 bg-gray-900/70 rounded-full overflow-hidden border border-gray-600">
                    {/* Player (blue) fills from left as they gain ground */}
                    <div
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                        style={{ width: `${displayPosition * 100}%` }}
                    />
                    {/* Opponent (red) fills from right */}
                    <div
                        className="absolute top-0 right-0 h-full bg-red-500 rounded-full"
                        style={{ width: `${(1 - displayPosition) * 100}%` }}
                    />
                    {/* Center marker */}
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/50 -translate-x-px" />
                </div>

                {/* Opponent charge indicator — floats above opponent spirit */}
                {isOpponentCharging && (
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            left:      `${opponentXPercent}%`,
                            bottom:    '70%',
                            transform: 'translateX(-50%)',
                            width:     '80px',
                        }}
                    >
                        <div className="h-2 bg-gray-800/80 rounded-full overflow-hidden border border-red-800/50">
                            <div
                                className="h-full bg-red-500 transition-none"
                                style={{ width: `${opponentCharge}%` }}
                            />
                        </div>
                        <p className="text-red-300 text-xs text-center mt-0.5 font-bold tracking-wide">
                            CHARGING
                        </p>
                    </div>
                )}

                {/* Player charge bar — floats above player spirit */}
                {gameState === 'playing' && (
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            left:      `${playerXPercent}%`,
                            bottom:    '70%',
                            transform: 'translateX(-50%)',
                            width:     '88px',
                        }}
                    >
                        {/* Bar with peak zone highlight */}
                        <div className="relative h-3 bg-gray-900/80 rounded-full overflow-hidden border border-gray-600">
                            {/* Peak zone backdrop */}
                            <div
                                className="absolute top-0 h-full bg-yellow-400/25"
                                style={{
                                    left:  `${gameSettings.peakZoneMin}%`,
                                    width: `${gameSettings.peakZoneMax - gameSettings.peakZoneMin}%`,
                                }}
                            />
                            {/* Charge fill */}
                            <div
                                className={`h-full rounded-full transition-none ${
                                    inPeakZone
                                        ? 'bg-yellow-400'
                                        : chargePhase === 'declining'
                                        ? 'bg-orange-500'
                                        : 'bg-blue-400'
                                }`}
                                style={{
                                    width:     `${playerCharge}%`,
                                    boxShadow: inPeakZone ? '0 0 8px gold' : 'none',
                                }}
                            />
                        </div>

                        {/* Label */}
                        <p className={`text-xs text-center mt-0.5 font-bold tracking-wide ${
                            inPeakZone          ? 'text-yellow-300 animate-pulse'
                            : chargePhase === 'declining' ? 'text-orange-400'
                            : chargePhase === 'charging'  ? 'text-blue-300'
                            : 'text-transparent'
                        }`}>
                            {inPeakZone          ? 'RELEASE!'
                            : chargePhase === 'declining' ? 'TOO LATE'
                            : chargePhase === 'charging'  ? 'HOLD...'
                            : '\u00A0' /* nbsp keeps height stable */}
                        </p>
                    </div>
                )}

                {/* Instruction overlay when ready */}
                {gameState === 'ready' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <p className="text-white text-lg font-bold text-center px-4 leading-snug">
                            Hold to charge · Release at peak to push
                        </p>
                    </div>
                )}

            </div>

            {/* ---- Controls below game area (same pattern as original) ---- */}
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

export default TotemWrestlingChallenge;
