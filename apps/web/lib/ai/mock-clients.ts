import type {
  EmbeddingClient,
  StructuredGenerationRequest,
  StructuredGenerationResult,
  StructuredModelClient,
} from "./contracts";

export const MOCK_EMBEDDING_MODEL_ID = "mock-charcode-v1";

export class MockStructuredModelClient implements StructuredModelClient {
  public constructor(private readonly fixture: unknown) {}

  public async generate<T>(
    request: StructuredGenerationRequest<T>,
  ): Promise<StructuredGenerationResult<T>> {
    return {
      data: request.schema.parse(this.fixture),
      provider: "mock",
      model: "deterministic-fixture",
    };
  }
}

export class MockEmbeddingClient implements EmbeddingClient {
  public constructor(private readonly dimensions = 8) {}

  public async embed(texts: readonly string[]): Promise<number[][]> {
    return texts.map((text) => {
      const vector = Array.from<number>({ length: this.dimensions }).fill(0);

      for (const [index, character] of Array.from(text).entries()) {
        const position = index % this.dimensions;
        vector[position] = (vector[position] ?? 0) + character.codePointAt(0)!;
      }

      const magnitude =
        Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
      return vector.map((value) => value / magnitude);
    });
  }
}
