/**
 * Supabase Client Configuration
 * Provides database connectivity with fallback to mock mode
 *
 * Mode Detection:
 * - PRODUCTION: When SUPABASE_URL and SUPABASE_ANON_KEY are both set
 * - DEMO/MOCK: When either variable is missing or empty
 *
 * The application gracefully handles both modes, allowing development
 * and demos without requiring a Supabase database connection.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || '';

// Singleton instance
let supabaseClient: SupabaseClient | null = null;

// Track if we've already logged the mode message
let modeLogged = false;

/**
 * Check if Supabase is properly configured
 * Both URL and ANON_KEY must be present and valid
 */
export function isConfigured(): boolean {
  // URL must start with https:// and be a valid Supabase URL
  const isValidUrl = SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.includes('.supabase.co');

  // Key must be present and have minimum length (JWT tokens are long)
  const isValidKey = SUPABASE_ANON_KEY.length > 50;

  return isValidUrl && isValidKey;
}

/**
 * Get the Supabase client instance
 * Returns null if not configured (enabling mock mode)
 */
export function getClient(): SupabaseClient | null {
  if (!isConfigured()) {
    // Only log the warning once to avoid console spam
    if (!modeLogged) {
      console.info(
        '[Supabase] Modo DEMO ativado. Credenciais nao configuradas ou invalidas.'
      );
      console.info(
        '[Supabase] Para usar banco real, configure SUPABASE_URL e SUPABASE_ANON_KEY no .env'
      );
      modeLogged = true;
    }
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-application-name': 'ai-data-assistant',
          },
        },
      });
      console.info('[Supabase] Cliente inicializado com sucesso.');
      console.info(`[Supabase] URL: ${SUPABASE_URL.substring(0, 30)}...`);
      modeLogged = true;
    } catch (error) {
      console.error('[Supabase] Erro ao criar cliente:', error);
      return null;
    }
  }

  return supabaseClient;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  if (!isConfigured()) {
    return {
      connected: false,
      message: 'Supabase nao configurado. Usando dados mock.',
    };
  }

  try {
    const client = getClient();
    if (!client) {
      return {
        connected: false,
        message: 'Cliente Supabase nao disponivel.',
      };
    }

    // Simple query to test connection
    const { error } = await client.from('_test_connection').select('*').limit(1);

    // If table doesn't exist, that's fine - connection still works
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }

    return {
      connected: true,
      message: 'Conexao com Supabase estabelecida com sucesso.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Supabase] Erro de conexao:', errorMessage);
    return {
      connected: false,
      message: `Erro ao conectar: ${errorMessage}`,
    };
  }
}

/**
 * Execute a raw SQL query using Supabase RPC
 * Note: Requires a database function to be set up for raw SQL execution
 */
export async function executeRawSQL(
  sql: string,
  _params?: Record<string, unknown>
): Promise<{ data: unknown[] | null; error: Error | null }> {
  const client = getClient();

  if (!client) {
    return {
      data: null,
      error: new Error('Supabase nao configurado. Use modo mock.'),
    };
  }

  try {
    // Try to use RPC function for raw SQL (if available)
    const { data, error } = await client.rpc('execute_sql', { query: sql });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as unknown[], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
    };
  }
}

/**
 * Get configuration status for health checks
 */
export function getConfigStatus(): {
  configured: boolean;
  url: string;
  mode: 'production' | 'demo';
  details: {
    hasUrl: boolean;
    hasKey: boolean;
    urlValid: boolean;
    keyValid: boolean;
  };
} {
  const hasUrl = Boolean(SUPABASE_URL);
  const hasKey = Boolean(SUPABASE_ANON_KEY);
  const urlValid = SUPABASE_URL.startsWith('https://') && SUPABASE_URL.includes('.supabase.co');
  const keyValid = SUPABASE_ANON_KEY.length > 50;

  return {
    configured: isConfigured(),
    url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'Nao configurado',
    mode: isConfigured() ? 'production' : 'demo',
    details: {
      hasUrl,
      hasKey,
      urlValid: hasUrl && urlValid,
      keyValid: hasKey && keyValid,
    },
  };
}

/**
 * Reset the client (useful for testing or reconfiguration)
 */
export function resetClient(): void {
  supabaseClient = null;
  modeLogged = false;
}

/**
 * Check if running in demo mode
 */
export function isDemoMode(): boolean {
  return !isConfigured();
}

export default {
  getClient,
  isConfigured,
  isDemoMode,
  testConnection,
  executeRawSQL,
  getConfigStatus,
  resetClient,
};
