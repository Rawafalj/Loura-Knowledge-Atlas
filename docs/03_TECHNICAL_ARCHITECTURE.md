# 03 — Technical Architecture

## 1. Architecture decision

Build a custom, private web application with a typed PostgreSQL graph and a separate document-ingestion worker.

Do not fork a generic wiki, note-taking application, enterprise RAG assistant, or automatic GraphRAG system. Those products solve adjacent problems but do not provide the required combination of:

- canonical concept structure;
- typed semantic relations;
- prerequisite learning logic;
- source-grounded maintained synthesis;
- reviewable AI changes;
- personal mastery state; and
- explicit Loura application traceability.

## 2. Selected stack

### Web application

- **Next.js App Router**
- **React + TypeScript, strict mode**
- **Tailwind CSS**
- **shadcn/ui-derived local components**
- **React Flow (`@xyflow/react`)** for local graph interaction
- **ELK.js** for deterministic hierarchical/layered layouts
- **MDXEditor** for Markdown authoring
- **Zod** for runtime validation

### Data and platform

- **Supabase** managed initially, self-hostable later
  - PostgreSQL
  - Auth
  - Storage
  - Queues / `pgmq`
  - Row Level Security
- **Drizzle ORM and Drizzle Kit**
- **pgvector** for embeddings
- PostgreSQL full-text search for lexical retrieval

### Ingestion worker

- **Python 3.12+**
- **Docling** for document parsing
- **Pydantic** for models
- **psycopg** or `asyncpg` for PostgreSQL
- official **OpenAI Python SDK** for extraction calls
- **Pytest**
- packaged with **uv**
- OCI-compatible Docker image

### AI application layer

- official **OpenAI JavaScript SDK** from the Next.js server
- **Responses API** for Ask Atlas and structured synthesis/extraction support
- model IDs and reasoning settings supplied through environment configuration
- structured outputs validated through Zod/Pydantic
- optional **Langfuse** instrumentation for LLM traces and evals

### Testing and quality

- **Vitest** for TypeScript unit/integration tests
- **React Testing Library** for component behavior
- **Playwright** for end-to-end tests
- **Pytest** for worker tests
- **GitHub Actions** for CI

## 3. Why this stack

### PostgreSQL instead of a dedicated graph database

The initial graph consists of typed concepts and relations, with moderate traversal depth and a strong need for:

- transactions;
- RLS;
- source/citation joins;
- versioning;
- full-text and vector search;
- simple operational infrastructure.

An adjacency-list relation table plus recursive CTEs is sufficient for v0.1. A graph database may be reconsidered only after measured query or scale constraints.

### Supabase instead of assembling individual services

The product needs authentication, PostgreSQL, object storage, RLS, queues, and backups. A unified Postgres-based platform minimizes integration surface while remaining portable.

### React Flow plus ELK

React Flow handles node/edge interaction and accessible React composition. ELK handles layout. The graph is an interface over the canonical PostgreSQL model, not the source of truth.

### Docling worker

Document conversion is materially better handled in Python because Docling provides structured extraction across PDF and office/document formats, including layout and provenance. Keeping it in a separate worker prevents heavy parsing dependencies from entering the web runtime.

### Direct OpenAI SDK rather than a broad orchestration framework

The v0.1 AI workflows are explicit pipelines with human review. Direct SDK calls, structured output schemas, and normal application code are easier to inspect and test than a general autonomous agent framework.

## 4. System context

```text
Browser
  │
  ▼
Next.js web application
  ├── server-rendered pages
  ├── route handlers / server actions
  ├── hybrid retrieval service
  ├── Ask Atlas service
  └── proposal review service
  │
  ├──────────────► OpenAI API
  │
  ▼
Supabase
  ├── PostgreSQL + pgvector
  ├── Auth
  ├── private Storage
  └── Queue: source-ingest
  ▲
  │
Python ingestion worker
  ├── pulls durable jobs
  ├── downloads private source
  ├── parses with Docling
  ├── chunks and embeds
  ├── extracts candidate changes
  └── writes immutable results/proposals
```

## 5. Repository structure

