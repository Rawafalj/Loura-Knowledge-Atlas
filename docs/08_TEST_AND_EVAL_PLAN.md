# 08 — Software Test and AI Evaluation Plan

## 1. Quality strategy

The system has two different quality problems:

1. deterministic software correctness;
2. probabilistic knowledge/AI quality.

Do not collapse them into one test suite. Software tests must be reproducible and run without live model calls. AI evaluations may include controlled live runs, but must use versioned datasets and explicit thresholds.

## 2. Test layers

## 2.1 Static checks

- TypeScript strict typecheck;
- Python type/lint checks as configured;
- ESLint/formatting;
- schema generation consistency;
- migration drift detection;
- prohibited dependency/import checks;
- secret scanning;
- dependency vulnerability scanning.

## 2.2 Unit tests

### TypeScript

Use Vitest for:

- relation normalization;
- cycle detection;
- path readiness;
- mastery rules;
- proposal state transitions;
- citation validation;
- RRF ranking;
- URL safety helpers;
- Markdown sanitization configuration;
- graph result capping;
- audit summary creation;
- schema parsing.

### Python

Use Pytest for:

- Docling adapter normalization;
- segment construction;
- stable segment ordering;
- idempotency-key generation;
- sensitivity policy;
- extraction schema validation;
- evidence segment validation;
- proposal builder;
- queue retry classification;
- safe URL resolution where worker participates.

## 2.3 Database integration tests

Run against local Supabase/PostgreSQL.

Required coverage:

- RLS role matrix;
- cross-workspace isolation;
- relation uniqueness;
- prerequisite cycle rejection;
- parent cycle rejection;
- transaction rollback on failed proposal application;
- source-segment immutability;
- idempotent seed import;
- idempotent ingestion version creation;
- generated FTS search;
- vector query with fixture embeddings;
- audit creation.

## 2.4 Component tests

Use React Testing Library selectively for:

- proposal diff controls;
- mastery control;
- source status/progress;
- citation drawer;
- graph filter controls;
- accessible relation list;
- Ask Atlas stream state;
- unsaved editor warning.

Do not snapshot entire pages. Test behavior and accessible output.

## 2.5 End-to-end tests

Use Playwright. Critical scenarios are listed in the implementation plan.

Browsers:

- Chromium required in every CI run;
- Firefox and WebKit in scheduled or release runs.

E2E must use deterministic fixture data and mocked AI endpoints unless running the explicit live suite.

## 3. Parser fixtures

Create small, redistributable or locally authored fixtures:

- text PDF with headings and pages;
- PDF with table;
- DOCX with headings/lists/table;
- PPTX with titles and notes/text;
- Markdown;
- HTML;
- image/scanned PDF only if OCR dependencies are enabled.

For each fixture store expected:

- detected metadata;
- section hierarchy;
- segment count range;
- page provenance;
- table representation;
- stable checksum;
- no loss of critical text.

Avoid placing copyrighted third-party documents in the test repository.

## 4. AI mock strategy

Define mock clients implementing the provider interfaces.

Mocks must support:

- valid structured output;
- malformed JSON/schema;
- unknown citation ID;
- unknown relation type;
- duplicate concept proposal;
- prompt-injection source content;
- timeout/rate limit/transient error;
- permanent safety/policy denial;
- partial stream and cancellation.

All default CI uses mocks.

## 5. Golden AI evaluation datasets

Create versioned JSONL or YAML datasets.

## 5.1 Extraction dataset

Each case contains:

```yaml
caseId: retries-idempotency-001
sourceSegments:
  - id: seg-1
    text: ...
existingConcepts:
  - id: concept-idempotency
    name: Idempotency
expected:
  mustMatchExisting:
    - concept-idempotency
  allowedRelationTypes:
    - prerequisite_for
    - related_to
  mustCiteSegments:
    - seg-1
  forbiddenConcepts:
    - Exactly-once delivery as an identical synonym
```

Metrics:

- schema-valid rate;
- evidence-valid rate;
- concept match precision;
- duplicate creation rate;
- relation type precision;
- prerequisite precision;
- unsupported claim rate;
- prompt-injection compliance.

## 5.2 Grounded QA dataset

Each case contains:

- question;
- permitted concept IDs;
- source segments;
- required facts;
- forbidden unsupported assertions;
- expected evidence state;
- valid citation IDs.

Metrics:

- answer relevance;
- citation validity;
- citation coverage;
- entailment of cited passage to claim;
- unsupported-claim rate;
- correct insufficient-evidence behavior;
- concept selection quality.

## 5.3 Concept resolution dataset

Include:

- exact synonyms;
- abbreviation;
- broader/narrower concepts;
- close but distinct concepts;
- same label in different domains;
- outdated terms;
- ambiguous candidate.

Metrics:

- same-concept precision;
- false merge rate;
- human-review routing rate for ambiguity.

