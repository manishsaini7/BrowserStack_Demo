import { expect, Page, TestInfo } from '@playwright/test';
export const phase = process.env.DEMO_PHASE ?? 'baseline';
export const outage = ['broken', 'classified'].includes(phase);
export const wrongPrice = ['broken', 'classified', 'catalog-fixed'].includes(phase);
export async function openCatalog(page: Page, info: TestInfo) {
  if (outage) await page.route('**/api/products', route => route.fulfill({
    status: 503, contentType: 'application/json',
    body: JSON.stringify({ error: 'DEMO_INJECTED_CATALOG_UNAVAILABLE' }),
  }));
  const responsePromise = page.waitForResponse(r => new URL(r.url()).pathname === '/api/products');
  await page.goto('/');
  const response = await responsePromise;
  await info.attach('catalog-response.json', { body: JSON.stringify({
    url: response.url(), status: response.status(), body: await response.text(),
    phase, faultInjected: outage,
  }, null, 2), contentType: 'application/json' });
  // Same actual HTTP prerequisite across independent test bodies, not a beforeAll skip.
  expect(response.status(), 'Catalog API must be available for this scenario').toBe(200);
  await expect(page.locator('.shelf-item').first()).toBeVisible();
}
export const card = (page: Page, title: string) => page.locator('.shelf-item').filter({
  has: page.locator('.shelf-item__title', { hasText: new RegExp(`^${title}$`) }),
});
