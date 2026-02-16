/**
 * Tests for validation utility functions
 */
import { describe, it, expect } from 'vitest';
import { validateDisplayName } from './validations';

describe('validateDisplayName', () => {
  it('should accept valid names', () => {
    expect(validateDisplayName('Tester')).toEqual({ valid: true });
    expect(validateDisplayName('My Name')).toEqual({ valid: true });
    expect(validateDisplayName('Player123')).toEqual({ valid: true });
  });

  it('should reject empty string', () => {
    const result = validateDisplayName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name required');
  });

  it('should accept single character', () => {
    const result = validateDisplayName('A');
    expect(result.valid).toBe(true);
  });

  it('should accept 32 characters', () => {
    const result = validateDisplayName('A'.repeat(32));
    expect(result.valid).toBe(true);
  });

  it('should reject 33 characters', () => {
    const result = validateDisplayName('A'.repeat(33));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name must be 1-32 characters');
  });

  it('should accept names with unicode letters', () => {
    expect(validateDisplayName('Ñoño')).toEqual({ valid: true });
    expect(validateDisplayName('日本語')).toEqual({ valid: true });
  });

  it('should accept names with punctuation', () => {
    expect(validateDisplayName("O'Brien")).toEqual({ valid: true });
    expect(validateDisplayName('Dr. Who')).toEqual({ valid: true });
  });

  it('should accept names with numbers', () => {
    expect(validateDisplayName('Player42')).toEqual({ valid: true });
  });

  it('should accept names with hyphens', () => {
    expect(validateDisplayName('Jean-Luc')).toEqual({ valid: true });
  });
});
