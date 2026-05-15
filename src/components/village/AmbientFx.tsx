import { useEffect, useId, useState } from 'react';
import { useAtmosphere } from './atmosphere';

type FxType = 'smoke' | 'mist' | 'sparkle' | 'shimmer' | 'star';

interface AmbientFxProps {
  /** Effect id from the AMBIENT_EFFECTS registry. Used by atmosphere.keepFxActive
   *  to opt this effect out of pause when its building's modal is open. */
  id?: string;
  type: FxType;
  /** Position center, % of parent stage */
  xPct: number;
  yPct: number;
  /** Visual size as % of parent stage width */
  widthPct: number;
  /** Aspect ratio width/height. Defaults vary per type. */
  aspectRatio?: number;
  opacity?: number;
  /** Tint color (CSS) — overrides default per type */
  color?: string;
  /** Animation speed multiplier (default 1) */
  speed?: number;
  className?: string;
}

const DEFAULTS: Record<FxType, { aspect: number; color: string }> = {
  smoke: { aspect: 100 / 200, color: '#a999d8' },
  mist: { aspect: 320 / 140, color: '#9ed4ff' },
  sparkle: { aspect: 1, color: '#ffc650' },
  // 'shimmer' is now repurposed as a waterfall-splash mist (small white burst).
  shimmer: { aspect: 100 / 80, color: '#eaf6ff' },
  // 'star' is a 4-point twinkle cluster — for tower tops, wand tips, etc.
  star: { aspect: 1, color: '#c890ff' },
};

