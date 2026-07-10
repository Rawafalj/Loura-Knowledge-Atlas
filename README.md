# Loura Knowledge Atlas — Codex Build Pack

**Version:** 0.1  
**Status:** Build specification  
**Product owner:** Rawaf / Loura  
**Primary implementation agent:** OpenAI Codex

This repository pack specifies a private, AI-native knowledge atlas for the bodies of knowledge required to understand, design, build, integrate, deploy, govern, and improve Loura.

The atlas is **not** a map of Loura as a company. It is a structured learning and reasoning environment in which independent knowledge domains are mapped first, then connected to Loura through explicit application links.

## Product definition

The product combines:

- an **atlas** for human navigation;
- a **typed concept graph** as the canonical knowledge model;
- a **semantic hierarchy** for top-down orientation;
- a **prerequisite graph** for learning order;
- a **source-grounded wiki** for explanations and synthesis;
- a **human review queue** for AI-proposed changes;
- a **mastery model** for personal learning state; and
- a **Loura bridge** connecting knowledge to technical, product, and deployment decisions.

## Read order

1. `AGENTS.md` — durable repository instructions for Codex.
2. `docs/01_PRODUCT_SPEC.md` — product scope, users, goals, and requirements.
3. `docs/02_UX_SPEC.md` — information architecture, screens, flows, and interaction design.
4. `docs/03_TECHNICAL_ARCHITECTURE.md` — stack, services, AI pipeline, security, and deployment.
5. `docs/04_DATA_MODEL.md` — canonical entities, relations, enums, and invariants.
6. `docs/05_API_AND_JOBS.md` — route contracts, worker jobs, and structured AI outputs.
7. `docs/06_IMPLEMENTATION_PLAN.md` — ordered milestones and acceptance criteria.
8. `docs/07_OPEN_SOURCE_DECISIONS.md` — adopt/fork/avoid decisions and rationale.
9. `docs/08_TEST_AND_EVAL_PLAN.md` — software testing, retrieval evaluation, and AI quality gates.
10. `docs/09_SEED_ATLAS.md` — initial domains and the first vertical learning route.
11. `docs/10_REFERENCES.md` — official technical references used in the specification.
12. `docs/11_CODEX_RUNBOOK.md` — controlled milestone prompts and review protocol.
13. `docs/DECISIONS.md` — architecture and product decision record.
14. `CODEX_START_PROMPT.md` — the first prompt to give Codex in an empty repository.

## Build strategy

The first useful product is a **vertical slice**, not a complete encyclopedia.

The first slice must support this loop:

```text
See the knowledge landscape
→ choose a learning route
→ inspect a concept and its prerequisites
→ read source-grounded synthesis
→ ask a grounded question
→ connect the concept to a Loura decision or artifact
→ ingest a new source
→ review proposed changes
→ improve the atlas
```

The first seeded route is **Closed-loop operational execution**, spanning systems/control, organizational coordination, workflow, agentic AI, distributed systems, evidence, verification, human authority, and industrial deployment.

## Implementation stance

- Build a custom application rather than forking a generic wiki or RAG product.
- Reuse open-source infrastructure and UI components aggressively.
- Keep the canonical structure in PostgreSQL using typed nodes and edges.
- Store long-form synthesis as Markdown.
- Treat source files as immutable.
- Never allow AI-generated structural changes to publish without review.
- Use graph views for local context, not one unbounded “hairball” graph.
- Prefer a thin, legible architecture over premature graph databases or ontology tooling.

## Definition of done for v0.1

The v0.1 product is complete when an authenticated owner can:

1. browse the world map and domain map;
2. open a canonical concept page;
3. inspect broader, narrower, prerequisite, related, and Loura-application links;
4. search concepts and sources using hybrid retrieval;
5. follow one prerequisite-based learning path;
6. record current and target mastery;
7. upload a supported source;
8. see the source parsed into traceable segments;
9. review and accept/edit/reject AI-proposed concept, relation, claim, and citation changes;
10. ask a grounded question and receive segment-level citations;
11. connect a concept to a Loura decision, component, experiment, or artifact; and
12. inspect the audit history of material changes.

## Repository status

Milestone 1 establishes authentication, first-owner workspace bootstrap, the canonical atlas schema, role-aware RLS, transactional graph invariants, audit/revision foundations, and the validated ten-area seed importer. Reading and authoring workflows, source ingestion, graph visualization, and live AI remain intentionally deferred to later milestones.

## Prerequisites

- Node.js 24.14.0 or a compatible Node 24 release
- pnpm 11.11.0
- Python 3.12
- uv 0.11.28
- Git 2.x
- Docker Desktop or another Docker Engine with Compose support

Check the local toolchain with:

```bash
pnpm doctor
```

## Local setup

```bash
cp .env.example .env.local
pnpm install --frozen-lockfile
uv sync --project services/ingest-worker --frozen
pnpm exec supabase start
pnpm db:seed
pnpm dev
```

After Supabase starts, run `pnpm exec supabase status` and copy its local anonymous key into `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. The local API and database URLs already match `.env.example`.

In another terminal, start the worker health process:

```bash
pnpm worker:dev
```

Health endpoints:

- web: `http://127.0.0.1:3000/api/health`
- worker: `http://127.0.0.1:8091/healthz`

The default `AI_PROVIDER=mock` requires no OpenAI key. Live provider behavior is not present in Milestone 1.

## Verification

```bash
pnpm verify
pnpm test:db
pnpm test:e2e
```

`pnpm verify` runs formatting checks, JavaScript and Python linting, strict type checks, unit tests, worker tests, and the production web build. Playwright runs separately because it starts a web server and requires its browser runtime.

Database commands are available at the repository root:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm test:db
```

`pnpm db:seed` rebuilds the local database from the single Supabase migration history. `pnpm test:db` requires local Supabase and verifies RLS, role boundaries, workspace isolation, graph invariants under concurrent writes, and seed-import idempotency.

## Environment and secrets

Copy `.env.example` locally and never commit real credentials. Supabase service-role and OpenAI credentials are server/worker-only. The basic application and all default tests run without either credential.

## Dependency policy

Exact direct versions and roles are recorded in `docs/DEPENDENCIES.md`. Production dependencies are deliberately minimal in Milestone 0; Docling and provider SDKs are deferred until their implementing milestones.
