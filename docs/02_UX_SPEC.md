# 02 — Experience and Interface Specification

## 1. Experience thesis

The atlas must feel like a serious research instrument, not a generic SaaS dashboard and not a decorative mind map.

The experience should support three mental modes:

1. **Orient** — understand the landscape and where a concept belongs.
2. **Learn** — move through prerequisites, explanations, examples, and sources.
3. **Apply** — connect understanding to a Loura decision, component, experiment, or deployment question.

A fourth maintenance mode is intentionally separated:

4. **Curate** — add sources and review proposed changes.

## 2. Design principles

### 2.1 Stable geography

Domains and canonical parentage create a stable sense of place. Users should not feel that every search or AI answer produces a new temporary organization.

### 2.2 Progressive depth

Every view begins with a compact orientation layer and allows deeper inspection. Avoid front-loading every relation, source, claim, and application.

### 2.3 Local graphs, not hairballs

Graph views show a selected concept neighborhood, path, or domain subset. The user controls relation types and expansion depth.

### 2.4 Reading remains primary

Concept pages prioritize explanation and evidence. Graphs support understanding but do not replace prose.

### 2.5 Canonical versus project-specific is visually explicit

Canonical knowledge, learner state, draft proposals, and Loura applications must never look interchangeable.

### 2.6 AI is inspectable

Every AI-maintained change shows evidence and confidence. Every answer exposes citations and retrieved concepts.

### 2.7 Dense, calm, and keyboard-friendly

The product can present substantial information, but hierarchy, spacing, typography, and interaction states must keep it legible.

## 3. Information architecture

### Global navigation

```text
Atlas
├── World map
├── Domains
├── Concepts
└── Learning paths

Research
├── Sources
├── Review queue
└── Ask Atlas

Application
├── Loura links
└── Mastery

System
├── Activity
└── Settings
```

### Route map

```text
/login
/onboarding
/atlas
/atlas/domains/[domainSlug]
/concepts/[conceptSlug]
/paths
/paths/[pathSlug]
/sources
/sources/[sourceId]
/review
/review/[proposalId]
/ask
/mastery
/applications
/activity
/settings
```

All primary entities must have stable URLs.

## 4. Shell and layout

### Desktop shell

- Left navigation rail: approximately 240–264 px.
- Top utility bar: global search, Ask Atlas, add source, user menu.
- Main content region: fluid, with readable text width capped around 760–820 px inside broader layouts.
- Optional right contextual rail: 320–380 px for prerequisites, mastery, citations, or review evidence.
- Drawers may replace the right rail at narrower widths.

### Responsive behavior

- **Desktop:** full shell and optional right rail.
- **Tablet:** collapsible left rail; right rail becomes drawer.
- **Mobile:** v0.1 supports browsing, concept reading, search, and Ask Atlas. Graph editing, proposal review, and source administration may show a desktop-required notice.

## 5. Visual language

### Tone

- scholarly;
- technical;
- restrained;
- confident without looking bureaucratic;
- no gradients, glowing nodes, or “AI magic” visual clichés.

### Typography

- UI: a legible modern sans-serif, preferably Geist or system UI.
- Long-form reading: use the same family with optimized measure, or a restrained serif only if it does not create implementation overhead.
- Technical metadata: monospaced style only for IDs, relation keys, code, and structured values.

### Color and status

Use a neutral base and restrained domain accents. Color is secondary; every status also uses text, icon, or pattern.

Required statuses:

- reviewed;
- draft;
- deprecated;
- AI proposal;
- insufficient evidence;
- mastery level;
- relation type.

### Graph styling

- `prerequisite_for`: directed edge with strong arrow and visible label.
- hierarchy: solid neutral edge.
- `related_to`: lighter or dashed edge.
- contrast/confusion: distinct patterned edge.
- Loura application: visually separated edge or external-link node style.
- selected node: clear outline and focus state.
- edge labels appear on hover/focus and in the accessible relation list.

## 6. Core screens

## 6.1 Login

### Goal

Enter a private workspace with minimal friction.

### Elements

- product name and one-sentence purpose;
- email field;
- magic-link action;
- clear error and success states;
- privacy note.

### Acceptance

- keyboard complete;
- no public sign-up if workspace is configured invite-only;
- redirect authenticated user to last visited route or `/atlas`.

## 6.2 Onboarding

Shown only when the first workspace does not exist.

### Steps

1. Name workspace.
2. Confirm owner identity.
3. Choose whether sample seed atlas should be installed.
4. Configure external AI processing default for source sensitivity levels.
5. Finish and open World Map.

No multi-step wizard should exceed one page unless necessary; use a compact stepper.

## 6.3 World Map

### Primary question

“What bodies of knowledge matter, and where should I go?”

### Default layout

Domain cards grouped into:

- supporting roots;
- core branches;
- vertical overlays.

Each card shows:

