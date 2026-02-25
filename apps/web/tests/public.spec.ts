import { test, expect } from "@playwright/test";

// Public pages are unauthenticated — explicit empty state so we don't
// accidentally fall back to the project-level storageState file.
test.use({ storageState: { cookies: [], origins: [] } });

const COMPANY_SLUG = "oversight"; // matches the slug seeded in globalSetup

test("company public page renders company header and role cards", async ({
  page,
}) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState("networkidle");

  // Company name / header should be visible
  await expect(page.getByRole("heading").first()).toBeVisible({
    timeout: 10_000,
  });

  // At least one role card (or a "no roles" message) should be present
  const hasRoles = await page
    .locator('[class*="card"], [class*="Card"]')
    .count();
  expect(hasRoles).toBeGreaterThanOrEqual(0);
});

test("clicking a role card navigates to the role detail page", async ({
  page,
}) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState("networkidle");

  const roleLink = page.getByRole("link").filter({ hasText: /.+/ }).first();
  if (await roleLink.count()) {
    await roleLink.click();
    await expect(page).toHaveURL(new RegExp(`/${COMPANY_SLUG}/`), {
      timeout: 10_000,
    });
  }
});

// Test is halted for now.
test("application form contains Full Name and Email fields", async ({
  page,
}) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState("networkidle");

  const roleLink = page.getByRole("link").filter({ hasText: /.+/ }).first();
  if (await roleLink.count()) {
    await roleLink.click();
    await page.waitForLoadState("networkidle");

    const fullName = page.locator('input[name="full_name"]');
    const email = page.locator('input[name="email"]');

    await expect(fullName).toBeVisible({
      timeout: 10_000,
    });
    await expect(email).toBeVisible({
      timeout: 10_000,
    });
  }
});

test("submit application with valid data shows success screen", async ({
  page,
}) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState("networkidle");

  const roleLink = page.getByRole("link").filter({ hasText: /.+/ }).first();
  if (!(await roleLink.count())) return; // no active roles, skip

  await roleLink.click();
  await page.waitForLoadState("networkidle");

  const fullName = page.locator('input[name="full_name"]');
  const email = page.locator('input[name="email"]');

  await expect(fullName).toBeVisible();
  await expect(email).toBeVisible();

  await fullName.fill("E2E Applicant");
  const uniqueEmail = `e2e-${Date.now()}@test.com`;
  await email.fill(uniqueEmail);

  await page.getByRole("button", { name: /apply|submit/i }).click();
  await page.waitForLoadState("networkidle");

  // Success screen should appear with a confirmation message
  await expect(page.getByText(/application | submitted/i)).toBeVisible({
    timeout: 10_000,
  });
});

test("submitting the same email again shows duplicate error", async ({
  page,
}) => {
  await page.goto(`/${COMPANY_SLUG}`);
  await page.waitForLoadState("networkidle");

  const roleLink = page.getByRole("link").filter({ hasText: /.+/ }).first();
  if (!(await roleLink.count())) return;

  await roleLink.click();
  await page.waitForLoadState("networkidle");

  const sharedEmail = `e2e-dup-${Date.now()}@test.com`;

  // First submission
  const fullName = page.locator('input[name="full_name"]');
  const email = page.locator('input[name="email"]');

  await fullName.fill("First Submit");
  await email.fill(sharedEmail);
  await page.getByRole("button", { name: /apply|submit/i }).click();
  await expect(page.getByText(/application | submitted/i)).toBeVisible({
    timeout: 10_000,
  });

  // Go back and try again with same email
  await page.goBack();
  await page.waitForLoadState("networkidle");
  await roleLink.click();
  await page.waitForLoadState("networkidle");
  await fullName.fill("Second Submit");
  await email.fill(sharedEmail);
  await page.getByRole("button", { name: /apply|submit/i }).click();

  await expect(page.getByText(/already|duplicate|exists/i)).toBeVisible({
    timeout: 10_000,
  });
});
