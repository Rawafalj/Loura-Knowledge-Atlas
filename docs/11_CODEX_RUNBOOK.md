# 11 — Codex Execution Runbook

## 1. Purpose

This runbook converts the product specification into controlled Codex sessions. It supplements, but does not replace, `AGENTS.md` and `docs/06_IMPLEMENTATION_PLAN.md`.

Use one primary Codex task per milestone. Do not ask Codex to build all milestones in a single run.

## 2. Session protocol

At the start of every milestone, instruct Codex to:

1. read `AGENTS.md` and the relevant specification files;
2. inspect the current repository and recent decision records;
3. restate the milestone boundary and acceptance criteria;
4. identify dependencies and risks before editing;
5. create or update an implementation checklist;
6. implement the smallest coherent vertical increment;
7. add tests as behavior is added;
8. run narrow checks during development and `pnpm verify` at completion;
9. report evidence, not merely a success assertion.

Use a fresh session when context becomes cluttered or when changing milestones. Repository files, tests, and ADRs—not chat memory—are authoritative.

## 3. Reusable milestone prompt

```text
You are implementing Milestone <N> of the Loura Knowledge Atlas.

Before changing code:
1. Read AGENTS.md.
2. Read docs/01_PRODUCT_SPEC.md, docs/03_TECHNICAL_ARCHITECTURE.md,
   docs/04_DATA_MODEL.md, docs/06_IMPLEMENTATION_PLAN.md, and
   docs/08_TEST_AND_EVAL_PLAN.md.
3. Read any additional spec named below.
4. Inspect the current repository, migrations, tests, and docs/DECISIONS.md.
5. Restate this milestone's boundary, acceptance criteria, and explicit non-goals.
6. Identify conflicts between the repository and specification. Do not silently
   resolve material conflicts; record a proposed ADR first.

Implement Milestone <N> only.

Additional relevant specification:
- <files>

Required behavior:
- <copy the milestone deliverables and any task-specific constraints>

Verification:
- Add the tests required by docs/06_IMPLEMENTATION_PLAN.md.
- Run focused tests while iterating.
- Run pnpm verify before completion.
- Run the applicable Playwright or integration suite when services are required.

At completion report:
1. acceptance criteria with pass/fail evidence;
2. files and migrations changed;
3. tests and commands run with results;
4. security, accessibility, and data-integrity checks performed;
5. ADRs added or deviations made;
6. known limitations and the exact next milestone boundary.

Do not begin Milestone <N+1>. Do not claim completion if required checks fail.
```

## 4. Milestone-specific focus

### Milestone 0 — Repository and environment

Use `CODEX_START_PROMPT.md` verbatim. Review dependency versions and local setup before implementation. Do not add live AI behavior.

### Milestone 1 — Identity and graph foundation

Additional files:

- `docs/04_DATA_MODEL.md`
- `docs/09_SEED_ATLAS.md`

Critical review points:

- every workspace table has RLS;
- role tests cover owner, editor, and viewer;
- hierarchy and prerequisite cycles are rejected;
- import is idempotent;
- audit entries are generated from service boundaries.

### Milestone 2 — Browsing and authoring

Additional file:

- `docs/02_UX_SPEC.md`

Critical review points:

- reading remains primary;
- structured fields and Markdown synthesis are separate;
- canonical changes create revisions;
- relation data has a complete accessible non-graph view;
- no generic CMS abstraction replaces the concept model.

### Milestone 3 — Graph and search

Critical review points:

- bounded local graph only;
- server returns graph data independently of React Flow;
- graph/list parity is tested;
- lexical, alias, and semantic matching explain why a result matched;
- mock embeddings make CI deterministic.

### Milestone 4 — Learning and mastery

Critical review points:

- prerequisite readiness is explainable;
- viewing a page never implies mastery;
- user-approved mastery and AI assessment are separate;
- seed path remains editable but validated.

### Milestone 5 — Source ingestion

Additional files:

- `docs/03_TECHNICAL_ARCHITECTURE.md`
- `docs/05_API_AND_JOBS.md`

Critical review points:

- originals and source versions are immutable;
- source sensitivity and external-processing policy are enforced;
- URL ingestion blocks private networks and unsafe redirects;
- segment provenance is stable and inspectable;
- jobs are idempotent and retryable.

### Milestone 6 — AI proposals and review

Critical review points:

- model output is validated as hostile external input;
- proposed citations can reference only supplied, stored segment IDs;
- AI never writes canonical knowledge directly;
- proposal application is transactional;
- source instructions cannot override system extraction rules;
- prompts and schemas are versioned.

### Milestone 7 — Ask Atlas

Critical review points:

- retrieval is workspace-scoped and reviewed-only by default;
- displayed citations pass exact segment validation;
- insufficient evidence is a first-class result;
- streamed output can be cancelled;
- answer text is not promoted to canonical knowledge automatically.

### Milestone 8 — Loura application bridge

Critical review points:

- canonical knowledge remains independent of Loura project content;
- each link states its relevance explicitly;
- archiving a project application cannot mutate the concept;
- this area does not become a project-management system.

### Milestone 9 — Release hardening

Critical review points:

- RLS and citation integrity get full regression coverage;
- security headers, sanitization, and sensitive logging are reviewed;
- graph and list experiences have accessibility parity;
- production migration and recovery procedures are rehearsed;
- the full vertical product loop passes in the deployed environment.

## 5. Code-review prompt

Use this after a milestone implementation, preferably in a separate Codex review session.

```text
Review the current branch against AGENTS.md and Milestone <N> in
`docs/06_IMPLEMENTATION_PLAN.md`.

Do not edit initially. Inspect the diff, architecture, migrations, policies,
tests, and runtime boundaries. Report findings ordered by severity, with file
and line references. Specifically check:

- product-boundary drift;
- security and RLS defects;
- data-model invariant violations;
- AI-to-canonical write bypasses;
- invalid or fabricated citation paths;
- nondeterministic tests;
- accessibility regressions;
- unnecessary dependencies or abstractions;
- missing acceptance-criterion coverage.

After the findings, propose the smallest repair plan. Only implement repairs
after the review has been accepted.
```

## 6. Completion evidence format

Codex should end each milestone with this table:

| Acceptance criterion | Evidence | Status |
|---|---|---|
| Criterion | Command, test, screenshot path, or file reference | Pass / Fail |

It should then report:

```text
Commands run
Files changed
Migrations added
Tests added
ADRs added
Known limitations
Explicitly not implemented
```

## 7. Stop conditions

Codex must stop and report rather than continue when:

- a required secret or external service is unavailable;
- a current dependency incompatibility changes the selected architecture;
- an RLS policy cannot be tested;
- a migration would destroy or rewrite immutable source data;
- a requirement would let AI bypass review;
- tests fail for reasons not understood;
- completing the request would cross into the next milestone.
