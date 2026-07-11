import { z } from "zod";

export const sourceTypes = [
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
] as const;
export const sourceQualities = [
  "canonical",
  "primary",
  "secondary",
  "practitioner",
  "unknown",
] as const;
export const sourceSensitivities = [
  "public",
  "internal",
  "confidential",
] as const;
export const externalAiPolicies = [
  "allowed",
  "denied",
  "explicit_per_run",
] as const;

export const sourceMetadataSchema = z
  .object({
    title: z.string().trim().min(1).max(240),
    subtitle: z.string().trim().max(300).optional().default(""),
    sourceType: z.enum(sourceTypes),
    authors: z
      .array(z.object({ name: z.string().trim().min(1).max(160) }))
      .max(30)
      .default([]),
    organization: z.string().trim().max(200).optional().default(""),
    publicationDate: z
      .union([z.iso.date(), z.literal("")])
      .optional()
      .default(""),
    externalIdentifier: z.string().trim().max(200).optional().default(""),
    quality: z.enum(sourceQualities),
    sensitivity: z.enum(sourceSensitivities),
    externalAiPolicy: z.enum(externalAiPolicies),
    rightsNote: z.string().trim().min(3).max(1000),
    tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  })
  .superRefine((value, context) => {
    if (
      value.sensitivity === "confidential" &&
      value.externalAiPolicy !== "denied"
    ) {
      context.addIssue({
        code: "custom",
        path: ["externalAiPolicy"],
        message:
          "Confidential sources must deny external AI processing in v0.1.",
      });
    }
  });

export const uploadIntentSchema = z.object({
  workspaceId: z.uuid(),
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._ -]*$/),
  mimeType: z.string().trim().min(1).max(160),
  sizeBytes: z.number().int().positive(),
  checksumSha256: z.string().regex(/^[0-9a-f]{64}$/),
  metadata: sourceMetadataSchema,
});

export const finalizeUploadSchema = z.object({
  workspaceId: z.uuid(),
});

export const urlSourceSchema = z.object({
  workspaceId: z.uuid(),
  url: z.url().max(2048),
  metadata: sourceMetadataSchema,
});

export const retryJobSchema = z.object({ workspaceId: z.uuid() });

export type SourceMetadataInput = z.infer<typeof sourceMetadataSchema>;
