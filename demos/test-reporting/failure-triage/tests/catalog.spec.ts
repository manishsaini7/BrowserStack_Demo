import { test, expect } from '@playwright/test';
import { openCatalog, card } from './store';

test('catalog lists multiple products', async ({ page }, info) => {
  await openCatalog(page, info);
  expect(await page.locator('.shelf-item').count()).toBeGreaterThan(1);
});
test('Apple product has a name and price', async ({ page }, info) => {
  await openCatalog(page, info);
  await expect(card(page, 'iPhone 12').locator('.shelf-item__price')).toContainText('$');
});
test('Samsung product is discoverable', async ({ page }, info) => {
  await openCatalog(page, info);
  await expect(card(page, 'Galaxy S20')).toBeVisible();
});
test('Google product image loads', async ({ page }, info) => {
  await openCatalog(page, info);
  const img = card(page, 'Pixel 4').locator('img');
  await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
});
test('OnePlus product can be added to the bag', async ({ page }, info) => {
  await openCatalog(page, info);
  await card(page, 'One Plus 8').getByText('Add to cart', { exact: true }).click();
  await expect(page.locator('.float-cart')).toContainText('One Plus 8');
});
test('catalog sorts prices from low to high', async ({ page }, info) => {
  await openCatalog(page, info);
  await page.locator('select').selectOption({ label: 'Lowest to highest' });
  await expect.poll(async () => {
    const prices = await page.locator('.shelf-item__price .val b').allTextContents();
    const values = prices.map(Number);
    return values.length > 1 && values.every((v, i) => i === 0 || values[i-1] <= v);
  }).toBe(true);
});
