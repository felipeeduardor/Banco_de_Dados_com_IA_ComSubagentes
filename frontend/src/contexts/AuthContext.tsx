/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  AuthUser,
  AuthSession,
  AuthContextValue,
  LoginCredentials,
  RegisterCredentials,
} from '../types';
import * as authService from '../services/auth';

// Create the context with undefined default
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const storedToken = authService.getStoredAccessToken();

        if (storedUser && storedToken) {
          // Verify token is still valid
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token expired, try to refresh
            const refreshed = await authService.refreshSession();
            if (refreshed) {
              setUser(refreshed.user);
              setSession(refreshed.session);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authService.clearStoredSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      setSession(result.session);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const result = await authService.register(credentials);
      setUser(result.user);
      setSession(result.session);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh session function
  const refreshSessionFn = useCallback(async () => {
    try {
      const result = await authService.refreshSession();
      if (result) {
        setUser(result.user);
        setSession(result.session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setUser(null);
      setSession(null);
    }
  }, []);

  // Context value
  const value: AuthContextValue = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshSession: refreshSessionFn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
