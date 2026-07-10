import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  MockEmbeddingClient,
  MockStructuredModelClient,
} from "../lib/ai/mock-clients";

describe("deterministic AI clients", () => {
  it("validates structured fixtures", async () => {
    const client = new MockStructuredModelClient({ answer: "fixture" });
    const result = await client.generate({
      schema: z.object({ answer: z.string() }),
      input: "ignored by deterministic mock",
    });

    expect(result).toEqual({
      data: { answer: "fixture" },
      provider: "mock",
      model: "deterministic-fixture",
    });
  });

  it("returns stable normalized embeddings", async () => {
    const client = new MockEmbeddingClient(4);
    const first = await client.embed(["atlas"]);
    const second = await client.embed(["atlas"]);

    expect(first).toEqual(second);
    expect(first[0]).toHaveLength(4);
  });
});
