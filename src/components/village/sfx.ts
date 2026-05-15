/**
 * Tiny one-shot SFX player for village interactions (wisp grab + release).
 *
 * Layers over the looping village ambient — each call creates a fresh Audio
 * element so multiple cues can overlap. Respects the same mute state as the
 * ambient: reads `village-ambience-muted` from localStorage on every call so
 * toggling mute silences SFX without any wiring.
 */

// Must match useVillageAmbience.ts STORAGE_KEY exactly. Kept as a string
// constant rather than imported so this module has zero React dependencies
// and can be called from anywhere (handlers, refs, rAF callbacks).
const MUTE_STORAGE_KEY = 'village-ambience-muted';

function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export type WispSfx = 'grab' | 'release';

const SRC: Record<WispSfx, string> = {
  grab: '/sounds/village/wisp-grab.mp3',
  release: '/sounds/village/wisp-release.mp3',
};

/**
 * Play a wisp interaction sound. No-op when muted, on SSR, or before the
 * user's first interaction (autoplay rejection is swallowed silently).
 *
 * @param kind   which clip to play
 * @param volume 0–1 gain — defaults sit slightly above the ambient bed
 *               (0.25 base) so the cue reads as a foreground event.
 */
export function playWispSfx(kind: WispSfx, volume = 0.4): void {
  if (typeof window === 'undefined') return;
  if (isMuted()) return;
  const a = new Audio(SRC[kind]);
  a.volume = volume;
  void a.play().catch(() => {
    // Autoplay rejected (no user gesture yet) or file 404. The walker
    // interaction itself is the gesture, so this only ever rejects when
    // the browser hasn't registered it as one — silent fallback is fine.
  });
}
