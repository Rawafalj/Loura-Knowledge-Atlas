# Milestone 8 handoff — Loura application bridge

## Delivered

- Added workspace-scoped `loura_applications` and `concept_applications` tables, enums, composite workspace foreign keys, constraints, indexes, RLS, role checks, archive invariants, and audit-producing RPCs.
- Added typed application contracts with required descriptions and relevance notes and HTTP(S)-only external URLs.
- Added application list, create, detail, edit, archive, and concept-link APIs and UI.
- Added a separate Loura tab on concept pages and a navigation entry; project context remains separate from canonical concept synthesis and archiving retains concept links.
- Hardened mutation authorization to check the authenticated user’s workspace membership.

## Evidence

- `supabase test db`: 8 files, 162 assertions passed.
- `pnpm verify` (via pnpm 11.11.0): seed validation, formatting, lint, strict typecheck, 39 web tests, 28 worker tests, and production build passed.
- `pnpm test:e2e`: health endpoint smoke test passed (1 test).

## Explicit exclusions

- No autonomous project-to-concept writes; all application/concept links are user-authored and audited.
- No live model or external project-system integration; external URLs are stored as reviewed metadata only.
- Unlink controls are API-backed and retain canonical concept data; broader application discovery/filtering can be expanded in a later polish pass.
