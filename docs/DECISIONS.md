# Architecture and Product Decision Log

Use this file for durable decisions that change, clarify, or deviate from the build specification.

## Rules

- Add an entry before implementing a material deviation from the selected architecture or product boundary.
- Use the next sequential identifier: `ADR-001`, `ADR-002`, and so on.
- Do not rewrite accepted entries to conceal history. Supersede them with a new decision.
- Link the pull request or commit when available.
- Record rejected alternatives and consequences, not only the selected choice.
- Product boundary changes require explicit product-owner approval.

## Status values

- **Proposed** — written for review; not yet authoritative.
- **Accepted** — approved and authoritative.
- **Rejected** — considered but not selected.
- **Superseded** — replaced by a later ADR.
- **Deprecated** — retained for history but no longer recommended.

---

## ADR-000 — Initial architecture baseline

**Status:** Accepted  
**Date:** 2026-07-10  
**Decision owners:** Rawaf / Loura, implementation lead

### Context

The Loura Knowledge Atlas needs a stable concept model, source-grounded synthesis, prerequisite-based learning, human-reviewed AI changes, personal mastery state, and explicit links from independent knowledge to Loura applications.

### Decision

Use the architecture and stack defined in `docs/03_TECHNICAL_ARCHITECTURE.md`:

- custom private web application;
- Next.js and TypeScript for the application;
- PostgreSQL/Supabase as the canonical data platform;
- typed node/edge tables rather than a dedicated graph database in v0.1;
- private object storage and durable Postgres-backed jobs;
- separate Python/Docling ingestion worker;
- direct OpenAI SDK integrations behind provider interfaces;
- human review before AI proposals can change canonical knowledge;
- Markdown for long-form synthesis;
- bounded local graph views with accessible list alternatives.

### Rejected alternatives

- Forking a generic wiki or note-taking product.
- Starting with Neo4j or a formal OWL reasoner.
- Using autonomous multi-agent maintenance.
- Building a general-purpose RAG assistant without a canonical concept model.
- Modeling Loura’s company structure as the atlas root.

### Consequences

The first release prioritizes conceptual integrity, traceability, and learning utility over breadth and automation. More specialized graph or agent infrastructure may be adopted only after measured need.

---

## ADR template

Copy this section for each new decision.

```markdown
## ADR-XXX — Decision title

**Status:** Proposed  
**Date:** YYYY-MM-DD  
**Decision owners:** ...

### Context

What problem or constraint requires a decision?

### Decision

What is being selected or changed?

### Alternatives considered

- Alternative A — why not selected.
- Alternative B — why not selected.

### Consequences

What becomes easier, harder, constrained, or newly required?

### Validation or reversal trigger

What evidence would cause this decision to be revisited?

### References

- Relevant specification, issue, pull request, benchmark, or documentation.
```

---

## ADR-001 — Ten visible top-level knowledge areas

**Status:** Accepted  
**Date:** 2026-07-10  
**Decision owners:** Rawaf / Loura, implementation lead

### Context

The product specification names eight top-level domains, while the seed specification defines two supporting roots, seven core branches, and one industrial overlay.

### Decision

Use all ten areas as visible top-level atlas geography. The two supporting roots remain knowledge domains, and the industrial area remains an overlay rather than being collapsed into another branch.

### Alternatives considered

- Eight canonical domains by treating the roots as presentation-only groupings — rejected because the roots contain their own subdomains and canonical concepts.
- Seed eight now and add the roots later — rejected because it weakens prerequisite orientation in the first route.

### Consequences

World-map counts and seed acceptance criteria use ten visible areas. The original eight-domain target is treated as superseded by this clarification.

---

## ADR-002 — Proposal approval authority

**Status:** Accepted  
**Date:** 2026-07-10  
**Decision owners:** Rawaf / Loura, implementation lead

### Context

The specification requires human review but leaves the editor's approval boundary ambiguous.

### Decision

Only owners may approve structural proposals that create or change concepts, aliases, relations, prerequisites, claims, contradictions, or Loura applications. Editors may approve citation-only proposals after citation-integrity validation.

### Consequences

Milestone 1 authorization helpers and Milestone 6 proposal services must encode and test this distinction.

---

## ADR-003 — Single migration authority

**Status:** Accepted  
**Date:** 2026-07-10  
**Decision owners:** Rawaf / Loura, implementation lead

### Context

The architecture mentions both Drizzle migrations and Supabase migrations, creating a risk of divergent histories.

### Decision

Supabase SQL files under `supabase/migrations` are the single deployable migration history. Beginning in Milestone 1, Drizzle defines the TypeScript schema and generates reviewed SQL into that history.

### Consequences

CI will check schema/migration drift once the first schema exists. No second migration directory will be introduced.

---

## ADR-004 — Workspace-owned relation grammar

**Status:** Accepted

**Date:** 2026-07-10

**Decision owners:** Rawaf / Loura, implementation lead

### Context

Mixing nullable global relation templates with workspace-owned relation types would make ownership, customization, and RLS policies harder to reason about.

### Decision

Every relation type is owned by exactly one workspace in v0.1. The validated seed installer copies the system grammar into each new workspace. Symmetric relations are normalized to canonical endpoint order before persistence; inverse labels are a read-time concern.

### Consequences

Relation-type keys are unique per workspace, structural changes remain owner-only, and all graph rows retain an unambiguous workspace boundary. Updating the system grammar requires an explicit versioned workspace migration strategy in a later milestone.

---

## ADR-005 — Database-enforced graph invariants

**Status:** Accepted

**Date:** 2026-07-10

**Decision owners:** Rawaf / Loura, implementation lead

