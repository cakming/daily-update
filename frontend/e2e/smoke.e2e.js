import { test, expect } from '@playwright/test';

/**
 * E2E smoke specs (Playwright).
 *
 * REQUIRES BOTH SERVERS RUNNING:
 *   - backend API on http://localhost:5000
 *   - frontend dev server on http://localhost:3000 (playwright.config.js
 *     starts `npm run dev` via its `webServer` block and uses baseURL :3000)
 * These specs are NOT run in the CI/test session here because no servers are
 * available; they are authored to be run manually / in an environment that has
 * both processes up.
 *
 * BROWSER EXECUTABLE:
 *   The Playwright package installed here expects a newer Chromium build than
 *   the one pre-installed in this environment, so we pin the executable to the
 *   pre-installed binary. If you run these where Playwright's own managed
 *   browser is available, you can drop this `test.use(...)` block.
 *   (We deliberately do not edit playwright.config.js to add this globally.)
 */
test.use({
  launchOptions: {
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  },
});

test.describe('Smoke', () => {
  test('loads /login and shows the app title', async ({ page }) => {
    await page.goto('/login');

    // The Login page renders the "Daily Update App" heading.
    await expect(
      page.getByRole('heading', { name: 'Daily Update App' })
    ).toBeVisible();

    // Login/Register tabs are present.
    await expect(page.getByRole('tab', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /register/i })).toBeVisible();
  });

  test('register -> dashboard happy path', async ({ page }) => {
    await page.goto('/login');

    // Switch to the Register tab.
    await page.getByRole('tab', { name: /register/i }).click();

    const uniqueEmail = `e2e.smoke.${Date.now()}@example.com`;
    await page.getByLabel(/name/i).fill('E2E Smoke User');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    // Password label appears on both tabs; scope to the visible register panel.
    await page.getByLabel(/password/i).first().fill('TestPassword123!');

    await page.getByRole('button', { name: /^register$/i }).click();

    // Successful registration lands on the dashboard.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});
