# 04 — Canonical Data Model

## 1. Modeling principles

1. PostgreSQL is canonical.
2. Every workspace-owned table includes `workspace_id`.
3. UUID primary keys.
4. Timestamps are UTC with timezone.
5. Soft deletion is preferred for canonical knowledge.
6. Source files and source versions are immutable.
7. AI outputs are proposals, not canonical records.
8. Canonical hierarchy is an adjacency list; semantic connections are typed edges.
9. Every accepted evidence-bearing record can trace to source segments.
10. Enums may be PostgreSQL enums or checked text columns; choose one consistent pattern.

## 2. Identity and workspace

## `profiles`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | equals Supabase `auth.users.id` |
| display_name | text | nullable |
| avatar_url | text | nullable |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

## `workspaces`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| slug | text unique | workspace URL-safe identifier |
| settings | jsonb | validated application settings |
| created_by | uuid FK profiles | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## `workspace_members`

| Column | Type | Notes |
|---|---|---|
| workspace_id | uuid FK | composite PK |
| user_id | uuid FK | composite PK |
| role | enum | owner, editor, viewer |
| created_at | timestamptz | |

## 3. Knowledge structure

## `domains`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| slug | text | unique per workspace |
| title | text | |
| short_description | text | one-line central question/description |
| scope_markdown | text | domain boundary |
| kind | enum | root, core, overlay |
| parent_domain_id | uuid FK domains | nullable; domain hierarchy |
| sort_order | integer | |
| content_status | enum | draft, reviewed, deprecated |
| priority | enum | now, next, later, reference |
| target_mastery | smallint | nullable 0–5 |
| last_reviewed_at | timestamptz | nullable |
| created_by | uuid FK | |
| updated_by | uuid FK | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable |

Constraints:

- unique `(workspace_id, slug)` where not deleted;
- `target_mastery` between 0 and 5;
- domain parent belongs to same workspace;
- prevent parent cycle in service validation.

## `concepts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| slug | text | unique per workspace |
| canonical_name | text | |
| concise_definition | text | |
| synthesis_markdown | text | long-form current synthesis |
| why_it_exists_markdown | text | nullable |
| mechanism_markdown | text | nullable |
| examples_markdown | text | nullable |
| counterexamples_markdown | text | nullable |
| failure_modes_markdown | text | nullable |
| common_confusions_markdown | text | nullable |
| canonical_domain_id | uuid FK domains | required |
| canonical_parent_id | uuid FK concepts | nullable |
| concept_kind | enum | concept, theory, mechanism, method, standard, model, tool |
| content_status | enum | draft, reviewed, deprecated |
| priority | enum | now, next, later, reference |
| target_mastery | smallint | nullable 0–5 |
| review_note | text | nullable |
| replacement_concept_id | uuid FK concepts | for deprecated concepts |
| search_document | tsvector | generated or maintained |
| embedding | vector(D) | nullable |
| embedding_model | text | nullable |
| embedding_updated_at | timestamptz | nullable |
| last_reviewed_at | timestamptz | nullable |
| created_by | uuid FK | |
| updated_by | uuid FK | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable |

Constraints:

- unique `(workspace_id, slug)` where not deleted;
- canonical domain/parent/replacement belong to same workspace;
- parent cannot equal self;
- target mastery 0–5;
- deprecated concept should have replacement when one exists, but replacement is not mandatory;
- parent cycles prevented in domain service;
- embedding dimension matches environment/database migration.

## `concept_aliases`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| concept_id | uuid FK concepts | |
| alias | text | |
| alias_normalized | text | normalized for lookup |
| alias_type | enum | synonym, abbreviation, former_name, translation, common_misnomer |
| language_code | text | default `en` |
| created_at | timestamptz | |

Constraint: unique `(workspace_id, alias_normalized, language_code)` unless explicitly disambiguated. For collisions, use a separate disambiguation mechanism rather than silently merging.

## `relation_types`

Configuration table seeded per workspace or global template.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | nullable only for system templates if implemented |
| key | text | e.g. `prerequisite_for` |
| forward_label | text | |
| inverse_label | text | |
| category | enum | hierarchy, learning, explanatory, contrast, operational, application, epistemic |
| directed | boolean | |
| symmetric | boolean | |
| acyclic | boolean | |
| allows_self | boolean | default false |
| allowed_source_kinds | text[] | empty means all |
| allowed_target_kinds | text[] | empty means all |
| style | jsonb | UI hints only |
| is_system | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

System relation keys for v0.1:

