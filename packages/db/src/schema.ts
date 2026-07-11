import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  customType,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  vector,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const workspaceRole = pgEnum("workspace_role", [
  "owner",
  "editor",
  "viewer",
]);
export const domainKind = pgEnum("domain_kind", ["root", "core", "overlay"]);
export const contentStatus = pgEnum("content_status", [
  "draft",
  "reviewed",
  "deprecated",
]);
export const priority = pgEnum("content_priority", [
  "now",
  "next",
  "later",
  "reference",
]);
export const conceptKind = pgEnum("concept_kind", [
  "concept",
  "theory",
  "mechanism",
  "method",
  "standard",
  "model",
  "tool",
]);
export const aliasType = pgEnum("alias_type", [
  "synonym",
  "abbreviation",
  "former_name",
  "translation",
  "common_misnomer",
]);
export const relationCategory = pgEnum("relation_category", [
  "hierarchy",
  "learning",
  "explanatory",
  "contrast",
  "operational",
  "application",
  "epistemic",
]);
export const relationProvenance = pgEnum("relation_provenance", [
  "human",
  "source_extracted",
  "inferred",
]);
export const revisionChangeSource = pgEnum("revision_change_source", [
  "manual",
  "proposal",
  "import",
  "restore",
]);
export const auditActorType = pgEnum("audit_actor_type", [
  "user",
  "worker",
  "system",
]);
export const masteryStatus = pgEnum("mastery_status", [
  "not_started",
  "learning",
  "applied",
  "mastered",
  "revisit",
]);
export const masteryEvidenceType = pgEnum("mastery_evidence_type", [
  "self_assessment",
  "explanation",
  "quiz",
  "applied_analysis",
  "design_artifact",
  "critique",
  "external_evaluation",
]);
export const sourceOrigin = pgEnum("source_origin", ["file", "url"]);
export const sourceType = pgEnum("source_type", [
  "book",
  "paper",
  "standard",
  "course",
  "documentation",
  "article",
  "webpage",
  "report",
  "thesis",
  "dataset",
  "note",
  "other",
]);
export const sourceQuality = pgEnum("source_quality", [
  "canonical",
  "primary",
  "secondary",
  "practitioner",
  "unknown",
]);
export const sourceSensitivity = pgEnum("source_sensitivity", [
  "public",
  "internal",
  "confidential",
]);
export const externalAiPolicy = pgEnum("external_ai_policy", [
  "allowed",
  "denied",
  "explicit_per_run",
]);
export const sourceIngestionStatus = pgEnum("source_ingestion_status", [
  "pending",
  "queued",
  "parsing",
  "persisting",
  "segmenting",
  "completed",
  "failed",
]);
export const sourceVersionStatus = pgEnum("source_version_status", [
  "processing",
  "completed",
  "failed",
]);
export const sourceSegmentType = pgEnum("source_segment_type", [
  "heading",
  "paragraph",
  "list",
  "table",
  "figure_caption",
  "code",
  "formula",
  "transcript",
  "other",
]);
export const ingestionJobStatus = pgEnum("ingestion_job_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "dead_letter",
]);
export const ingestionStage = pgEnum("ingestion_stage", [
  "download",
  "parse",
  "persist",
  "segment",
]);
export const aiRunType = pgEnum("ai_run_type", [
  "source_summary",
  "extraction",
  "resolution",
  "synthesis",
  "ask",
  "assessment",
]);
export const aiRunStatus = pgEnum("ai_run_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export const proposalStatus = pgEnum("proposal_status", [
  "draft",
  "ready_for_review",
  "partially_reviewed",
  "accepted",
  "rejected",
  "mixed",
  "archived",
]);
export const proposalItemType = pgEnum("proposal_item_type", [
  "create_concept",
  "update_concept",
  "add_alias",
  "add_relation",
  "add_prerequisite",
  "add_claim",
  "add_citation",
  "mark_contradiction",
  "add_application",
]);
export const proposalItemStatus = pgEnum("proposal_item_status", [
  "pending",
  "accepted",
  "edited_and_accepted",
  "rejected",
  "deferred",
  "stale",
]);
export const askMessageRole = pgEnum("ask_message_role", ["user", "assistant"]);
export const askAnswerStatus = pgEnum("ask_answer_status", [
  "complete",
  "insufficient_evidence",
  "failed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  settings: jsonb("settings").notNull().default({}),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id),
  ...timestamps,
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: workspaceRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    index("workspace_members_user_idx").on(table.userId, table.workspaceId),
  ],
);

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    shortDescription: text("short_description").notNull(),
    scopeMarkdown: text("scope_markdown").notNull().default(""),
    kind: domainKind("kind").notNull(),
    parentDomainId: uuid("parent_domain_id").references(
      (): AnyPgColumn => domains.id,
    ),
    sortOrder: integer("sort_order").notNull().default(0),
    contentStatus: contentStatus("content_status").notNull().default("draft"),
    priority: priority("priority").notNull().default("later"),
    targetMastery: smallint("target_mastery"),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => profiles.id),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique("domains_id_workspace_unique").on(table.id, table.workspaceId),
    uniqueIndex("domains_workspace_slug_active_unique")
      .on(table.workspaceId, table.slug)
      .where(sql`${table.deletedAt} is null`),
    index("domains_workspace_parent_idx").on(
      table.workspaceId,
      table.parentDomainId,
    ),
    foreignKey({
      name: "domains_parent_workspace_fk",
      columns: [table.parentDomainId, table.workspaceId],
      foreignColumns: [table.id, table.workspaceId],
    }),
    check(
      "domains_target_mastery_check",
      sql`${table.targetMastery} between 0 and 5`,
    ),
    check(
      "domains_parent_not_self_check",
      sql`${table.parentDomainId} is null or ${table.parentDomainId} <> ${table.id}`,
    ),
  ],
);

