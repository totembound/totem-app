import { useEffect, useRef, useState } from 'react';

interface VillageWalkerProps {
  /** Y baseline 0-100 where the walker sits */
  pathYPct: number;
  /** Left bound of horizontal travel, 0-100 */
  startXPct: number;
  /** Right bound of horizontal travel, 0-100 */
  endXPct: number;
  /** Sprite width as % of parent stage */
  widthPct: number;
  /** Aspect ratio width/height (default 1) */
  aspectRatio?: number;
  /** Full one-way traverse time in seconds (default 30) */
  durationSec?: number;
  /** Initial start delay in seconds (default 0) — staggers multiple walkers */
  delaySec?: number;
  /** Flip horizontally when moving right→left (default true) */
  mirrorOnReverse?: boolean;
  /** Bob amplitude in % of parent height (default 0 — sprite owns its own bob) */
  bobAmplitudePct?: number;
  /** Tint of the orb (CSS color) — default cyan-white */
  color?: string;
  /** Seconds to drift back to the patrol path after release (default 4.0) */
  returnSec?: number;
  /** How many full revolutions during the return spiral (default 2.5) */
  returnSpiralTurns?: number;
  /** Initial spiral radius — applied to x as % stage width and y as % stage height
   *  (separate to compensate for the panoramic aspect; same value would render
   *  visibly elongated). Defaults give a small comfortable orbit. */
  returnSpiralAmpXPct?: number;
  returnSpiralAmpYPct?: number;
}

type WalkerState = 'idle' | 'grabbed' | 'returning';

