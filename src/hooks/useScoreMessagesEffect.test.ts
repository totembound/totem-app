/**
 * useScoreMessages hook tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScoreMessages } from './useScoreMessagesEffect';

describe('useScoreMessages', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with empty messages', () => {
    const { result } = renderHook(() => useScoreMessages());
    expect(result.current.scoreMessages).toEqual([]);
  });

  it('should add a score message', () => {
    const { result } = renderHook(() => useScoreMessages());

    act(() => {
      result.current.addScoreMessage(100, 200, 50);
    });

    expect(result.current.scoreMessages).toHaveLength(1);
    expect(result.current.scoreMessages[0].value).toBe(50);
    expect(result.current.scoreMessages[0].x).toBe(100);
    expect(result.current.scoreMessages[0].y).toBe(200);
  });

  it('should add multiple messages', () => {
    const { result } = renderHook(() => useScoreMessages());

    act(() => {
      result.current.addScoreMessage(10, 20, 5);
      result.current.addScoreMessage(30, 40, 10);
      result.current.addScoreMessage(50, 60, 15);
    });

    expect(result.current.scoreMessages).toHaveLength(3);
  });

  it('should clean up expired messages', () => {
    const { result } = renderHook(() => useScoreMessages(500)); // 500ms duration

    act(() => {
      result.current.addScoreMessage(10, 20, 5);
    });

    expect(result.current.scoreMessages).toHaveLength(1);

    // Advance time past duration + cleanup interval
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.scoreMessages).toHaveLength(0);
  });

  it('should keep messages within duration', () => {
    const { result } = renderHook(() => useScoreMessages(1000));

    act(() => {
      result.current.addScoreMessage(10, 20, 5);
    });

    // Advance 200ms (within 1000ms duration)
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.scoreMessages).toHaveLength(1);
  });
});