```text
/
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── e2e.yml
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── lib/
│       ├── public/
│       └── tests/
├── packages/
│   ├── atlas-schema/
│   │   ├── src/
│   │   └── tests/
│   ├── db/
│   │   ├── src/
│   │   └── migrations/
│   ├── ai/
│   │   ├── src/
│   │   ├── prompts/
│   │   └── tests/
│   ├── retrieval/
│   │   ├── src/
│   │   └── tests/
│   └── ui/
│       ├── src/
│       └── tests/
├── services/
│   └── ingest-worker/
│       ├── pyproject.toml
│       ├── src/
│       ├── prompts/
│       ├── tests/
│       └── Dockerfile
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── seed/
│   ├── atlas.yaml
│   ├── sources.yaml
│   └── learning-paths.yaml
├── scripts/
│   ├── validate-atlas.ts
│   ├── check-citations.ts
│   └── seed-atlas.ts
└── docs/
```

If a monorepo package does not have a clear reuse boundary, keep code inside `apps/web` rather than creating a package prematurely.

## 6. Web architecture

### Rendering strategy

- Server Components for atlas, domain, concept, source, path, and activity read views.
- Client Components only for graph interaction, rich Markdown editing, streamed Ask Atlas UI, and local interactive filters.
- Route handlers for streaming, upload signing, job status, and API-like operations.
- Server actions are acceptable for simple authenticated mutations, but domain logic must live in services callable from tests.

### State strategy

- URL state for filters, selected relation types, graph depth, and search query where useful.
- Database/server is canonical state.
- React Flow local state for viewport and temporary node positions.
- No Redux.
- Avoid global client stores; introduce Zustand only if a documented cross-component client state need emerges.

### Caching

- Do not cache authenticated workspace content publicly.
- Use request-level/data cache only with explicit workspace-aware keys and invalidation.
- Invalidate domain/concept paths after accepted changes.
- Search and Ask responses are not persisted as canonical knowledge.

## 7. Database architecture

### Canonical graph

- `domains` and `concepts` represent nodes.
- `concept_relations` represents typed edges.
- A concept has `canonical_domain_id` and optional `canonical_parent_id`.
- Cross-domain membership is represented through relations/tags, not duplicate concepts.
- Prerequisite traversal uses recursive CTEs.

### Search

Store:

- generated `tsvector` columns for concepts and source segments;
- vector embeddings on concepts and source segments;
- GIN indexes for FTS;
- HNSW vector indexes once sufficient data exists.

Hybrid retrieval uses Reciprocal Rank Fusion over:

1. lexical concept results;
2. semantic concept results;
3. lexical source-segment results;
4. semantic source-segment results.

Do not add an external search engine in v0.1.

### Versions

- Concepts have current structured fields plus immutable `concept_revisions` snapshots.
- Source files are immutable.
- Parsed outputs create `source_versions`.
- Synthesis Markdown revisions are stored as snapshots or content-addressed text with revision metadata.
- AI proposal payloads retain schema version and model/run metadata.

## 8. Storage architecture

Private bucket structure:

```text
source-files/{workspace_id}/{source_id}/{checksum}/{original_filename}
source-derived/{workspace_id}/{source_id}/{source_version_id}/document.json
source-derived/{workspace_id}/{source_id}/{source_version_id}/document.md
source-derived/{workspace_id}/{source_id}/{source_version_id}/assets/...
```

Rules:

- original upload path includes checksum;
- no public buckets;
- browser access via signed URLs;
- worker uses service credentials;
- derived files are immutable per version;
- deleting a source is soft-delete by default; hard deletion is an owner-only administrative operation with audit record.

## 9. Queue and worker architecture

### Queue

Use Supabase Queues / `pgmq` queue named `source_ingest`.

Job payload:

```json
{
  "job_id": "uuid",
  "workspace_id": "uuid",
  "source_id": "uuid",
  "requested_by": "uuid",
  "parser_profile": "default-v1",
  "extraction_schema_version": "atlas-extract-v1",
  "allow_external_ai": true
}
```

### Job guarantees

- durable at-least-once processing behavior is assumed at the application level;
- the worker must be idempotent even if the queue offers a visibility-based exactly-once delivery window;
- claim a job with a visibility timeout;
- heartbeat/extend visibility during long parsing where supported;
- archive success;
- retain retry count and sanitized error;
- dead-letter after configured attempts.

