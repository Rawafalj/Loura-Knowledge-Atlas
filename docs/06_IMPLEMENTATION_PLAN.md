# 06 — Codex Implementation Plan

## 1. Execution rule

Implement milestones sequentially. A milestone is complete only when its acceptance criteria and tests pass. Do not scaffold every future feature before completing the current vertical slice.

Use a feature flag for live AI calls. Local and CI tests must run with deterministic mock clients by default.

## 2. Milestone 0 — Repository and developer environment

### Deliverables

- pnpm workspace and Turborepo configuration;
- Next.js web app;
- shared TypeScript packages only where justified;
- Python worker package using uv;
- Supabase local configuration;
- strict TypeScript, ESLint, formatting, Vitest, Playwright, Pytest;
- root scripts from `AGENTS.md`;
- `.env.example`;
- GitHub Actions CI;
- `docs/DECISIONS.md` with initial ADRs;
- health routes for web and worker.

### Requirements

- use current stable releases compatible with each other;
- pin lockfiles;
- no live OpenAI dependency for basic startup;
- supply mock AI and mock embedding implementations;
- README includes local setup.

### Acceptance criteria

- `pnpm install` succeeds;
- `pnpm dev` starts web app;
- worker starts and reports health;
- local Supabase can start;
- `pnpm verify` passes in a clean clone;
- CI runs lint, typecheck, unit tests, worker tests, and build.

## 3. Milestone 1 — Auth, workspace, database foundation

### Deliverables

- Supabase Auth integration;
- login and onboarding;
- Drizzle schema/migrations for identity, domains, concepts, aliases, relation types, relations, revisions, audit;
- RLS policies;
- workspace role helpers;
- initial relation-type seed;
- initial atlas YAML importer and validator;
- audit service.

### Required tests

- unauthenticated access denied;
- viewer/editor/owner policy matrix;
- cross-workspace access denied;
- seed import idempotency;
- duplicate slug and alias handling;
- canonical-parent cycle rejection;
- prerequisite-cycle rejection;
- symmetric relation normalization.

### Acceptance criteria

- first user can create workspace;
- owner can install seed skeleton;
- viewer cannot mutate;
- database inspection confirms RLS on all workspace tables;
- graph invariants pass.

## 4. Milestone 2 — Atlas browsing and concept authoring

### Deliverables

- application shell;
- world map card/list view;
- domain explorer overview and hierarchy;
- concept page Overview, Relationships, Sources placeholder, Loura placeholder, History;
- canonical concept/alias edit forms;
- Markdown synthesis editor using MDXEditor;
- concept revision creation;
- relation editor;
- accessible relation list/tree;
- graph-neighborhood API/service, without visualization initially if needed.

### Required tests

- browse World → Domain → Concept;
- create/update/deprecate concept;
- revision snapshot created;
- relation constraints enforced;
- unsaved editor warning;
- viewer read-only behavior.

### Acceptance criteria

- owner can maintain canonical concept structure without direct database work;
- concept edit produces history;
- relation list faithfully represents graph data;
- no graph visualization is required to complete core navigation.

## 5. Milestone 3 — Local graph and hybrid search

### Deliverables

- React Flow local concept graph;
- ELK layout adapter;
- relation filters and depth controls;
- graph node cap and progressive expansion;
- list fallback;
- PostgreSQL FTS indexes;
- embedding interface and mock embeddings;
- pgvector migration;
- hybrid search service with RRF;
- command palette;
- search result match reasons.

### Required tests

- deterministic graph layout adapter tests;
- node cap enforced;
- graph/list parity for relation data;
- lexical title/alias search;
- semantic search with fixture embeddings;
- workspace/status filters;
- keyboard command-palette flow.

### Acceptance criteria

- user can find a concept by title, alias, or semantic description;
- graph is bounded and navigable;
- graph failure falls back to relation list;
- search response stays within configured latency on seed fixture.

## 6. Milestone 4 — Learning paths and mastery

### Deliverables

- learning path tables/migrations;
- path list and detail screens;
- path editor;
- path validation service;
- prerequisite readiness logic;
- mastery records and evidence;
- mastery view;
- first seeded path from `docs/09_SEED_ATLAS.md`.

### Required tests

- invalid path order flags unmet prerequisite;
- readiness honors mastery waiver/threshold;
- mastery history preserved;
- page views do not change mastery;
- viewer can update only own mastery, not canonical path.

### Acceptance criteria

- owner can follow the first route and see the next-ready concept;
- mastery gaps are visible by domain/path;
- every step deep-links to a concept.

## 7. Milestone 5 — Source library and deterministic ingestion

### Deliverables

- source/source-version/segment/job migrations;
- private storage buckets and policies;
- source list/detail screens;
- upload intent/finalization;
- URL submission with SSRF protections;
- Supabase queue integration;
- Python worker queue consumer;
- Docling parsing;
- structured segmentation;
- storage of Docling JSON and Markdown;
- source/job progress UI;
- parser fixture tests;
- no AI extraction yet beyond mock summary if desired.

### Required tests

