# Milestone 2 Handoff — Reading and Authoring

**Status:** Complete locally; GitHub Actions evidence is recorded in the milestone commit/run.

## Delivered

- A private workspace shell with the ten-area world map, domain cards, atlas-wide concept index, canonical domain hierarchy, and role-aware navigation.
- Reading-first concept pages with Overview, Relationships, Sources, Loura, and History sections. Sources and Loura remain explicit placeholders for their planned milestones.
- Structured concept creation and editing with stable identity, placement, kind, status, priority, mastery target, aliases, explanation fields, Markdown synthesis, review notes, replacement links, and mandatory revision summaries.
- Typed relation creation, editing, and removal with forward/inverse labels exposed as an accessible table independent of future graph visualization.
- Safe Markdown rendering and an MDXEditor authoring surface, local draft recovery, browser-leave protection, and internal-navigation unsaved-change confirmation.
- Transactional PostgreSQL RPCs that combine concept, alias, relation, revision, and audit writes; reject stale edits; and retain the Milestone 1 graph invariants.
- A bounded concept-neighborhood service contract for Milestone 3 without adding graph rendering or search early.
- Viewer read-only behavior in both the UI and database, including direct edit-route protection.
- Shared UI primitives and calm, responsive, keyboard-visible application styling.

## Acceptance evidence

- `pnpm test:db` — 48 pgTAP assertions passed, including concept/relation rollback, alias uniqueness, revision/audit creation, viewer denial, symmetry, duplicate prevention, and cycle rejection.
- `pnpm test` — unit and component suites passed for query transformations, contracts, relationship accessibility, UI primitives, and unsaved-change behavior.
- `pnpm test:e2e:service` — authenticated Chromium workflow passed for World → Domain → Concept creation/edit/history, relation authoring, deprecation, and viewer read-only enforcement.
- `pnpm test:e2e` — isolated web-health Chromium test passed.
- `pnpm verify` — formatting, linting, strict TypeScript and Python checks, all default tests, worker checks, and production build passed.
- Browser visual QA — world map, domain view, and full authoring form inspected with no browser console warnings or errors.
- `pnpm audit --audit-level high --prod` — no high-severity production dependency findings.

## Migration

- `0002_milestone_2_authoring.sql` — profile peer visibility, snapshot/alias helpers, transactional concept and relation mutation functions, stale-write checks, revisions, and audit creation.

## Known limitations and explicit exclusions

- Multi-workspace switching remains outside the current single-owner-optimized slice.
- Graph rendering, ELK layout, graph interaction, hybrid search, aliases in retrieval, and embeddings belong to Milestone 3.
- Source upload, parsing, segments, citations, ingestion jobs, and extraction proposals remain excluded.
- Learning paths, readiness, mastery history, and evidence belong to Milestone 4.
- Live model calls, Ask Atlas, proposal review, Langfuse, graph databases, and cloud deployment remain excluded.
- The atlas seed still provides geography and relation grammar only; it does not publish generated concept prose as reviewed knowledge.
