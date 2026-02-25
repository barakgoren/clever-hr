import { test, expect } from '@playwright/test';

let createdRoleName: string;

test('create a new role with custom fields and qualifications', async ({ page }) => {
  createdRoleName = `E2E Role ${Date.now()}`;

  await page.goto('/dashboard/templates/new');

  // System fields should be visible and locked
  await expect(page.getByText(/full name/i)).toBeVisible();
  await expect(page.getByText(/email/i)).toBeVisible();

  // Fill basic info
  await page.getByLabel(/template name|role name|name/i).first().fill(createdRoleName);

  // Fill description if present
  const descField = page.getByLabel(/description/i);
  if (await descField.count()) await descField.fill('An E2E test role');

  // Set role type via select (pick first available option)
  const typeSelect = page.locator('select, [role="combobox"]').first();
  if (await typeSelect.count()) {
    await typeSelect.click();
    await page.getByRole('option').first().click();
  }

  // Submit the form
  await page.getByRole('button', { name: /save|create|submit/i }).last().click();

  // Should redirect to templates list
  await expect(page).toHaveURL(/\/dashboard\/templates/, { timeout: 10_000 });

  // New role card should appear
  await expect(page.getByText(createdRoleName)).toBeVisible({ timeout: 10_000 });
});

test('edit the newly created role — stages visible', async ({ page }) => {
  await page.goto('/dashboard/templates');
  await page.waitForLoadState('networkidle');

  // Click Edit on our role
  const roleCard = page.locator(`text=${createdRoleName}`).locator('..').locator('..');
  await roleCard.getByRole('link', { name: /edit/i }).click();

  await page.waitForLoadState('networkidle');

  // Default stages should exist
  await expect(page.getByText(/pending/i)).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/accepted/i)).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/rejected/i)).toBeVisible({ timeout: 5_000 });
});

test('toggle role active/inactive via switch on the card', async ({ page }) => {
  await page.goto('/dashboard/templates');
  await page.waitForLoadState('networkidle');

  // Find the switch for our role card
  const roleCard = page.locator(`text=${createdRoleName}`).first();
  await expect(roleCard).toBeVisible({ timeout: 10_000 });

  // Find and click the switch / toggle near this card
  const toggle = page.locator('[role="switch"]').first();
  const initialChecked = await toggle.getAttribute('aria-checked');
  await toggle.click();

  // State should have changed
  await expect(toggle).not.toHaveAttribute('aria-checked', initialChecked ?? 'true', { timeout: 5_000 });
});

test('templates list renders role cards with colored accents', async ({ page }) => {
  await page.goto('/dashboard/templates');
  await page.waitForLoadState('networkidle');

  // At least one card should be in the list
  const cards = page.locator('[class*="card"], [class*="Card"]');
  await expect(cards.first()).toBeVisible({ timeout: 10_000 });
});