export const concepts = pgTable(
  "concepts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    canonicalName: text("canonical_name").notNull(),
    conciseDefinition: text("concise_definition").notNull().default(""),
    synthesisMarkdown: text("synthesis_markdown").notNull().default(""),
    whyItExistsMarkdown: text("why_it_exists_markdown"),
    mechanismMarkdown: text("mechanism_markdown"),
    examplesMarkdown: text("examples_markdown"),
    counterexamplesMarkdown: text("counterexamples_markdown"),
    failureModesMarkdown: text("failure_modes_markdown"),
    commonConfusionsMarkdown: text("common_confusions_markdown"),
    canonicalDomainId: uuid("canonical_domain_id").notNull(),
    canonicalParentId: uuid("canonical_parent_id").references(
      (): AnyPgColumn => concepts.id,
    ),
    conceptKind: conceptKind("concept_kind").notNull().default("concept"),
    contentStatus: contentStatus("content_status").notNull().default("draft"),
    priority: priority("priority").notNull().default("later"),
    targetMastery: smallint("target_mastery"),
    reviewNote: text("review_note"),
    replacementConceptId: uuid("replacement_concept_id").references(
      (): AnyPgColumn => concepts.id,
    ),
    searchDocument: tsvector("search_document").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce("canonical_name", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("concise_definition", '')), 'B') ||
          setweight(to_tsvector('english',
            coalesce("synthesis_markdown", '') || ' ' ||
            coalesce("why_it_exists_markdown", '') || ' ' ||
            coalesce("mechanism_markdown", '') || ' ' ||
            coalesce("examples_markdown", '') || ' ' ||
            coalesce("counterexamples_markdown", '') || ' ' ||
            coalesce("failure_modes_markdown", '') || ' ' ||
            coalesce("common_confusions_markdown", '')
          ), 'C')`,
    ),
    embedding: vector("embedding", { dimensions: 1536 }),
    embeddingModel: text("embedding_model"),
    embeddingUpdatedAt: timestamp("embedding_updated_at", {
      withTimezone: true,
    }),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => profiles.id),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique("concepts_id_workspace_unique").on(table.id, table.workspaceId),
    uniqueIndex("concepts_workspace_slug_active_unique")
      .on(table.workspaceId, table.slug)
      .where(sql`${table.deletedAt} is null`),
    index("concepts_workspace_domain_idx").on(
      table.workspaceId,
      table.canonicalDomainId,
    ),
    index("concepts_workspace_parent_idx").on(
      table.workspaceId,
      table.canonicalParentId,
    ),
    index("concepts_search_document_idx").using("gin", table.searchDocument),
    foreignKey({
      name: "concepts_domain_workspace_fk",
      columns: [table.canonicalDomainId, table.workspaceId],
      foreignColumns: [domains.id, domains.workspaceId],
    }),
    foreignKey({
      name: "concepts_parent_workspace_fk",
      columns: [table.canonicalParentId, table.workspaceId],
      foreignColumns: [table.id, table.workspaceId],
    }),
    foreignKey({
      name: "concepts_replacement_workspace_fk",
      columns: [table.replacementConceptId, table.workspaceId],
      foreignColumns: [table.id, table.workspaceId],
    }),
    check(
      "concepts_target_mastery_check",
      sql`${table.targetMastery} between 0 and 5`,
    ),
    check(
      "concepts_parent_not_self_check",
      sql`${table.canonicalParentId} is null or ${table.canonicalParentId} <> ${table.id}`,
    ),
    check(
      "concepts_replacement_not_self_check",
      sql`${table.replacementConceptId} is null or ${table.replacementConceptId} <> ${table.id}`,
    ),
  ],
);

export const conceptAliases = pgTable(
  "concept_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id").notNull(),
    alias: text("alias").notNull(),
    aliasNormalized: text("alias_normalized").notNull(),
    aliasType: aliasType("alias_type").notNull().default("synonym"),
    languageCode: text("language_code").notNull().default("en"),
    disambiguationKey: text("disambiguation_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "concept_aliases_concept_workspace_fk",
      columns: [table.conceptId, table.workspaceId],
      foreignColumns: [concepts.id, concepts.workspaceId],
    }).onDelete("cascade"),
    uniqueIndex("concept_aliases_unqualified_unique")
      .on(table.workspaceId, table.aliasNormalized, table.languageCode)
      .where(sql`${table.disambiguationKey} is null`),
    uniqueIndex("concept_aliases_qualified_unique")
      .on(
        table.workspaceId,
        table.aliasNormalized,
        table.languageCode,
        table.disambiguationKey,
      )
      .where(sql`${table.disambiguationKey} is not null`),
    index("concept_aliases_concept_idx").on(table.workspaceId, table.conceptId),
  ],
);

export const relationTypes = pgTable(
  "relation_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    forwardLabel: text("forward_label").notNull(),
    inverseLabel: text("inverse_label").notNull(),
    category: relationCategory("category").notNull(),
    directed: boolean("directed").notNull(),
    symmetric: boolean("symmetric").notNull().default(false),
    acyclic: boolean("acyclic").notNull().default(false),
    allowsSelf: boolean("allows_self").notNull().default(false),
    allowedSourceKinds: text("allowed_source_kinds")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    allowedTargetKinds: text("allowed_target_kinds")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    style: jsonb("style").notNull().default({}),
    isSystem: boolean("is_system").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    unique("relation_types_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    unique("relation_types_workspace_key_unique").on(
      table.workspaceId,
      table.key,
    ),
    check(
      "relation_types_symmetry_check",
      sql`not (${table.symmetric} and ${table.directed})`,
    ),
  ],
);

export const conceptRelations = pgTable(
  "concept_relations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceConceptId: uuid("source_concept_id").notNull(),
    relationTypeId: uuid("relation_type_id").notNull(),
    targetConceptId: uuid("target_concept_id").notNull(),
    description: text("description"),
    confidence: numeric("confidence", { precision: 4, scale: 3 }),
    reviewStatus: contentStatus("review_status").notNull().default("draft"),
    provenanceType: relationProvenance("provenance_type")
      .notNull()
      .default("human"),
    sourceProposalItemId: uuid("source_proposal_item_id"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "concept_relations_source_workspace_fk",
      columns: [table.sourceConceptId, table.workspaceId],
      foreignColumns: [concepts.id, concepts.workspaceId],
    }),
    foreignKey({
      name: "concept_relations_target_workspace_fk",
      columns: [table.targetConceptId, table.workspaceId],
      foreignColumns: [concepts.id, concepts.workspaceId],
    }),
    foreignKey({
      name: "concept_relations_type_workspace_fk",
      columns: [table.relationTypeId, table.workspaceId],
      foreignColumns: [relationTypes.id, relationTypes.workspaceId],
    }),
    uniqueIndex("concept_relations_active_unique")
      .on(
        table.workspaceId,
        table.sourceConceptId,
        table.relationTypeId,
        table.targetConceptId,
      )
      .where(sql`${table.deletedAt} is null`),
    index("concept_relations_source_idx").on(
      table.workspaceId,
      table.sourceConceptId,
      table.relationTypeId,
    ),
    index("concept_relations_target_idx").on(
      table.workspaceId,
      table.targetConceptId,
      table.relationTypeId,
    ),
    check(
      "concept_relations_confidence_check",
      sql`${table.confidence} between 0 and 1`,
    ),
  ],
);

export const conceptRevisions = pgTable(
  "concept_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id").notNull(),
    revisionNumber: integer("revision_number").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    changeSummary: text("change_summary").notNull(),
    changeSource: revisionChangeSource("change_source").notNull(),
    proposalItemId: uuid("proposal_item_id"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "concept_revisions_concept_workspace_fk",
      columns: [table.conceptId, table.workspaceId],
      foreignColumns: [concepts.id, concepts.workspaceId],
    }),
    unique("concept_revisions_number_unique").on(
      table.conceptId,
      table.revisionNumber,
    ),
    index("concept_revisions_workspace_concept_idx").on(
      table.workspaceId,
      table.conceptId,
    ),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => profiles.id),
    actorType: auditActorType("actor_type").notNull(),
    eventType: text("event_type").notNull(),
    objectType: text("object_type").notNull(),
    objectId: uuid("object_id").notNull(),
    summary: text("summary").notNull(),
    beforeSummary: jsonb("before_summary"),
    afterSummary: jsonb("after_summary"),
    sourceProposalItemId: uuid("source_proposal_item_id"),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_events_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export const learningPaths = pgTable(
  "learning_paths",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    purposeMarkdown: text("purpose_markdown").notNull().default(""),
    targetOutcomeMarkdown: text("target_outcome_markdown")
      .notNull()
      .default(""),
    contentStatus: contentStatus("content_status").notNull().default("draft"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => profiles.id),
    ...timestamps,
  },
  (table) => [
    unique("learning_paths_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    unique("learning_paths_workspace_slug_unique").on(
      table.workspaceId,
      table.slug,
    ),
    index("learning_paths_workspace_status_idx").on(
      table.workspaceId,
      table.contentStatus,
    ),
  ],
);

export const learningPathSteps = pgTable(
  "learning_path_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    learningPathId: uuid("learning_path_id").notNull(),
    conceptId: uuid("concept_id").notNull(),
    stepOrder: integer("step_order").notNull(),
    branchKey: text("branch_key").notNull().default("main"),
    mandatory: boolean("mandatory").notNull().default(true),
    rationale: text("rationale"),
    learningObjective: text("learning_objective"),
    targetMastery: smallint("target_mastery").notNull(),
    requiredPriorMastery: smallint("required_prior_mastery")
      .notNull()
      .default(1),
    exerciseMarkdown: text("exercise_markdown"),
    ...timestamps,
  },
  (table) => [
    unique("learning_path_steps_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    foreignKey({
      name: "learning_path_steps_path_workspace_fk",
      columns: [table.learningPathId, table.workspaceId],
      foreignColumns: [learningPaths.id, learningPaths.workspaceId],
    }).onDelete("cascade"),
    foreignKey({
      name: "learning_path_steps_concept_workspace_fk",
      columns: [table.conceptId, table.workspaceId],
      foreignColumns: [concepts.id, concepts.workspaceId],
    }),
    unique("learning_path_steps_order_unique").on(
      table.learningPathId,
      table.branchKey,
      table.stepOrder,
    ),
    unique("learning_path_steps_concept_unique").on(
      table.learningPathId,
      table.branchKey,
      table.conceptId,
    ),
    index("learning_path_steps_path_order_idx").on(
      table.workspaceId,
      table.learningPathId,
      table.branchKey,
      table.stepOrder,
    ),
    check("learning_path_steps_order_check", sql`${table.stepOrder} > 0`),
    check(
      "learning_path_steps_target_mastery_check",
      sql`${table.targetMastery} between 0 and 5`,
    ),
    check(
      "learning_path_steps_prior_mastery_check",
      sql`${table.requiredPriorMastery} between 0 and 5`,
    ),
  ],
);

export const masteryEvidence = pgTable(
  "mastery_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id").notNull(),
    levelClaimed: smallint("level_claimed").notNull(),
    evidenceType: masteryEvidenceType("evidence_type").notNull(),
    note: text("note"),
    artifactUrl: text("artifact_url"),
    aiAssessment: jsonb("ai_assessment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("mastery_evidence_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    foreignKey({
      name: "mastery_evidence_concept_workspace_fk",
      columns: [table.conceptId, table.workspaceId],
      foreignColumns: [concepts.id, concepts.workspaceId],
    }),
    index("mastery_evidence_user_concept_idx").on(
      table.workspaceId,
      table.userId,
      table.conceptId,
      table.createdAt,
    ),
    check(
      "mastery_evidence_level_check",
      sql`${table.levelClaimed} between 0 and 5`,
    ),
    check(
      "mastery_evidence_content_check",
      sql`${table.note} is not null or ${table.artifactUrl} is not null`,
    ),
  ],
);

export const userMastery = pgTable(
  "user_mastery",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id").notNull(),
    currentLevel: smallint("current_level").notNull().default(0),
    targetLevel: smallint("target_level").notNull().default(1),
    status: masteryStatus("status").notNull().default("not_started"),
    lastEvidenceId: uuid("last_evidence_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "user_mastery_concept_workspace_fk",
      columns: [table.conceptId, table.workspaceId],
      foreignColumns: [concepts.id, concepts.workspaceId],
    }),
    foreignKey({
      name: "user_mastery_evidence_workspace_fk",
      columns: [table.lastEvidenceId, table.workspaceId],
      foreignColumns: [masteryEvidence.id, masteryEvidence.workspaceId],
    }),
    unique("user_mastery_workspace_user_concept_unique").on(
      table.workspaceId,
      table.userId,
      table.conceptId,
    ),
    index("user_mastery_user_status_idx").on(
      table.workspaceId,
      table.userId,
      table.status,
    ),
    check(
      "user_mastery_current_level_check",
      sql`${table.currentLevel} between 0 and 5`,
    ),
    check(
      "user_mastery_target_level_check",
      sql`${table.targetLevel} between 0 and 5`,
    ),
  ],
);

export const learningPrerequisiteWaivers = pgTable(
  "learning_prerequisite_waivers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    learningPathId: uuid("learning_path_id").notNull(),
    targetConceptId: uuid("target_concept_id").notNull(),
    prerequisiteConceptId: uuid("prerequisite_concept_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "learning_waivers_path_workspace_fk",
      columns: [table.learningPathId, table.workspaceId],
      foreignColumns: [learningPaths.id, learningPaths.workspaceId],
    }).onDelete("cascade"),
    foreignKey({
      name: "learning_waivers_target_workspace_fk",
      columns: [table.targetConceptId, table.workspaceId],
      foreignColumns: [concepts.id, concepts.workspaceId],
    }),
    foreignKey({
      name: "learning_waivers_prerequisite_workspace_fk",
      columns: [table.prerequisiteConceptId, table.workspaceId],
      foreignColumns: [concepts.id, concepts.workspaceId],
    }),
    unique("learning_waivers_unique").on(
      table.workspaceId,
      table.userId,
      table.learningPathId,
      table.targetConceptId,
      table.prerequisiteConceptId,
    ),
    index("learning_waivers_user_path_idx").on(
      table.workspaceId,
      table.userId,
      table.learningPathId,
    ),
    check(
      "learning_waivers_reason_check",
      sql`length(trim(${table.reason})) >= 3`,
    ),
    check(
      "learning_waivers_distinct_concepts_check",
      sql`${table.targetConceptId} <> ${table.prerequisiteConceptId}`,
    ),
  ],
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    origin: sourceOrigin("origin").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    sourceType: sourceType("source_type").notNull(),
    authors: jsonb("authors").notNull().default([]),
    organization: text("organization"),
    publicationDate: date("publication_date"),
    externalUrl: text("external_url"),
    finalUrl: text("final_url"),
    externalIdentifier: text("external_identifier"),
    quality: sourceQuality("quality").notNull().default("unknown"),
    sensitivity: sourceSensitivity("sensitivity").notNull().default("internal"),
    externalAiPolicy: externalAiPolicy("external_ai_policy")
      .notNull()
      .default("denied"),
    rightsNote: text("rights_note").notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    fileName: text("file_name"),
    fileMimeType: text("file_mime_type"),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
    fileChecksumSha256: text("file_checksum_sha256"),
    storagePath: text("storage_path"),
    ingestionStatus: sourceIngestionStatus("ingestion_status")
      .notNull()
      .default("pending"),
    latestSourceVersionId: uuid("latest_source_version_id"),
    addedBy: uuid("added_by")
      .notNull()
      .references(() => profiles.id),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique("sources_id_workspace_unique").on(table.id, table.workspaceId),
    uniqueIndex("sources_workspace_checksum_active_unique")
      .on(table.workspaceId, table.fileChecksumSha256)
      .where(
        sql`${table.fileChecksumSha256} is not null and ${table.deletedAt} is null`,
      ),
    index("sources_workspace_status_created_idx").on(
      table.workspaceId,
      table.ingestionStatus,
      table.createdAt,
    ),
    check("sources_title_check", sql`length(trim(${table.title})) > 0`),
    check(
      "sources_rights_note_check",
      sql`length(trim(${table.rightsNote})) >= 3`,
    ),
    check(
      "sources_checksum_check",
      sql`${table.fileChecksumSha256} is null or ${table.fileChecksumSha256} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "sources_origin_fields_check",
      sql`(${table.origin} = 'file' and ${table.fileName} is not null and ${table.externalUrl} is null)
          or (${table.origin} = 'url' and ${table.externalUrl} is not null)`,
    ),
    check(
      "sources_file_size_check",
      sql`${table.fileSizeBytes} is null or ${table.fileSizeBytes} > 0`,
    ),
  ],
);

