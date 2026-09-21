import path from 'node:path';
import { defineConfig } from '@playwright/test';
const phase = process.env.DEMO_PHASE ?? 'baseline';
if (!['baseline', 'broken', 'classified', 'catalog-fixed', 'fixed'].includes(phase)) {
  throw new Error(`Unknown DEMO_PHASE: ${phase}`);
}
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, retries: 0,
  timeout: 45000, expect: { timeout: 10000 },
  outputDir: `../../../artifacts/${phase}/test-results`,
  reporter: [['list'], ['html', { outputFolder: path.resolve(__dirname, `../../../artifacts/${phase}/html`), open: 'never' }],
    ['json', { outputFile: path.resolve(__dirname, `../../../artifacts/${phase}/results.json`) }]],
  use: { baseURL: 'https://bstackdemo.com', browserName: 'chromium',
    trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
});
