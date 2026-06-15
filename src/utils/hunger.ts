/**
 * Client-side hunger derivation.
 *
 * Hunger decays ~1/hour server-side, computed lazily on read. Because the decay
 * is deterministic, the client can re-derive the CURRENT hunger from the last
 * value the server sent — with zero API calls. This is NOT polling (no repeated
 * network requests); it's pure local math on data already in hand, so a player
 * who pages around or returns to the app sees what a refresh would show.
 *
 * Guards: totems that predate the hunger fields (no `hunger`, `hungerAsOf`, or
 * `hungerDecayPerHour`) are treated as fully fed and non-decaying until the
 * server starts sending the fields — never NaN, never a phantom drop.
 */

import { useSyncExternalStore } from 'react';
import type { TotemAttributes } from '../types/types';

const HOUR_MS = 3_600_000;
const HUNGER_MAX = 100;
const HUNGER_MIN = 0;

const clamp = (n: number): number => Math.max(HUNGER_MIN, Math.min(HUNGER_MAX, n));

type HungerFields = Pick<TotemAttributes, 'hunger' | 'hungerAsOf' | 'hungerDecayPerHour'>;

/**
 * Derive current hunger from the server snapshot + elapsed time.
 * Identical formula to the server (floor of whole hours × rate, clamped).
 * Only ever decays forward — never increases, never below 0.
 */
export function deriveHunger(attrs: HungerFields | undefined | null, now: number = Date.now()): number {
  const base = attrs?.hunger ?? HUNGER_MAX;
  // No anchor yet → nothing to extrapolate from; show the base value as-is.
  const asOfRaw = attrs?.hungerAsOf;
  const asOf = asOfRaw ? Date.parse(asOfRaw) : NaN;
  if (!Number.isFinite(asOf)) return clamp(base);

  const rate = attrs?.hungerDecayPerHour ?? 1;
  if (rate <= 0) return clamp(base);

  const decayed = Math.floor(((now - asOf) / HOUR_MS) * rate);
  return clamp(base - Math.max(0, decayed));
}

// ---- Shared focus clock -----------------------------------------------------
// One set of listeners total (not one per component). `now` advances on mount,
// route navigation (remount → fresh subscribe), and when the tab regains focus
// or visibility — never on a setInterval, so there is no timer and no polling.

let current = 0;
const listeners = new Set<() => void>();
let bound = false;

function refresh(): void {
  current = Date.now();
  listeners.forEach((l) => l());
}

function ensureBound(): void {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  window.addEventListener('visibilitychange', refresh);
  window.addEventListener('focus', refresh);
}

function subscribe(cb: () => void): () => void {
  ensureBound();
  listeners.add(cb);
  current = Date.now(); // fresh value on (re)mount / navigation
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): number {
  return current;
}

/**
 * Returns a timestamp that refreshes on mount/navigation/tab-focus. Pass it to
 * `deriveHunger(attrs, now)` so displayed hunger stays current without refetch.
 */
export function useFocusNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
