/**
 * Authentication Service
 * Handles user authentication using Supabase Auth
 */

import { getClient, isConfigured, isDemoMode } from '../config/supabase.js';
import type {
  AuthUser,
  AuthSession,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from '../types/index.js';

// Demo mode mock users storage (in-memory for demo purposes)
const mockUsers: Map<string, { id: string; email: string; password: string; created_at: string }> = new Map();
const mockSessions: Map<string, { user_id: string; expires_at: number }> = new Map();

// Initialize with a demo user
mockUsers.set('demo@example.com', {
  id: 'demo-user-001',
  email: 'demo@example.com',
  password: 'demo123',
  created_at: new Date().toISOString(),
});

/**
 * Generate a mock token for demo mode
 */
function generateMockToken(userId: string): string {
  const payload = {
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + 3600000, // 1 hour
  };
  return `mock_token_${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
}

/**
 * Validate mock token and extract user ID
 */
function validateMockToken(token: string): string | null {
  if (!token.startsWith('mock_token_')) {
    return null;
  }

  try {
    const base64Payload = token.replace('mock_token_', '');
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

    if (payload.exp < Date.now()) {
      return null; // Token expired
    }

    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * Register a new user
 */
export async function signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
  const { email, password, name } = credentials;

  // Demo mode - use mock storage
  if (isDemoMode()) {
    if (mockUsers.has(email)) {
      return {
        user: null,
        session: null,
        error: 'Usuario ja existe com este email',
      };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password,
      created_at: new Date().toISOString(),
    };

    mockUsers.set(email, newUser);

    const token = generateMockToken(newUser.id);
    const expiresAt = Date.now() + 3600000;
    mockSessions.set(token, { user_id: newUser.id, expires_at: expiresAt });

    const user: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      created_at: newUser.created_at,
      user_metadata: name ? { name } : undefined,
    };

    const session: AuthSession = {
      access_token: token,
      refresh_token: `refresh_${token}`,
      expires_in: 3600,
      expires_at: expiresAt,
      token_type: 'bearer',
      user,
    };

    console.info(`[Auth] Modo DEMO: Usuario ${email} registrado`);
    return { user, session };
  }

  // Production mode - use Supabase Auth
  const client = getClient();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Servico de autenticacao nao disponivel',
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: name ? { name } : undefined,
      },
    });

    if (error) {
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        user: null,
        session: null,
        error: 'Falha ao criar usuario',
      };
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || email,
      created_at: data.user.created_at,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata,
    };

    const session: AuthSession | null = data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
          user,
        }
      : null;

    return { user, session };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Auth] Erro no registro:', message);
    return {
      user: null,
      session: null,
      error: message,
    };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(credentials: LoginCredentials): Promise<AuthResponse> {
  const { email, password } = credentials;

  // Demo mode - use mock storage
  if (isDemoMode()) {
    const mockUser = mockUsers.get(email);

    if (!mockUser || mockUser.password !== password) {
      return {
        user: null,
        session: null,
        error: 'Email ou senha invalidos',
      };
    }

    const token = generateMockToken(mockUser.id);
    const expiresAt = Date.now() + 3600000;
    mockSessions.set(token, { user_id: mockUser.id, expires_at: expiresAt });

    const user: AuthUser = {
      id: mockUser.id,
      email: mockUser.email,
      created_at: mockUser.created_at,
    };

    const session: AuthSession = {
      access_token: token,
      refresh_token: `refresh_${token}`,
      expires_in: 3600,
      expires_at: expiresAt,
      token_type: 'bearer',
      user,
    };

    console.info(`[Auth] Modo DEMO: Usuario ${email} autenticado`);
    return { user, session };
  }

  // Production mode - use Supabase Auth
  const client = getClient();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Servico de autenticacao nao disponivel',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }

    if (!data.user || !data.session) {
      return {
        user: null,
        session: null,
        error: 'Falha na autenticacao',
      };
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || email,
      created_at: data.user.created_at,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata,
    };

    const session: AuthSession = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      token_type: data.session.token_type,
      user,
    };

    return { user, session };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Auth] Erro no login:', message);
    return {
      user: null,
      session: null,
      error: message,
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(accessToken: string): Promise<{ error?: string }> {
  // Demo mode - remove from mock sessions
  if (isDemoMode()) {
    mockSessions.delete(accessToken);
    console.info('[Auth] Modo DEMO: Usuario deslogado');
    return {};
  }

  // Production mode - use Supabase Auth
  const client = getClient();
  if (!client) {
    return { error: 'Servico de autenticacao nao disponivel' };
  }

  try {
    const { error } = await client.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Auth] Erro no logout:', message);
    return { error: message };
  }
}

/**
 * Get user from access token
 */
export async function getUser(accessToken: string): Promise<AuthResponse> {
  // Demo mode - validate mock token
  if (isDemoMode()) {
    const userId = validateMockToken(accessToken);

    if (!userId) {
      return {
        user: null,
        session: null,
        error: 'Token invalido ou expirado',
      };
    }

    // Find user by ID
    const mockUser = Array.from(mockUsers.values()).find((u) => u.id === userId);

    if (!mockUser) {
      return {
        user: null,
        session: null,
        error: 'Usuario nao encontrado',
      };
    }

    const user: AuthUser = {
      id: mockUser.id,
      email: mockUser.email,
      created_at: mockUser.created_at,
    };

    return { user, session: null };
  }

  // Production mode - use Supabase Auth
  const client = getClient();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Servico de autenticacao nao disponivel',
    };
  }

  try {
    const { data, error } = await client.auth.getUser(accessToken);

    if (error) {
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        user: null,
        session: null,
        error: 'Usuario nao encontrado',
      };
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || '',
      created_at: data.user.created_at,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata,
    };

    return { user, session: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Auth] Erro ao obter usuario:', message);
    return {
      user: null,
      session: null,
      error: message,
    };
  }
}

/**
 * Refresh the session with a refresh token
 */
export async function refreshSession(refreshToken: string): Promise<AuthResponse> {
  // Demo mode - generate new token
  if (isDemoMode()) {
    // Extract user from refresh token (mock implementation)
    if (!refreshToken.startsWith('refresh_mock_token_')) {
      return {
        user: null,
        session: null,
        error: 'Refresh token invalido',
      };
    }

    const originalToken = refreshToken.replace('refresh_', '');
    const userId = validateMockToken(originalToken);

    if (!userId) {
      return {
        user: null,
        session: null,
        error: 'Refresh token expirado',
      };
    }

    const mockUser = Array.from(mockUsers.values()).find((u) => u.id === userId);

    if (!mockUser) {
      return {
        user: null,
        session: null,
        error: 'Usuario nao encontrado',
      };
    }

    const newToken = generateMockToken(mockUser.id);
    const expiresAt = Date.now() + 3600000;
    mockSessions.set(newToken, { user_id: mockUser.id, expires_at: expiresAt });

    const user: AuthUser = {
      id: mockUser.id,
      email: mockUser.email,
      created_at: mockUser.created_at,
    };

    const session: AuthSession = {
      access_token: newToken,
      refresh_token: `refresh_${newToken}`,
      expires_in: 3600,
      expires_at: expiresAt,
      token_type: 'bearer',
      user,
    };

    console.info('[Auth] Modo DEMO: Sessao renovada');
    return { user, session };
  }

  // Production mode - use Supabase Auth
  const client = getClient();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Servico de autenticacao nao disponivel',
    };
  }

  try {
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }

    if (!data.user || !data.session) {
      return {
        user: null,
        session: null,
        error: 'Falha ao renovar sessao',
      };
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || '',
      created_at: data.user.created_at,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata,
    };

    const session: AuthSession = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      token_type: data.session.token_type,
      user,
    };

    return { user, session };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Auth] Erro ao renovar sessao:', message);
    return {
      user: null,
      session: null,
      error: message,
    };
  }
}

/**
 * Verify if a token is valid
 */
export async function verifyToken(accessToken: string): Promise<boolean> {
  const result = await getUser(accessToken);
  return result.user !== null;
}

/**
 * Check if auth service is available
 */
export function isAuthConfigured(): boolean {
  return isConfigured() || isDemoMode();
}

/**
 * Get auth mode (demo or production)
 */
export function getAuthMode(): 'demo' | 'production' {
  return isDemoMode() ? 'demo' : 'production';
}

export default {
  signUp,
  signIn,
  signOut,
  getUser,
  refreshSession,
  verifyToken,
  isAuthConfigured,
  getAuthMode,
};
