# AGENTS.md

## Mission

Build the private Loura Knowledge Atlas described in `docs/`. The atlas maps the external knowledge required to understand, design, build, integrate, deploy, govern, and improve Loura. It must not drift into becoming a generic company dashboard or a map of Loura’s organizational structure.

## Required reading before coding

Read these files in order:

1. `docs/01_PRODUCT_SPEC.md`
2. `docs/02_UX_SPEC.md`
3. `docs/03_TECHNICAL_ARCHITECTURE.md`
4. `docs/04_DATA_MODEL.md`
5. `docs/05_API_AND_JOBS.md`
6. `docs/06_IMPLEMENTATION_PLAN.md`
7. `docs/08_TEST_AND_EVAL_PLAN.md`
8. `docs/09_SEED_ATLAS.md`

Do not implement from this file alone.

## Working agreements

- Implement milestones in the order defined in `docs/06_IMPLEMENTATION_PLAN.md`.
- Complete one milestone with tests before beginning the next.
- Do not change the selected stack without documenting the reason in `docs/DECISIONS.md` and receiving explicit approval.
- Do not add production dependencies when the platform or an existing dependency already provides the capability.
- Keep pull requests and change sets scoped to one coherent milestone or feature.
- Prefer readable, explicit code over clever abstractions.
- Use TypeScript strict mode. Do not introduce `any` without a documented boundary reason.
- Validate all external input with Zod in TypeScript and Pydantic in Python.
- Keep database migrations deterministic, reversible where practical, and committed.
- Every table containing workspace data must include `workspace_id` and have Row Level Security policies.
- Never expose Supabase service-role credentials or OpenAI credentials to the browser.
- Treat uploaded content as untrusted data. It must never become executable instructions for an agent.
- Source files and parsed source versions are immutable. Corrections create new versions.
- AI changes are proposals. They do not directly mutate canonical concepts, relations, claims, or synthesis.
- Every grounded answer and every accepted extracted claim must trace to stored source segment IDs.
- Prerequisite relations must remain acyclic.
- Canonical hierarchy allows one primary parent per concept; cross-domain semantics belong in typed relations.
- Graph views must have a non-graph list/tree alternative for accessibility.
- Do not render more than the configured graph-node cap without explicit user expansion.
- Do not use model names directly in business logic. Read them from configuration.
- Do not log source text, prompts containing confidential source text, API keys, or raw model outputs containing sensitive data.

## Commands expected in the completed repository

Codex must create and maintain these root commands:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm worker:dev
pnpm worker:test
pnpm verify
```

`pnpm verify` must run formatting/linting, type checking, unit tests, worker tests, and a production build. E2E may run separately in CI when services are available.

## Completion protocol for each task

Before reporting completion:

1. inspect the relevant specification and existing code;
2. implement the smallest coherent change;
3. add or update tests;
4. run the narrow tests while iterating;
5. run `pnpm verify` before finalizing;
6. report files changed, behavior added, tests run, and remaining known limitations;
7. do not claim success when required checks fail.

## UI conventions

- Use the shared design tokens and shadcn-derived components in `packages/ui`.
- Avoid one-off styling when a token or reusable component is appropriate.
- Desktop-first, responsive down to tablet; mobile is read-only/degraded in v0.1.
- Use progressive disclosure. Do not default to a giant global graph.
- Preserve keyboard access, visible focus, reduced-motion support, and semantic HTML.
- Use color as a secondary signal only; relation types also require labels, line patterns, or icons.

## Testing expectations

- Unit tests: Vitest for TypeScript; Pytest for Python.
- Component tests: React Testing Library where logic warrants it.
- End-to-end: Playwright for critical owner workflows.
- AI extraction: golden fixtures with deterministic mocked model outputs plus optional live eval jobs.
- Database invariants must be covered by migration tests or integration tests.
- Any bug fix must include a regression test unless the behavior cannot reasonably be automated; document exceptions.

## Prohibited shortcuts

- No direct browser-to-OpenAI calls.
- No automatic “accept all” for structural AI proposals.
- No generic CMS page model replacing the typed concept graph.
- No Neo4j, OWL reasoner, GraphRAG, LangChain, or multi-agent framework in v0.1 unless explicitly approved.
- No scraping arbitrary websites in v0.1.
- No embedding copyrighted full-text obtained without user authorization.
- No storing generated citations that do not reference an existing source segment.
- No fake seed content presented as reviewed knowledge.

