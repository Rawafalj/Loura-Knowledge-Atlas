# 01 — Product Specification

## 1. Product name

**Working name:** Loura Knowledge Atlas  
**Release:** v0.1 — Atlas Core  
**Audience:** Private internal use by Rawaf and a small approved Loura team

## 2. Product statement

Loura Knowledge Atlas is a private, AI-native learning and reasoning environment that maps the bodies of knowledge required to understand, design, build, integrate, deploy, govern, and improve Loura.

The canonical object is the **knowledge landscape**: domains, subdomains, concepts, methods, relationships, prerequisites, claims, evidence, and sources. Loura appears only through explicit application links showing how independent knowledge informs a project decision, component, experiment, deployment practice, or artifact.

## 3. Problem

The knowledge required to build Loura spans systems and control, organizations and coordination, information and knowledge systems, artificial intelligence, distributed software, human–AI systems, safety, enterprise integration, systems engineering, deployment, and industrial operations.

Today, this knowledge tends to be distributed across:

- books, papers, standards, courses, technical documentation, and notes;
- unstructured reading lists;
- disconnected conversations and generated summaries;
- project documents that mix durable principles with temporary implementation choices;
- mental models held by the founder rather than externalized as a coherent structure.

This creates four product problems:

1. **Orientation failure:** it is difficult to see the complete landscape and know which major areas are missing.
2. **Sequence failure:** it is difficult to know what must be understood before a deeper concept.
3. **Synthesis failure:** useful knowledge is repeatedly reconstructed from raw sources rather than maintained cumulatively.
4. **Application failure:** learning is not consistently connected to Loura’s technical and deployment decisions.

## 4. Product goal

Provide one maintained system in which the user can:

- orient across the full knowledge landscape;
- understand how a domain decomposes from trunk concepts to detailed concepts;
- follow prerequisite-aware learning routes;
- read source-grounded concept synthesis;
- see disagreements, uncertainty, and provenance;
- identify personal knowledge gaps;
- ask grounded cross-domain questions;
- attach knowledge to concrete Loura applications; and
- improve the atlas by adding sources and reviewing AI-proposed changes.

## 5. Product principles

### 5.1 Knowledge first; Loura second

Canonical definitions and domain structures must remain independent of the current Loura implementation. Project links are overlays, not parents of the knowledge.

### 5.2 Tree for orientation; graph for truth

Each concept has one canonical home for navigation, but can have many typed cross-domain relationships. The system must never force real many-to-many semantics into a single tree.

### 5.3 Sources are immutable; synthesis evolves

Raw source files and parsed source versions remain immutable. Concept synthesis, claims, relations, and learning paths evolve through reviewed changes.

### 5.4 AI proposes; humans approve

AI can extract, compare, link, summarize, and challenge. It cannot silently publish structural changes to the canonical atlas.

### 5.5 Learning requires evidence of understanding

Reading a page is not mastery. Mastery is recorded separately and should be supported by explanation, application, design, or critique evidence.

### 5.6 Progressive disclosure over graph spectacle

The default experience must remain legible. Users enter through domain maps, local concept neighborhoods, and learning routes—not an unbounded global graph.

### 5.7 Decision usefulness over encyclopedic completeness

The map can expand broadly, but depth is prioritized where it improves an active learning need or Loura decision.

## 6. Primary user

### Owner / learner

A founder or senior builder who needs to develop cross-disciplinary understanding and apply it to Loura.

Primary jobs:

- understand the overall intellectual landscape;
- identify what to learn next;
- build accurate mental models;
- compare concepts across disciplines;
- preserve cumulative synthesis;
- ground project decisions in relevant theory and evidence;
- review AI-proposed changes;
- track current and target mastery.

## 7. Secondary users

### Editor

A trusted team member who can add sources, edit draft content, and submit proposals but cannot change workspace settings or approve sensitive structural changes unless granted permission.

### Viewer

A read-only collaborator who can browse, search, follow paths, and ask grounded questions.

**v0.1 simplification:** implement the role model, but optimize the experience for one owner. Collaboration features beyond basic access control are out of scope.

## 8. Core product objects

