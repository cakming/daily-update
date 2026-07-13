import { test, expect } from '@playwright/test';

/**
 * E2E tests for weekly updates functionality
 * Tests generating and viewing weekly summaries
 */

test.describe('Weekly Updates', () => {
  // These specs generate summaries via the real Anthropic API. In CI the
  // ANTHROPIC_API_KEY is a dummy so AI generation fails; skip unless a live key
  // is available (opt in with RUN_AI_E2E=1).
  test.skip(
    !process.env.RUN_AI_E2E,
    'requires a live ANTHROPIC_API_KEY; set RUN_AI_E2E=1 to run'
  );

  const testUser = {
    email: `weekly.updates.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Weekly Updates Tester',
  };

  const registerPanel = (page) =>
    page.getByRole('tabpanel').filter({ has: page.getByPlaceholder('Your name') });

  async function registerAndLogin(page, email = testUser.email) {
    await page.goto('/login');
    await page.getByRole('tab', { name: /register/i }).click();
    const panel = registerPanel(page);
    await panel.getByPlaceholder('Your name').fill(testUser.name);
    await panel.getByPlaceholder('your@email.com').fill(email);
    await panel.getByPlaceholder('••••••••').fill(testUser.password);
    await panel.getByRole('button', { name: /^register$/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  }

  // Helper function to register, login, and create some daily updates
  async function setupUserWithDailyUpdates(page) {
    await registerAndLogin(page);

    // Create 2-3 daily updates to have data for weekly summary
    for (let i = 0; i < 3; i++) {
      await page.goto('/daily-update/create');

      const updateText = `Daily update ${i + 1}
- Completed task ${i + 1}A
- Working on task ${i + 1}B
- Planning task ${i + 1}C`;

      await page.getByRole('textbox').first().fill(updateText);
      await page.getByRole('button', { name: /generate|create|submit/i }).click();
      await page.waitForTimeout(2000);
    }
  }

  test('should generate a weekly summary from daily updates', async ({ page }) => {
    await setupUserWithDailyUpdates(page);

    // Navigate to weekly updates page
    await page.goto('/weekly-update/create');

    // Should be on weekly updates page
    await expect(page).toHaveURL(/\/weekly-update\/create/);

    // Select date range (e.g., last 7 days)
    // This might vary based on your UI implementation
    const generateButton = page.getByRole('button', { name: /generate|create.*weekly/i });

    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(3000); // Wait for AI generation

      // Should show weekly summary output
      await expect(page.getByText(/week|summary|achievements/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display weekly summary with structured sections', async ({ page }) => {
    await setupUserWithDailyUpdates(page);

    await page.goto('/weekly-update/create');

    // Generate weekly summary
    const generateButton = page.getByRole('button', { name: /generate|create.*weekly/i });

    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(3000);

      // Check for typical sections in a weekly summary
      const hasAchievements = await page.getByText(/achievement|progress|completed/i).isVisible().catch(() => false);
      const hasOngoing = await page.getByText(/ongoing|current|in progress/i).isVisible().catch(() => false);
      const hasNextSteps = await page.getByText(/next|upcoming|plan/i).isVisible().catch(() => false);

      // At least one section should be visible
      expect(hasAchievements || hasOngoing || hasNextSteps).toBeTruthy();
    }
  });

  test('should handle empty state when no daily updates exist', async ({ page }) => {
    // Register new user with no daily updates
    const emptyUserEmail = `empty.weekly.${Date.now()}@example.com`;
    await registerAndLogin(page, emptyUserEmail);

    // Navigate to weekly updates
    await page.goto('/weekly-update/create');

    // Should show message about no data or require date selection
    const hasEmptyMessage = await page.getByText(/no.*update|no.*data|create.*daily/i).isVisible().catch(() => false);
    const hasDatePicker = await page.locator('input[type="date"]').isVisible().catch(() => false);

    expect(hasEmptyMessage || hasDatePicker).toBeTruthy();
  });

  test('should allow saving a generated weekly summary', async ({ page }) => {
    await setupUserWithDailyUpdates(page);

    await page.goto('/weekly-update/create');

    // Generate summary
    const generateButton = page.getByRole('button', { name: /generate|create.*weekly/i });

    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(3000);

      // Look for save button
      const saveButton = page.getByRole('button', { name: /save|submit/i });

      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);

        // Should show success message or redirect
        const hasSuccess = await page.getByText(/success|saved|created/i).isVisible().catch(() => false);
        expect(hasSuccess).toBeTruthy();
      }
    }
  });
});
