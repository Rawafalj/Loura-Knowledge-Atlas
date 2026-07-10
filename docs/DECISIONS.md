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
