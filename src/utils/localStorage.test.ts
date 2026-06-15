/**
 * Tests for localStorage utility functions
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUserKey, getUserStorage, setUserStorage, removeUserStorage } from './localStorage';

describe('createUserKey', () => {
  it('should return base key when address is null', () => {
    expect(createUserKey('theme', null)).toBe('theme');
  });

  it('should return prefixed key with normalized address', () => {
    expect(createUserKey('theme', 'UserABC')).toBe('theme_userabc');
  });

  it('should normalize address to lowercase', () => {
    expect(createUserKey('settings', 'UPPER')).toBe('settings_upper');
    expect(createUserKey('settings', 'MiXeD')).toBe('settings_mixed');
  });

  it('should handle empty string address', () => {
    // Empty string is falsy, returns base key
    expect(createUserKey('key', '')).toBe('key');
  });
});

describe('getUserStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default value when nothing stored', () => {
    expect(getUserStorage('missing', 'user1', 'default')).toBe('default');
  });

  it('should return stored value', () => {
    localStorage.setItem('prefs_user1', JSON.stringify({ theme: 'dark' }));
    const result = getUserStorage('prefs', 'user1', {});
    expect(result).toEqual({ theme: 'dark' });
  });

  it('should return default value on parse error', () => {
    localStorage.setItem('bad_user1', 'not json{{{');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = getUserStorage('bad', 'user1', 'fallback');
    expect(result).toBe('fallback');
    consoleSpy.mockRestore();
  });

  it('should work with null address (base key)', () => {
    localStorage.setItem('global', JSON.stringify(42));
    expect(getUserStorage('global', null, 0)).toBe(42);
  });

  it('should return stored arrays', () => {
    localStorage.setItem('items_usr', JSON.stringify([1, 2, 3]));
    expect(getUserStorage('items', 'usr', [])).toEqual([1, 2, 3]);
  });

  it('should return stored booleans', () => {
    localStorage.setItem('flag_usr', JSON.stringify(true));
    expect(getUserStorage('flag', 'usr', false)).toBe(true);
  });
});

describe('setUserStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store data as JSON', () => {
    setUserStorage('prefs', 'user1', { theme: 'light' });
    expect(localStorage.getItem('prefs_user1')).toBe('{"theme":"light"}');
  });

  it('should store with base key when address is null', () => {
    setUserStorage('global', null, 'value');
    expect(localStorage.getItem('global')).toBe('"value"');
  });

  it('should store arrays', () => {
    setUserStorage('items', 'usr', [1, 2, 3]);
    expect(JSON.parse(localStorage.getItem('items_usr')!)).toEqual([1, 2, 3]);
  });

  it('should overwrite existing data', () => {
    setUserStorage('data', 'usr', 'first');
    setUserStorage('data', 'usr', 'second');
    expect(JSON.parse(localStorage.getItem('data_usr')!)).toBe('second');
  });
});

describe('removeUserStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should remove stored data', () => {
    localStorage.setItem('prefs_user1', JSON.stringify('data'));
    removeUserStorage('prefs', 'user1');
    expect(localStorage.getItem('prefs_user1')).toBeNull();
  });

  it('should handle removing non-existent key', () => {
    // Should not throw
    removeUserStorage('nonexistent', 'user1');
    expect(localStorage.getItem('nonexistent_user1')).toBeNull();
  });

  it('should work with null address', () => {
    localStorage.setItem('global', JSON.stringify('data'));
    removeUserStorage('global', null);
    expect(localStorage.getItem('global')).toBeNull();
  });
});
