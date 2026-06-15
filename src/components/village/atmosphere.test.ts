import { describe, it, expect } from 'vitest';
import { PRESETS, resolveAtmosphere, type ModalAtmosphere } from './atmosphere';

describe('PRESETS', () => {
  it('soft preset continues village ambient through modals', () => {
    expect(PRESETS.soft.audio).toEqual({ mode: 'continue' });
    expect(PRESETS.soft.pause.walkers).toBe(true);
    expect(PRESETS.soft.pause.ambientFx).toBe(true);
    expect(PRESETS.soft.pause.panoramaPaint).toBe(false);
  });

  it('hard preset pauses audio and evicts panorama paint', () => {
    expect(PRESETS.hard.audio).toEqual({ mode: 'pause' });
    expect(PRESETS.hard.pause.panoramaPaint).toBe(true);
  });

  it('claim preset ducks audio and lets walkers + fx keep playing', () => {
    expect(PRESETS.claim.audio).toEqual({ mode: 'duck', gain: 0.3 });
    expect(PRESETS.claim.pause.walkers).toBe(false);
    expect(PRESETS.claim.pause.ambientFx).toBe(false);
  });
});

describe('resolveAtmosphere', () => {
  it('resolves a preset name to the matching object', () => {
    expect(resolveAtmosphere('soft')).toBe(PRESETS.soft);
    expect(resolveAtmosphere('hard')).toBe(PRESETS.hard);
    expect(resolveAtmosphere('claim')).toBe(PRESETS.claim);
  });

  it('passes a full ModalAtmosphere object through', () => {
    const custom: ModalAtmosphere = {
      pause: { walkers: false },
      audio: { mode: 'duck', gain: 0.5 },
    };
    expect(resolveAtmosphere(custom)).toBe(custom);
  });

  it('falls back to soft when input is undefined', () => {
    expect(resolveAtmosphere(undefined)).toBe(PRESETS.soft);
  });

  it('override wins over the base input', () => {
    expect(resolveAtmosphere('soft', 'hard')).toBe(PRESETS.hard);
  });

  it('override of a custom object wins over a preset name', () => {
    const custom: ModalAtmosphere = { pause: {} };
    expect(resolveAtmosphere('soft', custom)).toBe(custom);
  });

  it('falls through to input when override is undefined', () => {
    expect(resolveAtmosphere('hard', undefined)).toBe(PRESETS.hard);
  });
});
