import { z } from "zod";

import type { ConceptView } from "./queries";

const graphStatusSchema = z.enum(["draft", "reviewed", "deprecated"]);
const graphCategorySchema = z.enum([
  "hierarchy",
  "learning",
  "explanatory",
  "contrast",
  "operational",
  "application",
  "epistemic",
]);

export const conceptNeighborhoodSchema = z.object({
  selectedConceptId: z.uuid(),
  nodes: z.array(
    z.object({
      id: z.uuid(),
      slug: z.string(),
      label: z.string(),
      status: graphStatusSchema,
      domainId: z.uuid(),
      depth: z.number().int().min(0).max(2),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.uuid(),
      target: z.uuid(),
      relationKey: z.string(),
      label: z.string(),
      category: graphCategorySchema,
      description: z.string().nullable(),
      reviewStatus: graphStatusSchema,
    }),
  ),
  truncated: z.boolean(),
});

export type ConceptNeighborhood = z.infer<typeof conceptNeighborhoodSchema>;
export type ConceptGraphNode = ConceptNeighborhood["nodes"][number];
export type ConceptGraphEdge = ConceptNeighborhood["edges"][number];

const capSchema = z.coerce.number().int().min(2).max(500).catch(100);

export function configuredGraphNodeCap(
  value: string | number | undefined = process.env.GRAPH_VISIBLE_NODE_CAP,
): number {
  return capSchema.parse(value ?? 100);
}

export function filterConceptNeighborhood(
  dataset: ConceptNeighborhood,
  options: { depth: 1 | 2; relationKeys?: readonly string[]; nodeCap?: number },
): ConceptNeighborhood {
  const nodeCap = capSchema.parse(
    options.nodeCap ?? (dataset.nodes.length || 2),
  );
  const allowedKeys = options.relationKeys
    ? new Set(options.relationKeys)
    : null;
  const nodeById = new Map(dataset.nodes.map((node) => [node.id, node]));
  const selected = nodeById.get(dataset.selectedConceptId);
  if (!selected) return { ...dataset, nodes: [], edges: [] };
  const candidateEdges = dataset.edges.filter(
    (edge) => !allowedKeys || allowedKeys.has(edge.relationKey),
  );
  const adjacency = new Map<
    string,
    Array<{ nodeId: string; edge: ConceptGraphEdge }>
  >();
  for (const edge of candidateEdges) {
    adjacency.set(edge.source, [
      ...(adjacency.get(edge.source) ?? []),
      { nodeId: edge.target, edge },
    ]);
    adjacency.set(edge.target, [
      ...(adjacency.get(edge.target) ?? []),
      { nodeId: edge.source, edge },
    ]);
  }

  const depthById = new Map([[selected.id, 0]]);
  const queue = [selected.id];
  let capReached = false;
  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId) break;
    const currentDepth = depthById.get(currentId) ?? 0;
    if (currentDepth >= options.depth) continue;
    const neighbors = [...(adjacency.get(currentId) ?? [])].sort(
      (left, right) => {
        const leftLabel = nodeById.get(left.nodeId)?.label ?? left.nodeId;
        const rightLabel = nodeById.get(right.nodeId)?.label ?? right.nodeId;
        return (
          leftLabel.localeCompare(rightLabel) ||
          left.nodeId.localeCompare(right.nodeId)
        );
      },
    );
    for (const neighbor of neighbors) {
      if (depthById.has(neighbor.nodeId) || !nodeById.has(neighbor.nodeId))
        continue;
      if (depthById.size >= nodeCap) {
        capReached = true;
        continue;
      }
      depthById.set(neighbor.nodeId, currentDepth + 1);
      queue.push(neighbor.nodeId);
    }
  }

  const nodes = [...depthById.entries()]
    .map(([id, depth]) => ({ ...nodeById.get(id)!, depth }))
    .sort(
      (left, right) =>
        left.depth - right.depth ||
        left.label.localeCompare(right.label) ||
        left.id.localeCompare(right.id),
    );
  const visibleIds = new Set(nodes.map((node) => node.id));
  const edges = candidateEdges.filter(
    (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
  );
  return {
    selectedConceptId: dataset.selectedConceptId,
    nodes,
    edges,
    truncated: dataset.truncated || capReached,
  };
}

export function buildConceptNeighborhood(
  view: Pick<ConceptView, "concept" | "relations">,
  configuredCap?: string | number,
): ConceptNeighborhood {
  const nodes: ConceptGraphNode[] = [
    {
      id: view.concept.id,
      slug: view.concept.slug,
      label: view.concept.canonical_name,
      status: view.concept.content_status,
      domainId: view.concept.canonical_domain_id,
      depth: 0,
    },
    ...view.relations.map((relation) => ({
      id: relation.otherConcept.id,
      slug: relation.otherConcept.slug,
      label: relation.otherConcept.canonical_name,
      status: relation.otherConcept.content_status,
      domainId: relation.otherConcept.canonical_domain_id,
      depth: 1,
    })),
  ];
  const uniqueNodes = [
    ...new Map(nodes.map((node) => [node.id, node])).values(),
  ];
  const dataset: ConceptNeighborhood = {
    selectedConceptId: view.concept.id,
    nodes: uniqueNodes,
    edges: view.relations.map((relation) => ({
      id: relation.id,
      source: relation.sourceConceptId,
      target: relation.targetConceptId,
      relationKey: relation.relationKey,
      label: relation.label,
      category: relation.category,
      description: relation.description,
      reviewStatus: relation.reviewStatus,
    })),
    truncated: false,
  };
  return filterConceptNeighborhood(dataset, {
    depth: 1,
    nodeCap: configuredGraphNodeCap(configuredCap),
  });
}
