import fs from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { test, expect, Page } from '@playwright/test';

const phase = process.env.TIMELINE_PHASE ?? 'baseline';
const injected = ['empty-catalog', 'longer-wait'].includes(phase);
const clickTimeout = phase === 'longer-wait' ? 10000 : 3000;

// Stable test title/file across phases enables history comparison.
test('One Plus 8 can be added to the bag', async ({ page, request }, info) => {
  const started = performance.now();
  const events: Record<string, unknown>[] = [];
  const record = (event: string, details: Record<string, unknown> = {}) => {
    const row = { elapsedMs: Math.round(performance.now() - started), event, ...details };
    events.push(row);
    console.log('[YT-007 evidence]', JSON.stringify(row));
  };
  const attach = async (name: string, body: string | Buffer, contentType: string) => {
    const file = info.outputPath(name);
    await fs.writeFile(file, body);
    await info.attach(name, { path: file, contentType });
    if (process.env.TIMELINE_BROWSERSTACK === '1') {
      const sdkPage = page as Page & { uploadAttachment?: (file: string) => Promise<void> };
      if (typeof sdkPage.uploadAttachment !== 'function') throw new Error('SDK page.uploadAttachment unavailable; inspect the reporting integration before recording.');
      await sdkPage.uploadAttachment(file);
    }
  };
  record('run-start', { phase, injected, clickTimeout, viewport: page.viewportSize() });
  try {
    // Independent live read validates the demo prerequisite before any injected failure.
    const original = await request.get('https://bstackdemo.com/api/products');
    expect(original.ok(), 'Live catalog prerequisite must succeed').toBeTruthy();
    const payload = await original.json();
    expect(Array.isArray(payload.products), 'Catalog schema must contain products').toBeTruthy();
    expect(payload.products.some((p: { title: string }) => p.title === 'One Plus 8'), 'Live catalog must contain the demo product').toBeTruthy();
    const delivered = injected ? { ...payload, products: [] } : payload;
    await page.route('**/api/products', async route => {
      record('catalog-request-intercepted', { path: '/api/products' });
      await route.fulfill({ status: 200, json: delivered });
      record('catalog-response-delivered', { status: 200, productCount: delivered.products.length });
    });
    const responsePromise = page.waitForResponse(r => new URL(r.url()).pathname === '/api/products');
    await test.step('Open storefront and capture the catalog response', async () => {
      await page.goto('/');
      const response = await responsePromise;
      const actual = await response.json();
      record('browser-observed-catalog', { status: response.status(), productCount: actual.products.length });
      await attach('catalog-evidence.json', JSON.stringify({ phase, injected, status: response.status(),
        originalProductCount: payload.products.length, deliveredProductCount: actual.products.length,
        expectedProduct: 'One Plus 8', body: actual,
        note: 'Browser-only simulation. HTTP 200 does not establish useful scenario data.' }, null, 2), 'application/json');
    });
    await test.step('Add One Plus 8 to the bag', async () => {
      record('cart-click-start', { clickTimeout });
      const card = page.locator('.shelf-item').filter({ has: page.locator('.shelf-item__title', { hasText: /^One Plus 8$/ }) });
      await card.getByText('Add to cart', { exact: true }).click({ timeout: clickTimeout });
      record('cart-click-completed');
      await expect(page.locator('.float-cart')).toContainText('One Plus 8');
      record('bag-assertion-passed');
    });
  } catch (error) {
    record('test-error', { message: error instanceof Error ? error.message : String(error) });
    throw error;
  } finally {
    // Independent artifact capture: a screenshot failure must not suppress the event log.
    const captures = [
      async () => attach('timeline-evidence.json', JSON.stringify(events, null, 2), 'application/json'),
      async () => attach('final-state.png', await page.screenshot({ fullPage: true }), 'image/png'),
    ];
    const failures: string[] = [];
    for (const capture of captures) {
      try { await capture(); } catch (error) { failures.push(String(error)); }
    }
    if (failures.length) {
      console.error('Evidence capture/upload incomplete:', failures.join('\n'));
      info.annotations.push({ type: 'evidence-error', description: failures.join('\n') });
    }
  }
});
