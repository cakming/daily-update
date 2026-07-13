import { test, expect } from '@playwright/test';

/**
 * E2E tests for daily updates functionality
 * Tests creating, viewing, and managing daily updates
 */

test.describe('Daily Updates', () => {
  // These specs create updates, which call the real Anthropic API. In CI the
  // ANTHROPIC_API_KEY is a dummy so AI generation fails; skip unless a live key
  // is available (opt in with RUN_AI_E2E=1).
  test.skip(
    !process.env.RUN_AI_E2E,
    'requires a live ANTHROPIC_API_KEY; set RUN_AI_E2E=1 to run'
  );

  const testUser = {
    email: `daily.updates.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Daily Updates Tester',
  };

  const registerPanel = (page) =>
    page.getByRole('tabpanel').filter({ has: page.getByPlaceholder('Your name') });

  // Helper function to register and login
  async function registerAndLogin(page, email = testUser.email) {
    await page.goto('/login');

    // Register via the Register tab.
    await page.getByRole('tab', { name: /register/i }).click();
    const panel = registerPanel(page);
    await panel.getByPlaceholder('Your name').fill(testUser.name);
    await panel.getByPlaceholder('your@email.com').fill(email);
    await panel.getByPlaceholder('••••••••').fill(testUser.password);
    await panel.getByRole('button', { name: /^register$/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  }

  test('should create a daily update', async ({ page }) => {
    await registerAndLogin(page);

    // Navigate to create daily update
    await page.goto('/daily-update/create');

    // Should be on create page
    await expect(page).toHaveURL(/\/daily-update\/create/);

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
    await page.goto('/daily-update/create');
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
    await registerAndLogin(page, newUserEmail);

    // Go to history
    await page.goto('/history');

    // Should show empty state message
    await expect(page.getByText(/no updates|empty|haven't created/i)).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/daily-update/create');

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /generate|create|submit/i }).click();

    // Should show validation error or remain on page
    const isOnCreatePage = await page.url().includes('/create');
    expect(isOnCreatePage).toBeTruthy();
  });
});
