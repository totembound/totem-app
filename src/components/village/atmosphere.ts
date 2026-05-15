import { createContext, useContext } from 'react';

export interface ModalAtmosphere {
  pause: {
    walkers?: boolean;
    ambientFx?: boolean;
    pointerEvents?: boolean;
    panoramaPaint?: boolean;
  };
  audio?:
    | { mode: 'pause' }
    | { mode: 'continue' }
    | { mode: 'duck'; gain: number }
    | { mode: 'swap'; src: string; volume?: number; loop?: boolean; crossfadeMs?: number };
  keepFxActive?: string[];
}

export type AtmospherePreset = 'soft' | 'hard' | 'claim';

export const PRESETS: Record<AtmospherePreset, ModalAtmosphere> = {
  soft: {
    pause: { walkers: true, ambientFx: true, pointerEvents: true, panoramaPaint: false },
    // Continue the village ambient through building modals until each
    // building gets its own themed track (forge bellows, library page-turns,
    // shrine bells, etc.). One non-annoying loop everywhere beats silence
    // every time a modal opens.
    audio: { mode: 'continue' },
  },
  hard: {
    pause: { walkers: true, ambientFx: true, pointerEvents: true, panoramaPaint: true },
    audio: { mode: 'pause' },
  },
  claim: {
    pause: { walkers: false, ambientFx: false, pointerEvents: true, panoramaPaint: false },
    audio: { mode: 'duck', gain: 0.3 },
  },
};

export type AtmosphereInput = AtmospherePreset | ModalAtmosphere | undefined;

export function resolveAtmosphere(input: AtmosphereInput, override?: AtmosphereInput): ModalAtmosphere {
  const o = normalize(override);
  if (o) return o;
  return normalize(input) ?? PRESETS.soft;
}

function normalize(input: AtmosphereInput): ModalAtmosphere | null {
  if (!input) return null;
  if (typeof input === 'string') return PRESETS[input];
  return input;
}

interface AtmosphereContextValue {
  current: ModalAtmosphere | null;
  set: (atm: ModalAtmosphere) => void;
  clear: () => void;
}

export const AtmosphereCtx = createContext<AtmosphereContextValue>({
  current: null,
  set: () => {},
  clear: () => {},
});

export const useAtmosphere = () => useContext(AtmosphereCtx);
