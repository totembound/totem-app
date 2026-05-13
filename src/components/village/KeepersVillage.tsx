import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Lock, Volume2, VolumeX } from 'lucide-react';
import AmbientFx from './AmbientFx';
import VillageWalker from './VillageWalker';
import { useVillageAmbience } from './useVillageAmbience';

// Ambient animation registry — positioned in stage % coords (so they stick to their
// building when the panorama side-scrolls). Tune via ?villageEdit=1 + screenshot iteration.
type FxType = 'smoke' | 'mist' | 'sparkle' | 'shimmer' | 'star';
const AMBIENT_EFFECTS: ReadonlyArray<{
  id: string;
  type: FxType;
  xPct: number;
  yPct: number;
  widthPct: number;
  aspectRatio?: number;
  speed?: number;
  opacity?: number;
  color?: string;
}> = [
  // Forge chimney smoke — positioned at the chimney top of the forge building.
  // Forge hotspot is at x:55-68%, y:54-84%; chimney is on the right side at the top.
  // Wrapper xPct/yPct is the CENTER of the smoke column; aspect 100/200=0.5 means
  // wrapper height = width × 2, so a small widthPct keeps the plume compact.
  { id: 'forge-smoke', type: 'smoke', xPct: 57.5, yPct: 42, widthPct: 3, speed: 1, opacity: 0.9, color: '#b6a4e1' },
  // Hearthstone campfire smoke — center-bottom firepit
  { id: 'hearthstone-smoke', type: 'smoke', xPct: 48.5, yPct: 80, widthPct: 4, speed: 0.85, opacity: 0.7, color: '#c8bccf' },
  // Ring-of-fire firepit smoke (the central stone-ring fire)
  { id: 'ringoffire-smoke', type: 'smoke', xPct: 49.5, yPct: 59, widthPct: 3, speed: 1.1, opacity: 0.7, color: '#c8bccf' },
  // Sanctuary blue mist (hovering above the temple)
  { id: 'sanctuary-mist', type: 'mist', xPct: 48, yPct: 18, widthPct: 14, opacity: 0.9, color: '#9ed4ff' },
  { id: 'sanctuary-stars', type: 'star', xPct: 50.3, yPct: 38, widthPct: 3, opacity: 0.95, color: '#9ed4ff' },
  // Shrine crystal sparkle
  { id: 'shrine-sparkle', type: 'sparkle', xPct: 14, yPct: 70, widthPct: 5, opacity: 0.9, color: '#ffc650' },
  // Elder Tower spire — purple twinkle cluster (4-point stars flashing on/off)
  // at the top of the tower. Tower hotspot is x:78-86%, y:6-48%; spire ~ y:10.
  { id: 'elder-tower-stars', type: 'star', xPct: 81.3, yPct: 18.5, widthPct: 3, opacity: 0.95, color: '#c890ff' },
  // Waterfall splash mist — small white spray bursts where water hits ledges.
  // Three estimated start positions; tune via ?villageEdit=1 (click the cyan/amber
  // pills to copy registry snippets) and paste the new x/y back here.
  { id: 'splash-top',    type: 'shimmer', xPct: 22, yPct: 59, widthPct: 3, opacity: 0.85, color: '#ffffff' },
  { id: 'splash-mid',    type: 'shimmer', xPct: 22.5, yPct: 73, widthPct: 4, opacity: 0.85, color: '#ffffff' },
  { id: 'splash-bottom', type: 'shimmer', xPct: 23.5, yPct: 93, widthPct: 4, opacity: 0.85, color: '#ffffff' },
  { id: 'splash-right',  type: 'shimmer', xPct: 77, yPct: 43, widthPct: 2, opacity: 0.85, color: '#ffffff' },
];