// Cubic ease-out: starts fast, settles slowly. Used for the return-to-path glide.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const VillageWalker: React.FC<VillageWalkerProps> = ({
  pathYPct,
  startXPct,
  endXPct,
  widthPct,
  aspectRatio = 1,
  durationSec = 30,
  delaySec = 0,
  mirrorOnReverse = true,
  bobAmplitudePct = 0,
  color = '#bfe9ff',
  returnSec = 4.0,
  returnSpiralTurns = 2.5,
  returnSpiralAmpXPct = 4,
  returnSpiralAmpYPct = 8,
}) => {
  const [reduced, setReduced] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  // State machine and ancillary data live in refs so we don't re-render every frame.
  const stateRef = useRef<WalkerState>('idle');
  const grabbedXPctRef = useRef(0);
  const grabbedYPctRef = useRef(0);
  const releaseXPctRef = useRef(0);
  const releaseYPctRef = useRef(0);
  const releaseAtMsRef = useRef(0);
  const dirRef = useRef<1 | -1>(1);

  // Track elapsed time for the patrol clock. The clock keeps running during
  // grab/return so when we hand control back to idle, the walker resumes at
  // "where it would be now" rather than where it was when grabbed.
  const startedAtMsRef = useRef<number | null>(null);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = elRef.current;
    if (!el) return;

    /** What % position the patrol logic dictates at this absolute timestamp. */
    const patrolPos = (nowMs: number): { x: number; y: number; dir: 1 | -1 } => {
      if (startedAtMsRef.current === null) {
        startedAtMsRef.current = nowMs + delaySec * 1000;
      }
      const elapsed = (nowMs - startedAtMsRef.current) / 1000;
      if (elapsed < 0) return { x: startXPct, y: pathYPct, dir: 1 };
      const period = durationSec * 2;
      const phase = ((elapsed % period) + period) % period;
      const t = phase < durationSec ? phase / durationSec : 1 - (phase - durationSec) / durationSec;
      const x = startXPct + (endXPct - startXPct) * t;
      const goingForward = phase < durationSec;
      const dir = mirrorOnReverse && !goingForward ? -1 : 1;
      let y = pathYPct;
      if (bobAmplitudePct > 0) {
        y += Math.sin(elapsed * 2.4) * bobAmplitudePct;
      }
      return { x, y, dir: dir as 1 | -1 };
    };

    let frame = 0;
    const tick = (now: number) => {
      const state = stateRef.current;
      if (state === 'idle') {
        const p = patrolPos(now);
        dirRef.current = p.dir;
        el.style.left = `${p.x}%`;
        el.style.top = `${p.y}%`;
        el.style.transform = `translate(-50%, -50%) scaleX(${p.dir})`;
      } else if (state === 'grabbed') {
        // Position is set by pointermove; we just keep the patrol clock ticking
        // by consulting it (no-op aside from initialization on first frame).
        patrolPos(now);
        el.style.left = `${grabbedXPctRef.current}%`;
        el.style.top = `${grabbedYPctRef.current}%`;
        // Slight scale-up while grabbed; direction is locked to whatever it
        // was at grab-time so the sprite doesn't flip mid-drag.
        el.style.transform = `translate(-50%, -50%) scaleX(${dirRef.current}) scale(1.18)`;
      } else if (state === 'returning') {
        const live = patrolPos(now);
        const elapsed = (now - releaseAtMsRef.current) / 1000;
        const tNorm = clamp(elapsed / returnSec, 0, 1);
        const k = easeOut(tNorm);
        // Linear-eased progress along the line from release → live patrol pos.
        const linX = releaseXPctRef.current + (live.x - releaseXPctRef.current) * k;
        const linY = releaseYPctRef.current + (live.y - releaseYPctRef.current) * k;
        // Spiral: orbit the moving "linear" position with a radius that
        // shrinks to 0 by the end. Two amplitudes (X uses % of stage width,
        // Y uses % of stage height) so the orbit reads as a circle on the
        // panoramic aspect rather than a flat horizontal line.
        const phase = tNorm * returnSpiralTurns * 2 * Math.PI;
        const radius = 1 - tNorm; // linear shrink so the final approach is exact
        const sx = Math.cos(phase) * radius * returnSpiralAmpXPct;
        const sy = Math.sin(phase) * radius * returnSpiralAmpYPct;
        const x = linX + sx;
        const y = linY + sy;
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        el.style.transform = `translate(-50%, -50%) scaleX(${dirRef.current})`;
        if (tNorm >= 1) {
          stateRef.current = 'idle';
          el.style.cursor = 'grab';
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [
    reduced,
    startXPct,
    endXPct,
    pathYPct,
    durationSec,
    delaySec,
    mirrorOnReverse,
    bobAmplitudePct,
    returnSec,
    returnSpiralTurns,
    returnSpiralAmpXPct,
    returnSpiralAmpYPct,
  ]);

  // Pointer drag handlers — wired separately so they only attach once and
  // don't re-fire on prop changes.
  useEffect(() => {
    if (reduced) return;
    const el = elRef.current;
    if (!el) return;

    /** Convert client coords → stage % coords. Stage is the nearest .village-stage. */
    const toStagePct = (clientX: number, clientY: number) => {
      const stage = el.closest('.village-stage') as HTMLElement | null;
      if (!stage) return { x: 50, y: 50 };
      const r = stage.getBoundingClientRect();
      // Account for any scale on the stage (KeepersVillage scales up to 1.03
      // when a building is focused). getBoundingClientRect returns the post-
      // transform rect, so dividing by r.width directly gives correct % coords.
      const xPct = ((clientX - r.left) / r.width) * 100;
      const yPct = ((clientY - r.top) / r.height) * 100;
      return { x: clamp(xPct, 0, 100), y: clamp(yPct, 0, 100) };
    };

    // Long-press window for touch input. If the finger holds within this
    // many pixels of the start point for this duration, we activate the grab.
    // Mouse pointers skip the long-press entirely (immediate grab).
    const LONG_PRESS_MS = 380;
    const LONG_PRESS_SLOP_PX = 8;

    let longPressTimer: number | null = null;
    let pendingPointerId: number | null = null;
    let pendingStartX = 0;
    let pendingStartY = 0;
    let pendingType: string = 'mouse';

    const cancelPending = () => {
      if (longPressTimer !== null) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      pendingPointerId = null;
      el.style.cursor = 'grab';
    };

    const activateGrab = (clientX: number, clientY: number, pointerId: number) => {
      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* element may have been removed; ignore */
      }
      const p = toStagePct(clientX, clientY);
      grabbedXPctRef.current = p.x;
      grabbedYPctRef.current = p.y;
      stateRef.current = 'grabbed';
      el.style.cursor = 'grabbing';
    };

    const onPointerDown = (e: PointerEvent) => {
      pendingPointerId = e.pointerId;
      pendingStartX = e.clientX;
      pendingStartY = e.clientY;
      pendingType = e.pointerType;

      if (e.pointerType === 'mouse') {
        // Mouse: immediate grab, stop the village drag-pan from claiming it.
        e.stopPropagation();
        e.preventDefault();
        activateGrab(e.clientX, e.clientY, e.pointerId);
      } else {
        // Touch / pen: arm a long-press timer. We do NOT stopPropagation or
        // preventDefault yet — that lets the village's native horizontal pan
        // run if the user starts swiping before the timer fires.
        if (longPressTimer !== null) clearTimeout(longPressTimer);
        longPressTimer = window.setTimeout(() => {
          // Long-press completed without enough movement → activate.
          longPressTimer = null;
          if (pendingPointerId !== null) {
            activateGrab(pendingStartX, pendingStartY, pendingPointerId);
          }
        }, LONG_PRESS_MS);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (stateRef.current === 'grabbed') {
        e.stopPropagation();
        const p = toStagePct(e.clientX, e.clientY);
        grabbedXPctRef.current = p.x;
        grabbedYPctRef.current = p.y;
        return;
      }
      // Pending long-press: if the finger moves outside the slop radius,
      // cancel and let the village pan naturally.
      if (longPressTimer !== null && pendingPointerId === e.pointerId) {
        const dx = e.clientX - pendingStartX;
        const dy = e.clientY - pendingStartY;
        if (dx * dx + dy * dy > LONG_PRESS_SLOP_PX * LONG_PRESS_SLOP_PX) {
          cancelPending();
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (stateRef.current === 'grabbed') {
        e.stopPropagation();
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* capture may have already been released */
        }
        releaseXPctRef.current = grabbedXPctRef.current;
        releaseYPctRef.current = grabbedYPctRef.current;
        releaseAtMsRef.current = performance.now();
        stateRef.current = 'returning';
        el.style.cursor = 'grab';
        return;
      }
      // Released before long-press completed → cancel quietly. The user
      // either tapped briefly (no-op) or began a pan that the village
      // scroller is already handling.
      if (pendingPointerId === e.pointerId) cancelPending();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      cancelPending();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      ref={elRef}
      style={{
        position: 'absolute',
        left: `${startXPct}%`,
        top: `${pathYPct}%`,
        width: `${widthPct}%`,
        aspectRatio: String(aspectRatio),
        transform: 'translate(-50%, -50%)',
        // Walker IS interactive — captures pointers for drag.
        pointerEvents: 'auto',
        // Allow native horizontal pan so finger-on-walker doesn't trap the
        // village scroll; mouse drags grab immediately, touch requires a
        // ~380ms long-press before grabbing.
        touchAction: 'pan-x',
        cursor: 'grab',
        willChange: 'left, top, transform',
        // Stack above the building hotspots (which render later in DOM order
        // and so otherwise win pointer hits when a walker passes over them).
        // Building labels and edit-mode HUD pills use higher values; this is
        // just enough to clear hotspot buttons.
        zIndex: 15,
      }}
    >
      <svg viewBox="0 0 80 80" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <radialGradient id="walkerHaloGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="60%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Halo */}
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="url(#walkerHaloGrad)"
          style={{
            animation: 'village-walker-halo 2.4s ease-in-out infinite',
            transformBox: 'fill-box',
            transformOrigin: 'center',
          }}
        />
        {/* Core */}
        <circle
          cx="40"
          cy="40"
          r="9"
          fill="#fbffff"
          style={{
            animation: 'village-walker-core 1.6s ease-in-out infinite',
            transformBox: 'fill-box',
            transformOrigin: 'center',
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
        {/* Trail */}
        <ellipse cx="38" cy="50" rx="6" ry="3" fill={color} opacity="0.45" />
      </svg>
    </div>
  );
};

export default VillageWalker;
