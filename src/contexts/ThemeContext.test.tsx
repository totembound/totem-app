/**
 * ThemeContext tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';

// Mock localStorage
vi.mock('../utils/localStorage', () => ({
  getUserStorage: vi.fn().mockReturnValue(null),
  setUserStorage: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
  });

  describe('useTheme', () => {
    it('should throw when used outside ThemeProvider', () => {
      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');
      consoleSpy.mockRestore();
    });

    it('should default to dark theme when no stored preference', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('should toggle from light back to dark', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.toggleTheme(); // dark -> light
      });
      act(() => {
        result.current.toggleTheme(); // light -> dark
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should add theme class to document element', () => {
      renderHook(() => useTheme(), { wrapper });
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should switch document class on toggle', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.toggleTheme();
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('ThemeProvider with stored preference', () => {
    it('should use stored dark theme', async () => {
      const { getUserStorage } = await import('../utils/localStorage');
      (getUserStorage as ReturnType<typeof vi.fn>).mockReturnValue('dark');

      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('dark');
    });

    it('should use stored light theme', async () => {
      const { getUserStorage } = await import('../utils/localStorage');
      (getUserStorage as ReturnType<typeof vi.fn>).mockReturnValue('light');

      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('light');
    });
  });
});