const WALKERS: ReadonlyArray<{
  id: string;
  pathYPct: number;
  startXPct: number;
  endXPct: number;
  widthPct: number;
  durationSec: number;
  delaySec: number;
  bobAmplitudePct?: number;
  color?: string;
}> = [
  { id: 'wander-left',  pathYPct: 90, startXPct: 6,  endXPct: 42, widthPct: 2.5, durationSec: 38, delaySec: 0,  bobAmplitudePct: 0.8, color: '#bfe9ff' },
  { id: 'wander-mid',   pathYPct: 92, startXPct: 30, endXPct: 70, widthPct: 2.5, durationSec: 44, delaySec: 7,  bobAmplitudePct: 1.0, color: '#d8c8ff' },
  { id: 'wander-right', pathYPct: 88, startXPct: 58, endXPct: 94, widthPct: 2.5, durationSec: 36, delaySec: 14, bobAmplitudePct: 0.8, color: '#ffe8a8' },
];

interface Building {
  id: string;
  name: string;
  hotspot: { x: number; y: number; width: number; height: number };
  labelAnchor: { x: number; y: number };
  badge?: number;
  locked?: boolean;
  lockMessage?: string;
}

// Coordinates derived from village-background.png (1672×468). Tuned by visual inspection
// against the painted panorama; refine in `?villageEdit=1` mode if needed.
const PLACEHOLDER_BUILDINGS: Building[] = [
  {
    id: 'library',
    name: 'Library',
    hotspot: { x: 8, y: 30, width: 10, height: 30 },
    labelAnchor: { x: 15, y: 29 },
  },
  {
    id: 'shrine',
    name: 'Shrine',
    hotspot: { x: 10, y: 62, width: 10, height: 30 },
    labelAnchor: { x: 16, y: 66 },
    badge: 2,
  },
  {
    id: 'hall-of-legends',
    name: 'Hall of Legends',
    hotspot: { x: 20, y: 12, width: 15, height: 38 },
    labelAnchor: { x: 28, y: 14 },
  },
  {
    id: 'bazaar',
    name: 'Bazaar',
    hotspot: { x: 28, y: 51, width: 15, height: 32 },
    labelAnchor: { x: 36, y: 52 },
  },
  {
    id: 'sanctuary',
    name: 'Sanctuary',
    hotspot: { x: 42, y: 16, width: 16, height: 34 },
    labelAnchor: { x: 53, y: 17 },
    badge: 3,
  },
  {
    id: 'hearthstone',
    name: 'Hearthstone',
    hotspot: { x: 43, y: 75, width: 12, height: 22 },
    labelAnchor: { x: 50, y: 82 },
  },
  {
    id: 'forge',
    name: 'Totem Forge',
    hotspot: { x: 55, y: 54, width: 13, height: 30 },
    labelAnchor: { x: 67, y: 64 },
    locked: true,
    lockMessage: 'Own 3 totems of the same rarity',
  },
  {
    id: 'elder-tower',
    name: 'Elder Tower',
    hotspot: { x: 78, y: 6, width: 8, height: 42 },
    labelAnchor: { x: 78, y: 20 },
    locked: true,
    lockMessage: 'Raise an Ascended totem',
  },
  {
    id: 'arena',
    name: 'Arena',
    hotspot: { x: 62, y: 28, width: 12, height: 26 },
    labelAnchor: { x: 69, y: 32 },
    badge: 1,
  },
  {
    id: 'trailhead',
    name: 'Trailhead',
    hotspot: { x: 83, y: 52, width: 9, height: 30 },
    labelAnchor: { x: 88, y: 56 },
  },
];