False merges are more harmful than duplicate proposals. Optimize for conservative resolution.

## 6. Initial AI quality thresholds

Thresholds may be revised only with documented evidence.

### Extraction

- structured schema validity: 100% after retry/repair handling;
- evidence IDs exist: 100%;
- unknown relation keys accepted: 0%;
- direct canonical writes from AI: 0%;
- prompt-injection instruction compliance: 0%;
- false automatic merge: 0% because merge is never automatic;
- proposal precision on curated fixture set: target at least 80% useful or safely reviewable.

### Ask Atlas

- citation IDs valid: 100%;
- factual paragraphs with at least one supporting citation: target at least 95% on eval set;
- fabricated citations: 0%;
- correct insufficient-evidence classification: target at least 90%;
- unsupported material claim rate: target below 5% on curated eval set.

If thresholds fail, release may continue for deterministic features, but live AI functionality must remain behind a feature flag.

## 7. Retrieval evaluation

Evaluate retrieval separately from answer generation.

Dataset fields:

- query;
- relevant concept IDs;
- relevant source segment IDs;
- hard negatives;
- scope filters.

Metrics:

- Recall@5 and Recall@10;
- MRR;
- domain-filter accuracy;
- reviewed-only accuracy;
- diversity across sources;
- lexical versus semantic contribution.

Inspect queries such as:

- exact technical term;
- abbreviation;
- plain-language description;
- cross-domain question;
- misspelling;
- concept confusion;
- project implication query.

## 8. Knowledge-graph validation

Run `scripts/validate-atlas.ts` in CI against seed and canonical export.

Checks:

- unique slugs and aliases;
- valid domain/parent references;
- no hierarchy cycle;
- no prerequisite cycle;
- no invalid relation type;
- no self relation where forbidden;
- no orphan high-priority concept;
- no learning path broken reference;
- path prerequisites ordered or waived;
- no reviewed concept without concise definition;
- no reviewed priority concept without a source warning;
- no citation to missing segment;
- deprecated concepts with active path references flagged;
- duplicate normalized concept names flagged for review.

## 9. Security testing

### Automated

- RLS policy tests;
- SSRF unit/integration tests with private/loopback/redirect cases;
- stored/reflected XSS tests for Markdown and source excerpts;
- upload type/size bypass tests;
- path traversal tests;
- auth/session tests;
- rate-limit tests;
- prompt-injection fixtures;
- dependency and secret scanning.

### Manual release review

- verify no service key in client bundle;
- inspect signed URL expiry;
- inspect CSP and security headers;
- review logs for source-text leakage;
- review worker container permissions;
- test owner/editor/viewer boundaries;
- review confidential source policy.

## 10. Accessibility testing

### Automated

- axe checks in Playwright for primary routes;
- form labels;
- color contrast where automation supports it;
- focus trapping in dialogs/drawers.

### Manual

- complete critical navigation by keyboard;
- use screen reader on concept, source, review, and Ask pages;
- confirm graph has equivalent relation list;
- confirm streaming status announcements;
- confirm reduced motion;
- zoom to 200% without loss of functionality.

## 11. Performance tests

Seed a realistic v0.1 dataset:

- 100 concepts;
- 500 relations;
- 30 sources;
- 3,000 source segments;
- 200 citations;
- 100 proposal items.

Measure:

- world map server response;
- concept page response;
- recursive prerequisite query;
- graph neighborhood query;
- FTS/vector/hybrid search;
- proposal list/detail;
- source segment pagination.

Graph UI test:

- 100 nodes / 250 edges;
- filtering and selection remain responsive;
- no automatic attempt to render entire corpus.

## 12. Live model eval workflow

Live evals are opt-in:

```bash
AI_LIVE_TESTS=true pnpm test:ai-live
```

Requirements:

- dedicated test project/API key;
- cost cap;
- no confidential data;
- record model/prompt/schema versions;
- store eval result artifact;
- do not make ordinary CI depend on provider availability.

## 13. Bug severity

### Critical

- cross-workspace data leak;
- service key exposed;
- canonical AI write without review;
- fabricated citation presented as valid;
- source deletion/corruption;
- arbitrary code execution;
- persistent XSS.

### High

- prerequisite cycle admitted;
- accepted proposal applies wrong target;
- source sensitivity policy ignored;
- ingestion duplication causing conflicting versions;
- Ask Atlas retrieves another workspace’s data;
- inaccessible critical owner workflow.

### Medium

- incorrect graph layout/filter;
- stale proposal not clearly flagged;
- search quality regression;
- revision history gap;
- non-critical responsive defect.

## 14. Release evidence

Before v0.1 release, produce:

- CI run link/result;
- E2E report;
- RLS matrix report;
- citation integrity report;
- atlas validation report;
- live AI eval report if live AI enabled;
- accessibility checklist;
- dependency/license inventory;
- migration rehearsal result;
- known limitations list.

