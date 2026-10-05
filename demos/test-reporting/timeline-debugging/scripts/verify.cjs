const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../../..');
function walk(suites) { return suites.flatMap(s => [...(s.specs || []), ...walk(s.suites || [])]); }
for (const phase of ['baseline','empty-catalog','longer-wait','restored']) {
  const out = path.join(root, 'artifacts/timeline', phase);
  fs.rmSync(path.join(out, 'results.json'), { force: true });
  const run = spawnSync(process.execPath, [path.join(__dirname, 'run.cjs'), phase], { cwd: root, stdio: 'inherit' });
  const broken = ['empty-catalog','longer-wait'].includes(phase);
  assert.equal(run.status, broken ? 1 : 0, `Unexpected exit for ${phase}`);
  const report = JSON.parse(fs.readFileSync(path.join(out, 'results.json'), 'utf8'));
  assert.equal(report.errors.length, 0);
  const specs = walk(report.suites);
  assert.equal(specs.length, 1);
  const results = specs[0].tests[0].results;
  assert.equal(results.length, 1, 'Retries must remain disabled');
  const result = results[0];
  assert.equal(result.status, broken ? 'failed' : 'passed');
  assert.ok(!specs[0].tests[0].annotations?.some(a => a.type === 'evidence-error'));
  const attachment = name => {
    const item = result.attachments.find(a => a.name === name);
    assert.ok(item?.path, `Missing ${name}`);
    assert.ok(fs.statSync(item.path).size > 0);
    return item.path;
  };
  const catalog = JSON.parse(fs.readFileSync(attachment('catalog-evidence.json'), 'utf8'));
  assert.equal(catalog.status, 200);
  assert.ok(catalog.originalProductCount > 0);
  assert.equal(catalog.deliveredProductCount === 0, broken);
  const events = JSON.parse(fs.readFileSync(attachment('timeline-evidence.json'), 'utf8'));
  const names = events.map(e => e.event);
  assert.ok(names.indexOf('browser-observed-catalog') < names.indexOf('cart-click-start'));
  assert.equal(names.includes('bag-assertion-passed'), !broken);
  if (broken) {
    assert.match(result.error.message, /locator\.click: Timeout/);
    assert.ok(events.find(e => e.event === 'test-error').message.includes('Add to cart'));
  }
  for (const name of ['final-state.png','trace','video']) attachment(name);
  console.log(`VERIFIED ${phase}: ${result.status}; HTTP 200; delivered ${catalog.deliveredProductCount} products; evidence + trace + video present`);
}