const KeepersVillage: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [nearest, setNearest] = useState<string>(PLACEHOLDER_BUILDINGS[0].id);
  const [wrapperHeight, setWrapperHeight] = useState<number>(468);

  // Village ambient audio — single looping track, starts on first interaction
  // with the scroller (autoplay policy), pauses on unmount (route change).
  // Synthesized via tools/generate-village-ambient.py (run that script to
  // regenerate). Replace with a CC0 mp3/ogg if you have a preferred track —
  // just drop it at /public/sounds/village/ambient.{wav,mp3,ogg} and update.
  const { muted: ambienceMuted, toggleMute: toggleAmbienceMute } = useVillageAmbience({
    src: '/sounds/village/ambient.wav',
    gestureTarget: scrollerRef,
    volume: 0.25,
  });

  // Default center on first load — the geographic middle of the panorama.
  // Tweak this 0–100 to bias the initial view (0 = far left of village, 100 = far right).
  const INITIAL_CENTER_PCT = 50;
  const initialScrolledRef = useRef(false);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const scroller = scrollerRef.current;
    if (!stage || !scroller) return;

    // Disable browser scroll restoration so reloads don't snap us back to scrollLeft=0.
    const prevRestoration = 'scrollRestoration' in history ? history.scrollRestoration : null;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    const tryCenter = () => {
      if (initialScrolledRef.current) return;
      if (stage.offsetWidth < 100 || scroller.clientWidth < 100) return;
      // The stage must actually overflow the scroller — otherwise there's nothing to center.
      // (On first paint the wrapper is at its default 468 height and the stage is narrower
      // than the viewport, so we need to wait for the height-update re-render to hit.)
      if (scroller.scrollWidth <= scroller.clientWidth + 1) return;
      const targetX = (INITIAL_CENTER_PCT / 100) * stage.offsetWidth - scroller.clientWidth / 2;
      scroller.scrollLeft = Math.max(0, targetX);
      initialScrolledRef.current = true;
    };

    tryCenter();
    // Retry across several frames — beats browser scroll restoration and waits for stage
    // width to settle (depends on async wrapper-height updates, image decode, font load).
    const timers = [0, 16, 50, 120, 250, 500].map((ms) => window.setTimeout(tryCenter, ms));
    const ro = new ResizeObserver(tryCenter);
    ro.observe(stage);
    ro.observe(scroller);

    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
      if (prevRestoration && 'scrollRestoration' in history) {
        history.scrollRestoration = prevRestoration;
      }
    };
  }, []);

  // Size the whole village wrapper to exactly fill the viewport between sticky header and bottom chrome.
  // The scroller inside uses flex-1 to claim all space title/hint don't need — no vertical page scroll.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Strip <main>'s mobile pb-24 on this route. The wrapper already reserves space for the
    // fixed bottom nav, so the extra 96px would just push the page beyond viewport. Inline
    // style trumps Tailwind class, so React re-renders won't undo this.
    const main = document.querySelector('main') as HTMLElement | null;
    const origPb = main?.style.paddingBottom ?? '';
    if (main) main.style.paddingBottom = '0';

    const update = () => {
      const top = wrapper.getBoundingClientRect().top;
      const viewportH = window.innerHeight;
      // Bottom chrome above the wrapper bottom — measure the fixed mobile bottom nav directly
      // so the panorama hugs its top edge precisely (no slate gap, no clip behind it).
      let bottomReserve = 40; // desktop footer band default
      if (window.innerWidth < 640) {
        const mobileNav = Array.from(document.querySelectorAll('div, nav')).find((el) => {
          const cs = getComputedStyle(el as HTMLElement);
          const h = (el as HTMLElement).offsetHeight;
          return cs.position === 'fixed' && parseFloat(cs.bottom) === 0 && h > 30 && h < 120;
        }) as HTMLElement | undefined;
        bottomReserve = mobileNav?.offsetHeight ?? 64;
      }
      const available = viewportH - top - bottomReserve;
      // Floor at native panorama height (468) so the image isn't squished on small viewports.
      // Above that, let it grow to fill the available space.
      setWrapperHeight(Math.max(468, available));
    };
    const onResize = () => requestAnimationFrame(update);

    // Initial measure runs synchronously, but on first paint sticky/flex chrome may not have
    // settled — re-measure on the next two frames and once after fonts load to catch shifts.
    update();
    const f1 = requestAnimationFrame(update);
    const f2 = requestAnimationFrame(() => requestAnimationFrame(update));
    document.fonts?.ready.then(update).catch(() => undefined);

    // Watch the parent (mainChild) for height changes — fires whenever surrounding chrome shifts.
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    if (wrapper.parentElement) ro.observe(wrapper.parentElement);
    ro.observe(document.documentElement);

    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(f1);
      cancelAnimationFrame(f2);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      if (main) main.style.paddingBottom = origPb;
    };
  }, []);

  const editMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params) {
      if (key.toLowerCase() === 'villageedit' && value === '1') return true;
    }
    return false;
  }, []);

  // Buildings sorted by horizontal position — used by arrow-key nav.
  const sortedByX = useMemo(
    () => [...PLACEHOLDER_BUILDINGS].sort((a, b) => a.labelAnchor.x - b.labelAnchor.x),
    []
  );

  const scrollToBuilding = (b: Building) => {
    const scroller = scrollerRef.current;
    const stage = stageRef.current;
    if (!scroller || !stage) return;
    // labelAnchor.x is a % of stage width; center that point in the viewport.
    const targetX = (b.labelAnchor.x / 100) * stage.offsetWidth - scroller.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(0, targetX), behavior: 'smooth' });
  };

  const stepBuilding = (dir: -1 | 1) => {
    const idx = sortedByX.findIndex((b) => b.id === nearest);
    const next = sortedByX[Math.max(0, Math.min(sortedByX.length - 1, idx + dir))];
    if (next) {
      scrollToBuilding(next);
    }
  };

  // Keyboard pan — jump by ~80% of the visible viewport (smooth scroll).
  // Independent of building positions so each press feels substantial relative to screen width.
  const panByViewport = (dir: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const delta = dir * scroller.clientWidth * 0.8;
    scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior: 'smooth' });
  };

  // Edge buildings can't be physically centered in the viewport (the scroll position clamps),
  // so the auto-update from the scroll listener won't pick them as "nearest." When the user taps
  // a hotspot we set nearest explicitly and lock auto-updates briefly so the smooth-scroll
  // settling doesn't override the choice.
  const tapLockUntilRef = useRef(0);

  const handleHotspotTap = (b: Building) => {
    setNearest(b.id);
    tapLockUntilRef.current = Date.now() + 600;
    scrollToBuilding(b);
  };

  // Keyboard arrows — step to previous / next building.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack arrows if focus is in a form field.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        panByViewport(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        panByViewport(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearest]);

  // Mouse drag-to-pan (desktop). Touch uses native scroll-snap; we skip touch pointers.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let dragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let dragDistance = 0;
    let suppressNextClick = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startScrollLeft = scroller.scrollLeft;
      dragDistance = 0;
      scroller.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      dragDistance = Math.max(dragDistance, Math.abs(dx));
      scroller.scrollLeft = startScrollLeft - dx;
    };
    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      scroller.style.cursor = 'grab';
      if (dragDistance > 5) suppressNextClick = true;
    };
    const onClickCapture = (e: MouseEvent) => {
      if (suppressNextClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressNextClick = false;
      }
    };

    scroller.style.cursor = 'grab';
    scroller.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    scroller.addEventListener('click', onClickCapture, { capture: true });
    return () => {
      scroller.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      scroller.removeEventListener('click', onClickCapture, { capture: true });
    };
  }, []);

  // Track which building is closest to the scroller's centerline (for the "now viewing" pill).
  useEffect(() => {
    const scroller = scrollerRef.current;
    const stage = stageRef.current;
    if (!scroller || !stage) return;
    let frame = 0;
    const update = () => {
      // Honor an active tap-lock — the user explicitly picked a building, don't override it.
      if (Date.now() < tapLockUntilRef.current) return;
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let bestId = PLACEHOLDER_BUILDINGS[0].id;
      let bestDist = Infinity;
      for (const b of PLACEHOLDER_BUILDINGS) {
        const x = (b.labelAnchor.x / 100) * stage.offsetWidth;
        const d = Math.abs(x - center);
        if (d < bestDist) {
          bestDist = d;
          bestId = b.id;
        }
      }
      setNearest(bestId);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="text-white bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-t border-amber-500/30 relative flex flex-col -mt-2 -mb-2 sm:-mt-3 sm:-mb-3"
      style={{
        // Break out of MainLayout's max-w-screen-xl + padding so the dark backdrop covers
        // the full viewport edge-to-edge. Vertical -m matches MainLayout's py-2/py-3.
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
        height: wrapperHeight,
      }}
    >
      {/* Mobile bottom-gap filler — covers main's pb-24 zone so GameBackground doesn't bleed
          through between wrapper and the fixed mobile nav. Hidden on desktop where pb-24 is 0. */}
      <div
        aria-hidden
        className="sm:hidden absolute left-0 right-0 bg-slate-950 pointer-events-none"
        style={{ top: '100%', height: '120px' }}
      />
      {/* Title row — gutters match the global header (px-2 sm:px-4) so the
          mini-map's right edge aligns with the header's right-most controls. */}
      <div className="shrink-0 w-full max-w-screen-xl mx-auto px-2 sm:px-4 py-2 flex items-center gap-3">
        <h1 className="text-lg sm:text-xl font-bold shrink-0">Keeper&rsquo;s Village</h1>
        <button
          type="button"
          onClick={toggleAmbienceMute}
          aria-pressed={!ambienceMuted}
          aria-label={ambienceMuted ? 'Unmute village ambience' : 'Mute village ambience'}
          title={ambienceMuted ? 'Unmute village ambience' : 'Mute village ambience'}
          className="ml-auto shrink-0 h-7 w-7 md:h-8 md:w-8 flex items-center justify-center rounded bg-slate-800/70 border border-amber-400/40 text-amber-200 hover:text-amber-100 hover:bg-slate-700/80 hover:border-amber-400/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {ambienceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <MiniMap scrollerRef={scrollerRef} stageRef={stageRef} />
        {editMode && (
          <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-xs font-bold">
            EDIT MODE
          </span>
        )}
      </div>

      {/* Scroller — fills remaining vertical space inside the wrapper */}
      <div
        ref={scrollerRef}
        className="village-scroller relative flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden sm:snap-x sm:snap-proximity shadow-xl"
        style={{
          scrollbarWidth: 'none',
          touchAction: 'pan-x',
          overscrollBehaviorX: 'contain',
        }}
      >
        {/* Stage — h-full + aspect-ratio means width = height × 3.57 (panorama natural ratio) */}
        <div
          ref={stageRef}
          className="village-stage relative h-full"
          style={{ aspectRatio: '1672/468' }}
        >
          {/* Panorama */}
          <img
            src="/village-background.png"
            alt="Spirit Village"
            className="block h-full w-full object-cover select-none"
            draggable={false}
          />

          {/* Ambient animations — anchored in stage % coords so they side-scroll with the village */}
          {AMBIENT_EFFECTS.map((fx) => (
            <AmbientFx
              key={fx.id}
              type={fx.type}
              xPct={fx.xPct}
              yPct={fx.yPct}
              widthPct={fx.widthPct}
              aspectRatio={fx.aspectRatio}
              opacity={fx.opacity}
              speed={fx.speed}
              color={fx.color}
            />
          ))}

          {/* Wandering spirits — distributed across the full panorama so there's
              always activity in view regardless of scroll position */}
          {WALKERS.map((w) => (
            <VillageWalker
              key={w.id}
              pathYPct={w.pathYPct}
              startXPct={w.startXPct}
              endXPct={w.endXPct}
              widthPct={w.widthPct}
              durationSec={w.durationSec}
              delaySec={w.delaySec}
              bobAmplitudePct={w.bobAmplitudePct}
              color={w.color}
            />
          ))}

          {/* Edit-mode HUD — shows id + position next to each ambient effect / walker
              so the user can read coordinates directly off the artwork. Each label
              is clickable: tap it to log the registry line you'd paste back. */}
          {editMode && (
            <>
              {AMBIENT_EFFECTS.map((fx) => (
                <FxHudLabel
                  key={`hud-${fx.id}`}
                  id={fx.id}
                  xPct={fx.xPct}
                  yPct={fx.yPct}
                  widthPct={fx.widthPct}
                  color="amber"
                  detail={`w:${fx.widthPct}`}
                />
              ))}
              {WALKERS.map((w) => (
                <FxHudLabel
                  key={`hud-${w.id}`}
                  id={w.id}
                  xPct={(w.startXPct + w.endXPct) / 2}
                  yPct={w.pathYPct}
                  widthPct={w.widthPct}
                  color="cyan"
                  detail={`y:${w.pathYPct} x:${w.startXPct}–${w.endXPct}`}
                />
              ))}
            </>
          )}

          {/* Snap targets — one per building, centered on labelAnchor.x */}
          {PLACEHOLDER_BUILDINGS.map((b) => (
            <div
              key={`snap-${b.id}`}
              className="absolute top-0 h-full w-px snap-center pointer-events-none"
              style={{ left: `${b.labelAnchor.x}%` }}
            />
          ))}

          {/* Optional grid overlay (edit mode) */}
          {editMode && <GridOverlay />}

          {/* Building hotspots */}
          {PLACEHOLDER_BUILDINGS.map((b) => (
            <button
              key={b.id}
              onClick={(e) => {
                e.stopPropagation();
                handleHotspotTap(b);
              }}
              aria-label={b.name + (b.locked ? ' (locked)' : '')}
              className={`absolute focus:outline-none ${
                editMode ? 'border border-dashed border-amber-400/70 bg-amber-400/10' : 'bg-transparent'
              }`}
              style={{
                left: `${b.hotspot.x}%`,
                top: `${b.hotspot.y}%`,
                width: `${b.hotspot.width}%`,
                height: `${b.hotspot.height}%`,
              }}
            />
          ))}

          {/* Labels */}
          {PLACEHOLDER_BUILDINGS.map((b) => (
            <BuildingLabel
              key={`label-${b.id}`}
              building={b}
              isNearest={nearest === b.id}
              onClick={() => {
                // eslint-disable-next-line no-console
                console.log('label tap:', b.id, '→ would navigate / open modal');
              }}
            />
          ))}
        </div>
      </div>

    </div>
  );
};

interface MiniMapProps {
  scrollerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<HTMLDivElement>;
}

const MiniMap: React.FC<MiniMapProps> = ({ scrollerRef, stageRef }) => {
  const [vp, setVp] = useState({ left: 0, right: 100 });
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const stage = stageRef.current;
    if (!scroller || !stage) return;
    let frame = 0;
    const update = () => {
      const total = stage.offsetWidth;
      if (total <= 0) return;
      const left = (scroller.scrollLeft / total) * 100;
      const right = ((scroller.scrollLeft + scroller.clientWidth) / total) * 100;
      setVp({ left, right: Math.min(100, right) });
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(scroller);
    ro.observe(stage);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [scrollerRef, stageRef]);

  // Click anywhere on the map → scroll the scroller so that point becomes the new center.
  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const scroller = scrollerRef.current;
    const stage = stageRef.current;
    const map = mapRef.current;
    if (!scroller || !stage || !map) return;
    const rect = map.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const targetX = pct * stage.offsetWidth - scroller.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(0, targetX), behavior: 'smooth' });
  };

  return (
    <div
      ref={mapRef}
      onClick={handleClick}
      className="block w-[180px] sm:w-[280px] md:w-[360px] cursor-pointer relative h-7 md:h-8 overflow-hidden rounded border border-amber-400/40 shadow-md hover:border-amber-400/80 transition-colors"
      title="Click to jump to that part of the village"
    >
      <img
        src="/village-background.png"
        alt=""
        className="block w-full h-full object-cover select-none pointer-events-none"
        draggable={false}
      />
      {/* Dark mask on what is NOT visible */}
      <div
        className="absolute top-0 bottom-0 left-0 bg-black/70 pointer-events-none"
        style={{ width: `${vp.left}%` }}
      />
      <div
        className="absolute top-0 bottom-0 right-0 bg-black/70 pointer-events-none"
        style={{ width: `${100 - vp.right}%` }}
      />
      {/* Bright frame around the visible window */}
      <div
        className="absolute top-0 bottom-0 border-2 border-amber-400 pointer-events-none"
        style={{ left: `${vp.left}%`, width: `${Math.max(0, vp.right - vp.left)}%` }}
      />
    </div>
  );
};

