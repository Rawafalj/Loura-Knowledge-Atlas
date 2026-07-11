import type { EmbeddingClient } from "@/lib/ai/contracts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  searchInputSchema,
  type SearchInput,
  type SearchMatchReason,
  type SearchResponse,
} from "./contracts";
import { getEmbeddingProfile, vectorToLiteral } from "./embeddings";
import { reciprocalRankFuse } from "./rrf";

const RRF_K = 60;
const CANDIDATE_LIMIT = 30;

export async function searchAtlas(
  workspaceId: string,
  rawInput: SearchInput,
  embeddingClient?: EmbeddingClient,
): Promise<SearchResponse> {
  const input = searchInputSchema.parse(rawInput);
  const profile = getEmbeddingProfile();
  const client = embeddingClient ?? profile.client;
  const [queryEmbedding] = await client.embed([input.query]);
  if (!queryEmbedding)
    throw new Error("Embedding client returned no query vector.");

  const supabase = await createSupabaseServerClient();
  const rpcScope = {
    p_workspace_id: workspaceId,
    p_domain_ids: input.scope.domainIds.length ? input.scope.domainIds : null,
    p_content_statuses: input.scope.contentStatuses.length
      ? input.scope.contentStatuses
      : null,
    p_limit: CANDIDATE_LIMIT,
  };
  const [lexicalResult, semanticResult] = await Promise.all([
    supabase.rpc("search_concepts_lexical", {
      ...rpcScope,
      p_query: input.query,
    }),
    supabase.rpc("search_concepts_semantic", {
      ...rpcScope,
      p_query_embedding: vectorToLiteral(queryEmbedding, profile.dimensions),
    }),
  ]);
  if (lexicalResult.error) {
    throw new Error(`Lexical search failed: ${lexicalResult.error.code}`);
  }
  if (semanticResult.error) {
    throw new Error(`Semantic search failed: ${semanticResult.error.code}`);
  }

  const fused = reciprocalRankFuse(
    [
      lexicalResult.data.map((result) => ({
        id: result.id,
        rank: result.rank,
      })),
      semanticResult.data.map((result) => ({
        id: result.id,
        rank: result.rank,
      })),
    ],
    RRF_K,
  ).slice(0, input.limit);
  if (!fused.length) {
    return { query: input.query, concepts: [], sources: [] };
  }

  const ids = fused.map((result) => result.id);
  const conceptsResult = await supabase
    .from("concepts")
    .select(
      "id, slug, canonical_name, concise_definition, canonical_domain_id, content_status",
    )
    .eq("workspace_id", workspaceId)
    .in("id", ids);
  if (conceptsResult.error) {
    throw new Error(
      `Unable to load search results: ${conceptsResult.error.code}`,
    );
  }
  const domainIds = [
    ...new Set(
      conceptsResult.data.map((concept) => concept.canonical_domain_id),
    ),
  ];
  const domainsResult = await supabase
    .from("domains")
    .select("id, title")
    .eq("workspace_id", workspaceId)
    .in("id", domainIds);
  if (domainsResult.error) {
    throw new Error(
      `Unable to load search domains: ${domainsResult.error.code}`,
    );
  }

  const conceptById = new Map(
    conceptsResult.data.map((concept) => [concept.id, concept]),
  );
  const domainById = new Map(
    domainsResult.data.map((domain) => [domain.id, domain.title]),
  );
  const lexicalById = new Map(
    lexicalResult.data.map((result) => [result.id, result]),
  );
  const semanticIds = new Set(semanticResult.data.map((result) => result.id));

  const concepts = fused.flatMap((fusedResult) => {
    const concept = conceptById.get(fusedResult.id);
    if (!concept) return [];
    const lexical = lexicalById.get(concept.id);
    const matchReasons: SearchMatchReason[] = [];
    if (lexical?.title_match) matchReasons.push("title");
    if (lexical?.alias_match) matchReasons.push("alias");
    if (lexical?.text_match) matchReasons.push("lexical");
    if (semanticIds.has(concept.id)) matchReasons.push("semantic");
    return [
      {
        id: concept.id,
        type: "concept" as const,
        title: concept.canonical_name,
        subtitle: domainById.get(concept.canonical_domain_id),
        score: Number(fusedResult.score.toFixed(8)),
        matchReasons,
        matchDetail: lexical?.matched_alias
          ? `Matched alias: ${lexical.matched_alias}`
          : undefined,
        snippet: concept.concise_definition || "Definition pending.",
        route: `/concepts/${concept.slug}`,
        contentStatus: concept.content_status,
      },
    ];
  });

  return {
    query: input.query,
    concepts,
    // Source metadata and segments are introduced in Milestone 5. Keeping this
    // channel explicit avoids pretending concept synthesis is primary evidence.
    sources: [],
  };
}
