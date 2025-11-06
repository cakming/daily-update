import { test, expect } from '@playwright/test';

/**
 * E2E tests for authentication flows
 * Tests user registration, login, and logout
 */

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

    // Find and click the register link/button
    const registerLink = page.getByRole('link', { name: /register|sign up/i });
    await registerLink.click();

    // Fill out registration form
    await page.getByLabel(/name/i).fill(testUser.name);
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).first().fill(testUser.password);

    // Submit registration
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Should be redirected to dashboard after successful registration
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify user is logged in by checking for dashboard elements
    await expect(page.getByText(/dashboard|welcome/i)).toBeVisible();

    // Logout
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow registered user to login', async ({ page }) => {
    // First, register a user
    await page.goto('/');
    const registerLink = page.getByRole('link', { name: /register|sign up/i });
    await registerLink.click();

    const uniqueEmail = `login.test.${Date.now()}@example.com`;
    await page.getByLabel(/name/i).fill('Login Test User');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).first().fill(testUser.password);
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Logout
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Now test login with the registered credentials
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/dashboard|welcome/i)).toBeVisible();
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword123');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|error|failed|incorrect/i)).toBeVisible();

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