1. **Domain** — a broad body of knowledge.
2. **Concept** — a canonical unit of understanding.
3. **Relation** — a typed semantic connection between concepts.
4. **Learning path** — an ordered route through concepts, normally constrained by prerequisites.
5. **Source** — a book, paper, standard, course, page, file, or document.
6. **Source segment** — a traceable section of a source used for retrieval and citation.
7. **Claim** — a proposition supported, challenged, or qualified by evidence.
8. **Synthesis** — maintained explanatory Markdown for a concept.
9. **Change proposal** — an AI- or human-generated candidate change requiring review.
10. **Mastery record** — the user’s current and target depth for a concept.
11. **Loura application** — a link from knowledge to a decision, component, experiment, deployment question, or artifact.
12. **Audit event** — a durable record of material changes.

## 9. Product scope for v0.1

### 9.1 Included

#### Atlas navigation

- world map of domains;
- domain pages with subdomain hierarchy and key concepts;
- canonical concept pages;
- local typed graph view;
- broader/narrower and related concept navigation;
- global command palette and search.

#### Knowledge structure

- one canonical domain per concept;
- one canonical parent for hierarchical navigation;
- typed many-to-many relations;
- explicit prerequisite relations with cycle prevention;
- draft, reviewed, and deprecated content states;
- aliases and disambiguation.

#### Learning

- manually curated learning paths;
- prerequisite-aware route validation;
- current and target mastery levels;
- concept status: not started, learning, applied, mastered, revisit;
- evidence note or artifact link for mastery changes.

#### Sources and synthesis

- private source library;
- file upload for PDF, DOCX, PPTX, Markdown, HTML, plain text, and supported image formats;
- URL ingestion for explicitly submitted public URLs;
- immutable source versions;
- parsed structured content and source segments;
- source metadata and quality classification;
- citations from concept pages and claims to exact source segments.

#### AI maintenance

- document summary;
- candidate concept extraction;
- candidate relation and prerequisite extraction;
- candidate claim extraction;
- duplicate/concept match suggestion;
- source-to-concept citation suggestion;
- change proposal review queue;
- accept, edit-and-accept, or reject actions;
- provenance and audit history.

#### Grounded questions

- “Ask Atlas” interface;
- hybrid retrieval over concepts and source segments;
- one-hop graph expansion around retrieved concepts;
- streamed answers;
- segment-level citations;
- explicit insufficient-evidence behavior;
- link from answer to concept pages and source passages.

#### Loura bridge

- connect concepts to a Loura decision, component, experiment, deployment concern, or external artifact;
- display project implications separately from canonical concept content;
- filter concepts by application type and project relevance.

### 9.2 Excluded

- public publishing;
- autonomous web crawling;
- automatic bulk ingestion of the open internet;
- mobile-native applications;
- real-time collaborative editing;
- discussion threads and social features;
- corporate planning, fundraising, hiring, CRM, or project-management dashboards;
- a universal ontology of all knowledge;
- full formal logic or OWL reasoning;
- a dedicated graph database;
- unrestricted multi-agent orchestration;
- automatic promotion of AI proposals;
- live connectors to every enterprise system;
- video/audio transcription in the first release;
- automated mastery scoring based only on reading behavior;
- recommendation algorithms trained on multiple users.

## 10. Initial content boundary

The application architecture must support the full atlas, but v0.1 seed content is intentionally limited.

### Top-level domains

1. Systems, control, and decision sciences
2. Organizations, coordination, and operational work
3. Information, data, and knowledge systems
4. Artificial intelligence, reasoning, and agentic systems
5. Software, distributed systems, and enterprise integration
6. Human–AI systems, safety, security, and governance
7. Systems engineering, product design, deployment, and adoption
8. Manufacturing and industrial operations overlay

### First depth pilot

**Learning route:** Closed-loop operational execution

The route spans:

```text
system and boundary
→ goal and desired state
→ observation and uncertainty
→ feedback and control
→ organizational coordination
→ workflow and commitments
→ agent planning and tool use
→ distributed action semantics
→ evidence and provenance
→ verification and validation
→ human authority and escalation
→ industrial deployment
```

Target seed scale:

