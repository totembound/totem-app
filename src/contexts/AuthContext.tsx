/**
 * Auth Context (Web2)
 *
 * Provides authentication state and methods for email/password auth.
 * This replaces the wallet-based auth from UserContext for Web2.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as AuthService from '../services/AuthService';

interface AuthUser {
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

interface LootItemInfo {
  id: string;
  boxId: string;
  boxName: string;
  boxDescription: string;
  boxRarity: string;
  boxIcon: string;
}

interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  lootItem: LootItemInfo | null;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; needsVerification?: boolean }>;
  signup: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; needsVerification?: boolean }>;
  verifyEmail: (email: string, code: string, password: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateEssence: (newBalance: number) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [lootItem, setLootItem] = useState<LootItemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // Check for stored tokens
      if (AuthService.isAuthenticated()) {
        // Try to get user profile
        try {
          const result = await AuthService.getMe();
          if (result.success && result.user) {
            setUser(result.user as AuthUser);
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear it
            AuthService.clearTokens();
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Error checking auth:', err);
          AuthService.clearTokens();
          setIsAuthenticated(false);
        }
      } else {
        // Check for stored user (for quick UI)
        const storedUser = AuthService.getStoredUser();
        if (storedUser) {
          setUser(storedUser as AuthUser);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; needsVerification?: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.login(email, password);

      if (result.success && result.user) {
        setUser(result.user as AuthUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      } else {
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          setIsLoading(false);
          return { success: false, needsVerification: true };
        }
        setError(result.error || 'Login failed');
        setIsLoading(false);
        return { success: false };
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
      return { success: false };
    }
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ success: boolean; needsVerification?: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.signup(email, password, displayName);

      if (result.success && result.needsVerification) {
        if (result.lootItem) {
          setLootItem(result.lootItem);
        }
        setIsLoading(false);
        return { success: true, needsVerification: true };
      }

      if (result.success && result.user) {
        setUser(result.user as AuthUser);
        setIsAuthenticated(true);
        if (result.lootItem) {
          setLootItem(result.lootItem);
        }
        setIsLoading(false);
        return { success: true };
      }

      setError(result.error || 'Signup failed');
      setIsLoading(false);
      return { success: false };
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
      return { success: false };
    }
  }, []);

  const verifyEmail = useCallback(async (
    email: string,
    code: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.verifyEmail(email, code, password);

      if (result.success && result.tokens) {
        if (result.user) {
          setUser(result.user as AuthUser);
        }
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      } else {
        setError(result.error || 'Verification failed');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
      return false;
    }
  }, []);

  const resendVerification = useCallback(async (email: string): Promise<boolean> => {
    try {
      const result = await AuthService.resendVerificationCode(email);
      return result.success;
    } catch (err) {
      console.error('Resend verification error:', err);
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    await AuthService.logout();

    setUser(null);
    setIsAuthenticated(false);
    setLootItem(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      const result = await AuthService.getMe();
      if (result.success && result.user) {
        setUser(result.user as AuthUser);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, [isAuthenticated]);

  const updateEssence = useCallback((newBalance: number) => {
    setUser(prev => prev ? { ...prev, currencies: { ...prev.currencies, essence: newBalance, gems: prev.currencies?.gems ?? 0 } } : prev);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        lootItem,
        error,
        login,
        signup,
        verifyEmail,
        resendVerification,
        logout,
        refreshUser,
        updateEssence,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
