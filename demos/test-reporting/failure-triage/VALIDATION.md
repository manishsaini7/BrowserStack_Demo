# Validation record

2026-09-21, macOS arm64, Node.js 20.18.0. Dependencies are pinned in the root manifest and lockfile.

- TypeScript check: passed.
- Runner syntax and invalid-phase/missing-credential checks: passed.
- Local live-site scenario matrix: baseline 8/0, broken 1/7, classified 1/7, catalog-fixed 7/1, fixed 8/0 (passed/failed). No skipped tests or retries.
- An initial report-location issue was corrected by resolving reporter output paths absolutely. Final `npm run verify:demo` completed with exit 0: all five phases matched expected counts and failure identities.
- BrowserStack authentication, ingestion, Unique Errors groups, attachments and Automatic Failure Analysis: not verified. Credentials were not configured; do not describe the local `classified` phase as an observed automatic classification result.

The suite routes browser requests only; it does not alter the public application or its backend. Expected failures remain genuine failing test records. The matrix verifier treats their count and identity as expected behavior of this teaching fixture.
