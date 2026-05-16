/**
 * Tests for format utility functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTokenAmount,
  formatCompact,
  parseTokenAmount,
  formatTimeRemaining,
  splitWords,
  formatHoursDuration,
} from './formats';

describe('formatTokenAmount', () => {
  it('should format number with locale formatting', () => {
    expect(formatTokenAmount(1000)).toBe('1,000');
    expect(formatTokenAmount(1234567)).toBe('1,234,567');
  });

  it('should format string numbers', () => {
    expect(formatTokenAmount('500')).toBe('500');
    expect(formatTokenAmount('2000')).toBe('2,000');
  });

  it('should handle zero', () => {
    expect(formatTokenAmount(0)).toBe('0');
    expect(formatTokenAmount('0')).toBe('0');
  });

  it('should return "0" for NaN input', () => {
    expect(formatTokenAmount('abc')).toBe('0');
    expect(formatTokenAmount(NaN)).toBe('0');
  });

  it('should handle negative numbers', () => {
    const result = formatTokenAmount(-500);
    expect(result).toBe('-500');
  });
});

describe('formatCompact', () => {
  it('passes small numbers through without notation', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(42)).toBe('42');
    expect(formatCompact(999)).toBe('999');
  });

  it('uses K notation for thousands', () => {
    expect(formatCompact(1000)).toBe('1K');
    expect(formatCompact(1500)).toBe('1.5K');
    expect(formatCompact(88880)).toBe('88.9K');
    expect(formatCompact(886825)).toBe('886.8K');
  });

  it('uses M notation for millions', () => {
    expect(formatCompact(1_000_000)).toBe('1M');
    expect(formatCompact(1_500_000)).toBe('1.5M');
    expect(formatCompact(12_300_000)).toBe('12.3M');
  });

  it('accepts string numeric input', () => {
    expect(formatCompact('1500')).toBe('1.5K');
    expect(formatCompact('0')).toBe('0');
  });

  it('returns "0" for NaN input', () => {
    expect(formatCompact('not-a-number')).toBe('0');
    expect(formatCompact(NaN)).toBe('0');
  });

  it('handles negative numbers', () => {
    expect(formatCompact(-1500)).toBe('-1.5K');
  });
});

describe('parseTokenAmount', () => {
  it('should parse number to floored integer', () => {
    expect(parseTokenAmount(100)).toBe(100);
    expect(parseTokenAmount(99.9)).toBe(99);
    expect(parseTokenAmount(0.5)).toBe(0);
  });

  it('should parse string to floored integer', () => {
    expect(parseTokenAmount('100')).toBe(100);
    expect(parseTokenAmount('99.9')).toBe(99);
    expect(parseTokenAmount('50.7')).toBe(50);
  });

  it('should handle zero', () => {
    expect(parseTokenAmount(0)).toBe(0);
    expect(parseTokenAmount('0')).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(parseTokenAmount(-5.9)).toBe(-6);
  });
});

describe('formatTimeRemaining', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Completed" when time has passed', () => {
    const pastTime = Math.floor(Date.now() / 1000) - 100;
    expect(formatTimeRemaining(pastTime)).toBe('Completed');
  });

  it('should return "Completed" when endTime equals now', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeRemaining(now)).toBe('Completed');
  });

  it('should format hours and minutes remaining', () => {
    const now = Math.floor(Date.now() / 1000);
    // 2 hours and 30 minutes from now
    const endTime = now + (2 * 3600) + (30 * 60);
    expect(formatTimeRemaining(endTime)).toBe('2h 30m remaining');
  });

  it('should format zero hours with minutes', () => {
    const now = Math.floor(Date.now() / 1000);
    const endTime = now + (45 * 60);
    expect(formatTimeRemaining(endTime)).toBe('0h 45m remaining');
  });

  it('should format exact hours', () => {
    const now = Math.floor(Date.now() / 1000);
    const endTime = now + (3 * 3600);
    expect(formatTimeRemaining(endTime)).toBe('3h 0m remaining');
  });
});

describe('splitWords', () => {
  it('should split camelCase into separate words', () => {
    expect(splitWords('helloWorld')).toBe('hello World');
    expect(splitWords('myVariableName')).toBe('my Variable Name');
  });

  it('should handle PascalCase', () => {
    expect(splitWords('HelloWorld')).toBe('Hello World');
  });

  it('should handle already split words', () => {
    expect(splitWords('hello')).toBe('hello');
  });

  it('should handle empty string', () => {
    expect(splitWords('')).toBe('');
  });

  it('should handle all caps', () => {
    expect(splitWords('ABC')).toBe('A B C');
  });
});

describe('formatHoursDuration', () => {
  it('should format fractional hours as minutes', () => {
    expect(formatHoursDuration(0.5)).toBe('30 minutes');
    expect(formatHoursDuration(0.25)).toBe('15 minutes');
  });

  it('should format exactly 1 hour singular', () => {
    expect(formatHoursDuration(1)).toBe('1 hour');
  });

  it('should format multiple hours', () => {
    expect(formatHoursDuration(2)).toBe('2 hours');
    expect(formatHoursDuration(24)).toBe('24 hours');
  });

  it('should handle zero', () => {
    expect(formatHoursDuration(0)).toBe('0 minutes');
  });
});
