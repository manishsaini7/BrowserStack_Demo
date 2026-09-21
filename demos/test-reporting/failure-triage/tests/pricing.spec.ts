import { test, expect } from '@playwright/test';
import { card, wrongPrice, phase } from './store';

test('iPhone 12 displayed price matches the unmodified catalog', async ({ page, request }, info) => {
  // Independent API context bypasses page routing. This contract checks display consistency,
  // not whether the catalog price itself is commercially correct.
  const original = await request.get('https://bstackdemo.com/api/products');
  expect(original.ok(), 'Live catalog must be available for the pricing contract').toBeTruthy();
  const payload = await original.json();
  const product = payload.products.find((p: {title: string}) => p.title === 'iPhone 12');
  expect(product, 'Expected demo product must still exist').toBeTruthy();
  const expected = product.price;
  const displayed = expected + (wrongPrice ? 100 : 0);
  const changed = { ...payload, products: payload.products.map((p: {id:number}) =>
    p.id === product.id ? { ...p, price: displayed } : p) };
  await page.route('**/api/products', r => r.fulfill({ status: 200, json: changed }));
  await info.attach('price-injection.json', { body: JSON.stringify({ phase,
    expected, injectedPrice: displayed, faultInjected: wrongPrice,
    explanation: 'Browser-only response mutation; not a real defect in bstackdemo.com' }, null, 2),
    contentType: 'application/json' });
  await page.goto('/');
  await expect(card(page, 'iPhone 12').locator('.shelf-item__price .val b')).toHaveText(String(expected));
});