```text
broader_than
narrower_than
part_of
prerequisite_for
co_requisite_with
deepens
depends_on
enables
constrains
explains
influences
contrasts_with
alternative_to
commonly_confused_with
measured_by
verified_by
implemented_by
governed_by
fails_through
related_to
```

Hierarchy can rely primarily on `canonical_parent_id`; relation rows may represent additional hierarchy only where needed. Do not create redundant parent relation rows unless a clear query/UI need is documented.

## `concept_relations`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| source_concept_id | uuid FK concepts | |
| relation_type_id | uuid FK relation_types | |
| target_concept_id | uuid FK concepts | |
| description | text | optional qualification |
| confidence | numeric(4,3) | nullable 0–1 |
| review_status | enum | draft, reviewed, deprecated |
| provenance_type | enum | human, source_extracted, inferred |
| source_proposal_item_id | uuid | nullable |
| created_by | uuid FK | |
| reviewed_by | uuid FK | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable |

Constraints:

- unique active `(workspace_id, source_concept_id, relation_type_id, target_concept_id)`;
- relation endpoints belong to workspace;
- enforce self rule;
- service enforces symmetry normalization and acyclicity where configured;
- a `prerequisite_for` edge means source is prerequisite for target.

## `concept_revisions`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| concept_id | uuid FK | |
| revision_number | integer | monotonic per concept |
| snapshot | jsonb | complete structured snapshot |
| change_summary | text | |
| change_source | enum | manual, proposal, import, restore |
| proposal_item_id | uuid | nullable |
| created_by | uuid FK | |
| created_at | timestamptz | |

Constraint: unique `(concept_id, revision_number)`.

## 4. Sources and evidence

## `sources`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| title | text | |
| subtitle | text | nullable |
| source_type | enum | book, paper, standard, course, documentation, article, webpage, report, thesis, dataset, note, other |
| authors | jsonb | array of structured people/orgs |
| organization | text | nullable |
| publication_date | date | nullable |
| external_url | text | nullable |
| external_identifier | text | DOI/ISBN/standard number/etc. |
| quality | enum | canonical, primary, secondary, practitioner, unknown |
| sensitivity | enum | public, internal, confidential |
| external_ai_policy | enum | allowed, denied, explicit_per_run |
| rights_note | text | required for non-public-domain uploads |
| file_name | text | nullable |
| file_mime_type | text | nullable |
| file_size_bytes | bigint | nullable |
| file_checksum_sha256 | text | nullable |
| storage_path | text | nullable |
| ingestion_status | enum | pending, queued, parsing, embedding, extracting, ready_for_review, completed, failed |
| latest_source_version_id | uuid | nullable, add FK after table creation |
| added_by | uuid FK | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable |

Duplicate detection index on `(workspace_id, file_checksum_sha256)` when checksum is not null.

## `source_versions`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| source_id | uuid FK | |
| version_number | integer | |
| idempotency_key | text | unique per workspace |
| parser_name | text | |
| parser_version | text | |
| parser_profile | text | |
| docling_json_path | text | |
| markdown_path | text | |
| extracted_metadata | jsonb | |
| page_count | integer | nullable |
| language_code | text | nullable |
| processing_status | enum | processing, completed, failed |
| error_code | text | nullable |
| error_message_sanitized | text | nullable |
| created_at | timestamptz | |
| completed_at | timestamptz | nullable |

Constraint: unique `(source_id, version_number)` and `(workspace_id, idempotency_key)`.

## `source_segments`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| source_version_id | uuid FK | |
| ordinal | integer | |
| segment_type | enum | heading, paragraph, list, table, figure_caption, code, formula, transcript, other |
| heading_path | text[] | |
| text | text | |
| token_count | integer | |
| page_start | integer | nullable |
| page_end | integer | nullable |
| provenance | jsonb | bounding boxes/item references |
| search_document | tsvector | |
| embedding | vector(D) | nullable |
| embedding_model | text | nullable |
| created_at | timestamptz | |

Constraints:

- unique `(source_version_id, ordinal)`;
- immutable after version completed;
- source version and workspace must match.

## `source_summaries`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| source_version_id | uuid FK | |
| summary_markdown | text | |
| key_topics | text[] | |
| limitations | text | nullable |
| generated_by_run_id | uuid FK ai_runs | |
| created_at | timestamptz | |

## `claims`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| statement | text | |
| claim_type | enum | definition, descriptive, causal, normative, design_principle, technical_assumption, empirical, disputed |
| status | enum | observed, supported, inferred, hypothesized, contested, rejected, unknown |
| confidence | numeric(4,3) | nullable |
| qualification | text | nullable |
| falsification_condition | text | nullable |
| content_status | enum | draft, reviewed, deprecated |
| created_by | uuid FK | |
| reviewed_by | uuid FK | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable |

