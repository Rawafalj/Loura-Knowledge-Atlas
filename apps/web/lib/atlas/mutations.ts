import { z } from "zod";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  conceptEmbeddingText,
  getEmbeddingProfile,
  vectorToLiteral,
} from "@/lib/search/embeddings";

import type {
  CreateConceptInput,
  RelationInput,
  UpdateConceptInput,
  UpdateRelationInput,
} from "./contracts";

const jsonSchema = z.json();
const conceptMutationResultSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  revisionId: z.uuid(),
  contentStatus: z.enum(["draft", "reviewed", "deprecated"]),
});
const relationMutationResultSchema = z.object({
  id: z.uuid(),
  sourceConceptId: z.uuid(),
  targetConceptId: z.uuid(),
  reviewStatus: z.enum(["draft", "reviewed", "deprecated"]),
});

function asJson(value: unknown): Json {
  return jsonSchema.parse(value) as Json;
}

export class AtlasMutationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AtlasMutationError";
  }
}

function messageForDatabaseCode(code: string): string {
  if (code === "40001")
    return "This record changed after you opened it. Reload before saving again.";
  if (code === "23505")
    return "That slug, alias, or relation already exists in this workspace.";
  if (code === "23514")
    return "The change violates a hierarchy or relationship rule.";
  if (code === "23503")
    return "A selected domain, concept, or relation type is no longer available.";
  if (code === "42501")
    return "Your workspace role does not allow this change.";
  return "The atlas change could not be saved.";
}

async function refreshConceptEmbedding(
  workspaceId: string,
  conceptId: string,
  input: CreateConceptInput | UpdateConceptInput,
): Promise<boolean> {
  try {
    const profile = getEmbeddingProfile();
    const [embedding] = await profile.client.embed([
      conceptEmbeddingText(input),
    ]);
    if (!embedding) return false;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("set_concept_embedding", {
      p_workspace_id: workspaceId,
      p_concept_id: conceptId,
      p_embedding: vectorToLiteral(embedding, profile.dimensions),
      p_embedding_model: profile.model,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function createConcept(
  workspaceId: string,
  input: CreateConceptInput,
) {
  const supabase = await createSupabaseServerClient();
  const { changeSummary, ...payload } = input;
  const { data, error } = await supabase.rpc("create_atlas_concept", {
    p_workspace_id: workspaceId,
    p_payload: asJson(payload),
    p_change_summary: changeSummary,
  });
  if (error)
    throw new AtlasMutationError(
      error.code,
      messageForDatabaseCode(error.code),
    );
  const result = conceptMutationResultSchema.parse(data);
  const searchIndexed = await refreshConceptEmbedding(
    workspaceId,
    result.id,
    input,
  );
  return { ...result, searchIndexed };
}

export async function updateConcept(
  workspaceId: string,
  input: UpdateConceptInput,
) {
  const { conceptId, expectedUpdatedAt, changeSummary, ...payload } = input;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("update_atlas_concept", {
    p_workspace_id: workspaceId,
    p_concept_id: conceptId,
    p_expected_updated_at: expectedUpdatedAt,
    p_payload: asJson(payload),
    p_change_summary: changeSummary,
  });
  if (error)
    throw new AtlasMutationError(
      error.code,
      messageForDatabaseCode(error.code),
    );
  const result = conceptMutationResultSchema.parse(data);
  const searchIndexed = await refreshConceptEmbedding(
    workspaceId,
    result.id,
    input,
  );
  return { ...result, searchIndexed };
}

export async function createRelation(
  workspaceId: string,
  input: RelationInput,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_atlas_relation", {
    p_workspace_id: workspaceId,
    p_source_concept_id: input.sourceConceptId,
    p_relation_type_id: input.relationTypeId,
    p_target_concept_id: input.targetConceptId,
    p_description: input.description,
    p_review_status: input.reviewStatus,
  });
  if (error)
    throw new AtlasMutationError(
      error.code,
      messageForDatabaseCode(error.code),
    );
  return relationMutationResultSchema.parse(data);
}

export async function updateRelation(
  workspaceId: string,
  input: UpdateRelationInput,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("update_atlas_relation", {
    p_workspace_id: workspaceId,
    p_relation_id: input.relationId,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_source_concept_id: input.sourceConceptId,
    p_relation_type_id: input.relationTypeId,
    p_target_concept_id: input.targetConceptId,
    p_description: input.description,
    p_review_status: input.reviewStatus,
  });
  if (error)
    throw new AtlasMutationError(
      error.code,
      messageForDatabaseCode(error.code),
    );
  return relationMutationResultSchema.parse(data);
}

export async function removeRelation(
  workspaceId: string,
  relationId: string,
  expectedUpdatedAt: string,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_atlas_relation", {
    p_workspace_id: workspaceId,
    p_relation_id: relationId,
    p_expected_updated_at: expectedUpdatedAt,
  });
  if (error)
    throw new AtlasMutationError(
      error.code,
      messageForDatabaseCode(error.code),
    );
}
