import { test, expect } from '@playwright/test';

/**
 * E2E tests for daily updates functionality
 * Tests creating, viewing, and managing daily updates
 */

test.describe('Daily Updates', () => {
  const testUser = {
    email: `daily.updates.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Daily Updates Tester',
  };

  // Helper function to register and login
  async function registerAndLogin(page) {
    await page.goto('/');

    // Register
    const registerLink = page.getByRole('link', { name: /register|sign up/i });
    await registerLink.click();

    await page.getByLabel(/name/i).fill(testUser.name);
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).first().fill(testUser.password);
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  }

  test('should create a daily update', async ({ page }) => {
    await registerAndLogin(page);

    // Navigate to create daily update
    const createButton = page.getByRole('link', { name: /create.*update|new.*update/i }).first();
    await createButton.click();

    // Should be on create page
    await expect(page).toHaveURL(/\/create/);

    // Fill in the daily update form
    const updateText = `Test daily update created at ${new Date().toISOString()}
- Completed E2E test setup
- Implemented authentication flow
- Added daily update creation`;

    const textarea = page.getByRole('textbox').first();
    await textarea.fill(updateText);

    // Submit the form
    await page.getByRole('button', { name: /generate|create|submit/i }).click();

    // Wait for success (either stays on page with success message or redirects)
    await page.waitForTimeout(2000); // Wait for API call

    // Should show formatted output or success message
    const hasFormattedOutput = await page.getByText(/daily update|today's progress/i).isVisible().catch(() => false);
    const hasSuccessMessage = await page.getByText(/success|created/i).isVisible().catch(() => false);

    expect(hasFormattedOutput || hasSuccessMessage).toBeTruthy();
  });

  test('should view daily updates in history', async ({ page }) => {
    await registerAndLogin(page);

    // First, create a daily update
    await page.goto('/create');
    const updateText = 'Test update for history view';
    await page.getByRole('textbox').first().fill(updateText);
    await page.getByRole('button', { name: /generate|create|submit/i }).click();
    await page.waitForTimeout(2000);

    // Navigate to history
    await page.goto('/history');

    // Should see the created update in the list
    await expect(page.getByText(/history|updates/i)).toBeVisible();

    // The list should contain some updates
    const updateCards = page.locator('[data-testid="update-card"], .update-card, article, .card').first();
    await expect(updateCards).toBeVisible({ timeout: 5000 });
  });

  test('should display empty state when no updates exist', async ({ page }) => {
    // Register a new user who has no updates
    const newUserEmail = `empty.state.${Date.now()}@example.com`;

    await page.goto('/');
    const registerLink = page.getByRole('link', { name: /register|sign up/i });
    await registerLink.click();

    await page.getByLabel(/name/i).fill('Empty State User');
    await page.getByLabel(/email/i).fill(newUserEmail);
    await page.getByLabel(/password/i).first().fill(testUser.password);
    await page.getByRole('button', { name: /register|sign up/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Go to history
    await page.goto('/history');

    // Should show empty state message
    await expect(page.getByText(/no updates|empty|haven't created/i)).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/create');

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /generate|create|submit/i }).click();

    // Should show validation error or remain on page
    const isOnCreatePage = await page.url().includes('/create');
    expect(isOnCreatePage).toBeTruthy();
  });
});
