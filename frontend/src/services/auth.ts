/**
 * Authentication Service
 * Handles API calls for authentication
 */

import { apiClient } from './api';
import type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
} from '../types';

// Storage keys
const ACCESS_TOKEN_KEY = 'propia_access_token';
const REFRESH_TOKEN_KEY = 'propia_refresh_token';
const USER_KEY = 'propia_user';

// ============================================
// Token Management
// ============================================

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function storeSession(session: AuthSession): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearStoredSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ============================================
// API Calls
// ============================================

interface AuthApiResponse {
  success: boolean;
  data: {
    user: AuthUser;
    session: AuthSession;
    message?: string;
  };
  timestamp: string;
}

/**
 * Register a new user
 */
export async function register(credentials: RegisterCredentials): Promise<{
  user: AuthUser;
  session: AuthSession;
}> {
  const response = await apiClient.post<AuthApiResponse>('/api/auth/register', credentials);

  const { user, session } = response.data.data;
  storeSession(session);

  return { user, session };
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<{
  user: AuthUser;
  session: AuthSession;
}> {
  const response = await apiClient.post<AuthApiResponse>('/api/auth/login', credentials);

  const { user, session } = response.data.data;
  storeSession(session);

  return { user, session };
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    // Even if API call fails, clear local storage
    console.warn('Logout API call failed, clearing local storage anyway');
  } finally {
    clearStoredSession();
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredAccessToken();
  if (!token) return null;

  try {
    const response = await apiClient.get<{ success: boolean; data: { user: AuthUser } }>(
      '/api/auth/me'
    );
    return response.data.data.user;
  } catch (error) {
    // Token might be expired
    clearStoredSession();
    return null;
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<{
  user: AuthUser;
  session: AuthSession;
} | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await apiClient.post<AuthApiResponse>('/api/auth/refresh', {
      refresh_token: refreshToken,
    });

    const { user, session } = response.data.data;
    storeSession(session);

    return { user, session };
  } catch (error) {
    clearStoredSession();
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getStoredAccessToken();
}

/**
 * Get auth status from API
 */
export async function getAuthStatus(): Promise<{
  mode: 'demo' | 'production';
  configured: boolean;
  message: string;
}> {
  const response = await apiClient.get<{
    success: boolean;
    data: { mode: string; configured: boolean; message: string };
  }>('/api/auth/status');

  return {
    mode: response.data.data.mode as 'demo' | 'production',
    configured: response.data.data.configured,
    message: response.data.data.message,
  };
}

export default {
  register,
  login,
  logout,
  getCurrentUser,
  refreshSession,
  isAuthenticated,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  storeSession,
  clearStoredSession,
  getAuthStatus,
};
