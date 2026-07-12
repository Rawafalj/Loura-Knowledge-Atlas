"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";

import {
  filterConceptNeighborhood,
  type ConceptNeighborhood,
} from "@/lib/atlas/neighborhood";
import {
  layoutNeighborhood,
  type PositionedNeighborhood,
} from "@/lib/graph/layout";

import { GraphRelationList } from "./graph-relation-list";

const categoryColor: Record<string, string> = {
  hierarchy: "#66736d",
  learning: "#315f55",
  explanatory: "#47658a",
  contrast: "#8a5a44",
  operational: "#6e5b84",
  application: "#7a6940",
  epistemic: "#526b73",
};

export function ConceptGraph({ dataset }: { dataset: ConceptNeighborhood }) {
  const [depth, setDepth] = useState<1 | 2>(1);
  const relationKeys = useMemo(
    () => [...new Set(dataset.edges.map((edge) => edge.relationKey))].sort(),
    [dataset.edges],
  );
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(relationKeys));
  const [positioned, setPositioned] = useState<PositionedNeighborhood | null>(
    null,
  );
  const [layoutFailed, setLayoutFailed] = useState(false);
  const router = useRouter();
  const neighborhood = useMemo(
    () =>
      filterConceptNeighborhood(dataset, {
        depth,
        relationKeys: [...enabledKeys],
      }),
    [dataset, depth, enabledKeys],
  );

  useEffect(() => {
    let active = true;
    void layoutNeighborhood(neighborhood)
      .then((result) => {
        if (!active) return;
        setPositioned(result);
        setLayoutFailed(false);
      })
      .catch(() => {
        if (!active) return;
        setPositioned(null);
        setLayoutFailed(true);
      });
    return () => {
      active = false;
    };
  }, [neighborhood]);

  const nodes: Node[] = (positioned?.nodes ?? []).map((node) => ({
    id: node.id,
    position: node.position,
    data: { label: node.label },
    ariaLabel: `${node.label}, ${node.status} concept`,
    className:
      node.id === dataset.selectedConceptId
        ? "atlas-graph-node atlas-graph-node--selected"
        : `atlas-graph-node atlas-graph-node--${node.status}`,
    style: { width: 210, minHeight: 72 },
  }));
  const edges: Edge[] = (positioned?.edges ?? []).map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    markerEnd: { type: MarkerType.ArrowClosed },
    className: `atlas-graph-edge atlas-graph-edge--${edge.category}`,
    style: {
      stroke: categoryColor[edge.category] ?? "#66736d",
      strokeDasharray:
        edge.category === "contrast" || edge.relationKey === "related_to"
          ? "6 5"
          : undefined,
    },
    labelStyle: { fill: "#3f4743", fontSize: 11, fontWeight: 650 },
  }));

  return (
    <div className="graph-explorer">
      <div className="graph-toolbar" aria-label="Graph controls">
        <label>
          <span>Expansion depth</span>
          <select
            value={depth}
            onChange={(event) => setDepth(event.target.value === "2" ? 2 : 1)}
          >
            <option value="1">One hop</option>
            <option value="2">Two hops</option>
          </select>
        </label>
        <fieldset>
          <legend>Relationship types</legend>
          <div className="graph-filter-list">
            {relationKeys.map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={enabledKeys.has(key)}
                  onChange={(event) => {
                    setEnabledKeys((current) => {
                      const next = new Set(current);
                      if (event.target.checked) next.add(key);
                      else next.delete(key);
                      return next;
                    });
                  }}
                />
                <span>{key.replaceAll("_", " ")}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {layoutFailed ? (
        <div className="graph-fallback" role="status">
          <strong>The graph layout could not be displayed.</strong>
          <p>The equivalent relationship list remains available below.</p>
        </div>
      ) : positioned ? (
        <div className="graph-canvas" aria-label="Local concept graph">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.35}
            maxZoom={1.6}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            onNodeDoubleClick={(_event, node) => {
              const concept = neighborhood.nodes.find(
                (candidate) => candidate.id === node.id,
              );
              if (concept) router.push(`/concepts/${concept.slug}`);
            }}
          >
            <Background color="#d9d8d0" gap={24} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      ) : (
        <div className="graph-loading" role="status">
          Laying out the bounded neighborhood…
        </div>
      )}

      <div className="graph-summary" aria-live="polite">
        <span>
          {neighborhood.nodes.length} nodes · {neighborhood.edges.length} edges
        </span>
        {neighborhood.truncated ? (
          <strong>
            Node cap reached. Narrow relationship types before expanding.
          </strong>
        ) : null}
      </div>
      <details className="graph-list-fallback" open={layoutFailed}>
        <summary>Open the graph as an accessible relationship list</summary>
        <GraphRelationList neighborhood={neighborhood} />
      </details>
    </div>
  );
}