export const sourceVersions = pgTable(
  "source_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    fileChecksumSha256: text("file_checksum_sha256").notNull(),
    parserName: text("parser_name").notNull(),
    parserVersion: text("parser_version").notNull(),
    parserProfile: text("parser_profile").notNull(),
    doclingJsonPath: text("docling_json_path"),
    markdownPath: text("markdown_path"),
    extractedMetadata: jsonb("extracted_metadata").notNull().default({}),
    pageCount: integer("page_count"),
    languageCode: text("language_code"),
    processingStatus: sourceVersionStatus("processing_status")
      .notNull()
      .default("processing"),
    errorCode: text("error_code"),
    errorMessageSanitized: text("error_message_sanitized"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("source_versions_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    foreignKey({
      name: "source_versions_source_workspace_fk",
      columns: [table.sourceId, table.workspaceId],
      foreignColumns: [sources.id, sources.workspaceId],
    }).onDelete("cascade"),
    unique("source_versions_source_number_unique").on(
      table.sourceId,
      table.versionNumber,
    ),
    unique("source_versions_workspace_idempotency_unique").on(
      table.workspaceId,
      table.idempotencyKey,
    ),
    index("source_versions_source_created_idx").on(
      table.workspaceId,
      table.sourceId,
      table.createdAt,
    ),
    check("source_versions_number_check", sql`${table.versionNumber} > 0`),
    check(
      "source_versions_checksum_check",
      sql`${table.fileChecksumSha256} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export const sourceSegments = pgTable(
  "source_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceVersionId: uuid("source_version_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    stableKey: text("stable_key").notNull(),
    segmentType: sourceSegmentType("segment_type").notNull(),
    headingPath: text("heading_path")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    text: text("text").notNull(),
    tokenCount: integer("token_count").notNull(),
    pageStart: integer("page_start"),
    pageEnd: integer("page_end"),
    provenance: jsonb("provenance").notNull().default({}),
    searchDocument: tsvector("search_document").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce("text", '')), 'B')`,
    ),
    embedding: vector("embedding", { dimensions: 1536 }),
    embeddingModel: text("embedding_model"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("source_segments_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    foreignKey({
      name: "source_segments_version_workspace_fk",
      columns: [table.sourceVersionId, table.workspaceId],
      foreignColumns: [sourceVersions.id, sourceVersions.workspaceId],
    }).onDelete("cascade"),
    unique("source_segments_version_ordinal_unique").on(
      table.sourceVersionId,
      table.ordinal,
    ),
    unique("source_segments_version_stable_key_unique").on(
      table.sourceVersionId,
      table.stableKey,
    ),
    index("source_segments_version_ordinal_idx").on(
      table.workspaceId,
      table.sourceVersionId,
      table.ordinal,
    ),
    index("source_segments_search_document_idx").using(
      "gin",
      table.searchDocument,
    ),
    check("source_segments_ordinal_check", sql`${table.ordinal} > 0`),
    check("source_segments_text_check", sql`length(trim(${table.text})) > 0`),
    check("source_segments_token_count_check", sql`${table.tokenCount} > 0`),
    check(
      "source_segments_page_range_check",
      sql`${table.pageStart} is null or (${table.pageStart} > 0 and (${table.pageEnd} is null or ${table.pageEnd} >= ${table.pageStart}))`,
    ),
  ],
);