### Idempotency key

```text
source_id + file_checksum + parser_profile + extraction_schema_version
```

If a completed source version exists for the same key, return it rather than duplicate work.

## 10. Document ingestion pipeline

```text
1. Validate source record and sensitivity policy
2. Download original from private storage
3. Validate checksum, size, and type
4. Parse with Docling
5. Persist immutable Docling JSON and Markdown
6. Normalize metadata and document hierarchy
7. Create structural source segments
8. Generate embeddings
9. Create source summary
10. Extract candidate concepts, relations, prerequisites, claims, citations, and applications
11. Resolve candidates against existing concepts
12. Persist change proposal and proposal items
13. Update job/source status
```

### Segmentation

Prefer structural segmentation over fixed character splitting.

Each segment stores:

- heading path;
- page number where available;
- paragraph/table/figure provenance;
- ordinal;
- text;
- token count;
- bounding boxes or Docling provenance JSON where available.

Target approximately 600–1,000 tokens per segment with modest overlap only when section boundaries require it. Tables may be standalone segments. Preserve stable segment IDs per source version.

### URL ingestion

v0.1 supports explicitly submitted HTTP/HTTPS URLs only.

Security controls:

- reject non-HTTP schemes;
- resolve DNS and reject loopback, link-local, private, and metadata service addresses;
- cap redirects;
- cap response size;
- allowlist content types;
- capture final URL;
- store rights note and original URL;
- do not recursively crawl links.

## 11. AI architecture

### Principles

- deterministic pipeline around probabilistic calls;
- source text is data, never instruction;
- structured output required for extraction;
- all references must use existing segment IDs supplied to the model;
- model IDs and settings are configuration;
- AI writes only to proposal/answer/run tables;
- canonical writes occur through reviewed application services.

### AI functions

1. `summarize_source`
2. `extract_atlas_candidates`
3. `resolve_concept_candidates`
4. `draft_concept_synthesis`
5. `answer_atlas_question`
6. `generate_learning_assessment` — optional after core v0.1

### Prompt storage

Store prompt templates in version-controlled files, not only external dashboards.

Every AI run records:

- prompt version;
- schema version;
- model ID;
- model settings;
- source/version IDs;
- latency;
- token usage where available;
- success/failure;
- sensitivity classification;
- output hash;
- trace ID.

Do not store raw confidential prompts in general logs.

### Model abstraction

Define interfaces:

```ts
interface StructuredModelClient {
  generate<T>(request: StructuredGenerationRequest<T>): Promise<StructuredGenerationResult<T>>
}

interface EmbeddingClient {
  embed(texts: string[]): Promise<number[][]>
}
```

OpenAI is the first implementation. Business logic must not import provider-specific SDK types.

## 12. Ask Atlas retrieval pipeline

```text
Question
  ↓
Normalize and classify scope
  ↓
Hybrid retrieve concepts + source segments
  ↓
Apply workspace/status/sensitivity filters
  ↓
Expand one graph hop around top concepts
  ↓
Assemble bounded evidence context
  ↓
Generate answer with required citation IDs
  ↓
Validate citations exist and were in context
  ↓
Stream/render answer
```

### Retrieval rules

- reviewed concept content ranks above draft by default;
- accepted claims rank above unresolved proposals;
- canonical/primary source quality can influence ranking but cannot suppress relevant contradictory evidence;
- citations must reference supplied source segment IDs;
- if retrieval confidence or evidence coverage is low, answer in insufficient-evidence mode;
- do not cite concept pages as if they were primary evidence; concept pages may be shown as synthesis links while source segments support factual claims.

### Context limits

Use a bounded context budget. Select diverse evidence across relevant concepts and sources rather than taking only adjacent chunks from one document.

## 13. Change proposal architecture

Proposal lifecycle:

```text
draft → ready_for_review → partially_reviewed → accepted/rejected/mixed → archived
```

Proposal item lifecycle:

```text
pending → accepted | edited_and_accepted | rejected | deferred | stale
```

Accepted items call typed domain services:

- `createConceptFromProposal`
- `updateConceptFromProposal`
- `addRelationFromProposal`
- `addClaimFromProposal`
- `addCitationFromProposal`
- `addApplicationFromProposal`

