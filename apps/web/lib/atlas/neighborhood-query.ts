import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  conceptNeighborhoodSchema,
  configuredGraphNodeCap,
  type ConceptNeighborhood,
} from "./neighborhood";

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
    p_relation_keys: null,
  });
  if (error) {
    throw new Error(`Unable to load concept graph: ${error.code}`);
  }
  return conceptNeighborhoodSchema.parse(data);
}
