# Many failed tests, fewer investigations

Episode 1 of **From Failed Tests to Release Decisions**.

The target is the real [BrowserStack demo store](https://bstackdemo.com/). This example intentionally modifies responses **inside individual test browsers**. It does not change the hosted site, place orders, or demonstrate actual defects in BrowserStack's application.

## Engineering story

Six independent catalog scenarios rely on `/api/products`. A controlled HTTP 503 makes their shared prerequisite fail. One isolated pricing scenario receives a response with the iPhone 12 price increased by 100; it compares the displayed price with an unmodified API response. A sign-in-navigation test remains healthy.

The pricing test deliberately uses a separate browser context and healthy catalog payload so the unavailable catalog does not prevent its assertion. Explain this scope in the video. The price alteration simulates corrupted product data in transit; it is **not** a discount-calculation bug. This is a change from the early script's fictional stock-service example.

The six failures are real HTTP assertions in independently executed test bodies, not hardcoded `throw` statements or tests skipped by a failing suite hook. The pricing contract validates consistency with the source API, not business correctness of the source price.

## Run locally

From the repository root:

```sh
npm ci
npx playwright install chromium
npm run typecheck
npm run demo -- baseline
npm run demo -- broken
npm run demo -- classified
npm run demo -- catalog-fixed
npm run demo -- fixed
```

| Phase | Browser-only catalog fault | Price alteration | Expected pass / fail |
| --- | --- | --- | --- |
| baseline | Off | Off | 8 / 0 |
| broken | Six catalog scenarios receive 503 | On in pricing context | 1 / 7 |
| classified | Same as broken | On | 1 / 7 |
| catalog-fixed | Off | On | 7 / 1 |
| fixed | Off | Off | 8 / 0 |

The failing phases correctly exit with status 1. Do not mark them as expected failures using `test.fail()`: BrowserStack must receive actual failing outcomes. `npm run verify:demo` runs all five phases and checks counts, no skipped/flaky tests, reporter errors and exit status. It exits 0 only when the entire intended matrix matches.

Reports: `artifacts/<phase>/results.json` and `artifacts/<phase>/html/`; traces/screenshots/videos beneath the phase's `test-results/`. Repeating a phase overwrites its local artifacts; copy a recording-worthy run to a separate ignored archive before rerunning.

```sh
npx playwright show-report artifacts/broken/html
```

## Send results to BrowserStack

Set `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` securely in your local shell or CI secrets. The runner checks their presence, not their values. Do not paste them into recordings or tracked files. `.env` files are ignored but are **not automatically loaded** by this runner.

```sh
npm run demo -- baseline --browserstack
npm run demo -- broken --browserstack
```

The runner overwrites an ignored, credential-free root `browserstack.yml` (keep any unrelated configuration elsewhere) using static project `DevRel-Trust-Series`, build `YT-006-Failure-Triage`, and a phase tag. It invokes the BrowserStack Node SDK with reporting on and remote execution off. Tests use local Chromium; an Automate subscription or Local tunnel is not required for this route. Verify actual feature entitlement in your account.

After the first failing build completes:

1. Open its actual run URL and verify eight test records and their outcomes.
2. Open Unique Errors, select this project's relevant time window/available filters, and inspect error patterns plus impacted tests.
3. Check the attached HTTP response, stack traces and pricing evidence before interpreting a shared cause. Inspect at least two catalog failures.
4. Categorize demonstrated catalog outages as `Environment issue` and the simulated incorrect-price behavior as `Product bug`. Disclose that these are manually assigned labels for injected examples.
5. Run `npm run demo -- classified --browserstack` and inspect actual categorization. This command **does not assign or fabricate categories**.
6. Run `catalog-fixed` and then `fixed` with `--browserstack`; record their real run URLs and outcomes.

Automatic Failure Analysis requires earlier failures and manual categories in the same project. There is no guaranteed training-run count. If it remains `To be investigated`, show that result honestly. Error grouping may split the catalog failures or combine unexpected patterns. Preserve what the product actually does; do not promise seven failures become exactly two groups.

Unique Errors may aggregate repeated executions. Historical groups need not disappear after a clean run. Compare individual build reports for before/after counts. Distinguish impacted tests from error occurrences.

## Recording checklist

- Identify the faults as browser-only injection, not public-site bugs.
- Capture actual native and BrowserStack reports for the same run.
- Keep deeper timeline, retry-health and quality-gate demonstrations for later episodes.
- Record the manual labeling step separately from automatic results.
- Show catalog restored while pricing still fails, then restore pricing.
- Preserve the observed labels and group counts in narration; group similarity is not proof of common root cause.
- After recording, close browsers; routing faults disappear with their contexts. No server rollback is needed.

## Boundaries and troubleshooting

Public-site network availability, DOM and product names can change. A genuine upstream outage may affect even the control/pricing baseline. Investigate baseline failures rather than accepting new expected counts. The app makes an unrelated `/failed-request` request; this suite observes `/api/products` specifically.

The matrix validates local test behavior. BrowserStack ingestion, attachments, grouping and automatic labeling require an authenticated run and are not guaranteed by local verification. The SDK can also change reporter behavior: confirm all expected records and logs after the first upload.

The installed SDK dependency tree has moderate audit findings through its Google API dependencies at initial setup. Avoid a forced SDK downgrade solely to clear audit output. Review `npm audit` as dependencies change; this example does not serve an application or expose a network listener.

## Sources

Checked 2026-09-21:

- [Playwright SDK integration](https://www.browserstack.com/docs/test-reporting-and-analytics/getting-started/javascript/playwright/integrate-your-tests)
- [Unique Errors](https://www.browserstack.com/docs/test-reporting-and-analytics/features/unique-errors)
- [Automatic Failure Analysis](https://www.browserstack.com/docs/test-reporting-and-analytics/features/auto-failure-analysis)