- domain title;
- one-line central question;
- concept count;
- reviewed coverage;
- current/target mastery summary;
- active path count;
- up to three key concepts.

### Alternate map mode

A bounded graph or nested map showing domains and cross-domain connections. The list/card mode remains default and fully functional.

### Actions

- open domain;
- resume active path;
- filter by priority/mastery;
- search;
- ask a question from the world context.

## 6.4 Domain Explorer

### Header

- domain title;
- central question;
- scope/boundary statement;
- status and last reviewed date;
- edit action for authorized users.

### Body layout

Left column:

- hierarchical subdomain tree;
- filters.

Center:

- Overview tab;
- Concepts tab;
- Map tab;
- Paths tab;
- Sources tab;
- Gaps tab.

Right rail:

- key concepts;
- target mastery;
- unresolved proposals or coverage gaps;
- related domains.

### Domain map behavior

- load only selected domain and configured depth;
- relation filters visible;
- search within graph;
- fit-to-view action;
- reset action;
- “open as list” alternative;
- click node opens preview; double-click or explicit action opens concept page;
- graph state encoded in URL query parameters when practical.

## 6.5 Concept Page

### Primary question

“What is this, what does it depend on, how does it work, and why does it matter?”

### Header

- canonical title;
- aliases;
- domain breadcrumb;
- content status;
- target/current mastery;
- edit, add relation, and ask actions.

### Main tabs

#### Overview

Structured order:

1. concise definition;
2. why the concept exists / problem it explains;
3. long-form synthesis;
4. mechanism or formal treatment;
5. examples and counterexamples;
6. failure modes and limitations;
7. common confusions;
8. key claims and evidence status.

#### Relationships

- prerequisites;
- broader and narrower concepts;
- explanatory/enabling/constraining links;
- contrasts and common confusions;
- local graph;
- accessible relation table.

#### Sources

- cited source passages grouped by source;
- canonical reading list;
- source quality and type;
- open exact segment;
- show uncited synthesis warnings where applicable.

#### Loura

- applications grouped by type;
- implication statement;
- linked decision/artifact/experiment;
- application status;
- add application link.

#### History

- revisions;
- accepted proposals;
- authors/reviewers;
- compare revisions.

### Right rail

- prerequisite readiness;
- next concepts;
- mastery control;
- active learning path context;
- quick citations;
- related unresolved questions.

### Reading interactions

- inline citation markers open source preview drawer;
- concept links show hover preview;
- “Explain simply,” “Compare,” and “Apply to Loura” actions prefill Ask Atlas, but do not generate hidden content changes.

## 6.6 Global Search / Command Palette

### Trigger

`Cmd/Ctrl + K`

### Sections

- concepts;
- domains;
- paths;
- sources;
- actions.

### Query behavior

- immediate lexical suggestions;
- semantic results after brief debounce;
- show match reason;
- arrow-key navigation;
- recent and pinned items when empty.

### Actions

- open item;
- ask Atlas about result;
- add source;
- create concept draft;
- resume path.

## 6.7 Learning Path Page

### Header

- path title and purpose;
- domains crossed;
- estimated depth, not time;
- current progress;
- target outcome.

### Main route view

Display steps as a readable ordered route, with optional branches.

Each step shows:

- concept;
- why it appears here;
- prerequisites and readiness;
- target mastery;
- assigned source or exercise;
- current status.

### Next-ready logic

A concept is ready when:

- all mandatory prior path steps are complete at the required level; and
- all explicit prerequisite concepts meet the path threshold or are waived with a reason.

### Actions

- start/continue concept;
- mark learning status;
- add mastery evidence;
- ask contextual question;
- open route as graph.

## 6.8 Source Library

### List

Columns/cards:

- title;
- source type;
- author/organization;
- publication date;
- quality;
- sensitivity;
- ingestion status;
- proposal count;
- added date.

### Filters

- status;
- type;
- quality;
- domain;
- sensitivity;
- has unresolved proposals;
- duplicate warning.

### Add source flow

1. Choose File or URL.
2. Upload/enter URL.
3. Review detected metadata.
4. Set source quality, rights note, sensitivity, and tags.
5. Confirm whether external AI processing is allowed.
6. Submit; show durable job progress.

### Source detail

Tabs:

- Summary
- Parsed document
- Segments
- Citations
- Proposed changes
- Processing history
- Metadata

Parsed content must retain heading path and page/location information.

## 6.9 Review Queue

### Primary question

“What should change in the canonical atlas because of this source?”

### Queue view

Group by source and ingestion run. Show:

- item counts by proposal type;
- high-confidence count;
- contradiction warning;
- duplicate warning;
- run status.

### Proposal detail layout

Left:

- current canonical content or relation.

Center:

- proposed change with editable fields.

Right:

- source excerpts;
- exact segment links;
- confidence;
- extraction rationale;
- prior rejected similar proposals.

### Actions

- accept;
- edit and accept;
- reject with reason;
- defer;
- next item;
- apply selected safe citation-only proposals.

