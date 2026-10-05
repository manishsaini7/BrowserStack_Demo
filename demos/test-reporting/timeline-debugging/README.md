# YT-007 — Timeline debugging: a timeout does not prove slowness

Episode 2 of From Failed Tests to Release Decisions. Reuses bstackdemo.com, Playwright and Test Reporting & Analytics. This adds a separate demo; episode-one commands are unchanged.

## Setup

From the repository root:

```bash
npm ci
npx playwright install chromium
npm run typecheck
npm run verify:timeline
```

Dependencies remain locked: Playwright 1.63.0, BrowserStack SDK 1.70.2, TypeScript 7.0.2. Tested with Node 20.18.0 on macOS and local Chromium. The public demo must be reachable and contain One Plus 8. No checkout/order is submitted.

## Run and inspect locally

```bash
npm run demo:timeline -- baseline
npm run demo:timeline -- empty-catalog
npm run demo:timeline -- longer-wait
npm run demo:timeline -- restored
npx playwright show-report artifacts/timeline/empty-catalog/html
```

baseline/restored pass; empty-catalog/longer-wait deliberately fail with exit 1. verify:timeline succeeds only if all four outcomes, error types and artifacts match. Each command replaces artifacts for its phase: preserve recording evidence elsewhere before rerunning.

The same named test attempts to add One Plus 8 to the bag. Every phase reads the real catalog through an independent API request and validates its schema/product. Browser routing then delivers either the original snapshot or an empty products array, always with HTTP 200. The empty payload removes the target, so the 3-second click times out. Longer-wait changes only that operation's limit to 10 seconds; it does not restore the data. Restored returns the original payload and the original 3-second limit.

This is a controlled browser-only simulation. It is not a slow-CI reproduction, a real backend defect, or a server fix. A live prerequisite failure must be investigated separately.

## BrowserStack recording runs

Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY in your local environment, never in Git or a shared Notion page. Then run the same four commands with --browserstack.

```bash
npm run demo:timeline -- baseline --browserstack
npm run demo:timeline -- empty-catalog --browserstack
npm run demo:timeline -- longer-wait --browserstack
npm run demo:timeline -- restored --browserstack
```

The runner writes ignored per-phase config under artifacts/timeline, using BROWSERSTACK_CONFIG_FILE; it preserves root browserstack.yml. Project: DevRel-Trust-Series. Stable build name: YT-007-Timeline-Debugging. Phase is a tag, not part of test identity. Local execution is retained; reporting is enabled and remote automation disabled.

Evidence is attached to the native Playwright report. SDK mode also explicitly calls the documented page.uploadAttachment for catalog-evidence.json, timeline-evidence.json, and final-state.png. Inspect output for upload/capture errors. Missing SDK upload support fails during catalog evidence capture; finalization errors are annotated so they do not replace the original test failure.

Native traces and videos are retained locally for every phase. Do not assume automatic upload of those artifacts or native cloud-session video. The demo requires the explicit JSON/PNG attachments to appear in BrowserStack before recording. Native network-log visibility and test.step rendering depend on integration; the JSON is labeled custom test evidence, not a Network tab.

## Recording order

1. Show baseline and failing build identities.
2. Open the failed test from Build Runs in Timeline Debugging.
3. Inspect the click error, screenshot, and custom catalog/event attachments.
4. Compare the same test's earlier passing execution: status 200 in both; product counts differ.
5. Show longer-wait still fails; inspect the same absent prerequisite.
6. Show restored passes with the original timeout.
7. Use local Trace Viewer for optional DOM detail, explicitly identified as native Playwright tooling.

Never claim the timeline alone proves causality. The controlled payload change supports the explanation. A historical pass is a comparison, not proof that current code/data is correct.

## Evidence and cleanup

artifacts/timeline/<phase>/ contains HTML/JSON reports and per-test trace, video, screenshot and JSON evidence. Event times are elapsed milliseconds from the test process, not a distributed backend trace. Only the products response is logged; no cookies or authorization headers are collected.

Closing test contexts removes interception. Nothing on the hosted server needs rollback. Ignored artifacts may be deleted after saving recording evidence. Capture-all is intentional for four teaching runs; tune retention for production suites.

## Sources

Checked 2026-10-05:
- https://www.browserstack.com/docs/test-reporting-and-analytics/features/timeline-debugging
- https://www.browserstack.com/docs/test-reporting-and-analytics/how-to-guides/attachments
- https://www.browserstack.com/docs/test-reporting-and-analytics/how-to-guides/organize-test-runs
- https://playwright.dev/docs/trace-viewer
