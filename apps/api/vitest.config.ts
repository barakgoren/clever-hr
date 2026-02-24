import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],  // runs ONCE before all test files
    setupFiles: ['./tests/envSetup.ts'],       // runs per-file (just loads env)
    singleFork: true,
    testTimeout: 15000,
  },
});
