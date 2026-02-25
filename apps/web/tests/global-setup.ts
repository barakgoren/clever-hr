/**
 * global-setup.ts
 *
 * Logs in once as the default admin user and saves the browser storage state
 * so every subsequent spec file can reuse the authenticated session without
 * repeating the login flow.
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, '.auth/state.json');

setup('authenticate', async ({ page }) => {
  // Ensure the .auth directory exists
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.TEST_EMAIL ?? 'barak.goren6@gmail.com');
  await page.getByLabel(/password/i).fill(process.env.TEST_PASSWORD ?? '123123123');
  await page.getByRole('button', { name: /sign in|login/i }).click();

  // Wait until we land on the dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