- 8 top-level domains;
- 25–40 subdomains;
- 60–100 concepts;
- 10–15 relation types;
- 1 fully curated learning path;
- 15–30 canonical sources;
- 5–15 Loura application links.

These are seed targets, not hard application limits.

## 11. Functional requirements

### FR-1 Authentication and workspace

- Users authenticate with email magic link or passwordless email.
- All data belongs to a workspace.
- The first authenticated user can bootstrap the first workspace as owner.
- Workspace access is enforced by database RLS.
- Service-role operations are restricted to server and worker processes.

### FR-2 World map

- Display each top-level domain with description, concept count, reviewed-content coverage, target/current mastery summary, and active learning paths.
- Provide list and map modes.
- Domain selection must be deep-linkable.
- The world map must remain useful without loading graph visualization code.

### FR-3 Domain explorer

- Display domain overview and boundaries.
- Show subdomains as an expandable hierarchy.
- Show key concepts and local concept graph.
- Show canonical sources, learning paths, and unresolved gaps.
- Support filtering by reviewed status, priority, mastery, and relation type.

### FR-4 Concept page

Every concept page must support:

- canonical name and aliases;
- concise definition;
- long-form Markdown synthesis;
- domain and canonical parent;
- prerequisites;
- derived/narrower concepts;
- typed related concepts;
- examples and counterexamples;
- common confusions;
- source citations;
- claims and evidence status;
- target and current mastery;
- Loura applications;
- revision history;
- content status and last review date.

### FR-5 Concept editing

- Owner/editor can edit structured metadata and Markdown synthesis.
- Material edits create a revision record.
- A reviewed concept edited materially becomes draft unless the editor explicitly keeps it reviewed and has permission.
- Deleting a concept with incoming relations is prohibited; use deprecation and replacement links.

### FR-6 Relations

- Add, edit, and remove typed relations.
- Validate allowed source and target types.
- Prevent self-relations unless a relation type explicitly allows them.
- Prevent cycles for `prerequisite_for`.
- Support inverse display labels without duplicating inverse rows when configured.
- Store provenance and review status for AI-suggested relations.

### FR-7 Search

- Search concept titles, aliases, definitions, synthesis, source metadata, and source segments.
- Combine lexical and vector results.
- Group results by Concepts and Sources.
- Expose why a result matched: title, alias, text passage, or semantic similarity.
- Support filters for domain, content status, source type, source quality, and application relevance.
- Keyboard shortcut: `Cmd/Ctrl + K`.

### FR-8 Source library

- Add source by file or URL.
- Capture title, authors, publication date, source type, quality, rights note, sensitivity, tags, and external identifier.
- Compute checksum to detect duplicates.
- Preserve original file.
- Create immutable parsed version with parser metadata.
- Show ingestion status and errors.
- Permit reprocessing with a newer parser while retaining prior versions.

### FR-9 AI change review

- Group proposed changes by source and ingestion run.
- Proposal item types: create concept, update concept, add alias, add relation, add prerequisite, add claim, add citation, mark contradiction, add Loura implication.
- Show current value, proposed value, supporting segment excerpts, confidence, and model/run metadata.
- Reviewer can accept, edit and accept, reject with reason, or defer.
- Accepted items apply transactionally and create audit events.
- Rejected items remain visible in run history to reduce repeated proposals.

### FR-10 Ask Atlas

- Accept natural-language questions.
- Retrieve canonical concept content and source segments.
- Expand to directly connected concepts where useful.
- Stream answer text.
- Cite every material factual statement or clearly identify synthesis/inference.
- Citation opens the exact source segment and source metadata.
- If evidence is insufficient, state that and show the best available concepts/sources.
- Do not use unreviewed AI proposals as authoritative content unless the UI explicitly labels them draft.

### FR-11 Learning paths

- Owner/editor can create ordered paths.
- Each step references one concept and may include rationale, learning objective, source assignment, and applied exercise.
- Validate that required prerequisites appear earlier or are already mastered at the target threshold.
- Show progress and the next ready concept.
- Permit optional branches without turning the path into a general workflow engine.

### FR-12 Mastery

Mastery levels:

