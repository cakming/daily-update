import { test, expect } from '@playwright/test';

/**
 * E2E smoke specs (Playwright).
 *
 * The backend must be reachable on http://localhost:5000; the frontend is
 * started automatically by playwright.config.js `webServer` (`npm run dev` on
 * :3000). In CI (.github/workflows/e2e-tests.yml) the backend is started and
 * Chromium is installed via `npx playwright install chromium`.
 *
 * Browser: the config uses Playwright's managed Chromium by default. For a
 * local run against a pre-installed binary, set PW_CHROMIUM_PATH (see
 * playwright.config.js) — no per-spec launchOptions needed.
 *
 * Selector note: the Login page (src/pages/Login.jsx) renders BOTH the Login
 * and Register tab panels in the DOM (Chakra v2 Tabs). The email/password
 * placeholders therefore appear twice, so we scope queries to a single tab
 * panel (identified by the register-only "Your name" placeholder) to avoid
 * Playwright strict-mode ambiguity.
 */

// The register panel is the only tab panel containing the "Your name" input.
const registerPanel = (page) =>
  page.getByRole('tabpanel').filter({ has: page.getByPlaceholder('Your name') });

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

    const panel = registerPanel(page);
    const uniqueEmail = `e2e.smoke.${Date.now()}@example.com`;
    await panel.getByPlaceholder('Your name').fill('E2E Smoke User');
    await panel.getByPlaceholder('your@email.com').fill(uniqueEmail);
    await panel.getByPlaceholder('••••••••').fill('TestPassword123!');

    await panel.getByRole('button', { name: /^register$/i }).click();

    // Successful registration lands on the dashboard.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});
