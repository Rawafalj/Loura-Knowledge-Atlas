# Milestone 3 Handoff — Local Graph and Hybrid Search

**Status:** Complete locally; GitHub Actions evidence is recorded in the milestone commit/run.

## Delivered

- PostgreSQL-generated weighted full-text documents over canonical names, definitions, synthesis, and structured explanation fields, with a GIN index.
- pgvector concept embeddings at the migration-bound 1,536-dimensional profile, deterministic mock embedding refresh after concept authoring, and owner/editor-only derived-index writes.
- Independent lexical and semantic PostgreSQL search functions with workspace, domain, and content-status filtering.
- Reciprocal Rank Fusion in the retrieval service, grouped concept/source response channels, and explicit title, alias, lexical, and semantic match reasons without presenting similarity as confidence.
- An authenticated `POST /api/search` contract with Zod validation, active-workspace enforcement, controlled errors, and private no-store responses.
- A global `Cmd/Ctrl + K` command palette with debounce, keyboard selection, result explanations, no-results/error states, and stable entity navigation.
- A recursive PostgreSQL concept-neighborhood function capped at depth two and the configured visible-node limit, with relation filters applied before expansion.
- React Flow local graph rendering, deterministic ELK layered layout, category/line-pattern edge styling, one/two-hop controls, relationship filters, selected-node emphasis, fit/zoom controls, and explicit double-click navigation.
- An equivalent semantic relationship table for every visible graph edge; graph layout failure leaves the list usable.
- ADR-006 documenting embedding dimension/profile changes, exact-search use at current scale, the HNSW trigger, and why source search remains typed but empty until Milestone 5.

## Acceptance evidence

- `pnpm test:db` — 62 pgTAP assertions passed, including generated FTS, title/alias/synthesis search, status/workspace isolation, fixture vector ranking, embedding-write permissions, depth controls, relation filters, and cap reporting.
- `pnpm test` — RRF, vector serialization, embedding text, deterministic ELK layout, graph capping/filtering/list parity, command-palette keyboard behavior, and all prior suites passed.
- `pnpm test:e2e:service` — authenticated Chromium workflow passed for alias search and match explanation, keyboard result opening, local graph rendering, depth control, accessible graph list, authoring, history, and viewer restrictions.
- `pnpm verify` — formatting, linting, strict TypeScript/Python checks, default tests, worker tests, and production build passed.
- `pnpm test:e2e` — isolated web-health Chromium test passed.
- Browser visual QA — command palette and relationship graph inspected at desktop size with no browser console warnings or errors.
- `pnpm audit --audit-level high --prod` — no high-severity production dependency findings.

## Migration

- `0003_milestone_3_search_graph.sql` — pgvector, concept search/embedding columns, FTS GIN index, lexical/semantic search functions, controlled embedding refresh, and capped recursive graph neighborhoods.

An HNSW index is intentionally deferred until representative volume and profiling justify approximate search.

## Known limitations and explicit exclusions

- Source search is an explicit empty response channel until source metadata and immutable segments arrive in Milestone 5; concept synthesis is not presented as source evidence.
- The mock embedding profile is deterministic infrastructure for local/CI behavior, not a claim of production semantic quality. Live provider embeddings remain deferred.
- Search filters are implemented in the service/database contract; the compact command palette exposes the default active-workspace search only.
- Graphs are concept-local, depth 1–2, and node-capped. There is no global graph or graph editing surface.
- Learning paths, readiness, mastery, sources, Docling, proposals, Ask Atlas, Loura applications, and cloud deployment remain excluded.
