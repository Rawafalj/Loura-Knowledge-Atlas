# Milestone 1 Handoff — Auth, Workspace, and Canonical Foundation

**Status:** Complete locally; GitHub Actions evidence is recorded in the milestone commit/run.

## Delivered

- Supabase passwordless email authentication with cookie-backed SSR sessions, protected routes, callback handling, sign-out, and first-owner onboarding.
- Atomic workspace bootstrap that creates the profile, workspace, owner membership, audit event, and optional seed installation in one transaction.
- Drizzle schemas and one Supabase migration history for profiles, workspaces, memberships, domains, concepts, aliases, workspace relation types, concept relations, concept revisions, and audit events.
- RLS and grants for anonymous, viewer, editor, and owner boundaries; routine web access uses authenticated user sessions and never the service-role key.
- PostgreSQL enforcement for same-workspace references, immutable workspace ownership, immutable creation actors, last-owner retention, hierarchy cycles, relation endpoint/type rules, self-edge rules, symmetric ordering, and configured acyclic relation types.
- Transaction-scoped advisory locks around hierarchy and acyclic relation writes so competing valid-looking writes cannot jointly create a cycle.
- A versioned YAML contract, ten-area draft skeleton, 20 workspace-installed system relation types, deterministic validator, transactional importer, and idempotency checks.
- Audit service function and immutable concept-revision foundation for later authoring workflows.
- ADRs for ten visible areas, approval authority, migration ownership, workspace relation grammar, and database-enforced graph invariants.

## Acceptance evidence

- `pnpm install --frozen-lockfile` — passed.
- `pnpm db:generate` — no schema drift after generation.
- `pnpm db:seed` — both Supabase migrations applied from an empty local database.
- `pnpm test:db` — 20 pgTAP assertions passed; YAML import, idempotency, and concurrent hierarchy/prerequisite race tests passed.
- `pnpm verify` — seed validation, formatting, linting, strict TypeScript and Python types, unit tests, worker tests, and production build passed.
- `pnpm test:e2e` — Chromium web-health test passed.
- `pnpm audit --audit-level high --prod` — no known production vulnerabilities.

## Migrations

- `0000_peaceful_franklin_storm.sql` — canonical tables, enums, indexes, RLS, policies, triggers, bootstrap/import, and audit functions.
- `0001_gifted_psynapse.sql` — actor/profile foreign keys generated after schema review.

## Known limitations and explicit exclusions

- v0.1 currently selects the first membership because multi-workspace switching is outside Milestone 1.
- The seed intentionally contains no generated concept prose or placeholder concepts; all ten domains start as drafts.
- Atlas browsing, concept/relation editing UI, Markdown authoring, source placeholders, and history views begin in Milestone 2.
- Graph visualization and hybrid retrieval begin in Milestone 3.
- Source ingestion, Docling, queues, live model calls, proposals, Ask Atlas, and Loura application records remain excluded.
- Cloud deployment and production provider credentials remain deferred.