Structural proposals cannot have a one-click unreviewed “accept all.” Citation-only batch acceptance may be enabled only when every citation points to valid segments and no canonical text changes.

### Conflict handling

If canonical content changed after proposal creation:

- mark proposal stale;
- show three-way comparison;
- require manual resolution.

## 6.10 Ask Atlas

### Entry points

- dedicated `/ask` page;
- global side panel;
- contextual actions from domain, concept, path, and source pages.

### Composer

- question input;
- scope chip: entire atlas, current domain, current concept/path, reviewed only;
- optional “include draft proposals” disabled by default;
- send/stop controls.

### Answer anatomy

1. direct synthesis;
2. structured explanation when useful;
3. inline numbered citations;
4. concepts used;
5. sources used;
6. uncertainty or missing evidence;
7. suggested next concept, not an open-ended generic follow-up.

### Citation drawer

- source title and metadata;
- exact segment text;
- page/section location;
- linked concept/claim;
- open source detail.

### Insufficient evidence state

Use explicit language:

- “The reviewed atlas does not contain enough evidence to answer this confidently.”
- show relevant concepts and sources;
- optionally propose a research/source gap;
- never fabricate a citation.

## 6.11 Mastery View

### Views

- by domain;
- by target gap;
- by active path;
- recently updated;
- needs revisit.

### Concept row

- current level;
- target level;
- gap;
- last evidence;
- next action;
- active path.

### Updating mastery

The user selects level and evidence type, enters a note or artifact link, and optionally asks the system to generate an assessment. AI assessment is advisory and stored separately from the user-approved mastery level.

## 6.12 Loura Applications

### List and filters

- application type;
- status;
- project tag;
- owner;
- linked domains/concepts;
- unresolved knowledge gap.

### Application detail

- title and type;
- project context;
- design/deployment implication;
- linked concepts with stated relevance;
- external artifact URL;
- decisions or experiments affected;
- history.

This screen must not expand into project management. It is a traceability view from knowledge to work.

## 6.13 Activity and Audit

- chronological material events;
- filters by actor, object, source, and event type;
- link to affected revision/proposal;
- no raw confidential prompt logging.

## 7. Empty, loading, and error states

### Empty world map

Explain the atlas model and offer “Install seed atlas” or “Create first domain.”

### Empty domain

Offer structured actions: add subdomain, add concept, attach source, create path.

### Search no results

Show spelling/alias suggestions, related domains, and “propose concept draft.”

### Ingestion failure

Show stage, sanitized error, retry action, and source file retained.

### AI extraction failure

Keep parsed source available; allow rerun with changed settings; never delete source.

### Graph error

Fallback immediately to relation list/tree.

### Offline/transient failure

Preserve unsaved editor content locally and provide retry.

## 8. Editor experience

### Structured plus Markdown

Concept editing uses:

- structured form for title, aliases, domain, parent, status, definitions, and metadata;
- Markdown editor for synthesis;
- dedicated relationship editor;
- source citation picker;
- preview and diff before save.

### Draft safety

- autosave local draft;
- explicit save;
- warn on navigation with unsaved changes;
- show revision note field for material edits.

## 9. Accessibility requirements

- semantic headings and landmarks;
- all controls labeled;
- graph nodes keyboard focusable where library permits;
- graph relation list contains equivalent information;
- source excerpt drawer traps focus correctly;
- no hover-only required actions;
- minimum touch target on tablet/mobile;
- text contrast meets AA;
- reduced animation when `prefers-reduced-motion` is set;
- screen-reader announcements for streamed answer state and job progress;
- relation labels readable without relying on line color.

## 10. Analytics events

Track product behavior without capturing sensitive text.

```text
atlas_domain_opened
concept_opened
concept_relation_opened
search_performed
search_result_opened
path_started
path_step_completed
mastery_updated
source_added
ingestion_completed
ingestion_failed
proposal_accepted
proposal_edited_and_accepted
proposal_rejected
ask_submitted
ask_answer_completed
ask_citation_opened
ask_insufficient_evidence
loura_application_created
```

Do not send raw query, source, prompt, or answer text to generic analytics. Store necessary AI traces in the approved observability system with sensitivity controls.

## 11. UX acceptance scenarios

1. A new owner can install seed data and reach the world map.
2. The owner can navigate World Map → Domain → Concept without using search.
3. The owner can find “idempotency” with `Cmd+K`, see why it matched, and open it.
4. A keyboard-only user can read prerequisites and sources without using the graph.
5. The owner can follow the first learning path and see the next-ready concept.
6. The owner can add a PDF, monitor processing, and open extracted segments.
7. The owner can compare an AI proposal with current content and its evidence, then edit and accept it.
8. The owner can ask why retries are dangerous for agent actions and receive valid source citations.
9. The owner can connect idempotency to a Loura connector protocol artifact without changing the canonical definition.
10. The owner can inspect the change history for the concept afterward.