## `concept_claims`

| Column | Type | Notes |
|---|---|---|
| workspace_id | uuid FK | composite PK |
| concept_id | uuid FK | composite PK |
| claim_id | uuid FK | composite PK |
| role | enum | core, supporting, limitation, competing_view |
| sort_order | integer | |

## `claim_evidence`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| claim_id | uuid FK | |
| source_segment_id | uuid FK | |
| stance | enum | supports, challenges, qualifies, mentions |
| note | text | nullable |
| created_by | uuid FK | |
| review_status | enum | draft, reviewed |
| created_at | timestamptz | |

Constraint: unique `(claim_id, source_segment_id, stance)`.

## `concept_citations`

Direct citations for synthesis sections that are not modeled as standalone claims.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| concept_id | uuid FK | |
| source_segment_id | uuid FK | |
| citation_key | text | stable marker used in Markdown or block metadata |
| section_key | text | concise_definition, synthesis, mechanism, etc. |
| note | text | nullable |
| review_status | enum | draft, reviewed |
| created_by | uuid FK | |
| created_at | timestamptz | |

## 5. Learning

## `learning_paths`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| slug | text | unique per workspace |
| title | text | |
| purpose_markdown | text | |
| target_outcome_markdown | text | |
| content_status | enum | draft, reviewed, deprecated |
| created_by | uuid FK | |
| updated_by | uuid FK | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## `learning_path_steps`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| learning_path_id | uuid FK | |
| concept_id | uuid FK | |
| step_order | integer | |
| branch_key | text | nullable |
| mandatory | boolean | default true |
| rationale | text | nullable |
| learning_objective | text | nullable |
| target_mastery | smallint | 0–5 |
| required_prior_mastery | smallint | default 1 |
| assigned_source_ids | uuid[] | optional; junction table preferred if queried heavily |
| exercise_markdown | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Constraint: unique `(learning_path_id, step_order, branch_key)` and preferably one occurrence per concept/path unless intentional.

## `user_mastery`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| user_id | uuid FK | |
| concept_id | uuid FK | |
| current_level | smallint | 0–5 |
| target_level | smallint | 0–5 |
| status | enum | not_started, learning, applied, mastered, revisit |
| last_evidence_id | uuid | nullable |
| updated_at | timestamptz | |

Constraint: unique `(workspace_id, user_id, concept_id)`.

## `mastery_evidence`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| user_id | uuid FK | |
| concept_id | uuid FK | |
| level_claimed | smallint | |
| evidence_type | enum | self_assessment, explanation, quiz, applied_analysis, design_artifact, critique, external_evaluation |
| note | text | nullable |
| artifact_url | text | nullable |
| ai_assessment | jsonb | nullable, advisory only |
| created_at | timestamptz | |

## 6. Loura application bridge

## `loura_applications`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| application_type | enum | decision, component, experiment, deployment_question, artifact, risk, requirement |
| title | text | |
| description_markdown | text | |
| implication_markdown | text | nullable |
| status | enum | proposed, active, decided, validated, archived |
| owner_user_id | uuid FK | nullable |
| project_tag | text | nullable |
| external_url | text | nullable |
| created_by | uuid FK | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| archived_at | timestamptz | nullable |

## `concept_applications`

| Column | Type | Notes |
|---|---|---|
| workspace_id | uuid FK | composite PK |
| concept_id | uuid FK | composite PK |
| application_id | uuid FK | composite PK |
| relevance_note | text | required |
| created_by | uuid FK | |
| created_at | timestamptz | |

## 7. AI runs and proposals

## `ai_runs`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| run_type | enum | source_summary, extraction, resolution, synthesis, ask, assessment |
| status | enum | queued, running, completed, failed, cancelled |
| provider | text | |
| model_id | text | |
| prompt_version | text | |
| schema_version | text | nullable |
| idempotency_key | text | unique within workspace; retries reuse the same run |
| input_refs | jsonb | IDs only; avoid raw confidential text |
| output_hash | text | nullable |
| usage | jsonb | nullable |
| latency_ms | integer | nullable |
| trace_id | text | nullable |
| error_code | text | nullable |
| error_message_sanitized | text | nullable |
| started_at | timestamptz | |
| completed_at | timestamptz | nullable |
| created_by | uuid FK | nullable for worker |

