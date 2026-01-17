/**
 * Test Setup Configuration
 * Configures the test environment for Vitest
 */

import { beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Set test environment variables
beforeAll(() => {
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';

  // Ensure we use mock mode (no external services)
  process.env.SUPABASE_URL = '';
  process.env.SUPABASE_ANON_KEY = '';
  process.env.OPENAI_API_KEY = '';
});

// Clean up after all tests
afterAll(() => {
  // Restore any mocked modules
  vi.restoreAllMocks();
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Suppress console output during tests (optional)
// Uncomment if you want cleaner test output
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'info').mockImplementation(() => {});
