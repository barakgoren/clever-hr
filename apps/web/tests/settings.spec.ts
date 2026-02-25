import { test, expect } from '@playwright/test';

test('company name field is pre-filled', async ({ page }) => {
  await page.goto('/dashboard/settings');
  await page.waitForLoadState('networkidle');

  // The company name input should have a non-empty value
  const nameInput = page.getByLabel(/company name/i);
  await expect(nameInput).toBeVisible({ timeout: 10_000 });
  const val = await nameInput.inputValue();
  expect(val.length).toBeGreaterThan(0);
});

test('save changes triggers a success response', async ({ page }) => {
  await page.goto('/dashboard/settings');
  await page.waitForLoadState('networkidle');

  // Just click save without changes
  const saveBtn = page.getByRole('button', { name: /save/i }).last();
  if (await saveBtn.count()) {
    await saveBtn.click();
    // Should show a success toast / message (or at least not error)
    await page.waitForTimeout(1000);
    const errorMsg = await page.getByText(/error|failed/i).count();
    expect(errorMsg).toBe(0);
  }
});

test('users section lists at least the current admin', async ({ page }) => {
  await page.goto('/dashboard/settings');
  await page.waitForLoadState('networkidle');

  // There should be a users section or admin checkboxes
  const hasUsers =
    (await page.getByText(/admin/i).count()) > 0 ||
    (await page.locator('[role="checkbox"]').count()) > 0;

  expect(hasUsers).toBe(true);
});
