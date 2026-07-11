import { z } from "zod";

/** The answer status is persisted with ask messages in the database. */
export const evidenceAssessments = [
  "sufficient",
  "partial",
  "insufficient",
] as const;

export const askAnswerSchema = z.object({
  answerMarkdown: z.string().trim().max(30_000),
  citationIds: z.array(z.string().trim().min(1).max(160)).max(64),
  conceptIds: z.array(z.string().trim().min(1).max(160)).max(50),
  evidenceAssessment: z.enum(evidenceAssessments),
  inferenceNotes: z.array(z.string().trim().min(1).max(2_000)).max(20),
  suggestedNextConceptId: z.string().trim().min(1).max(160).optional(),
});

export type EvidenceAssessment = (typeof evidenceAssessments)[number];
export type AskAnswer = z.infer<typeof askAnswerSchema>;
/** Naming used by the product/API specification. */
export const atlasAnswerSchema = askAnswerSchema;
export type AtlasAnswer = AskAnswer;

export const askScopeSchema = z.object({
  domainIds: z.array(z.string().uuid()).max(20).default([]),
  conceptIds: z.array(z.string().uuid()).max(50).default([]),
  pathId: z.string().uuid().nullable().default(null),
  reviewedOnly: z.boolean().default(true),
  includeDraftProposals: z.boolean().default(false),
});

export type AskScope = z.infer<typeof askScopeSchema>;

export const askRequestSchema = z.object({
  workspaceId: z.uuid(),
  threadId: z.uuid().nullable().optional(),
  question: z.string().trim().min(2).max(4_000),
  scope: askScopeSchema.default({
    domainIds: [],
    conceptIds: [],
    pathId: null,
    reviewedOnly: true,
    includeDraftProposals: false,
  }),
});

export type AskRequest = z.infer<typeof askRequestSchema>;

/** A source segment is the only evidence object an answer may cite. */
export const evidenceSegmentSchema = z.object({
  id: z.string().trim().min(1).max(160),
  sourceId: z.string().trim().min(1).max(160),
  sourceVersionId: z.string().trim().min(1).max(160),
  sourceTitle: z.string().trim().min(1).max(240),
  text: z.string().trim().min(1).max(100_000),
  ordinal: z.number().int().nonnegative().optional(),
  location: z.string().trim().max(500).optional(),
  contentStatus: z.enum(["draft", "reviewed", "deprecated"]).optional(),
  sourceQuality: z
    .enum(["canonical", "primary", "secondary", "practitioner", "unknown"])
    .optional(),
});

export const evidenceConceptSchema = z.object({
  id: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(240),
  synthesisMarkdown: z.string().trim().max(20_000).optional().default(""),
  contentStatus: z.enum(["draft", "reviewed", "deprecated"]).optional(),
});

export const evidenceBundleSchema = z.object({
  segments: z.array(evidenceSegmentSchema).max(40),
  concepts: z.array(evidenceConceptSchema).max(40),
  truncated: z.boolean(),
});

export type EvidenceSegment = z.infer<typeof evidenceSegmentSchema>;
export type EvidenceConcept = z.infer<typeof evidenceConceptSchema>;
export type EvidenceBundle = z.infer<typeof evidenceBundleSchema>;
