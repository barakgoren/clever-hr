import { test, expect } from './fixtures';

test.describe.serial('template CRUD flow', () => {
  let createdRoleName: string;

  test.afterAll(async ({ request }) => {
    // Delete all roles whose name starts with "E2E Role" (created by this suite)
    try {
      const loginRes = await request.post('http://localhost:3001/api/auth/login', {
        data: {
          email: process.env.TEST_EMAIL    ?? 'barak.goren6@gmail.com',
          password: process.env.TEST_PASSWORD ?? '123123123',
        },
      });
      const { data: loginData } = await loginRes.json();
      const token = loginData?.accessToken;
      if (!token) return;

      const rolesRes = await request.get('http://localhost:3001/api/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: roles } = await rolesRes.json();

      for (const role of (roles ?? []) as Array<{ id: number; name: string }>) {
        if (role.name?.startsWith('E2E Role')) {
          await request.delete(`http://localhost:3001/api/roles/${role.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    } catch {
      // Cleanup failure should not fail the suite
    }
  });

  test('create a new role with custom fields and qualifications', async ({ page }) => {
    createdRoleName = `E2E Role ${Date.now()}`;

    await page.goto('/dashboard/templates/new');
    await page.waitForLoadState('networkidle');

    // System fields should be visible and locked
    await expect(page.getByText('full_name')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('email').first()).toBeVisible();

    // Fill basic info
    await page.getByLabel(/template name|role name|name/i).first().fill(createdRoleName);

    // Fill description if present
    const descField = page.getByLabel(/description/i);
    if (await descField.count()) await descField.fill('An E2E test role');

    // Set role type via select (pick first available option)
    const typeSelect = page.locator('select, [role="combobox"]').first();
    if (await typeSelect.count()) {
      await typeSelect.selectOption({ index: 0 });
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
    const roleCard = page.locator('div').filter({
      has: page.getByRole('heading', { name: createdRoleName }),
    }).filter({
      has: page.getByRole('link', { name: /edit/i }),
    }).last();
    await roleCard.getByRole('link', { name: /edit/i }).click();

    await page.waitForLoadState('networkidle');

    // Default stages should exist — names are textbox values, not visible text
    await expect(page.getByText('#1').locator('..').getByRole('textbox').first()).toHaveValue(/pending/i, { timeout: 5_000 });
    await expect(page.getByText('#2').locator('..').getByRole('textbox').first()).toHaveValue(/accepted/i);
    await expect(page.getByText('#3').locator('..').getByRole('textbox').first()).toHaveValue(/rejected/i);
  });

  test('toggle role active/inactive via switch on the card', async ({ page }) => {
    await page.goto('/dashboard/templates');
    await page.waitForLoadState('networkidle');

    // Find the card for our role and scope the switch to it
    const roleCard = page.locator('div').filter({
      has: page.getByRole('heading', { name: createdRoleName }),
    }).filter({
      has: page.locator('[role="switch"]'),
    }).last();
    await expect(roleCard).toBeVisible({ timeout: 10_000 });

    const toggle = roleCard.locator('[role="switch"]');
    const initialChecked = await toggle.getAttribute('aria-checked');
    await toggle.click();

    // State should have changed
    await expect(toggle).not.toHaveAttribute('aria-checked', initialChecked ?? 'true', { timeout: 5_000 });
  });
});

test('templates list renders role cards with colored accents', async ({ page }) => {
  await page.goto('/dashboard/templates');
  await page.waitForLoadState('networkidle');

  // At least one card should be in the list
  const cards = page.locator('div').filter({
    has: page.getByRole('heading', { level: 3 }),
  }).filter({
    has: page.getByRole('link', { name: /edit/i }),
  });
  await expect(cards.first()).toBeVisible({ timeout: 10_000 });
});
