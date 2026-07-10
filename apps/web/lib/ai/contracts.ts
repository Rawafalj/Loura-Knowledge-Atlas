import type { ZodType } from "zod";

export type StructuredGenerationRequest<T> = {
  schema: ZodType<T>;
  input: string;
};

export type StructuredGenerationResult<T> = {
  data: T;
  provider: string;
  model: string;
};

export interface StructuredModelClient {
  generate<T>(
    request: StructuredGenerationRequest<T>,
  ): Promise<StructuredGenerationResult<T>>;
}

export interface EmbeddingClient {
  embed(texts: readonly string[]): Promise<number[][]>;
}
