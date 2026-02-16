/**
 * AuthService tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

import {
  storeTokens,
  getStoredTokens,
  clearTokens,
  storeUser,
  getStoredUser,
  getAuthHeader,
  signup,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  login,
  logout,
  refreshToken,
  getMe,
  isAuthenticated,
  authFetch,
} from './AuthService';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(store).forEach(k => delete store[k]);
  });

  describe('token storage', () => {
    it('should store tokens in localStorage', () => {
      const tokens = { accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' };
      storeTokens(tokens);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('totembound_tokens', JSON.stringify(tokens));
    });

    it('should retrieve stored tokens', () => {
      const tokens = { accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' };
      store['totembound_tokens'] = JSON.stringify(tokens);
      expect(getStoredTokens()).toEqual(tokens);
    });

    it('should return null when no tokens stored', () => {
      expect(getStoredTokens()).toBeNull();
    });

    it('should return null for corrupted tokens', () => {
      store['totembound_tokens'] = 'bad-json';
      expect(getStoredTokens()).toBeNull();
    });

    it('should clear both tokens and user', () => {
      store['totembound_tokens'] = 'x';
      store['totembound_user'] = 'y';
      clearTokens();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('totembound_tokens');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('totembound_user');
    });
  });

  describe('user storage', () => {
    it('should store user', () => {
      const user = { id: 'u1', email: 'test@test.com', displayName: 'Test' };
      storeUser(user);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('totembound_user', JSON.stringify(user));
    });

    it('should retrieve stored user', () => {
      const user = { id: 'u1', email: 'test@test.com', displayName: 'Test' };
      store['totembound_user'] = JSON.stringify(user);
      expect(getStoredUser()).toEqual(user);
    });

    it('should return null when no user stored', () => {
      expect(getStoredUser()).toBeNull();
    });

    it('should return null for corrupted user data', () => {
      store['totembound_user'] = '{bad';
      expect(getStoredUser()).toBeNull();
    });
  });

  describe('getAuthHeader', () => {
    it('should return auth header when tokens exist', () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'my-token', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });
      expect(getAuthHeader()).toEqual({ Authorization: 'Bearer my-token' });
    });

    it('should return empty object when no tokens', () => {
      expect(getAuthHeader()).toEqual({});
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when tokens with accessToken exist', () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no tokens', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('signup', () => {
    it('should call signup endpoint and store tokens on success', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          tokens: { accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' },
          user: { id: 'u1', email: 'new@test.com', displayName: 'New' },
        }),
      });

      const result = await signup('new@test.com', 'pass123', 'New');
      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('totembound_tokens', expect.any(String));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('totembound_user', expect.any(String));

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1/auth/signup');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ email: 'new@test.com', password: 'pass123', displayName: 'New' });
    });

    it('should not store tokens when signup needs verification', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          needsVerification: true,
          message: 'Check email',
        }),
      });

      const result = await signup('new@test.com', 'pass123');
      expect(result.success).toBe(true);
      expect(result.needsVerification).toBe(true);
      // No tokens to store
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('totembound_tokens', expect.any(String));
    });
  });

  describe('verifyEmail', () => {
    it('should verify and store tokens on success', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          tokens: { accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' },
          user: { id: 'u1', email: 'test@test.com', displayName: 'Test' },
        }),
      });

      const result = await verifyEmail('test@test.com', '123456', 'pass123');
      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('totembound_tokens', expect.any(String));

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({ email: 'test@test.com', code: '123456', password: 'pass123' });
    });

    it('should return data without storing tokens on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Invalid code' }),
      });

      const result = await verifyEmail('test@test.com', '000000', 'pass123');
      expect(result.success).toBe(false);
    });
  });

  describe('resendVerificationCode', () => {
    it('should call resend endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, message: 'Code sent' }),
      });

      const result = await resendVerificationCode('test@test.com');
      expect(result.success).toBe(true);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({ email: 'test@test.com' });
    });
  });

  describe('forgotPassword', () => {
    it('should call forgot-password endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, message: 'Reset code sent' }),
      });

      const result = await forgotPassword('test@test.com');
      expect(result.success).toBe(true);

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/v1/auth/forgot-password');
    });
  });

  describe('resetPassword', () => {
    it('should call reset-password endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, message: 'Password reset' }),
      });

      const result = await resetPassword('test@test.com', '123456', 'newPass');
      expect(result.success).toBe(true);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({ email: 'test@test.com', code: '123456', newPassword: 'newPass' });
    });
  });

  describe('login', () => {
    it('should store tokens and user on success', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          tokens: { accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' },
          user: { id: 'u1', email: 'test@test.com', displayName: 'Test' },
        }),
      });

      const result = await login('test@test.com', 'pass123');
      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('totembound_tokens', expect.any(String));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('totembound_user', expect.any(String));
    });

    it('should not store tokens on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Invalid' }),
      });

      const result = await login('test@test.com', 'wrong');
      expect(result.success).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call logout endpoint and clear tokens', async () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      await logout();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('totembound_tokens');
    });

    it('should clear tokens even if API call fails', async () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('totembound_tokens');
    });

    it('should skip API call when no refresh token', async () => {
      await logout();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('totembound_tokens');
    });
  });

  describe('refreshToken', () => {
    it('should refresh and store new tokens', async () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'old', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          tokens: { accessToken: 'new-at', refreshToken: 'new-rt', idToken: 'new-it', expiresIn: 3600, tokenType: 'Bearer' },
        }),
      });

      const result = await refreshToken();
      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('totembound_tokens', expect.stringContaining('new-at'));
    });

    it('should return error when no refresh token', async () => {
      const result = await refreshToken();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No refresh token');
    });

    it('should clear tokens when refresh fails', async () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'old', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false }),
      });

      const result = await refreshToken();
      expect(result.success).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('totembound_tokens');
    });
  });

  describe('getMe', () => {
    it('should fetch user profile and store user', async () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          user: { id: 'u1', email: 'test@test.com', displayName: 'Test' },
        }),
      });

      const result = await getMe();
      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('totembound_user', expect.any(String));

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer at');
    });

    it('should not store user on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false }),
      });

      const result = await getMe();
      expect(result.success).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('totembound_user', expect.any(String));
    });
  });

  describe('authFetch', () => {
    it('should make authenticated request', async () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'at', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ data: 'ok' }),
      });

      const response = await authFetch('/v1/test');
      expect(response.status).toBe(200);
      expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer at');
    });

    it('should retry with refreshed token on 401', async () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'old', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });

      // First request: 401
      mockFetch.mockResolvedValueOnce({ status: 401, ok: false });

      // Refresh call
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          tokens: { accessToken: 'new-at', refreshToken: 'new-rt', idToken: 'new-it', expiresIn: 3600, tokenType: 'Bearer' },
        }),
      });

      // Retry succeeds
      mockFetch.mockResolvedValueOnce({ status: 200, ok: true });

      const response = await authFetch('/v1/test');
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should return 401 response if refresh fails', async () => {
      store['totembound_tokens'] = JSON.stringify({ accessToken: 'old', refreshToken: 'rt', idToken: 'it', expiresIn: 3600, tokenType: 'Bearer' });

      // First request: 401
      mockFetch.mockResolvedValueOnce({ status: 401, ok: false });

      // Refresh fails
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false }),
      });

      const response = await authFetch('/v1/test');
      expect(response.status).toBe(401);
    });
  });
});
