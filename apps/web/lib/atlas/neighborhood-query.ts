import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  conceptNeighborhoodSchema,
  configuredGraphNodeCap,
  type ConceptNeighborhood,
} from "./neighborhood";
import { getWorldMap } from "./queries";

export async function getConceptNeighborhood(
  workspaceId: string,
  conceptId: string,
): Promise<ConceptNeighborhood> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_concept_neighborhood", {
    p_workspace_id: workspaceId,
    p_concept_id: conceptId,
    p_depth: 2,
    p_node_cap: configuredGraphNodeCap(),
    p_relation_keys: undefined,
  });
  if (error) {
    throw new Error(`Unable to load concept graph: ${error.code}`);
  }
  return conceptNeighborhoodSchema.parse(data);
}

/** Load a bounded, workspace-wide semantic map for the primary Explore view. */
export async function getSemanticMap(workspaceId: string): Promise<ConceptNeighborhood> {
  const supabase = await createSupabaseServerClient();
  const world = await getWorldMap(workspaceId);
  const cap = configuredGraphNodeCap();
  const concepts = world.concepts
    .filter((concept) => concept.content_status !== "deprecated")
    .slice(0, cap);
  const firstConcept = concepts[0];
  if (!firstConcept) {
    return {
      selectedConceptId: "00000000-0000-0000-0000-000000000000",
      nodes: [],
      edges: [],
      truncated: false,
    };
  }

  const visibleIds = new Set(concepts.map((concept) => concept.id));
  const [relationsResult, typesResult] = await Promise.all([
    supabase
      .from("concept_relations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
    supabase.from("relation_types").select("*").eq("workspace_id", workspaceId),
  ]);
  if (relationsResult.error || typesResult.error) {
    throw new Error("Unable to load semantic map relations");
  }
  const typeById = new Map(typesResult.data.map((type) => [type.id, type]));
  const relationEdges = relationsResult.data.flatMap((relation) => {
    const type = typeById.get(relation.relation_type_id);
    if (
      !type ||
      !visibleIds.has(relation.source_concept_id) ||
      !visibleIds.has(relation.target_concept_id)
    ) {
      return [];
    }
    return [
      {
        id: relation.id,
        source: relation.source_concept_id,
        target: relation.target_concept_id,
        relationKey: type.key,
        label: type.forward_label,
        category: type.category,
        description: relation.description,
        reviewStatus: relation.review_status,
      },
    ];
  });
  const relationPairKeys = new Set(
    relationEdges.map((edge) => `${edge.source}:${edge.target}`),
  );
  const hierarchyEdges = concepts.flatMap((concept) => {
    const parentId = concept.canonical_parent_id;
    if (!parentId || !visibleIds.has(parentId)) return [];
    if (relationPairKeys.has(`${parentId}:${concept.id}`)) return [];
    return [
      {
        id: `hierarchy:${parentId}:${concept.id}`,
        source: parentId,
        target: concept.id,
        relationKey: "parent_of",
        label: "contains",
        category: "hierarchy" as const,
        description: null,
        reviewStatus: concept.content_status,
      },
    ];
  });

  return conceptNeighborhoodSchema.parse({
    selectedConceptId: firstConcept.id,
    nodes: concepts.map((concept) => ({
      id: concept.id,
      slug: concept.slug,
      label: concept.canonical_name,
      status: concept.content_status,
      domainId: concept.canonical_domain_id,
      depth: concept.canonical_parent_id ? 1 : 0,
    })),
    edges: [...relationEdges, ...hierarchyEdges],
    truncated: world.concepts.length > cap,
  });
}
