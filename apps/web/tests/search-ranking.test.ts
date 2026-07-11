import { describe, expect, it } from "vitest";

import {
  ATLAS_EMBEDDING_DIMENSIONS,
  conceptEmbeddingText,
  vectorToLiteral,
} from "@/lib/search/embeddings";
import { reciprocalRankFuse } from "@/lib/search/rrf";

describe("hybrid search ranking", () => {
  it("uses reciprocal rank fusion so cross-channel matches rank first", () => {
    const results = reciprocalRankFuse([
      [
        { id: "lexical-only", rank: 1 },
        { id: "both", rank: 2 },
      ],
      [
        { id: "semantic-only", rank: 1 },
        { id: "both", rank: 2 },
      ],
    ]);
    expect(results[0]?.id).toBe("both");
    expect(results[0]?.contributingLists).toEqual([0, 1]);
  });

  it("serializes only migration-compatible finite vectors", () => {
    const vector = Array.from<number>({
      length: ATLAS_EMBEDDING_DIMENSIONS,
    }).fill(0);
    expect(vectorToLiteral(vector)).toMatch(/^\[0,0,/);
    expect(() => vectorToLiteral([1, 2])).toThrow(/1536/);
  });

  it("builds concept embedding input from canonical and alias text", () => {
    expect(
      conceptEmbeddingText({
        canonicalName: "Idempotency",
        conciseDefinition: "Repeated application preserves the effect.",
        synthesisMarkdown: "Useful for retry safety.",
        whyItExistsMarkdown: null,
        mechanismMarkdown: null,
        examplesMarkdown: null,
        counterexamplesMarkdown: null,
        failureModesMarkdown: null,
        commonConfusionsMarkdown: null,
        aliases: [{ value: "Retry safety" }],
      }),
    ).toContain("Retry safety");
  });
});
