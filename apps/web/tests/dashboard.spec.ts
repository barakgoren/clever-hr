import { test, expect } from '@playwright/test';

test('stats cards render with numeric values', async ({ page }) => {
  await page.goto('/dashboard');
  // Stats cards should contain numbers, not blank/NaN
  const statCards = page.locator('[class*="card"], [class*="Card"]').first();
  await expect(statCards).toBeVisible({ timeout: 10_000 });

  // At least one card should contain a digit
  const cardText = await page.locator('text=/\\d+/').first().textContent({ timeout: 5_000 });
  expect(cardText).toBeTruthy();
});

test('charts render — at least one SVG is present', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const svgs = page.locator('svg');
  await expect(svgs.first()).toBeVisible({ timeout: 10_000 });
});

test('Recent Applications section is visible', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  // The heading or section label should appear
  await expect(page.getByText(/recent application/i)).toBeVisible({ timeout: 10_000 });
});
