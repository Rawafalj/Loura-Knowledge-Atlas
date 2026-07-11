import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
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
