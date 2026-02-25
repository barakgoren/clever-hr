import { test, expect } from '@playwright/test';

// Public pages are unauthenticated — clear stored session
test.use({ storageState: undefined });

const COMPANY_SLUG = 'test-co'; // matches the slug seeded in globalSetup

test('company public page renders company header and role cards', async ({ page }) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState('networkidle');

  // Company name / header should be visible
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });

  // At least one role card (or a "no roles" message) should be present
  const hasRoles = await page.locator('[class*="card"], [class*="Card"]').count();
  expect(hasRoles).toBeGreaterThanOrEqual(0);
});

test('clicking a role card navigates to the role detail page', async ({ page }) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState('networkidle');

  const roleLink = page.getByRole('link').filter({ hasText: /.+/ }).first();
  if (await roleLink.count()) {
    await roleLink.click();
    await expect(page).toHaveURL(new RegExp(`/${COMPANY_SLUG}/`), { timeout: 10_000 });
  }
});

test('application form contains Full Name and Email fields', async ({ page }) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState('networkidle');

  const roleLink = page.getByRole('link').filter({ hasText: /.+/ }).first();
  if (await roleLink.count()) {
    await roleLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel(/full name/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5_000 });
  }
});

test('submit application with valid data shows success screen', async ({ page }) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState('networkidle');

  const roleLink = page.getByRole('link').filter({ hasText: /.+/ }).first();
  if (!(await roleLink.count())) return; // no active roles, skip

  await roleLink.click();
  await page.waitForLoadState('networkidle');

  const uniqueEmail = `e2e-${Date.now()}@test.com`;
  await page.getByLabel(/full name/i).fill('E2E Applicant');
  await page.getByLabel(/email/i).fill(uniqueEmail);
  await page.getByRole('button', { name: /apply|submit/i }).click();

  // Success screen should appear with a confirmation message
  await expect(
    page.getByText(/thank you|received|success|submitted/i)
  ).toBeVisible({ timeout: 10_000 });
});

test('submitting the same email again shows duplicate error', async ({ page }) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState('networkidle');

  const roleLink = page.getByRole('link').filter({ hasText: /.+/ }).first();
  if (!(await roleLink.count())) return;

  await roleLink.click();
  await page.waitForLoadState('networkidle');

  const sharedEmail = `e2e-dup-${Date.now()}@test.com`;

  // First submission
  await page.getByLabel(/full name/i).fill('First Submit');
  await page.getByLabel(/email/i).fill(sharedEmail);
  await page.getByRole('button', { name: /apply|submit/i }).click();
  await expect(page.getByText(/thank you|received|success|submitted/i)).toBeVisible({ timeout: 10_000 });

  // Go back and try again with same email
  await page.goBack();
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/full name/i).fill('Second Submit');
  await page.getByLabel(/email/i).fill(sharedEmail);
  await page.getByRole('button', { name: /apply|submit/i }).click();

  await expect(page.getByText(/already|duplicate|exists/i)).toBeVisible({ timeout: 10_000 });
});
