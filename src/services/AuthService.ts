/**
 * Auth Service
 *
 * Handles authentication API calls for Web2 email/password auth.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  tier?: string;
  currencies?: {
    essence: number;
    gems: number;
  };
  stats?: {
    totalTotems: number;
    totalChallengesCompleted: number;
    loginStreak: number;
    lastLoginDate: string;
  };
  settings?: {
    notifications: boolean;
    darkMode: string;
  };
  createdAt?: string;
}

export interface LootItemInfo {
  id: string;
  boxId: string;
  boxName: string;
  boxDescription: string;
  boxRarity: string;
  boxIcon: string;
}

export interface SignupResponse {
  success: boolean;
  message?: string;
  needsVerification?: boolean;
  user?: User;
  lootItem?: LootItemInfo;
  tokens?: AuthTokens;
  error?: string;
}

export interface VerifyResponse {
  success: boolean;
  message?: string;
  user?: User;
  tokens?: AuthTokens;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  isNewUser?: boolean;
  lootItem?: LootItemInfo;
  error?: string;
}

export interface RefreshResponse {
  success: boolean;
  tokens?: AuthTokens;
  error?: string;
}

export interface MeResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Token storage keys
const TOKEN_STORAGE_KEY = 'totembound_tokens';
const USER_STORAGE_KEY = 'totembound_user';

/**
 * Store tokens securely
 */
export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

/**
 * Get stored tokens
 */
export function getStoredTokens(): AuthTokens | null {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Store user data
 */
export function storeUser(user: User): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Get stored user
 */
export function getStoredUser(): User | null {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Get authorization header
 */
export function getAuthHeader(): Record<string, string> {
  const tokens = getStoredTokens();
  if (!tokens?.idToken) return {};
  return { Authorization: tokens.idToken };
}

/**
 * Sign up a new user
 */
export async function signup(
  email: string,
  password: string,
  displayName?: string
): Promise<SignupResponse> {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });

  const data = await response.json();

  // Signup no longer returns tokens — user must verify email first
  if (data.success && data.tokens) {
    storeTokens(data.tokens);
    if (data.user) {
      storeUser(data.user);
    }
  }

  return data;
}

/**
 * Verify email with verification code
 */
export async function verifyEmail(
  email: string,
  code: string,
  password: string
): Promise<VerifyResponse> {
  const response = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, password }),
  });

  const data = await response.json();

  if (data.success && data.tokens) {
    storeTokens(data.tokens);
    if (data.user) {
      storeUser(data.user);
    }
  }

  return data;
}

/**
 * Resend email verification code
 */
export async function resendVerificationCode(
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  return response.json();
}

/**
 * Request a password reset code
 */
export async function forgotPassword(
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  return response.json();
}

/**
 * Reset password with code from email
 */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });

  return response.json();
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success && data.tokens) {
    storeTokens(data.tokens);
    if (data.user) {
      storeUser(data.user);
    }
  }

  return data;
}

/**
 * Logout - revoke refresh token
 */
export async function logout(): Promise<void> {
  const tokens = getStoredTokens();

  if (tokens?.refreshToken) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
  }

  clearTokens();
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<RefreshResponse> {
  const tokens = getStoredTokens();

  if (!tokens?.refreshToken) {
    return { success: false, error: 'No refresh token' };
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  const data = await response.json();

  if (data.success && data.tokens) {
    storeTokens(data.tokens);
  } else {
    // Refresh failed, clear tokens
    clearTokens();
  }

  return data;
}

/**
 * Get current user profile
 */
export async function getMe(): Promise<MeResponse> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  const data = await response.json();

  if (data.success && data.user) {
    storeUser(data.user);
  }

  return data;
}

/**
 * Exchange OAuth authorization code for tokens
 */
export async function handleOAuthCallback(
  provider: string,
  code: string,
  redirectUri: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/oauth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, code, redirectUri }),
  });

  const data = await response.json();

  if (data.success && data.tokens) {
    storeTokens(data.tokens);
    if (data.user) {
      storeUser(data.user);
    }
  }

  return data;
}

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  const tokens = getStoredTokens();
  return !!tokens?.accessToken;
}

/**
 * Make an authenticated API request
 */
export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshResult = await refreshToken();

    if (refreshResult.success) {
      // Retry with new token
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...getAuthHeader(),
        },
      });
    }
  }

  return response;
}
