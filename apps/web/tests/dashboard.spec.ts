import { test, expect } from './fixtures';

test('stats cards render with numeric values', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  // Stats cards should contain numbers, not blank/NaN
  // Cards are plain divs (Tailwind) — locate by their numeric value paragraph
  const statCard = page.locator('div').filter({
    has: page.locator('p', { hasText: /^\d+$/ }),
  }).first();
  await expect(statCard).toBeVisible({ timeout: 10_000 });

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
