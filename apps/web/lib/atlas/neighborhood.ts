import { z } from "zod";

import type { ConceptView } from "./queries";

export type ConceptNeighborhood = {
  selectedConceptId: string;
  nodes: Array<{
    id: string;
    slug: string;
    label: string;
    status: "draft" | "reviewed" | "deprecated";
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    relationKey: string;
    label: string;
  }>;
  truncated: boolean;
};

const capSchema = z.coerce.number().int().min(2).max(500).catch(100);

export function buildConceptNeighborhood(
  view: Pick<ConceptView, "concept" | "relations">,
  configuredCap: string | number | undefined = process.env
    .GRAPH_VISIBLE_NODE_CAP,
): ConceptNeighborhood {
  const cap = capSchema.parse(configuredCap ?? 100);
  const nodes = [
    {
      id: view.concept.id,
      slug: view.concept.slug,
      label: view.concept.canonical_name,
      status: view.concept.content_status,
    },
  ];
  const seen = new Set([view.concept.id]);
  for (const relation of view.relations) {
    if (seen.has(relation.otherConcept.id) || nodes.length >= cap) continue;
    seen.add(relation.otherConcept.id);
    nodes.push({
      id: relation.otherConcept.id,
      slug: relation.otherConcept.slug,
      label: relation.otherConcept.canonical_name,
      status: relation.otherConcept.content_status,
    });
  }
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = view.relations
    .filter(
      (relation) =>
        nodeIds.has(relation.sourceConceptId) &&
        nodeIds.has(relation.targetConceptId),
    )
    .map((relation) => ({
      id: relation.id,
      source: relation.sourceConceptId,
      target: relation.targetConceptId,
      relationKey: relation.relationKey,
      label: relation.label,
    }));
  return {
    selectedConceptId: view.concept.id,
    nodes,
    edges,
    truncated: view.relations.some(
      (relation) => !nodeIds.has(relation.otherConcept.id),
    ),
  };
}
