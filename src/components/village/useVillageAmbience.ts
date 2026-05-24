import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'village-ambience-muted';
const DEFAULT_VOLUME = 0.25; // mild — ambient should sit under everything

/**
 * Manages a single looping ambient audio track for the village page.
 * - Honors browser autoplay policy: waits for the first user gesture inside
 *   the gestureTarget element before calling play(), so we never get an
 *   uncaught play() rejection.
 * - Persists mute state to localStorage so the user's preference survives
 *   reloads.
 * - Cleans up on unmount (audio is paused + element released), which means
 *   leaving /keepers-village stops the sound.
 * - Exposes pause/setGain/restore for atmosphere control: modal-over-village
 *   modals call these to mute, duck, or restore the village ambient without
 *   touching the user's mute preference.
 *
 * If the audio file is missing (404), audio.play() will reject silently and
 * we surface no error — the user just hears nothing until they drop the file in.
 */
export function useVillageAmbience(opts: {
  src: string;
  /**
   * Optional element-scoped fallback for the document gesture listener.
   * Document-level pointerdown/touchstart is the primary unlock path; this
   * ref adds a redundant element listener so the unlock still fires if a
   * descendant calls stopPropagation() before the event reaches document.
   */
  gestureTarget?: React.RefObject<HTMLElement | null>;
  volume?: number;
}) {
  const { src, gestureTarget, volume = DEFAULT_VOLUME } = opts;

  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  // Programmatic target volume — atmosphere effects ramp this independently
  // of the user's `volume` prop and `muted` preference.
  const programmaticVolumeRef = useRef(volume);
  // Whether the *village* (this hook) wants the audio playing. Atmosphere pause
  // sets this false to stop playback; restore sets it true and resumes.
  const wantsPlayingRef = useRef(true);
  const rampFrameRef = useRef(0);

  const debugAudio =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('audioDebug');

  const applyVolume = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    // iOS Safari (esp. PWA standalone) treats audio.volume as read-only — only
    // the `muted` property and pause() actually silence playback. Set both so
    // the user-toggleable mute works on iOS while desktop ducking via `volume`
    // (setGain) keeps working everywhere else.
    a.muted = muted;
    a.volume = muted ? 0 : programmaticVolumeRef.current;
  }, [muted]);

  const tryStart = useCallback(() => {
    const a = audioRef.current;
    if (!a || startedRef.current) return;
    if (!wantsPlayingRef.current) return; // village asked us to stay paused
    startedRef.current = true;
    void a.play().catch((err) => {
      startedRef.current = false;
      // AbortError fires when cleanup pauses the element before play() resolves
      // (common in React StrictMode dev double-mount). The second mount tries
      // again and succeeds, so this is benign noise — don't log it.
      if (err?.name === 'AbortError') return;
      if (debugAudio) {
        // eslint-disable-next-line no-console
        console.warn('[village-ambience] play() rejected:', err?.name ?? err, err?.message ?? '');
      }
    });
  }, [debugAudio]);

  // Create the audio element once; clean up on unmount. Try play() immediately —
  // most arrivals at /keepers-village come from a navigation click, which counts
  // as a user gesture and unlocks autoplay. If play() rejects (NotAllowedError),
  // the document-level gesture listeners below will pick it up on the next tap.
  useEffect(() => {
    const a = new Audio();
    a.src = src;
    a.loop = true;
    a.preload = 'auto';
    a.muted = muted;
    a.volume = muted ? 0 : programmaticVolumeRef.current;
    audioRef.current = a;
    tryStart();
    return () => {
      cancelAnimationFrame(rampFrameRef.current);
      a.pause();
      a.src = '';
      audioRef.current = null;
      startedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // React to user mute toggles — apply against current programmatic volume.
  useEffect(() => {
    applyVolume();
  }, [muted, applyVolume]);

  // Document-level gesture fallback. Any tap anywhere on the page unlocks audio
  // (HUD, mute toggle, building labels, panorama scroll). pointerdown on a
  // child bubbles up, so a single document listener covers every interaction.
  // The optional `gestureTarget` ref attaches a redundant element-scoped
  // listener as belt-and-suspenders against descendants that stopPropagation.
  useEffect(() => {
    document.addEventListener('pointerdown', tryStart, { passive: true });
    document.addEventListener('touchstart', tryStart, { passive: true });
    const target = gestureTarget?.current;
    if (target) {
      target.addEventListener('pointerdown', tryStart, { passive: true });
      target.addEventListener('touchstart', tryStart, { passive: true });
    }
    return () => {
      document.removeEventListener('pointerdown', tryStart);
      document.removeEventListener('touchstart', tryStart);
      if (target) {
        target.removeEventListener('pointerdown', tryStart);
        target.removeEventListener('touchstart', tryStart);
      }
    };
  }, [gestureTarget, tryStart]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      }
      return next;
    });
  }, []);

  /** Stop village playback. Atmosphere uses this for `audio: { mode: 'pause' }`. */
  const pause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    cancelAnimationFrame(rampFrameRef.current);
    wantsPlayingRef.current = false;
    a.pause();
  }, []);

  /**
   * Ramp programmatic volume to `target` over `durationMs` (linear interp).
   * Atmosphere uses this for `audio: { mode: 'duck', gain }` to drop village
   * audio under a claim modal without fully pausing.
   */
  const setGain = useCallback((target: number, durationMs = 150) => {
    const a = audioRef.current;
    if (!a) return;
    cancelAnimationFrame(rampFrameRef.current);
    const start = programmaticVolumeRef.current;
    if (durationMs <= 0) {
      programmaticVolumeRef.current = target;
      applyVolume();
      return;
    }
    const startTime = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - startTime) / durationMs);
      programmaticVolumeRef.current = start + (target - start) * t;
      applyVolume();
      if (t < 1) {
        rampFrameRef.current = requestAnimationFrame(tick);
      }
    };
    tick();
  }, [applyVolume]);

  /**
   * Restore base volume + resume playback. Atmosphere calls this on modal
   * close. If audio hasn't been started yet (no user gesture), the gesture
   * handler will pick up where this left off.
   */
  const restore = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    wantsPlayingRef.current = true;
    setGain(volume, 200);
    if (a.paused && startedRef.current) {
      void a.play().catch(() => {
        startedRef.current = false;
      });
    }
  }, [volume, setGain]);

  return { muted, toggleMute, pause, setGain, restore };
}
