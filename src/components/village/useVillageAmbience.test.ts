/**
 * Tests for useVillageAmbience — the looping ambient audio hook.
 *
 * Focus: the autoplay-fix behavior (try play() on mount, document gesture
 * fallback, AbortError noise filtering, debug logging via ?audioDebug=1).
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef } from 'react';

// Track every Audio instance the hook creates, plus the impl that play() runs.
let audioInstances: MockAudio[] = [];
let playImpl: () => Promise<void> = () => Promise.resolve();

class MockAudio {
  src = '';
  loop = false;
  preload = '';
  volume = 0;
  muted = false;
  paused = true;

  play = vi.fn(() => {
    this.paused = false;
    return playImpl();
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  constructor() {
    audioInstances.push(this);
  }
}

const setSearch = (search: string) => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, search },
  });
};

// Flush both the play() promise resolution and the catch/then handler chained
// on top of it. One microtask isn't enough when the chain has multiple awaits.
const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

beforeEach(() => {
  audioInstances = [];
  playImpl = () => Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Audio = MockAudio;
  setSearch('');
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Import AFTER the Audio mock is in scope so the hook picks it up.
import { useVillageAmbience } from './useVillageAmbience';

describe('useVillageAmbience', () => {
  describe('mount-time autoplay', () => {
    it('attempts play() automatically on mount', async () => {
      renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      await flushPromises();
      expect(audioInstances).toHaveLength(1);
      expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    });

    it('initializes the audio element with loop + preload + correct src', () => {
      renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      expect(audioInstances[0].src).toBe('/test.mp3');
      expect(audioInstances[0].loop).toBe(true);
      expect(audioInstances[0].preload).toBe('auto');
    });

    it('uses the provided volume when not muted', () => {
      renderHook(() => useVillageAmbience({ src: '/test.mp3', volume: 0.5 }));
      expect(audioInstances[0].volume).toBe(0.5);
    });

    it('starts at volume 0 when previously muted (localStorage)', () => {
      window.localStorage.setItem('village-ambience-muted', '1');
      renderHook(() => useVillageAmbience({ src: '/test.mp3', volume: 0.5 }));
      expect(audioInstances[0].volume).toBe(0);
    });
  });

  describe('document gesture fallback', () => {
    it('retries play() on document pointerdown after the initial play() is rejected', async () => {
      playImpl = () =>
        Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
      renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      await flushPromises();
      // Initial mount play() was rejected; reset call count so we measure the gesture-triggered call.
      audioInstances[0].play.mockClear();

      // Now the user "interacts" — gesture listener should fire tryStart().
      // From now on, play() resolves so we can assert it was called.
      playImpl = () => Promise.resolve();
      document.dispatchEvent(new PointerEvent('pointerdown'));

      expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    });

    it('attaches a redundant element-scoped listener when gestureTarget is provided', async () => {
      playImpl = () =>
        Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
      const target = document.createElement('div');
      const { result } = renderHook(() => {
        const ref = useRef<HTMLDivElement>(target);
        return useVillageAmbience({ src: '/test.mp3', gestureTarget: ref });
      });
      // Touch the result to satisfy lint/no-unused.
      expect(result.current.muted).toBe(false);
      await flushPromises();
      audioInstances[0].play.mockClear();

      playImpl = () => Promise.resolve();
      target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: false }));

      expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause / restore', () => {
    it('does not retry play() after pause(), even on document gesture', async () => {
      const { result } = renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      await flushPromises();
      audioInstances[0].play.mockClear();

      act(() => {
        result.current.pause();
      });
      document.dispatchEvent(new PointerEvent('pointerdown'));

      expect(audioInstances[0].play).not.toHaveBeenCalled();
      expect(audioInstances[0].pause).toHaveBeenCalled();
    });

    it('restore() resumes playback', async () => {
      const { result } = renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      await flushPromises();

      act(() => {
        result.current.pause();
      });
      audioInstances[0].play.mockClear();
      audioInstances[0].paused = true;

      act(() => {
        result.current.restore();
      });

      expect(audioInstances[0].play).toHaveBeenCalled();
    });
  });

  describe('mute toggle', () => {
    it('toggles muted state and persists to localStorage', async () => {
      const { result } = renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      expect(result.current.muted).toBe(false);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.muted).toBe(true);
      expect(window.localStorage.getItem('village-ambience-muted')).toBe('1');
      expect(audioInstances[0].volume).toBe(0);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.muted).toBe(false);
      expect(window.localStorage.getItem('village-ambience-muted')).toBe('0');
    });

    // iOS Safari treats audio.volume as read-only — only the `muted` property
    // (and pause()) actually silence playback in PWA mode. Without this, the
    // mute icon flips but ambient audio keeps playing on iPhone.
    it('sets audio.muted on the element when toggled (iOS PWA fix)', () => {
      const { result } = renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      expect(audioInstances[0].muted).toBe(false);

      act(() => {
        result.current.toggleMute();
      });
      expect(audioInstances[0].muted).toBe(true);

      act(() => {
        result.current.toggleMute();
      });
      expect(audioInstances[0].muted).toBe(false);
    });

    it('initializes audio.muted=true when previously muted (localStorage)', () => {
      window.localStorage.setItem('village-ambience-muted', '1');
      renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      expect(audioInstances[0].muted).toBe(true);
    });
  });

  describe('debug logging', () => {
    it('does not log AbortError even when ?audioDebug=1 is set', async () => {
      setSearch('?audioDebug=1');
      playImpl = () =>
        Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      await flushPromises();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('logs non-AbortError rejections when ?audioDebug=1 is set', async () => {
      setSearch('?audioDebug=1');
      playImpl = () =>
        Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      await flushPromises();

      expect(warnSpy).toHaveBeenCalledWith(
        '[village-ambience] play() rejected:',
        'NotAllowedError',
        'blocked',
      );
    });

    it('stays silent on rejections when ?audioDebug is not set', async () => {
      playImpl = () =>
        Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      await flushPromises();

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('pauses audio and removes the document listener on unmount', async () => {
      const { unmount } = renderHook(() => useVillageAmbience({ src: '/test.mp3' }));
      await flushPromises();
      const audio = audioInstances[0];
      audio.pause.mockClear();
      audio.play.mockClear();

      unmount();

      expect(audio.pause).toHaveBeenCalled();

      // After unmount, document gesture should not retry play() (audioRef is null).
      document.dispatchEvent(new PointerEvent('pointerdown'));
      expect(audio.play).not.toHaveBeenCalled();
    });
  });
});