0. Recognize
1. Explain
2. Apply
3. Design
4. Critique
5. Extend

Requirements:

- Record target level per concept for the workspace or user.
- Record current level per user.
- Record evidence type: self-assessment, explanation, quiz, applied analysis, design artifact, review, external evaluation.
- Preserve mastery history.
- Never infer mastery solely from page views.

### FR-13 Loura application bridge

- Application types: decision, component, experiment, deployment question, artifact, risk, requirement.
- Store title, description, status, owner, external URL, and optional project tag.
- Link one application to many concepts and one concept to many applications.
- Display applications in a clearly separated section on concept pages.
- Canonical knowledge remains valid if an application is archived.

### FR-14 Audit and history

- Record actor, event type, object type/id, before/after summary, timestamp, and provenance.
- Show concept revision history and proposal history.
- Support restoration of prior Markdown synthesis through a new revision, not destructive rollback.

## 12. Non-functional requirements

### NFR-1 Performance

For the seeded v0.1 dataset:

- server-rendered atlas and concept pages should become usable within two seconds on a normal broadband connection;
- search should return the first result page within one second under normal load;
- local graphs should remain interactive at 100 visible nodes and 250 visible edges;
- graph expansion beyond the configured cap requires explicit user action;
- large source processing occurs asynchronously.

### NFR-2 Reliability

- Ingestion jobs are durable and idempotent.
- Retrying a completed ingestion does not duplicate source versions, segments, or proposals.
- Canonical updates from accepted proposal items occur in one database transaction.
- Failed jobs expose actionable error states and can be retried.

### NFR-3 Security and privacy

- RLS on all workspace tables.
- Private source storage bucket.
- Signed, short-lived file URLs.
- MIME, extension, and size validation.
- URL ingestion blocks private-network destinations and unsafe redirects.
- Uploaded source text is treated as untrusted content and cannot instruct tools or override system prompts.
- Source sensitivity policy determines whether external model processing is allowed.
- Secrets remain server-side.
- Audit material changes.

### NFR-4 Accessibility

- Target WCAG 2.2 AA for primary workflows.
- Full keyboard navigation for non-graph workflows.
- Graph content has list/tree alternatives.
- Visible focus and reduced-motion support.
- Relationship meaning is not encoded by color alone.
- Dialogs, drawers, menus, and forms use accessible primitives.

### NFR-5 Maintainability

- Strict TypeScript and validated Python models.
- Migrations and seed data are versioned.
- Business rules live in testable domain services, not only UI handlers.
- AI schemas are versioned.
- Model/provider settings are configuration, not hard-coded behavior.
- The application runs locally using documented commands.

## 13. Product metrics

The v0.1 metrics are diagnostic, not vanity metrics.

### Knowledge quality

- percentage of priority concepts with reviewed definitions;
- percentage with at least one canonical/primary source;
- percentage with explicit prerequisites where applicable;
- number of orphan concepts;
- number of prerequisite cycles detected;
- number of unresolved contradiction flags.

### AI maintenance quality

- proposal acceptance rate by item type;
- edit-before-accept rate;
- rejection rate and reason;
- citation validity rate;
- duplicate-concept proposal rate;
- average proposals per source that materially improve the atlas.

### Learning utility

- concepts progressed to Explain, Apply, or Design;
- learning-path completion;
- number of mastery changes with evidence;
- number of concepts connected to a concrete Loura artifact or decision;
- self-reported “found what I needed” for search and Ask Atlas.

### System quality

- search latency;
- ingestion success rate;
- grounded answer citation coverage;
- critical workflow E2E pass rate;
- number of security or RLS regressions.

## 14. Release gates

### Alpha gate

- authentication and RLS verified;
- schema and seed data loaded;
- world map, domain page, concept page, local graph, and search operational;
- one learning path usable;
- source upload and parsing operational;
- no AI automatic writes.

### v0.1 gate

- review queue complete;
- grounded Ask Atlas complete;
- mastery and Loura applications complete;
- all critical E2E scenarios pass;
- citation integrity eval meets the threshold in the test plan;
- no open critical security findings;
- documentation enables a clean local setup.

