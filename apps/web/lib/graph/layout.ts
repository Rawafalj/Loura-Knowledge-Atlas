import ELK from "elkjs/lib/elk.bundled.js";

import type {
  ConceptGraphEdge,
  ConceptGraphNode,
  ConceptNeighborhood,
} from "@/lib/atlas/neighborhood";

export type PositionedConceptNode = ConceptGraphNode & {
  position: { x: number; y: number };
};

export type PositionedNeighborhood = {
  nodes: PositionedConceptNode[];
  edges: ConceptGraphEdge[];
};

const elk = new ELK();

export async function layoutNeighborhood(
  neighborhood: ConceptNeighborhood,
): Promise<PositionedNeighborhood> {
  const sortedNodes = [...neighborhood.nodes].sort(
    (left, right) =>
      left.depth - right.depth ||
      left.label.localeCompare(right.label) ||
      left.id.localeCompare(right.id),
  );
  const sortedEdges = [...neighborhood.edges].sort(
    (left, right) =>
      left.relationKey.localeCompare(right.relationKey) ||
      left.source.localeCompare(right.source) ||
      left.target.localeCompare(right.target) ||
      left.id.localeCompare(right.id),
  );
  const result = await elk.layout({
    id: "atlas-neighborhood",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.randomSeed": "7",
      "elk.spacing.nodeNode": "44",
    },
    children: sortedNodes.map((node) => ({
      id: node.id,
      width: 210,
      height: 72,
    })),
    edges: sortedEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });
  const positionById = new Map(
    (result.children ?? []).map((node) => [
      node.id,
      { x: node.x ?? 0, y: node.y ?? 0 },
    ]),
  );
  return {
    nodes: sortedNodes.map((node) => ({
      ...node,
      position: positionById.get(node.id) ?? { x: 0, y: 0 },
    })),
    edges: sortedEdges,
  };
}
