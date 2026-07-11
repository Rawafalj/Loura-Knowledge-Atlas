# Milestone 4 Handoff — Learning Paths and Mastery

**Status:** Complete locally and in GitHub Actions.

## Delivered

- Canonical `learning_paths` and ordered `learning_path_steps` with workspace RLS, role-aware editing, transactional replacement, and audit events.
- Per-user `user_mastery`, append-only `mastery_evidence`, and reasoned `learning_prerequisite_waivers` with strict workspace/user isolation.
- Deterministic path validation and readiness that explains mandatory prior-step targets, explicit prerequisite thresholds, learner waivers, completion, and the next-ready step.
- Learning path list, path detail route, structured path editor, personal mastery view, concept-page mastery controls, evidence history, and active-path context.
- The curated 15-step closed-loop operational execution route, 15 honest draft route concepts, and 14 reviewed prerequisite edges from `docs/09_SEED_ATLAS.md`.
- ADR-007 documenting the separation of canonical curriculum, personal learning state, evidence, and waivers.

## Acceptance evidence

- `pnpm test:db` — 87 pgTAP assertions passed plus seed/import and concurrency checks.
- `pnpm test` — readiness/order/waiver logic, mastery control behavior, and all prior suites passed.
- `pnpm test:e2e:service` — authenticated owner and viewer workflow passed, including no writes on page view, first-step evidence, next-ready advancement, mastery history display, viewer-owned mastery, and canonical path denial.
- The service E2E measures the search API response directly. CI keeps the one-second product budget; local Docker runs default to a configurable five-second allowance so host contention does not masquerade as a functional regression.
- `pnpm verify` — formatting, linting, strict TypeScript/Python checks, tests, worker tests, and production build passed.
- Browser visual QA — path detail and mastery views inspected at desktop size with no browser console warnings or errors.
- GitHub Actions — verify, database/service-E2E, and security jobs passed for the milestone commit.

## Migration

- `0004_milestone_4_learning_mastery.sql` — learning/mastery enums and tables, indexes, RLS, immutable evidence behavior, mastery/waiver/path services, and idempotent learning-seed installation.

## Known limitations and explicit exclusions

- Source assignments remain excluded because immutable source/version/segment records begin in Milestone 5. Exercises and learning objectives are available now without fabricated citations.
- AI-generated assessments remain absent. The `ai_assessment` storage boundary is reserved, but only user-approved mastery is authoritative.
- Optional branch keys are stored and validated, but the first route is intentionally linear and the product does not become a workflow engine.
- Mastery is single-workspace, per-user state; team comparison, recommendations, and automatic scoring are excluded.
- Source ingestion, Docling, queues, extraction proposals, Ask Atlas, Loura applications, and cloud deployment remain excluded.
