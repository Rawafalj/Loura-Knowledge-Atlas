import { z } from "zod";

import type { EmbeddingClient } from "@/lib/ai/contracts";
import {
  MockEmbeddingClient,
  MOCK_EMBEDDING_MODEL_ID,
} from "@/lib/ai/mock-clients";

export const ATLAS_EMBEDDING_DIMENSIONS = 1536;

const embeddingConfigSchema = z.object({
  provider: z.literal("mock").catch("mock"),
  dimensions: z.coerce
    .number()
    .int()
    .refine((value) => value === ATLAS_EMBEDDING_DIMENSIONS, {
      message:
        "EMBEDDING_DIMENSIONS must match the vector dimension in migration 0003.",
    })
    .catch(ATLAS_EMBEDDING_DIMENSIONS),
});

export type EmbeddingProfile = {
  client: EmbeddingClient;
  dimensions: number;
  model: string;
};

export function getEmbeddingProfile(): EmbeddingProfile {
  const config = embeddingConfigSchema.parse({
    provider: process.env.AI_PROVIDER,
    dimensions: process.env.EMBEDDING_DIMENSIONS,
  });
  return {
    client: new MockEmbeddingClient(config.dimensions),
    dimensions: config.dimensions,
    model: MOCK_EMBEDDING_MODEL_ID,
  };
}

export function vectorToLiteral(
  vector: readonly number[],
  dimensions = ATLAS_EMBEDDING_DIMENSIONS,
): string {
  if (
    vector.length !== dimensions ||
    vector.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(`Embedding must contain ${dimensions} finite values.`);
  }
  return `[${vector.join(",")}]`;
}

export function conceptEmbeddingText(input: {
  canonicalName: string;
  conciseDefinition: string;
  synthesisMarkdown: string;
  whyItExistsMarkdown: string | null;
  mechanismMarkdown: string | null;
  examplesMarkdown: string | null;
  counterexamplesMarkdown: string | null;
  failureModesMarkdown: string | null;
  commonConfusionsMarkdown: string | null;
  aliases: Array<{ value: string }>;
}): string {
  return [
    input.canonicalName,
    ...input.aliases.map((alias) => alias.value),
    input.conciseDefinition,
    input.synthesisMarkdown,
    input.whyItExistsMarkdown,
    input.mechanismMarkdown,
    input.examplesMarkdown,
    input.counterexamplesMarkdown,
    input.failureModesMarkdown,
    input.commonConfusionsMarkdown,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
}
