import { z } from "zod";

export const applicationTypes = [
  "decision",
  "component",
  "experiment",
  "deployment_question",
  "artifact",
  "risk",
  "requirement",
] as const;

export const applicationStatuses = [
  "proposed",
  "active",
  "decided",
  "validated",
  "archived",
] as const;

/**
 * Application links may point to project artifacts, but never to executable
 * or browser-controlled protocols. Keep this in the shared contract so both
 * forms and route handlers enforce the same rule before rendering a link.
 */
/** Return the URL when it is safe to render, otherwise null. */
export function safeExternalUrl(value: string) {
  try {
    const candidate = value.trim();
    if (!candidate) return null;
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function isSafeExternalUrl(value: string) {
  return safeExternalUrl(value) !== null;
}

export const externalUrlSchema = z
  .string()
  .trim()
  .max(2_000)
  .refine((value) => !value || safeExternalUrl(value) !== null, {
    message: "External URL must use HTTP or HTTPS",
  });

const optionalUuid = z
  .union([z.uuid(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? value : null));

const optionalText = z
  .union([z.string().trim().max(2_000), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? value : null));

const applicationDescription = z.string().trim().min(1).max(20_000);

/**
 * `description` is the form/API spelling; `descriptionMarkdown` is retained
 * as an accepted alias for callers that mirror the database column. The
 * transform emits both names so domain services can use either vocabulary.
 */
export const applicationInputSchema = z
  .object({
    id: optionalUuid,
    applicationType: z.enum(applicationTypes),
    title: z.string().trim().min(2).max(240),
    description: applicationDescription.optional(),
    descriptionMarkdown: applicationDescription.optional(),
    implicationMarkdown: optionalText,
    status: z.enum(applicationStatuses).default("proposed"),
    ownerUserId: optionalUuid,
    projectTag: z
      .union([z.string().trim().max(160), z.literal(""), z.null()])
      .optional()
      .transform((value) => (value ? value : null)),
    externalUrl: externalUrlSchema.optional().default(""),
  })
  .superRefine((input, context) => {
    if (!input.description && !input.descriptionMarkdown) {
      context.addIssue({
        code: "custom",
        path: ["description"],
        message: "Description is required",
      });
    }
  })
  .transform((input) => {
    const description = input.description ?? input.descriptionMarkdown ?? "";
    return {
      ...input,
      description,
      descriptionMarkdown: input.descriptionMarkdown ?? description,
    };
  });

export const applicationUpdateSchema = z.intersection(
  applicationInputSchema,
  z.object({
    applicationId: z.uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }).optional(),
  }),
);

export const conceptApplicationLinkSchema = z.object({
  conceptId: z.uuid(),
  applicationId: z.uuid(),
  relevanceNote: z.string().trim().min(3).max(2_000),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
export type ConceptApplicationLinkInput = z.infer<
  typeof conceptApplicationLinkSchema
>;