export const ingestionJobs = pgTable(
  "ingestion_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").notNull(),
    sourceVersionId: uuid("source_version_id"),
    queueMessageId: bigint("queue_message_id", { mode: "number" }),
    status: ingestionJobStatus("status").notNull().default("queued"),
    stage: ingestionStage("stage").notNull().default("download"),
    attemptCount: integer("attempt_count").notNull().default(0),
    progress: numeric("progress", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    idempotencyKey: text("idempotency_key").notNull(),
    parserProfile: text("parser_profile").notNull(),
    extractionSchemaVersion: text("extraction_schema_version").notNull(),
    allowExternalAi: boolean("allow_external_ai").notNull().default(false),
    forceReprocess: boolean("force_reprocess").notNull().default(false),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => profiles.id),
    errorCode: text("error_code"),
    errorMessageSanitized: text("error_message_sanitized"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("ingestion_jobs_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    foreignKey({
      name: "ingestion_jobs_source_workspace_fk",
      columns: [table.sourceId, table.workspaceId],
      foreignColumns: [sources.id, sources.workspaceId],
    }).onDelete("cascade"),
    foreignKey({
      name: "ingestion_jobs_version_workspace_fk",
      columns: [table.sourceVersionId, table.workspaceId],
      foreignColumns: [sourceVersions.id, sourceVersions.workspaceId],
    }),
    unique("ingestion_jobs_workspace_idempotency_unique").on(
      table.workspaceId,
      table.idempotencyKey,
    ),
    index("ingestion_jobs_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("ingestion_jobs_workspace_source_idx").on(
      table.workspaceId,
      table.sourceId,
      table.createdAt,
    ),
    check("ingestion_jobs_attempt_check", sql`${table.attemptCount} >= 0`),
    check(
      "ingestion_jobs_progress_check",
      sql`${table.progress} between 0 and 100`,
    ),
  ],
);