### Context

Service-only hierarchy and prerequisite validation can admit cycles when two valid-looking writes race.

### Decision

Enforce workspace-local hierarchy, endpoint, relation-kind, symmetry, self-edge, and acyclic-relation rules in PostgreSQL. Serialize competing hierarchy and acyclic relation mutations with transaction-scoped advisory locks, then run recursive cycle checks inside the same transaction.

### Consequences

All clients receive the same integrity guarantees, including import and future worker paths. Domain services should still pre-validate for readable errors, while PostgreSQL remains the final authority. Database integration tests deliberately race opposing writes.

---

## ADR-006 — Migration-bound concept embedding profile

**Status:** Accepted

**Date:** 2026-07-10

**Decision owners:** Rawaf / Loura, implementation lead

### Context

pgvector columns and indexes require a stable dimension, while provider models and dimensions can change. Milestone 3 must remain deterministic without live provider credentials, and source-segment embeddings do not exist until deterministic source ingestion in Milestone 5.

### Decision

The Milestone 3 concept embedding column is `vector(1536)`, tied to migration `0003_milestone_3_search_graph.sql`. The default profile uses the deterministic mock embedding client and stores its profile ID with each vector. A different dimension requires a new column/index migration and an explicit re-embedding job. Exact vector search is used at the current small atlas scale; an HNSW index is deferred until realistic data and profiling demonstrate a benefit. Search retains a typed source-result channel but returns it empty until immutable source/version/segment records exist.

### Alternatives considered

- Dimensionless vectors — rejected because indexed rows would still need dimension-specific expression indexes and profile filtering.
- An HNSW index on the empty seed atlas — rejected because it adds operational cost before there is data to benchmark.
- Creating source tables early only to make search return placeholders — rejected because source immutability and ingestion belong to Milestone 5.

### Consequences

Concept authoring refreshes derived mock embeddings without changing canonical revisions. Search can combine lexical and semantic concept channels now without presenting synthesis as primary-source evidence. Live embedding adoption must include a migration/re-embedding plan rather than an environment-only dimension change.

### Validation or reversal trigger

Revisit exact vector search when the realistic performance fixture or production telemetry shows it cannot meet the one-second search target.

---

## ADR-007 — Learner-owned readiness and evidence

**Status:** Accepted

**Date:** 2026-07-11

**Decision owners:** Rawaf / Loura, implementation lead

### Context

Learning paths are canonical workspace content, while readiness and mastery are personal state. The specification requires ordered mandatory steps, explicit prerequisite thresholds, reasoned waivers, evidence-backed changes, preserved history, and viewer updates to only their own mastery.

### Decision

Canonical paths and ordered steps are owner/editor-maintained. A path step is complete when the learner reaches that step's target mastery. A later step is ready only when every earlier mandatory step in its branch reaches its target and each explicit `prerequisite_for` edge reaches the later step's configured prerequisite threshold. A learner may waive an explicit prerequisite only through a separate per-user, per-path record with a reason; the waiver never deletes or weakens the canonical relation.

Mastery writes go through one transactional PostgreSQL function that appends evidence, upserts the learner's current record, and creates an audit event. Evidence is immutable to authenticated users. AI assessment remains absent rather than being mixed into user-approved mastery.

### Alternatives considered

- Marking page views as progress — rejected because reading is not evidence of understanding.
- Storing progress directly on canonical path steps — rejected because it would mix shared curriculum with personal state.
- Treating a waiver as relation deletion — rejected because a learner exception must not change semantic truth for the workspace.
- Allowing direct table writes for mastery — rejected because evidence, state, and audit must commit together.

### Consequences

Readiness explanations remain deterministic and testable. Viewers can maintain only their own learning state while remaining unable to edit canonical routes. Optional branches retain a branch key without introducing a workflow engine.

---

## ADR-008 — Deterministic, immutable source ingestion boundary

**Status:** Accepted

**Date:** 2026-07-11

**Decision owners:** Rawaf / Loura, implementation lead

### Context

Source ingestion crosses three trust boundaries: untrusted bytes, private storage, and a parser with a large dependency surface. The product also requires retriable jobs without duplicate evidence and forbids AI from writing canonical content.

### Decision

Originals and parser-derived artifacts live in separate private Supabase Storage buckets. Authenticated owner/editor sessions create upload intents and explicit URL jobs; the service-role key exists only in the worker. A durable versioned `pgmq` message invokes a pinned, lazily imported Docling parser. PDF enrichment features and remote parser services are disabled. Every completed version is identified by source checksum, parser profile, and deterministic extraction-schema version; completed versions and their structural segments are database-immutable.

Explicit URLs are restricted to HTTP/HTTPS, standard ports, approved MIME types, bounded sizes, and public DNS/IP results. Every redirect is revalidated by both the web boundary and worker fetch boundary. The fetcher never crawls discovered links. Source text remains untrusted data and no external AI call or extraction proposal occurs in this milestone.

### Alternatives considered

- Parsing in the web process — rejected because heavyweight, untrusted conversion should not share the request runtime.
- A service-role web data path — rejected because routine authenticated access must remain protected by RLS.
- Docling's slim extra — rejected because the supported converter surface still imports required document/PDF backends outside that extra.
- Updating a completed parse in place — rejected because citations must retain an immutable evidence target.

### Consequences

Worker images and lockfiles are larger, but web and health startup stay lightweight. Parser upgrades or profile changes create a new immutable version. Retries reuse the same version key and never duplicate completed segments. Malware scanning and isolated conversion infrastructure remain release-hardening concerns; v0.1 accepts only explicitly supported formats and treats all parsed content as non-executable.