interface LabelProps {
  building: Building;
  isNearest: boolean;
  onClick: () => void;
}

const BuildingLabel: React.FC<LabelProps> = ({ building, isNearest, onClick }) => {
  const count = building.badge ?? 0;
  const showBubble = building.locked || count > 0;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-full
                 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded
                 transition-transform duration-200"
      style={{
        left: `${building.labelAnchor.x}%`,
        top: `${building.labelAnchor.y}%`,
        transform: `translate(-50%, -100%) ${isNearest ? 'scale(1.1)' : 'scale(1)'}`,
      }}
      aria-label={
        building.locked
          ? `${building.name} (locked: ${building.lockMessage})`
          : count > 0
            ? `${building.name}, ${count} ready`
            : building.name
      }
    >
      {showBubble && (
        <span
          className={`min-w-[28px] h-7 px-2 rounded-full text-sm font-bold flex items-center justify-center shadow-md ${
            building.locked
              ? 'bg-slate-800/90 text-amber-300 border border-amber-400/30'
              : 'bg-amber-500 text-black animate-pulse'
          }`}
        >
          {building.locked ? <Lock className="w-4 h-4" /> : count}
        </span>
      )}
      <span
        className={`text-sm sm:text-base font-semibold mt-1 px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap ${
          isNearest ? 'bg-amber-500/90 text-black' : 'bg-black/40 text-white'
        }`}
      >
        {building.name}
      </span>
    </button>
  );
};