const AmbientFx: React.FC<AmbientFxProps> = ({
  id,
  type,
  xPct,
  yPct,
  widthPct,
  aspectRatio,
  opacity = 1,
  color,
  speed = 1,
  className,
}) => {
  const [reduced, setReduced] = useState(false);
  const uid = useId().replace(/:/g, ''); // colons are invalid in SVG IDs
  const { current: atmosphere } = useAtmosphere();
  const keepActive = !!(id && atmosphere?.keepFxActive?.includes(id));
  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  if (reduced) return null;

  const fxColor = color ?? DEFAULTS[type].color;
  const aspect = aspectRatio ?? DEFAULTS[type].aspect;

  // Per-type animation duration: speed scales it (lower duration = faster)
  const dur = (base: number) => `${(base / speed).toFixed(2)}s`;

  let body: React.ReactElement;
  switch (type) {
    case 'smoke': {
      // 100×200 viewBox; 6 puffs of varied sizes / start positions, distorted by
      // feTurbulence to break up the circle silhouettes into wisps.
      const filterId = `smokeFilter-${uid}`;
      // Each puff: { r, cx, delay, anim } — anim picks between -A (gentle drift left) and -B (drift right)
      const puffs = [
        { r: 13, cx: 50, delay: 0,    anim: 'A' },
        { r: 9,  cx: 47, delay: -1.0, anim: 'B' },
        { r: 11, cx: 53, delay: -2.0, anim: 'A' },
        { r: 8,  cx: 48, delay: -3.0, anim: 'B' },
        { r: 14, cx: 52, delay: -4.0, anim: 'A' },
        { r: 10, cx: 49, delay: -5.0, anim: 'B' },
      ];
      body = (
        <svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMax meet" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045 0.07" numOctaves="2" seed="3" result="noise">
                <animate attributeName="seed" from="0" to="120" dur="14s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" />
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>
          <g filter={`url(#${filterId})`}>
            {puffs.map((p, i) => (
              <circle
                key={i}
                cx={p.cx}
                cy="180"
                r={p.r}
                fill={fxColor}
                style={{
                  animation: `village-smoke-rise-${p.anim} ${dur(5.4)} cubic-bezier(0.4, 0.0, 0.4, 1.0) ${p.delay}s infinite`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                }}
              />
            ))}
          </g>
        </svg>
      );
      break;
    }
    case 'mist': {
      // 320×140 viewBox; 2 large soft ellipses + 2 small orbs drifting
      const mistGradId = `mistGrad-${uid}`;
      body = (
        <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <defs>
            <radialGradient id={mistGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={fxColor} stopOpacity="0.95" />
              <stop offset="55%" stopColor={fxColor} stopOpacity="0.55" />
              <stop offset="100%" stopColor={fxColor} stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="160" cy="70" rx="130" ry="38" fill={`url(#${mistGradId})`}
            style={{ animation: `village-mist-drift ${dur(11)} ease-in-out infinite` }} />
          <ellipse cx="170" cy="78" rx="100" ry="30" fill={`url(#${mistGradId})`} opacity="0.7"
            style={{ animation: `village-mist-drift ${dur(13)} ease-in-out -3s infinite reverse` }} />
          <circle cx="120" cy="50" r="6" fill={fxColor} opacity="0.85"
            style={{ animation: `village-mist-orb ${dur(9)} ease-in-out infinite` }} />
          <circle cx="220" cy="90" r="5" fill={fxColor} opacity="0.7"
            style={{ animation: `village-mist-orb ${dur(11)} ease-in-out -2.5s infinite reverse` }} />
        </svg>
      );
      break;
    }
    case 'sparkle': {
      // 120×120 viewBox; concentric pulse + bright core
      const sparkGradId = `sparkGrad-${uid}`;
      body = (
        <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <defs>
            <radialGradient id={sparkGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbe8" stopOpacity="1" />
              <stop offset="40%" stopColor={fxColor} stopOpacity="0.85" />
              <stop offset="100%" stopColor={fxColor} stopOpacity="0" />
            </radialGradient>
          </defs>
          {[0, 1].map((i) => (
            <circle
              key={i}
              cx="60"
              cy="60"
              r="40"
              fill={`url(#${sparkGradId})`}
              style={{
                animation: `village-sparkle-pulse ${dur(2.0)} ease-out ${(i * -1.0).toFixed(2)}s infinite`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
            />
          ))}
          <circle cx="60" cy="60" r="9" fill="#fffbe8"
            style={{ animation: `village-sparkle-core ${dur(2.0)} ease-in-out infinite` }} />
        </svg>
      );
      break;
    }
    case 'shimmer': {
      // Waterfall-splash mist: 100×80 viewBox; small white-ish droplets burst
      // upward and outward from a central ledge point, fade as they rise.
      // feTurbulence breaks circles into wisps for an organic spray look.
      const filterId = `splashFilter-${uid}`;
      // Each droplet has its own start position (fanning out from x=50, y=65)
      // and a delay so the cluster bursts continuously.
      const drops = [
        { cx: 50, cy: 64, r: 7, anim: 'C', delay: 0 },
        { cx: 44, cy: 60, r: 5, anim: 'L', delay: -0.5 },
        { cx: 56, cy: 60, r: 5, anim: 'R', delay: -1.0 },
        { cx: 38, cy: 56, r: 4, anim: 'L', delay: -1.5 },
        { cx: 62, cy: 56, r: 4, anim: 'R', delay: -2.0 },
        { cx: 50, cy: 52, r: 4, anim: 'C', delay: -2.5 },
      ];
      body = (
        <svg viewBox="0 0 100 80" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <defs>
            <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.06 0.09" numOctaves="2" seed="5" result="noise">
                <animate attributeName="seed" from="0" to="100" dur="9s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
              <feGaussianBlur stdDeviation="1.0" />
            </filter>
          </defs>
          <g filter={`url(#${filterId})`}>
            {drops.map((p, i) => (
              <circle
                key={i}
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill={fxColor}
                style={{
                  animation: `village-splash-${p.anim} ${dur(2.6)} ease-out ${p.delay}s infinite`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                }}
              />
            ))}
          </g>
        </svg>
      );
      break;
    }
    case 'star': {
      // Cluster of 4-point twinkles that flash on/off at staggered intervals.
      // Each twinkle = a thin star path + a soft radial halo. The path is
      // centered at (0,0) so transform-origin:center scales/rotates around it
      // properly; the parent <g> uses an SVG attribute transform to position
      // each twinkle in viewBox space.
      const haloId = `starGlow-${uid}`;
      // 4-point sparkle path (vertical+horizontal rays) — keep at origin
      const starPath = 'M 0 -22 L 3 -3 L 22 0 L 3 3 L 0 22 L -3 3 L -22 0 L -3 -3 Z';
      const twinkles = [
        { cx: 50, cy: 48, scale: 1.0,  delay: 0,    dur: 2.6 },
        { cx: 36, cy: 38, scale: 0.65, delay: -0.7, dur: 2.2 },
        { cx: 64, cy: 44, scale: 0.7,  delay: -1.5, dur: 2.8 },
        { cx: 46, cy: 64, scale: 0.55, delay: -2.0, dur: 2.4 },
      ];
      body = (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor={fxColor} stopOpacity="0.85" />
              <stop offset="100%" stopColor={fxColor} stopOpacity="0" />
            </radialGradient>
          </defs>
          {twinkles.map((t, i) => (
            <g key={i} transform={`translate(${t.cx} ${t.cy}) scale(${t.scale})`}>
              {/* Soft glow */}
              <circle
                cx="0"
                cy="0"
                r="18"
                fill={`url(#${haloId})`}
                style={{
                  animation: `village-star-glow ${dur(t.dur)} ease-in-out ${t.delay}s infinite`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                }}
              />
              {/* Vertical+horizontal cross */}
              <path
                d={starPath}
                fill={fxColor}
                style={{
                  animation: `village-star-twinkle ${dur(t.dur)} ease-in-out ${t.delay}s infinite`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                }}
              />
              {/* Diagonal cross (rotated 45°) — phased so the 8 rays pulse asymmetrically */}
              <path
                d={starPath}
                fill={fxColor}
                opacity="0.55"
                style={{
                  animation: `village-star-twinkle-diag ${dur(t.dur)} ease-in-out ${(t.delay - 0.4).toFixed(2)}s infinite`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                }}
              />
              {/* Bright core */}
              <circle
                cx="0"
                cy="0"
                r="2.2"
                fill="#ffffff"
                style={{
                  animation: `village-star-core ${dur(t.dur)} ease-in-out ${t.delay}s infinite`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                }}
              />
            </g>
          ))}
        </svg>
      );
      break;
    }
  }

  return (
    <div
      className={`${className ?? ''}${keepActive ? ' village-fx-keep' : ''}`}
      style={{
        position: 'absolute',
        left: `${xPct}%`,
        top: `${yPct}%`,
        width: `${widthPct}%`,
        aspectRatio: String(aspect),
        transform: 'translate(-50%, -50%)',
        opacity,
        pointerEvents: 'none',
      }}
    >
      {body}
    </div>
  );
};

export default AmbientFx;
