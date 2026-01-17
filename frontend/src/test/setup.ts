/**
 * Vitest Test Setup for Frontend
 * Configures testing environment with necessary mocks
 */

import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';

// ============================================
// Window API Mocks
// ============================================

// Mock matchMedia - Required for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver - Required for responsive layouts
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// Mock IntersectionObserver - Required for lazy loading
class IntersectionObserverMock {
  root = null;
  rootMargin = '';
  thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock scrollIntoView - Required for scroll behavior
Element.prototype.scrollIntoView = vi.fn();

// Mock scrollTo
window.scrollTo = vi.fn();

// ============================================
// Fetch Mock
// ============================================

// Global fetch mock with default implementation
const mockFetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

Object.defineProperty(global, 'fetch', {
  writable: true,
  value: mockFetch,
});

// ============================================
// Storage Mocks
// ============================================

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
});

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
});

// ============================================
// URL Mock
// ============================================

Object.defineProperty(window, 'URL', {
  writable: true,
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// ============================================
// Console Mocks (optional, for cleaner test output)
// ============================================

const originalConsole = { ...console };

// Suppress console warnings/errors in tests unless needed
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// ============================================
// Test Helpers
// ============================================

/**
 * Creates a mock API response
 */
export function createMockResponse<T>(data: T, options?: {
  status?: number;
  ok?: boolean;
}) {
  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
  };
}

/**
 * Waits for a given time
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resets the fetch mock to default behavior
 */
export function resetFetchMock() {
  mockFetch.mockReset();
  mockFetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
    })
  );
}

export { mockFetch };