Each service:

1. checks authorization;
2. validates item freshness and schema;
3. validates referenced source segments;
4. enforces graph invariants;
5. applies changes transactionally;
6. creates revision and audit events;
7. marks item accepted.

## 14. Security architecture

### Authentication and authorization

- Supabase Auth.
- Roles stored in `workspace_members`.
- RLS uses authenticated user ID and workspace membership.
- Owner/editor/viewer policies.
- Service role used only in server and worker environments.

### Source processing policy

Fields:

```text
sensitivity: public | internal | confidential
external_ai_policy: allowed | denied | explicit_per_run
```

Default recommendation:

- public: allowed;
- internal: explicit per workspace default;
- confidential: denied unless owner explicitly changes policy.

### Prompt injection resistance

- extraction prompts state that document content is untrusted and may contain instructions;
- no extraction worker tools other than controlled DB/storage operations outside model control;
- model receives opaque segment IDs and text, not database credentials;
- structured schema disallows executable actions;
- URL content is sanitized and isolated;
- AI output is not rendered as unsanitized HTML.

### File safety

- extension and MIME allowlist;
- maximum upload size configured;
- checksum;
- parser runs in worker container with limited filesystem/network access;
- resource limits;
- no macros executed;
- optionally add malware scanning before broader team use.

### Web security

- CSRF protection through framework/Supabase patterns;
- secure cookies;
- CSP;
- sanitize rendered Markdown/HTML;
- SSRF controls for URL ingestion;
- rate limits for auth, uploads, search, and AI routes;
- security headers;
- dependency scanning in CI.

## 15. Observability

### Application telemetry

- structured logs with request/job/trace IDs;
- OpenTelemetry-compatible traces where practical;
- error reporting with sensitive-data scrubbing;
- queue depth, job age, ingestion duration, and failure metrics;
- search latency and result counts;
- graph query timing.

### LLM telemetry

Langfuse may be used for:

- AI traces;
- prompt versions;
- model latency and usage;
- eval datasets and scores.

The application remains functional when Langfuse is unavailable. Telemetry errors must not fail user workflows.

## 16. Deployment

### Managed initial deployment

```text
Web: Vercel-compatible Next.js deployment
Database/Auth/Storage/Queue: Supabase managed project
Worker: OCI container host with persistent outbound network and sufficient CPU/RAM
AI: OpenAI API
Observability: Langfuse Cloud or self-hosted, optional
```

The worker deployment must not depend on a vendor-specific API. Provide a Dockerfile and environment-based configuration.

### Local development

Required services:

- Node/pnpm;
- Python/uv;
- Docker;
- Supabase CLI;
- local Supabase stack;
- local worker;
- mocked AI by default, live AI opt-in.

Recommended flow:

```bash
supabase start
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
pnpm worker:dev
```

### Future self-hosted deployment

A later deployment profile may compose:

- Next.js container;
- self-hosted Supabase services;
- worker container;
- optional Langfuse;
- reverse proxy.

Do not make full self-hosting a release blocker for v0.1.

## 17. Environment variables

Create `.env.example` with at least:

```text
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

OPENAI_API_KEY=
OPENAI_ANSWER_MODEL=
OPENAI_EXTRACTION_MODEL=
OPENAI_EMBEDDING_MODEL=
EMBEDDING_DIMENSIONS=

SOURCE_MAX_UPLOAD_MB=
URL_INGEST_MAX_MB=
GRAPH_VISIBLE_NODE_CAP=100
ASK_MAX_CONTEXT_TOKENS=

LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_BASE_URL=

AI_LIVE_TESTS=false
```

Worker variables may be prefixed consistently but should reuse shared names where safe.

## 18. Architecture decision records

Codex must create `docs/DECISIONS.md` and record any deviation. Initial decisions:

- ADR-001: Custom app, not generic wiki fork.
- ADR-002: PostgreSQL typed graph before graph database.
- ADR-003: Supabase platform.
- ADR-004: Separate Python Docling worker.
- ADR-005: Human-reviewed AI proposals.
- ADR-006: Direct OpenAI SDK and provider interfaces.
- ADR-007: React Flow local graphs with ELK layout.
- ADR-008: Hybrid PostgreSQL retrieval.

