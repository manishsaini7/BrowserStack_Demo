const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
process.chdir(root);
const phase = process.argv[2] || 'baseline';
const cloud = process.argv.includes('--browserstack');
if (!['baseline','broken','classified','catalog-fixed','fixed'].includes(phase)) {
  console.error('Use baseline, broken, classified, catalog-fixed or fixed'); process.exit(2);
}
const env = { ...process.env, DEMO_PHASE: phase };
if (cloud) {
  for (const key of ['BROWSERSTACK_USERNAME','BROWSERSTACK_ACCESS_KEY']) {
    if (!env[key]) { console.error(`Missing ${key}; set it locally, never commit it.`); process.exit(2); }
  }
  // SDK-native config, ignored by git. No credentials written into it.
  fs.writeFileSync('browserstack.yml', [
    'projectName: DevRel-Trust-Series', 'buildName: YT-006-Failure-Triage',
    'testObservability: true', 'browserstackAutomation: false',
    `CUSTOM_TAG_1: ${phase}`, '',
  ].join('\n'));
}
const args = ['playwright','test','--config=demos/test-reporting/failure-triage/playwright.config.ts'];
if (cloud) args.unshift('browserstack-node-sdk');
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, { env, stdio:'inherit' });
if(result.error) console.error(result.error.message);
process.exit(result.status ?? 2);
