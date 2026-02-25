import { test, expect } from '@playwright/test';

// Auth spec runs without a saved session so we can test the unauthenticated state
test.use({ storageState: undefined });

test('visiting / while unauthenticated redirects to /login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

test('visiting /dashboard while unauthenticated redirects to /login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('nobody@example.com');
  await page.getByLabel(/password/i).fill('wrongpassword');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  // An error message should appear (text may vary)
  await expect(page.getByText(/invalid|incorrect|wrong|error/i)).toBeVisible({ timeout: 5_000 });
});

test('login with valid credentials redirects to dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@test-co.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
});

test('logout clears session and redirects to /login', async ({ page }) => {
  // Log in first
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@test-co.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  // Find and click logout / sign out
  await page.getByRole('button', { name: /sign out|logout/i }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
});
