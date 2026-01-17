import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Enable globals like describe, it, expect
    globals: true,
    // Environment to run tests
    environment: 'node',
    // Setup files to run before tests
    setupFiles: ['./src/test/setup.ts'],
    // Include patterns for test files
    include: ['src/**/*.test.ts'],
    // Exclude patterns
    exclude: ['node_modules', 'dist'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**/*', 'src/types/**/*'],
    },
    // Timeout for each test
    testTimeout: 10000,
    // Hook timeout
    hookTimeout: 10000,
    // Isolate each test file
    isolate: true,
    // Reporter for test output
    reporters: ['verbose'],
  },
})
