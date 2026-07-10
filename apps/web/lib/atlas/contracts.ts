import { z } from "zod";

export const conceptKinds = [
  "concept",
  "theory",
  "mechanism",
  "method",
  "standard",
  "model",
  "tool",
] as const;
export const contentStatuses = ["draft", "reviewed", "deprecated"] as const;
export const contentPriorities = ["now", "next", "later", "reference"] as const;
export const aliasTypes = [
  "synonym",
  "abbreviation",
  "former_name",
  "translation",
  "common_misnomer",
] as const;

const optionalUuidSchema = z
  .union([z.uuid(), z.literal(""), z.null()])
  .transform((value) => (value ? value : null));
const optionalTextSchema = z
  .union([z.string().max(20_000), z.null()])
  .optional()
  .transform((value) => value?.trim() || null);

export const conceptAliasInputSchema = z.object({
  value: z.string().trim().min(1).max(160),
  type: z.enum(aliasTypes).default("synonym"),
  languageCode: z.string().trim().min(2).max(16).default("en"),
  disambiguationKey: optionalTextSchema,
});

const conceptFieldsSchema = z
  .object({
    canonicalName: z.string().trim().min(2).max(180),
    conciseDefinition: z.string().trim().max(1_200).default(""),
    synthesisMarkdown: z.string().max(80_000).default(""),
    whyItExistsMarkdown: optionalTextSchema,
    mechanismMarkdown: optionalTextSchema,
    examplesMarkdown: optionalTextSchema,
    counterexamplesMarkdown: optionalTextSchema,
    failureModesMarkdown: optionalTextSchema,
    commonConfusionsMarkdown: optionalTextSchema,
    canonicalDomainId: z.uuid(),
    canonicalParentId: optionalUuidSchema,
    conceptKind: z.enum(conceptKinds).default("concept"),
    contentStatus: z.enum(contentStatuses).default("draft"),
    priority: z.enum(contentPriorities).default("later"),
    targetMastery: z
      .union([z.coerce.number().int().min(0).max(5), z.literal(""), z.null()])
      .transform((value) => (value === "" ? null : value)),
    reviewNote: optionalTextSchema,
    replacementConceptId: optionalUuidSchema,
    aliases: z.array(conceptAliasInputSchema).max(50).default([]),
    changeSummary: z.string().trim().min(3).max(500),
  })
  .superRefine((input, context) => {
    const seen = new Set<string>();
    for (const [index, alias] of input.aliases.entries()) {
      const normalized = alias.value
        .normalize("NFKC")
        .trim()
        .toLocaleLowerCase("en")
        .replace(/\s+/g, " ");
      const key = `${normalized}:${alias.languageCode}:${alias.disambiguationKey ?? ""}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["aliases", index, "value"],
          message: `Duplicate alias: ${alias.value}`,
        });
      }
      seen.add(key);
    }
    if (
      input.canonicalParentId &&
      input.canonicalParentId === input.replacementConceptId
    ) {
      context.addIssue({
        code: "custom",
        path: ["replacementConceptId"],
        message: "Parent and replacement concepts must be different.",
      });
    }
  });

export const createConceptInputSchema = conceptFieldsSchema.extend({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(180),
});

export const updateConceptInputSchema = conceptFieldsSchema.extend({
  conceptId: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});

export const relationInputSchema = z
  .object({
    sourceConceptId: z.uuid(),
    relationTypeId: z.uuid(),
    targetConceptId: z.uuid(),
    description: z.string().trim().max(1_000).default(""),
    reviewStatus: z.enum(contentStatuses).default("draft"),
  })
  .refine((input) => input.sourceConceptId !== input.targetConceptId, {
    path: ["targetConceptId"],
    message: "Choose two different concepts.",
  });

export const updateRelationInputSchema = relationInputSchema.extend({
  relationId: z.uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});

export type CreateConceptInput = z.infer<typeof createConceptInputSchema>;
export type UpdateConceptInput = z.infer<typeof updateConceptInputSchema>;
export type RelationInput = z.infer<typeof relationInputSchema>;
export type UpdateRelationInput = z.infer<typeof updateRelationInputSchema>;

export function parseAliasesFormValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  try {
    return z.array(conceptAliasInputSchema).max(50).parse(JSON.parse(value));
  } catch {
    throw new Error("Aliases are invalid.");
  }
}
