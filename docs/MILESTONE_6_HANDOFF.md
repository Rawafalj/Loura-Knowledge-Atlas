# Milestone 6 Handoff — AI Extraction and Human Review

**Status:** Complete for the review-only extraction foundation.

## Delivered

- Versioned Pydantic and Zod schemas for summaries, extraction candidates,
  claims, relations, applications, and concept resolution.
- Deterministic mock provider plus an opt-in OpenAI-compatible structured
  provider. Live credentials are never required for startup or CI.
- Prompt-injection-safe source framing, detection warnings, strict evidence
  segment validation, relation-grammar validation, and conservative exact
  canonical/alias resolution. Ambiguous matches remain human review.
- `ai_runs`, `change_proposals`, and `change_proposal_items` with workspace
  boundaries, run idempotency, evidence ownership checks, RLS, immutable
  reviewed-item history, and audited review actions.
- Owner-only structural approval; editors may approve citation-only items.
  Accepted concept/relation changes run transactionally through the existing
  typed atlas services and create proposal-linked revision/audit provenance.
- Review queue and proposal detail pages with evidence excerpts, confidence,
  rationale, and accept/defer/reject actions.
- Source detail includes an idempotent review-only mock extraction action for
  local/CI validation; it creates a clearly labelled citation proposal and
  never presents mock output as reviewed canonical knowledge.

## Acceptance evidence

- `pnpm test` — all TypeScript package and web tests passed (30 web tests).
- Worker checks — 28 Pytest tests, Ruff, and strict mypy passed.
- `supabase test db` — 126 pgTAP assertions passed, including Milestone 6
  RLS, evidence, role, review, immutability, and audit checks.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm format:check` passed.
- `pnpm db:generate` reports no schema drift.

## Explicit limitations

- Extraction proposal persistence is review-only; no AI path can directly
  mutate canonical concepts, relations, claims, or synthesis.
- The default provider is deterministic mock. Live OpenAI calls remain
  disabled unless explicitly configured with non-confidential source policy.
- Claim/application typed canonical tables and their acceptance handlers are
  deferred to the follow-on application/grounded-answer milestones; proposals
  remain safely reviewable and auditable.
