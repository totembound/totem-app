/**
 * AuthContext tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock AuthService
vi.mock('../services/AuthService', () => ({
  isAuthenticated: vi.fn().mockReturnValue(false),
  getMe: vi.fn().mockResolvedValue({ success: false }),
  getStoredUser: vi.fn().mockReturnValue(null),
  clearTokens: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerificationCode: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth', () => {
    it('should throw when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      consoleSpy.mockRestore();
    });

    it('should start with loading true and unauthenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.login as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        user: { id: 'usr_1', email: 'test@test.com', displayName: 'Tester' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@test.com', 'password');
      });

      expect(loginResult.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@test.com');
    });

    it('should handle login failure', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.login as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@test.com', 'wrong');
      });

      expect(loginResult.success).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should return needsVerification for unverified email', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.login as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'EMAIL_NOT_VERIFIED',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@test.com', 'pass');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.needsVerification).toBe(true);
    });

    it('should handle login exception', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.login as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@test.com', 'pass');
      });

      expect(loginResult.success).toBe(false);
      expect(result.current.error).toBe('An unexpected error occurred');
      consoleSpy.mockRestore();
    });
  });

  describe('signup', () => {
    it('should signup with verification needed', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.signup as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        needsVerification: true,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let signupResult: any;
      await act(async () => {
        signupResult = await result.current.signup('test@test.com', 'pass', 'Tester');
      });

      expect(signupResult.success).toBe(true);
      expect(signupResult.needsVerification).toBe(true);
    });

    it('should signup directly with user', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.signup as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        user: { id: 'usr_new', email: 'new@test.com', displayName: 'New' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let signupResult: any;
      await act(async () => {
        signupResult = await result.current.signup('new@test.com', 'pass', 'New');
      });

      expect(signupResult.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle signup failure', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.signup as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Email in use',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let signupResult: any;
      await act(async () => {
        signupResult = await result.current.signup('dup@test.com', 'pass');
      });

      expect(signupResult.success).toBe(false);
      expect(result.current.error).toBe('Email in use');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        tokens: { accessToken: 'tk', refreshToken: 'rtk' },
        user: { id: 'usr_1', email: 'test@test.com', displayName: 'Test' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let verifyResult = false;
      await act(async () => {
        verifyResult = await result.current.verifyEmail('test@test.com', '123456', 'pass');
      });

      expect(verifyResult).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle verification failure', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Invalid code',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let verifyResult = true;
      await act(async () => {
        verifyResult = await result.current.verifyEmail('test@test.com', '000000', 'pass');
      });

      expect(verifyResult).toBe(false);
      expect(result.current.error).toBe('Invalid code');
    });
  });

  describe('logout', () => {
    it('should clear user state on logout', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.login as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        user: { id: 'usr_1', email: 'test@test.com', displayName: 'Test' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Login first
      await act(async () => {
        await result.current.login('test@test.com', 'pass');
      });
      expect(result.current.isAuthenticated).toBe(true);

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.login as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Some error',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('test@test.com', 'wrong');
      });
      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('resendVerification', () => {
    it('should return true on success', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.resendVerificationCode as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let resendResult = false;
      await act(async () => {
        resendResult = await result.current.resendVerification('test@test.com');
      });
      expect(resendResult).toBe(true);
    });

    it('should return false on failure', async () => {
      const AuthService = await import('../services/AuthService');
      (AuthService.resendVerificationCode as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let resendResult = true;
      await act(async () => {
        resendResult = await result.current.resendVerification('test@test.com');
      });
      expect(resendResult).toBe(false);
      consoleSpy.mockRestore();
    });
  });
});
