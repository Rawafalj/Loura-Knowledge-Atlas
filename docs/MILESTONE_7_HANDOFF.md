# Milestone 7 Handoff — Ask Atlas

**Status:** Complete for the bounded, reviewable grounded-answer flow.

## Delivered

- Private `ask_threads` and `ask_messages` with user-owned RLS, workspace
  boundaries, retention-safe thread deletion, and immutable ownership.
- Citation persistence validation: assistant messages can cite only completed,
  non-deleted source segments in the same workspace.
- Bounded, deduplicated evidence bundles with concept context and exact segment
  metadata; reviewed-only, concept, domain, and learning-path scope support.
- Prompt-injection-safe answer prompts, structured answer schema, exact
  citation validation, first-class insufficient-evidence classification, and
  cancellation-safe SSE events.
- Ask Atlas page with send/stop controls, answer status announcements, saved
  private threads, concept IDs, and citation excerpts linking to exact source
  segments.

## Acceptance evidence

- `pnpm verify` — formatting, lint, strict TypeScript/Python checks, all tests,
  worker tests, and production build passed.
- Web tests: 16 files / 35 tests passed, including 5 Ask grounding tests.
- Worker tests: 28 passed; Ruff and strict mypy passed.
- `supabase test db`: 142 pgTAP assertions passed across Milestones 1–7.
- `pnpm db:generate`: no schema changes reported.

## Explicit limitations

- The default answer provider is deterministic mock output. Live provider calls
  remain opt-in and are not required for local/CI operation.
- Source lexical retrieval currently contributes one best segment per source;
  broader segment diversity and live model evaluation remain follow-up work.
- Ask answers are persisted only after citation validation; aborted streams do
  not publish partial assistant messages.