export const aiRuns = pgTable(
  "ai_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    runType: aiRunType("run_type").notNull(),
    status: aiRunStatus("status").notNull().default("queued"),
    provider: text("provider").notNull(),
    modelId: text("model_id").notNull(),
    promptVersion: text("prompt_version").notNull(),
    schemaVersion: text("schema_version"),
    idempotencyKey: text("idempotency_key").notNull(),
    inputRefs: jsonb("input_refs").notNull().default({}),
    outputHash: text("output_hash"),
    usage: jsonb("usage"),
    latencyMs: integer("latency_ms"),
    traceId: text("trace_id"),
    errorCode: text("error_code"),
    errorMessageSanitized: text("error_message_sanitized"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("ai_runs_id_workspace_unique").on(table.id, table.workspaceId),
    unique("ai_runs_workspace_idempotency_unique").on(
      table.workspaceId,
      table.idempotencyKey,
    ),
    index("ai_runs_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    index("ai_runs_workspace_status_idx").on(table.workspaceId, table.status),
    check(
      "ai_runs_latency_check",
      sql`${table.latencyMs} is null or ${table.latencyMs} >= 0`,
    ),
  ],
);

export const changeProposals = pgTable(
  "change_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceVersionId: uuid("source_version_id"),
    aiRunId: uuid("ai_run_id"),
    title: text("title").notNull(),
    status: proposalStatus("status").notNull().default("draft"),
    summary: text("summary"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("change_proposals_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    uniqueIndex("change_proposals_workspace_run_unique")
      .on(table.workspaceId, table.aiRunId)
      .where(sql`${table.aiRunId} is not null`),
    index("change_proposals_workspace_status_idx").on(
      table.workspaceId,
      table.status,
      table.updatedAt,
    ),
    foreignKey({
      name: "change_proposals_source_version_workspace_fk",
      columns: [table.sourceVersionId, table.workspaceId],
      foreignColumns: [sourceVersions.id, sourceVersions.workspaceId],
    }),
    foreignKey({
      name: "change_proposals_ai_run_workspace_fk",
      columns: [table.aiRunId, table.workspaceId],
      foreignColumns: [aiRuns.id, aiRuns.workspaceId],
    }),
    check(
      "change_proposals_title_check",
      sql`length(trim(${table.title})) > 0`,
    ),
  ],
);

export const changeProposalItems = pgTable(
  "change_proposal_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    proposalId: uuid("proposal_id").notNull(),
    itemType: proposalItemType("item_type").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    baseRevisionId: uuid("base_revision_id"),
    proposedPayload: jsonb("proposed_payload").notNull(),
    evidenceSegmentIds: uuid("evidence_segment_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    confidence: numeric("confidence", { precision: 4, scale: 3 }),
    rationale: text("rationale"),
    status: proposalItemStatus("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    editedPayload: jsonb("edited_payload"),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    appliedObjectRefs: jsonb("applied_object_refs"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("change_proposal_items_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    foreignKey({
      name: "change_proposal_items_proposal_workspace_fk",
      columns: [table.proposalId, table.workspaceId],
      foreignColumns: [changeProposals.id, changeProposals.workspaceId],
    }).onDelete("cascade"),
    index("change_proposal_items_proposal_status_idx").on(
      table.workspaceId,
      table.proposalId,
      table.status,
    ),
    check(
      "change_proposal_items_confidence_check",
      sql`${table.confidence} between 0 and 1`,
    ),
    check(
      "change_proposal_items_payload_check",
      sql`jsonb_typeof(${table.proposedPayload}) = 'object'`,
    ),
  ],
);

export const askThreads = pgTable(
  "ask_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title"),
    scope: jsonb("scope").notNull().default({}),
    ...timestamps,
  },
  (table) => [
    unique("ask_threads_id_workspace_unique").on(table.id, table.workspaceId),
    index("ask_threads_workspace_user_updated_idx").on(
      table.workspaceId,
      table.userId,
      table.updatedAt,
    ),
    check(
      "ask_threads_scope_check",
      sql`jsonb_typeof(${table.scope}) = 'object'`,
    ),
  ],
);

export const askMessages = pgTable(
  "ask_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").notNull(),
    role: askMessageRole("role").notNull(),
    contentMarkdown: text("content_markdown").notNull(),
    answerStatus: askAnswerStatus("answer_status")
      .notNull()
      .default("complete"),
    retrievedConceptIds: uuid("retrieved_concept_ids").array(),
    citedSegmentIds: uuid("cited_segment_ids").array(),
    aiRunId: uuid("ai_run_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("ask_messages_id_workspace_unique").on(table.id, table.workspaceId),
    foreignKey({
      name: "ask_messages_thread_workspace_fk",
      columns: [table.threadId, table.workspaceId],
      foreignColumns: [askThreads.id, askThreads.workspaceId],
    }).onDelete("cascade"),
    foreignKey({
      name: "ask_messages_ai_run_workspace_fk",
      columns: [table.aiRunId, table.workspaceId],
      foreignColumns: [aiRuns.id, aiRuns.workspaceId],
    }),
    index("ask_messages_workspace_thread_created_idx").on(
      table.workspaceId,
      table.threadId,
      table.createdAt,
    ),
    check(
      "ask_messages_content_check",
      sql`length(trim(${table.contentMarkdown})) > 0`,
    ),
  ],
);
