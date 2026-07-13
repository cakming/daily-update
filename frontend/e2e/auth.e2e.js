import { test, expect } from '@playwright/test';

/**
 * E2E tests for authentication flows
 * Tests user registration, login, and logout.
 *
 * The Login page (src/pages/Login.jsx) uses Chakra v2 Tabs and renders BOTH the
 * Login and Register panels in the DOM, so the email/password placeholders
 * appear twice. We scope queries to a single tab panel to avoid strict-mode
 * ambiguity. The register panel is identified by its unique "Your name" input;
 * the login panel is the other one.
 */

const registerPanel = (page) =>
  page.getByRole('tabpanel').filter({ has: page.getByPlaceholder('Your name') });
const loginPanel = (page) =>
  page.getByRole('tabpanel').filter({ hasNot: page.getByPlaceholder('Your name') });

async function registerViaUi(page, { name, email, password }) {
  await page.getByRole('tab', { name: /register/i }).click();
  const panel = registerPanel(page);
  await panel.getByPlaceholder('Your name').fill(name);
  await panel.getByPlaceholder('your@email.com').fill(email);
  await panel.getByPlaceholder('••••••••').fill(password);
  await panel.getByRole('button', { name: /^register$/i }).click();
}

async function loginViaUi(page, { email, password }) {
  await page.getByRole('tab', { name: /login/i }).click();
  const panel = loginPanel(page);
  await panel.getByPlaceholder('your@email.com').fill(email);
  await panel.getByPlaceholder('••••••••').fill(password);
  await panel.getByRole('button', { name: /^login$/i }).click();
}

test.describe('Authentication Flow', () => {
  const testUser = {
    name: 'E2E Test User',
    email: `e2e.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should allow user to register, login, and access dashboard', async ({ page }) => {
    // Should start at login page (or be redirected there)
    await expect(page).toHaveURL(/\/login/);

    // Use a unique email per attempt so CI retries don't collide with an
    // already-registered user.
    await registerViaUi(page, {
      ...testUser,
      email: `e2e.test.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
    });

    // Should be redirected to dashboard after successful registration
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify user is logged in by checking for a dashboard element.
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow registered user to login', async ({ page }) => {
    // First, register a user
    await page.goto('/login');

    const creds = {
      name: 'Login Test User',
      email: `login.test.${Date.now()}@example.com`,
      password: testUser.password,
    };
    await registerViaUi(page, creds);

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Now test login with the registered credentials
    await loginViaUi(page, creds);

    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should reject invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with invalid credentials.
    await loginViaUi(page, {
      email: 'invalid@example.com',
      password: 'WrongPassword123',
    });

    // The backend returns 401; the app's axios response interceptor
    // (src/services/api.js) clears any stored auth and redirects to /login on a
    // 401. So the observable, meaningful outcome is that access is denied: the
    // user is NOT taken to the dashboard and remains on the login page.
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/dashboard/);

    // The login form is still shown (user is not authenticated).
    await expect(page.getByRole('tab', { name: /login/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Daily Update App' })
    ).toBeVisible();
  });

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
