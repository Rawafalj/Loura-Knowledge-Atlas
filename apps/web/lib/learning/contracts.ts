import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const masteryLevelSchema = z.coerce.number().int().min(0).max(5);
export const masteryStatusSchema = z.enum([
  "not_started",
  "learning",
  "applied",
  "mastered",
  "revisit",
]);
export const masteryEvidenceTypeSchema = z.enum([
  "self_assessment",
  "explanation",
  "quiz",
  "applied_analysis",
  "design_artifact",
  "critique",
  "external_evaluation",
]);

export const masteryInputSchema = z
  .object({
    conceptId: z.string().uuid(),
    conceptSlug: z.string().regex(slugPattern),
    currentLevel: masteryLevelSchema,
    targetLevel: masteryLevelSchema,
    status: masteryStatusSchema,
    evidenceType: masteryEvidenceTypeSchema,
    note: z.string().trim().max(2_000).optional().default(""),
    artifactUrl: z
      .string()
      .trim()
      .max(2_000)
      .refine(
        (value) => !value || /^https?:\/\/[^\s]+$/i.test(value),
        "Artifact URL must use HTTP or HTTPS",
      )
      .optional()
      .default(""),
    returnTo: z
      .string()
      .startsWith("/")
      .refine(
        (value) => !value.startsWith("//"),
        "Return path must be internal",
      )
      .default("/mastery"),
  })
  .superRefine((input, context) => {
    if (!input.note && !input.artifactUrl) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Add an evidence note or artifact URL",
      });
    }
    if (input.status === "not_started" && input.currentLevel !== 0) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "Not started requires level 0",
      });
    }
    if (input.status === "applied" && input.currentLevel < 2) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "Applied requires level 2 or higher",
      });
    }
    if (input.status === "mastered" && input.currentLevel < input.targetLevel) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "Mastered requires meeting the target level",
      });
    }
  });

export const learningPathStepInputSchema = z.object({
  conceptSlug: z.string().regex(slugPattern),
  stepOrder: z.coerce.number().int().positive(),
  branchKey: z.string().regex(slugPattern).default("main"),
  mandatory: z.coerce.boolean().default(true),
  rationale: z.string().trim().max(2_000).default(""),
  learningObjective: z.string().trim().max(2_000).default(""),
  targetMastery: masteryLevelSchema,
  requiredPriorMastery: masteryLevelSchema.default(1),
  exerciseMarkdown: z.string().trim().max(10_000).default(""),
});

export const learningPathInputSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  slug: z.string().regex(slugPattern),
  title: z.string().trim().min(2).max(160),
  purposeMarkdown: z.string().trim().min(10).max(20_000),
  targetOutcomeMarkdown: z.string().trim().min(10).max(20_000),
  contentStatus: z.enum(["draft", "reviewed", "deprecated"]),
  steps: z.array(learningPathStepInputSchema).min(1).max(100),
});

export type MasteryInput = z.infer<typeof masteryInputSchema>;
export type LearningPathInput = z.infer<typeof learningPathInputSchema>;

export const MASTERY_LEVEL_LABELS = [
  "Recognize",
  "Explain",
  "Apply",
  "Design",
  "Critique",
  "Extend",
] as const;
