# Milestone 5 Handoff — Source Library and Deterministic Ingestion

**Status:** Complete locally and in GitHub Actions.

## Delivered

- Workspace-scoped `sources`, immutable `source_versions`, structural `source_segments`, and durable `ingestion_jobs`, with RLS, constrained service functions, audit events, and migration-owned pgmq setup.
- Separate private `source-files` and `source-derived` Storage buckets with workspace-member reads and owner/editor original uploads.
- Reading-first source list/detail screens, explicit file and URL creation, checksum-verified upload finalization, parser/job history, stage progress, sanitized errors, retry, and accessible segment anchors.
- A versioned `source_ingest` queue message and a Python worker that remains health-ready without credentials, consumes jobs only when explicitly enabled, bounds retries, and never logs source or parser payloads.
- Pinned, lazily imported Docling conversion for PDF, DOCX, PPTX, Markdown, and HTML; deterministic heading-aware segments with stable within-version IDs and Docling provenance; immutable Docling JSON and Markdown artifacts.
- SSRF-resistant explicit URL ingestion with scheme/port/MIME/size limits, public address validation, per-redirect revalidation, DNS-rebinding-resistant IP pinning with original Host/SNI, and no link crawling.
- Source-segment lexical search merged into the existing ranked search response without treating generated synthesis as evidence.
- ADR-008 and updated dependency/environment documentation for the deterministic ingestion trust boundary.
- Follow-up correctness hardening: citation segment UUIDs are deterministic for a source version and stable key, and source-version allocation is serialized per source to prevent concurrent numbering races.

## Acceptance evidence

- `pnpm verify` — formatting, TypeScript/Python lint and strict types, all unit/component suites, 16 worker tests, and the production build passed after the follow-up hardening.
- `pnpm test:db` — 114 pgTAP assertions passed plus seed/import and concurrent-cycle checks. Milestone 5 assertions cover RLS, workspace isolation, private buckets, queue/job idempotency, immutable completed evidence, source search, and retry.
- `pnpm test:e2e` — production web health workflow passed in Chromium.
- `pnpm test:e2e:service` — authenticated owner workflow passed against local Supabase and the live worker, including private upload, durable processing, immutable segments, source detail, and search discovery.
- Parser fixtures passed for authored PDF, DOCX, PPTX, Markdown, and HTML inputs. URL tests cover private destinations, unsafe redirects, and validated-IP pinning.
- `pnpm db:generate` reported no schema drift after the reviewed migration was generated.
- In-app browser smoke validation found a semantic login boundary and no browser warnings or errors; the authenticated source flow is covered by the service-backed Chromium suite.
- [GitHub Actions run 29160454299](https://github.com/Rawafalj/Loura-Knowledge-Atlas/actions/runs/29160454299) — verify, database/service-E2E, secret scanning, and production dependency audit all passed for milestone commit `8651851`.

## Migration

- `0005_milestone_5_source_ingestion.sql` — source enums/tables/indexes/checks, immutable-version triggers, RLS/grants, private buckets and policies, pgmq queue, creation/enqueue/retry services, and completed-segment lexical search.

## Known limitations and explicit exclusions

- Milestone 5 performs deterministic parsing only. Summaries, extraction proposals, concept resolution, AI review, and all live provider calls remain excluded until Milestone 6.
- Supported content is size- and MIME-bounded, but dedicated malware scanning and stronger process/container isolation remain Milestone 9 hardening work. Parsed content is always treated as non-executable data.
- File checksum calculation and upload finalization currently buffer up to the configured 50 MB cap in browser/server memory. Streaming multipart hashing is deferred until measurements justify the added complexity.
- Docling's full pinned distribution makes the worker image and dependency cache substantially larger. Heavy parser imports remain lazy, and PDF enrichment/remote services are disabled.
- The source detail page displays the first 200 latest-version segments. Explicit pagination/expansion is deferred; immutable IDs and direct anchors remain stable.
- URL ingestion accepts only an explicitly submitted resource and follows a bounded redirect chain. Arbitrary crawling, scraping, authenticated URLs, and nonstandard ports are excluded.
