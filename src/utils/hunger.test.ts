/**
 * Tests for client-side hunger derivation.
 *
 * deriveHunger must agree with the server's floor(hours × rate) formula and
 * guard totems that don't carry the hunger fields yet.
 */
import { describe, it, expect } from 'vitest';
import { deriveHunger } from './hunger';

const HOUR = 3_600_000;
const T0 = Date.parse('2026-07-01T00:00:00.000Z');
const at = (h: number) => T0 + h * HOUR;

describe('deriveHunger', () => {
  const snapshot = { hunger: 100, hungerAsOf: new Date(T0).toISOString(), hungerDecayPerHour: 1 };

  it('decays one point per whole hour from the snapshot', () => {
    expect(deriveHunger(snapshot, at(24))).toBe(76);
  });

  it('floors sub-hour elapsed (no partial-point drop)', () => {
    expect(deriveHunger(snapshot, T0 + 59 * 60 * 1000)).toBe(100);
  });

  it('never returns below 0', () => {
    expect(deriveHunger({ ...snapshot, hunger: 5 }, at(100))).toBe(0);
  });

  it('never returns above 100 and never increases', () => {
    expect(deriveHunger(snapshot, T0 - 5 * HOUR)).toBe(100); // future-relative clock
  });

  it('respects a per-totem decay rate (e.g. trt_hardy 0.5)', () => {
    expect(deriveHunger({ ...snapshot, hungerDecayPerHour: 0.5 }, at(10))).toBe(95);
  });

  it('a zero rate halts decay', () => {
    expect(deriveHunger({ ...snapshot, hungerDecayPerHour: 0 }, at(50))).toBe(100);
  });

  // ---- guards for totems missing the data -----------------------------------
  it('treats a totem with no hunger fields as fully fed (100)', () => {
    expect(deriveHunger({}, at(100))).toBe(100);
  });

  it('shows the base hunger as-is when there is no anchor yet', () => {
    expect(deriveHunger({ hunger: 64 }, at(100))).toBe(64);
  });

  it('defaults the rate to 1 when only hunger + anchor are present', () => {
    expect(deriveHunger({ hunger: 100, hungerAsOf: new Date(T0).toISOString() }, at(3))).toBe(97);
  });

  it('handles null/undefined input without throwing', () => {
    expect(deriveHunger(undefined, at(1))).toBe(100);
    expect(deriveHunger(null, at(1))).toBe(100);
  });

  it('matches what a fresh server refetch would show for the same inputs', () => {
    // Server would compute floor((now-asOf)/hour) = 30 → 70; client agrees.
    expect(deriveHunger({ hunger: 100, hungerAsOf: new Date(T0).toISOString(), hungerDecayPerHour: 1 }, at(30))).toBe(70);
  });
});