- file type/size checks;
- duplicate checksum detection;
- private storage access;
- queue job idempotency;
- same idempotency key returns existing version;
- parser fixtures for PDF, DOCX, PPTX, Markdown/HTML where fixture licensing permits;
- stable segment ordering and provenance;
- URL rejects private IP and unsafe redirects;
- failed parse retains original source and exposes retry.

### Acceptance criteria

- owner uploads a supported document and opens parsed segments;
- job can be retried safely;
- original and derived files remain private and versioned;
- source segment IDs are stable within a version.

## 8. Milestone 6 — AI extraction and human review

### Deliverables

- AI provider interfaces in TypeScript/Python;
- OpenAI implementations;
- versioned prompts and extraction schemas;
- source summary generation;
- candidate extraction;
- deterministic candidate matching plus model-assisted resolution;
- proposal/proposal-item migrations;
- review queue and proposal detail;
- transactional typed proposal application services;
- stale proposal detection;
- AI run telemetry;
- mock/golden extraction fixtures.

### Required tests

- malformed model output rejected;
- evidence segment IDs validated;
- unknown relation type rejected;
- model cannot create direct canonical writes;
- accepted item creates audit/revision;
- rejected item remains in history;
- stale proposal requires resolution;
- prompt injection fixture does not alter extraction instructions;
- retries do not duplicate proposals for same run key.

### Acceptance criteria

- a parsed source produces a reviewable proposal;
- owner can inspect evidence, edit, accept, or reject each item;
- accepted changes update canonical data transactionally;
- no structural item is auto-published.

## 9. Milestone 7 — Ask Atlas

### Deliverables

- Ask thread/message migrations;
- hybrid retrieval for answer context;
- graph expansion;
- answer prompt and structured citation schema;
- streaming route/UI;
- citation validator;
- citation drawer;
- insufficient-evidence mode;
- contextual scope from concept/domain/path;
- saved private threads and retention setting.

### Required tests

- retrieval respects workspace and reviewed-only filters;
- citations must have been supplied in context;
- nonexistent citation causes validation failure, not display;
- answer with no evidence enters insufficient mode;
- source prompt injection does not control answer behavior;
- streaming can be cancelled;
- raw question/answer not sent to generic analytics.

### Acceptance criteria

- owner asks a cross-domain question and receives a cited answer;
- clicking citation opens exact segment;
- low-evidence question visibly declines confident synthesis;
- answer links relevant concepts.

## 10. Milestone 8 — Loura application bridge

### Deliverables

- application and concept-application migrations;
- Loura application list/detail/create/edit;
- concept-page Loura tab;
- application filters;
- link from learning path/concept to application;
- audit and archive behavior.

### Required tests

- many-to-many linking;
- archived application does not alter canonical concept;
- application relevance note required;
- role permissions;
- external URL safely rendered.

### Acceptance criteria

- user can trace a concept into a Loura decision/artifact;
- knowledge and project content remain visually/data-model separated.

## 11. Milestone 9 — Hardening and release gate

### Deliverables

- performance profiling and index tuning;
- accessibility review/fixes;
- security headers/CSP;
- rate limiting;
- sensitive-data log scrubbing;
- queue metrics and alerts;
- optional Langfuse integration;
- product analytics with text redaction;
- backup/restore documentation;
- seed dataset quality pass;
- final E2E suite;
- deployment docs.

### Required tests

- RLS regression suite;
- CSP/Markdown sanitization;
- graph/list accessibility parity;
- Playwright critical workflows;
- citation integrity script;
- AI golden eval thresholds;
- production build and migration rehearsal.

### Acceptance criteria

- all release gates in product spec pass;
- no critical/high unresolved security defects;
- clean setup from README succeeds;
- deployed app completes the vertical product loop.

## 12. Critical E2E scenarios

Implement as Playwright tests, using mocked AI except a separate optional live suite.

### E2E-1 Workspace bootstrap

```text
login
→ create workspace
→ install seed
→ open world map
```

### E2E-2 Atlas navigation

```text
world map
→ domain
→ concept
→ prerequisite
→ return via breadcrumb
```

### E2E-3 Search

```text
Cmd+K
→ query by alias/description
→ inspect match reason
→ open concept
```

### E2E-4 Learning

```text
open path
→ inspect blocked step
→ update prerequisite mastery with evidence
→ next step becomes ready
```

### E2E-5 Source ingestion

```text
upload fixture
→ observe queued/running/completed
→ open source
→ inspect parsed segment
```

### E2E-6 Proposal review

```text
open source proposal
→ inspect evidence
→ edit and accept concept update
→ concept revision appears
→ audit event appears
```

### E2E-7 Ask Atlas

```text
ask fixture question
→ stream answer
→ open citation
→ exact source segment shown
```

### E2E-8 Loura bridge

```text
open concept
→ create application link
→ open application
→ concept relevance note visible
```

## 13. First Codex work item

After reading all specifications, Codex should execute only Milestone 0 first.

Expected first task output:

1. proposed exact dependency versions;
2. repository tree;
3. files created;
4. commands run;
5. `pnpm verify` result;
6. explicit deviations or unresolved environment requirements.

Do not begin database feature implementation in the same change set unless Milestone 0 is fully verified.

