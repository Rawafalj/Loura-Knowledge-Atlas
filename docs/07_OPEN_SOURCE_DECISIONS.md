# 07 — Open-Source and Build-vs-Reuse Decisions

## 1. Decision framework

Adopt an open-source project directly when it provides a bounded technical capability with a stable interface and does not dictate the product’s canonical model.

Reference, but do not fork, an open-source application when its product model conflicts with the atlas.

Avoid adding a project because it is fashionable or adjacent to knowledge graphs. Every dependency creates maintenance, security, and conceptual cost.

## 2. Adopt directly

| Project | Use | Decision | Rationale |
|---|---|---|---|
| Next.js | Web application | Adopt | Full-stack React framework with server rendering and route handlers |
| shadcn/ui | UI primitives/source | Adopt selectively | Open code copied into repository; accessible building blocks and good Codex legibility |
| React Flow | Local graph UI | Adopt | MIT-licensed node/edge interaction without forcing a graph backend |
| ELK.js / Eclipse Layout Kernel | Graph layout | Adopt | Mature hierarchical/layered layout algorithms |
| react-force-graph-2d | Workspace semantic map | Adopt selectively | MIT-licensed, client-only force-directed canvas renderer for bounded semantic exploration; paired with a relationship-list fallback |
| MDXEditor | Markdown editing | Adopt | Open-source editor that accepts/emits Markdown, preserving portable content |
| Supabase | Postgres/Auth/Storage/Queues | Adopt | Consolidates required platform capabilities and remains self-hostable |
| PostgreSQL | Canonical data | Adopt | Transactions, relational integrity, RLS, recursive queries, FTS |
| pgvector | Semantic retrieval | Adopt | Keeps vector search beside canonical relational data |
| Drizzle | TypeScript data access/migrations | Adopt | SQL-oriented TypeScript mapping and pgvector support |
| Docling | Document conversion | Adopt | Structured multi-format parsing, layout, tables, and provenance |
| OpenAI official SDKs | AI generation/extraction | Adopt | Direct provider integration with structured output and streaming support |
| Langfuse | LLM observability/evals | Optional adopt | Open/self-hostable tracing and evals; non-critical dependency |
| Vitest | Unit tests | Adopt | Fast TypeScript testing |
| Playwright | E2E tests | Adopt | Cross-browser end-to-end test runner |
| Pytest | Worker tests | Adopt | Standard Python test framework |

## 3. Reference but do not fork

## Logseq

Useful patterns:

- linked concepts/notes;
- local graph navigation;
- privacy and user-control orientation;
- Markdown/Org portability.

Why not fork:

- note/block model rather than canonical typed concepts;
- product architecture and language stack create unnecessary adaptation cost;
- no native reviewed proposal workflow, prerequisite curriculum model, or explicit Loura bridge.

## Wiki.js

Useful patterns:

- private documentation;
- Markdown/visual editing;
- administration and authentication.

Why not fork:

- page-centric wiki model;
- typed graph and learning state would become extensive custom subsystems;
- AGPL implications should be evaluated for any code reuse;
- custom app is smaller than forcing atlas semantics into generic wiki abstractions.

## Onyx

Useful patterns:

- connector and ingestion UX;
- RAG answer interface;
- self-hosting posture.

Why not fork:

- assistant/search is the primary product object;
- the atlas requires curated canonical structure and human-reviewed synthesis;
- importing a large enterprise-search platform would obscure the differentiating domain model.

## Microsoft GraphRAG

Useful patterns:

- extracting entities/relations from unstructured text;
- graph-aware retrieval;
- corpus-level summaries.

Why not use in v0.1:

- it is a transformation/retrieval pipeline, not an authoritative curated learning atlas;
- automatic graph extraction could invert the desired hierarchy: corpus-derived structure would replace the designed conceptual map;
- operational and token complexity is unnecessary for the initial scale;
- extraction components can be evaluated later against the custom proposal pipeline.