## `change_proposals`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| source_version_id | uuid FK | nullable for human/manual proposals |
| ai_run_id | uuid FK | nullable |
| title | text | |
| status | enum | draft, ready_for_review, partially_reviewed, accepted, rejected, mixed, archived |
| summary | text | nullable |
| created_by | uuid FK | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## `change_proposal_items`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| proposal_id | uuid FK | |
| item_type | enum | create_concept, update_concept, add_alias, add_relation, add_prerequisite, add_claim, add_citation, mark_contradiction, add_application |
| target_type | text | nullable |
| target_id | uuid | nullable |
| base_revision_id | uuid | nullable for stale detection |
| proposed_payload | jsonb | schema-versioned |
| evidence_segment_ids | uuid[] | every extracted item requires at least one except metadata-only cases |
| confidence | numeric(4,3) | nullable |
| rationale | text | nullable |
| status | enum | pending, accepted, edited_and_accepted, rejected, deferred, stale |
| rejection_reason | text | nullable |
| edited_payload | jsonb | nullable |
| reviewed_by | uuid FK | nullable |
| reviewed_at | timestamptz | nullable |
| applied_object_refs | jsonb | nullable |
| created_at | timestamptz | |

## 8. Jobs and audit

## `ingestion_jobs`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| source_id | uuid FK | |
| queue_message_id | bigint/text | nullable |
| status | enum | queued, running, completed, failed, dead_letter |
| stage | enum | download, parse, persist, segment, embed, summarize, extract, resolve, propose |
| attempt_count | integer | |
| progress | numeric(5,2) | nullable |
| idempotency_key | text | |
| requested_by | uuid FK | |
| error_code | text | nullable |
| error_message_sanitized | text | nullable |
| created_at | timestamptz | |
| started_at | timestamptz | nullable |
| completed_at | timestamptz | nullable |

## `audit_events`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| actor_user_id | uuid FK | nullable for system |
| actor_type | enum | user, worker, system |
| event_type | text | controlled constants |
| object_type | text | |
| object_id | uuid | |
| summary | text | |
| before_summary | jsonb | nullable, sanitized |
| after_summary | jsonb | nullable, sanitized |
| source_proposal_item_id | uuid | nullable |
| request_id | text | nullable |
| created_at | timestamptz | |

## 9. Ask sessions

## `ask_threads`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| user_id | uuid FK | |
| title | text | nullable |
| scope | jsonb | domain/concept/path/status filters |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## `ask_messages`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| thread_id | uuid FK | |
| role | enum | user, assistant |
| content_markdown | text | |
| answer_status | enum | complete, insufficient_evidence, failed |
| retrieved_concept_ids | uuid[] | nullable |
| cited_segment_ids | uuid[] | nullable |
| ai_run_id | uuid FK | nullable |
| created_at | timestamptz | |

Store conversations only inside the private workspace. Add retention controls in settings.

## 10. Required indexes

At minimum:

- unique slugs per workspace;
- all workspace foreign-key access paths;
- `concepts(canonical_domain_id)`;
- `concepts(canonical_parent_id)`;
- `concept_relations(source_concept_id, relation_type_id)`;
- `concept_relations(target_concept_id, relation_type_id)`;
- GIN on concept/source-segment `search_document`;
- HNSW on embeddings when enabled;
- `source_segments(source_version_id, ordinal)`;
- `change_proposal_items(proposal_id, status)`;
- `ingestion_jobs(status, created_at)`;
- `audit_events(workspace_id, created_at desc)`;
- `user_mastery(user_id, status)`.

## 11. RLS policy pattern

Define SQL helper function:

```sql
is_workspace_member(workspace_uuid uuid, allowed_roles text[] default null)
```

Policy intent:

- viewer: select canonical workspace content and own mastery/ask data;
- editor: viewer rights plus create/edit drafts, sources, paths, applications, and proposals;
- owner: all workspace actions including member/settings and approvals;
- service role: worker/server bypass only in protected environments.

Sensitive source access can be further restricted by role/sensitivity if needed.

## 12. Graph invariants

Implement and test:

1. no active duplicate relation;
2. no invalid self relation;
3. endpoints in same workspace;
4. no `prerequisite_for` cycle;
5. no canonical-parent cycle;
6. symmetric relations stored in a canonical endpoint order;
7. concept deprecation does not hard-delete history;
8. replacing a concept cannot point to self;
9. accepted proposal evidence segment IDs exist and belong to the proposal’s source version/workspace;
10. source segments are immutable after source-version completion.

## 13. Citation integrity

A citation is valid only when:

- the source segment exists;
- the segment belongs to the same workspace;
- the source is not deleted;
- the source version is completed;
- the citation record references a concept or claim that exists;
- AI answers only cite segment IDs included in the generation context.

Create a `scripts/check-citations.ts` command that reports broken or orphaned citations and exits non-zero in CI for seed data.
