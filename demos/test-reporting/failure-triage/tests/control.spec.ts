import { test, expect } from '@playwright/test';

test('store shell exposes sign-in navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Sign In', { exact: true })).toBeVisible();
  await expect(page).toHaveTitle('StackDemo');
});