## Protégé / OWL tooling

Useful patterns:

- ontology discipline;
- explicit classes, properties, and constraints;
- competency-question thinking.

Why not use as the main UI/backend:

- too formal for initial product validation;
- not designed for the intended learning and source-review experience;
- lightweight typed relations are sufficient initially.

## 4. Explicitly defer

| Technology | Reason for deferral | Trigger to reconsider |
|---|---|---|
| Neo4j / dedicated graph DB | Added infrastructure and authorization complexity | Measured traversal/query limits in Postgres |
| Apache AGE | Premature dual graph/relational abstraction | Strong need for Cypher inside existing Postgres |
| OWL reasoner | Formal axioms not yet stable or required | Need for machine inference/consistency beyond app validation |
| LangChain/LlamaIndex | Broad abstraction not required for explicit pipelines | Multiple providers/workflows become materially hard to maintain |
| Multi-agent orchestration | More failure modes and lower inspectability | Clear task decomposition outperforms deterministic pipelines in evals |
| Automatic web crawler | Rights, quality, and scope risks | Approved source policy and review capacity exist |
| External search engine | Postgres FTS + vector should cover v0.1 | Corpus scale/latency measurements justify it |
| Real-time CRDT collaboration | Single-owner product first | Multiple editors need simultaneous authoring |
| Native mobile app | Desktop research workflows dominate | Demonstrated frequent mobile learning need |
| Automated adaptive curriculum ML | Not enough learner data | Explicit prerequisite system proves insufficient at scale |

## 5. License and dependency policy

Codex must:

- record production dependency license and version in a generated inventory;
- prefer permissive licenses for embedded libraries;
- avoid copying AGPL application code into the custom product without explicit legal review;
- keep notices required by licenses;
- run dependency vulnerability scanning in CI;
- avoid unmaintained packages when a platform-native alternative exists;
- document any open-core feature dependency that could create vendor lock-in.

## 6. Resource model

The product can be developed with a lean structure because the selected stack delegates infrastructure and uses existing UI components.

### Required human responsibilities

#### Product owner / domain architect

- approve product scope;
- approve top-level knowledge structure;
- curate seed concepts and sources;
- decide target mastery;
- review high-impact AI proposals;
- judge whether the product improves real Loura decisions.

#### Engineering owner

- review architecture and security;
- own database/RLS correctness;
- review Codex changes and deployment;
- manage incidents and dependency updates.

One person may initially hold both roles, but the responsibilities remain distinct.

### Codex responsibilities

- scaffold and implement specified milestones;
- add tests and documentation;
- maintain migrations and typed schemas;
- run verification commands;
- surface ambiguity rather than silently invent product behavior;
- keep implementation aligned with `AGENTS.md`.

### Optional specialist review

- information/ontology expert for concept-model quality;
- UX designer for graph and reading usability;
- security reviewer before confidential document ingestion;
- domain experts for manufacturing, control, AI safety, and deployment content.

## 7. Infrastructure resources

Initial managed services:

- one Supabase project;
- one web deployment;
- one worker container;
- one OpenAI API project with spend controls;
- optional Langfuse project;
- GitHub repository and Actions.

Primary cost drivers:

- document parsing worker CPU/memory;
- embeddings and extraction calls;
- Ask Atlas model calls;
- file storage;
- database compute/backups;
- observability retention.

The application must record model usage and prevent accidental repeated ingestion so resource cost remains attributable and controllable.

## 8. Product components that are differentiated IP

Do not outsource these to a generic framework:

1. atlas schema and canonical concept model;
2. relation grammar and graph invariants;
3. prerequisite and mastery model;
4. AI proposal schema and review workflow;
5. source-to-concept evidence traceability;
6. cross-domain Ask Atlas retrieval policy;
7. Loura application bridge;
8. seed domain map and learning routes;
9. quality/evaluation criteria for maintained knowledge.

These are the product. The open-source stack should make them cheaper to build, not replace them.
