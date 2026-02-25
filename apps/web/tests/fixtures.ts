/**
 * tests/fixtures.ts
 *
 * Extends Playwright's base `test` with an afterEach hook that writes the
 * current context's storageState back to the auth file after every test.
 *
 * This is required because the API uses refresh-token rotation: each
 * successful /api/auth/refresh call deletes the old token and issues a new
 * one.  Without persisting the new cookie, every subsequent test would start
 * with an already-revoked token and be redirected to /login.
 *
 * Usage: import { test, expect } from './fixtures' in spec files that use
 * authenticated routes.  Unauthenticated spec files (auth.spec.ts) keep their
 * own `test.use({ storageState: undefined })` override and can continue to
 * import directly from @playwright/test.
 */
import path from 'path';
import { test as base, expect } from '@playwright/test';

export { expect };

const AUTH_FILE = path.join(__dirname, '.auth', 'state.json');

export const test = base.extend({
  // After every test, write the updated cookies (including the rotated
  // refresh token) back to the state file so the next test starts fresh.
  page: async ({ page, context }, use) => {
    await use(page);
    try {
      await context.storageState({ path: AUTH_FILE });
    } catch {
      // Context may already be closed on test failure — safe to ignore.
    }
  },
});
