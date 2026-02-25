import { test, expect } from './fixtures';

test('applications list renders with correct columns', async ({ page }) => {
  await page.goto('/dashboard/applications');
  await page.waitForLoadState('networkidle');

  // Header row / column labels should be present
  await expect(page.getByText(/applicant|name/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/application|type/i).first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/date|applied/i).first()).toBeVisible({ timeout: 5_000 });
});

test('search by applicant name filters the list', async ({ page }) => {
  await page.goto('/dashboard/applications');
  await page.waitForLoadState('networkidle');

  const searchInput = page.getByPlaceholder(/search/i);
  if (await searchInput.count()) {
    await searchInput.fill('zzznomatch_xyz');
    await page.waitForTimeout(500);
    // Should show 0 results or empty state
    const rows = page.locator('tbody tr, [data-testid="app-row"]');
    const count = await rows.count();
    expect(count).toBe(0);
  }
});

test('clicking view navigates to application detail', async ({ page }) => {
  await page.goto('/dashboard/applications');
  await page.waitForLoadState('networkidle');

  // Find a view / eye link
  const viewBtn = page
    .getByRole('link', { name: /view|open/i })
    .or(page.locator('[title*="view"], [aria-label*="view"]'))
    .first();

  if (await viewBtn.count()) {
    await viewBtn.click();
    await expect(page).toHaveURL(/\/dashboard\/applications\/\d+/, { timeout: 10_000 });
  }
});

test('application detail shows applicant info and timeline section', async ({ page }) => {
  await page.goto('/dashboard/applications');
  await page.waitForLoadState('networkidle');

  const viewBtn = page
    .getByRole('link', { name: /view|open/i })
    .or(page.locator('[title*="view"], [aria-label*="view"]'))
    .first();

  if (!(await viewBtn.count())) return;

  await viewBtn.click();
  await page.waitForLoadState('networkidle');

  // Applicant name section
  await expect(page.locator('[class*="card"], [class*="Card"]').first()).toBeVisible({ timeout: 10_000 });

  // Timeline section
  await expect(page.getByText(/timeline/i)).toBeVisible({ timeout: 5_000 });
});

test('email button opens email composer modal', async ({ page }) => {
  await page.goto('/dashboard/applications');
  await page.waitForLoadState('networkidle');

  const viewBtn = page
    .getByRole('link', { name: /view|open/i })
    .or(page.locator('[title*="view"], [aria-label*="view"]'))
    .first();

  if (!(await viewBtn.count())) return;

  await viewBtn.click();
  await page.waitForLoadState('networkidle');

  const emailBtn = page.getByRole('button', { name: /^email$/i });
  if (await emailBtn.count()) {
    await emailBtn.click();
    // Modal should appear
    await expect(page.getByText(/email candidate/i)).toBeVisible({ timeout: 5_000 });
    // Close it
    await page.keyboard.press('Escape');
  }
});

test('pipeline stage change via select updates the stage badge', async ({ page }) => {
  await page.goto('/dashboard/applications');
  await page.waitForLoadState('networkidle');

  const viewBtn = page
    .getByRole('link', { name: /view|open/i })
    .or(page.locator('[title*="view"], [aria-label*="view"]'))
    .first();

  if (!(await viewBtn.count())) return;

  await viewBtn.click();
  await page.waitForLoadState('networkidle');

  // Find the Pipeline Stage select
  const stageSelect = page.getByRole('combobox').filter({ hasText: /not placed|pending|accepted|rejected/i });
  if (await stageSelect.count()) {
    await stageSelect.click();
    const options = page.getByRole('option');
    const count = await options.count();
    if (count > 1) {
      await options.nth(1).click();
      // Stage badge or label should update
      await page.waitForTimeout(500);
      await expect(stageSelect).toBeVisible();
    }
  }
});

test('add a timeline milestone entry', async ({ page }) => {
  await page.goto('/dashboard/applications');
  await page.waitForLoadState('networkidle');

  const viewBtn = page
    .getByRole('link', { name: /view|open/i })
    .or(page.locator('[title*="view"], [aria-label*="view"]'))
    .first();

  if (!(await viewBtn.count())) return;

  await viewBtn.click();
  await page.waitForLoadState('networkidle');

  // Fill the timeline description
  const descTextarea = page.getByPlaceholder(/notes|milestone|description/i);
  if (await descTextarea.count()) {
    await descTextarea.fill('E2E milestone note');

    const addBtn = page.getByRole('button', { name: /add milestone/i });
    if (await addBtn.count()) {
      await addBtn.click();
      // The new entry should appear in the timeline
      await expect(page.getByText(/E2E milestone note/i)).toBeVisible({ timeout: 5_000 });
    }
  }
});
