const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '../../../..'));
let bad = false;
for (const [phase, failures] of [['baseline',0],['broken',7],['classified',7],['catalog-fixed',1],['fixed',0]]) {
  const file = `artifacts/${phase}/results.json`;
  if(fs.existsSync(file)) fs.unlinkSync(file);
  const result = spawnSync(process.execPath, ['demos/test-reporting/failure-triage/scripts/run.cjs',phase], {stdio:'inherit'});
  if(!fs.existsSync(file)) { bad=true; console.error(`Missing result: ${phase}`); continue; }
  const report = JSON.parse(fs.readFileSync(file,'utf8'));
  const stats=report.stats;
  const specs = [];
  const walk = suites => { for(const suite of suites) { specs.push(...(suite.specs||[])); walk(suite.suites||[]); } };
  walk(report.suites);
  const failed = specs.filter(s => s.tests.some(t => t.status === 'unexpected'));
  const correctFailures = failures === 0 ? failed.length === 0 :
    failed.every(s => s.file.endsWith('pricing.spec.ts') || (failures === 7 && s.file.endsWith('catalog.spec.ts'))) &&
    failed.filter(s => s.file.endsWith('pricing.spec.ts')).length === 1;

  const matches = correctFailures && result.status === (failures ? 1 : 0) && stats.expected === 8-failures &&
    stats.unexpected === failures && stats.skipped === 0 && stats.flaky === 0 && report.errors.length === 0;
  console.log(`MATRIX ${phase}: ${matches ? 'PASS':'FAIL'} (${stats.expected} pass / ${stats.unexpected} fail)`);
  if(!matches) bad=true;
}
process.exit(bad ? 1 : 0);
