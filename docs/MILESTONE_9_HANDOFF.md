# Milestone 9 handoff — hardening and release gate

## Delivered

- Added production security headers and a CSP in the Next.js configuration.
- Added explicit safe-protocol filtering for rendered Markdown links.
- Added bounded in-process rate limits for login, search, Ask Atlas, uploads, URL ingestion, and application writes. The deployment checklist keeps provider/edge rate limiting as the production scaling layer.
- Added metadata-only telemetry boundaries with source, prompt, question, answer, and raw-output redaction. Langfuse and external analytics remain optional and disabled by default.
- Added queue counters and last-error timing to the worker health endpoint.
- Added deterministic citation-integrity and grounded-QA golden-evaluation commands to CI.
- Added backup/restore and managed deployment runbooks, dependency/license gate documentation, and a seed/release status update.
- Registered the Milestone 8 schema snapshot so `pnpm db:generate` reports no schema drift.

## Evidence

- `pnpm verify`: formatting, lint, strict TypeScript/Python checks, 43 web tests, 28 worker tests, and production build passed.
- `pnpm test:db`: 162 database assertions passed.
- `pnpm citation:check`: fabricated citations rejected.
- `pnpm eval:golden`: 2 deterministic grounded-QA cases passed (100%).
- `pnpm test:e2e`: Chromium health smoke test passed.

## Known release limitations

- The in-process limiter is a local safety net; production deployments must also configure edge/provider limits shared across instances.
- Langfuse integration and live-model evaluation remain opt-in and are not required for deterministic release checks.
- The current Playwright suite includes the health smoke test plus the existing service-backed authoring workflow; broader multi-browser runs remain scheduled release work.
