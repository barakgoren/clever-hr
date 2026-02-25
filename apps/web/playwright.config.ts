import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  workers: 1, // serial to avoid race conditions against the shared DB
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    headless: false,           // visible browser as requested
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: 'tests/.auth/state.json', // reuse login session
  },

  // Auto-start dev servers if they are not already running
  webServer: [
    {
      command: "sh -c 'cd ../api && npx ts-node src/index.ts'",
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],

  projects: [
    // 1. Global setup — logs in and saves session
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
      use: { storageState: undefined },
    },
    // 2. All spec files reuse the saved session
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
