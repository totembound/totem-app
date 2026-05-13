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
 *
 * If the audio file is missing (404), audio.play() will reject silently and
 * we surface no error — the user just hears nothing until they drop the file in.
 */
export function useVillageAmbience(opts: {
  src: string;
  /** ref to the element whose first click/touchstart unlocks audio */
  gestureTarget: React.RefObject<HTMLElement | null>;
  volume?: number;
}) {
  const { src, gestureTarget, volume = DEFAULT_VOLUME } = opts;

  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  // Create the audio element once; clean up on unmount.
  useEffect(() => {
    const a = new Audio(src);
    a.loop = true;
    a.preload = 'auto';
    a.volume = muted ? 0 : volume;
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = '';
      audioRef.current = null;
      startedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // React to mute/volume changes after element exists.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = muted ? 0 : volume;
  }, [muted, volume]);

  // Hook up the autoplay-unlock gesture listener once the target ref is set.
  useEffect(() => {
    const target = gestureTarget.current;
    if (!target) return;

    const startIfPossible = () => {
      const a = audioRef.current;
      if (!a || startedRef.current) return;
      startedRef.current = true;
      // Don't await — we just want to fire-and-forget. A rejection
      // (autoplay still blocked, file missing) is silently swallowed.
      void a.play().catch(() => {
        // Browser refused even after user gesture, or file missing.
        // Reset so a subsequent gesture can try again.
        startedRef.current = false;
      });
    };

    target.addEventListener('pointerdown', startIfPossible, { passive: true });
    target.addEventListener('touchstart', startIfPossible, { passive: true });
    return () => {
      target.removeEventListener('pointerdown', startIfPossible);
      target.removeEventListener('touchstart', startIfPossible);
    };
  }, [gestureTarget]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      }
      return next;
    });
  }, []);

  return { muted, toggleMute };
}
