const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
process.chdir(root);
const phase = process.argv[2] || 'baseline';
const extra = process.argv.slice(3);
if (!['baseline','empty-catalog','longer-wait','restored'].includes(phase) || extra.some(x => x !== '--browserstack')) {
  console.error('Usage: npm run demo:timeline -- baseline|empty-catalog|longer-wait|restored [--browserstack]'); process.exit(2);
}
const cloud = extra.includes('--browserstack');
const env = { ...process.env, TIMELINE_PHASE: phase, TIMELINE_BROWSERSTACK: cloud ? '1' : '0' };
if (cloud) {
  for (const key of ['BROWSERSTACK_USERNAME','BROWSERSTACK_ACCESS_KEY']) {
    if (!env[key]) { console.error(`Missing ${key}; configure locally, never commit credentials.`); process.exit(2); }
  }
  // Per-phase ignored configuration: preserve the episode-one/user browserstack.yml.
  const config = path.join(root, 'artifacts/timeline', phase, 'browserstack.yml');
  fs.mkdirSync(path.dirname(config), { recursive: true });
  fs.writeFileSync(config, ['projectName: DevRel-Trust-Series', 'buildName: YT-007-Timeline-Debugging',
    'testObservability: true', 'browserstackAutomation: false', `CUSTOM_TAG_1: ${phase}`, ''].join('\n'));
  env.BROWSERSTACK_CONFIG_FILE = config;
}
const args = ['playwright','test','--config=demos/test-reporting/timeline-debugging/playwright.config.ts'];
if (cloud) args.unshift('browserstack-node-sdk');
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, { env, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 2);
