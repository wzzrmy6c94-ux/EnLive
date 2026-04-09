import { test, expect } from '@playwright/test';

test('artist can subscribe monthly', async ({ page }) => {
  // Assume user is already logged in for test setup
  await page.goto('/pricing');
  // Wait for plan selector
  await page.waitForSelector('text=Artist');
  // Click first subscribe monthly button
  await page.click('text=Subscribe Monthly');
  // Expect redirect to profile page and subscription status visible
  await page.waitForURL('**/users/profile');
  await expect(page.locator('text=Subscription active')).toBeVisible();
});
