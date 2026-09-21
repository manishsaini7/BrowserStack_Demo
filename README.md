# BrowserStack demos

Reusable technical examples for BrowserStack developer education. Each example explains the engineering problem, setup, expected behavior and limitations.

## Examples

- [Failure triage with Test Reporting & Analytics](demos/test-reporting/failure-triage/README.md): run eight Playwright tests against https://bstackdemo.com/, introduce browser-only faults, and investigate actual error groups before restoring normal behavior.

## Setup

Use Node.js 20 or newer (validated with 20.18.0).

```sh
npm ci
npx playwright install chromium
npm run typecheck
npm test
```

Dependencies are locked. Local reports and recordings are ignored by git. BrowserStack credentials must be provided through environment variables, never committed.