interface FxHudLabelProps {
  id: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  color: 'amber' | 'cyan';
  detail: string;
}

// Small floating label rendered next to each ambient effect / walker in
// edit mode. Crosshair marks the exact center; pill shows id + xPct/yPct.
// Clicking the pill copies the registry line to clipboard.
const FxHudLabel: React.FC<FxHudLabelProps> = ({ id, xPct, yPct, widthPct, color, detail }) => {
  const ringColor = color === 'amber' ? 'border-amber-400' : 'border-cyan-300';
  const pillBg = color === 'amber' ? 'bg-amber-500/95 text-black' : 'bg-cyan-400/95 text-black';

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const line = `{ id: '${id}', xPct: ${xPct}, yPct: ${yPct}, widthPct: ${widthPct} }`;
    void navigator.clipboard?.writeText(line);
    // eslint-disable-next-line no-console
    console.log('[village hud] copied:', line);
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -50%)' }}
    >
      {/* Crosshair: 12px ring + tiny center dot at exact (xPct, yPct) */}
      <div
        className={`relative w-3 h-3 rounded-full border-2 ${ringColor} bg-black/30 shadow-[0_0_0_1px_rgba(0,0,0,0.6)]`}
      >
        <span className="absolute inset-1 rounded-full bg-white/90" />
      </div>
      {/* Pill — clickable, copies the registry line to clipboard */}
      <button
        onClick={onClick}
        className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded text-[10px] leading-tight font-mono whitespace-nowrap shadow-md ${pillBg} hover:brightness-110`}
        title={`Click to copy registry snippet for ${id}`}
      >
        {id} <span className="opacity-70">x:{xPct} y:{yPct}</span>
        {detail && <span className="opacity-70 ml-1">· {detail}</span>}
      </button>
    </div>
  );
};

const GridOverlay: React.FC = () => (
  <div className="pointer-events-none absolute inset-0">
    {Array.from({ length: 9 }).map((_, i) => (
      <div
        key={`v${i}`}
        className="absolute top-0 bottom-0 border-l border-amber-400/20"
        style={{ left: `${(i + 1) * 10}%` }}
      />
    ))}
    {Array.from({ length: 9 }).map((_, i) => (
      <div
        key={`h${i}`}
        className="absolute left-0 right-0 border-t border-amber-400/20"
        style={{ top: `${(i + 1) * 10}%` }}
      />
    ))}
  </div>
);

export default KeepersVillage;
