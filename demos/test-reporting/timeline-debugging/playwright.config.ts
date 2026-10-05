import path from 'node:path';
import { defineConfig } from '@playwright/test';
const phase = process.env.TIMELINE_PHASE ?? 'baseline';
if (!['baseline', 'empty-catalog', 'longer-wait', 'restored'].includes(phase)) throw new Error('Unknown TIMELINE_PHASE');
const output = path.resolve(__dirname, '../../../artifacts/timeline', phase);
export default defineConfig({
  testDir: './tests', workers: 1, retries: 0, timeout: 60000,
  outputDir: path.join(output, 'test-results'),
  reporter: [['list'], ['html', { outputFolder: path.join(output, 'html'), open: 'never' }],
    ['json', { outputFile: path.join(output, 'results.json') }]],
  use: { baseURL: 'https://bstackdemo.com', browserName: 'chromium',
    viewport: { width: 1280, height: 720 }, trace: 'on', screenshot: 'on', video: 'on' },
});
