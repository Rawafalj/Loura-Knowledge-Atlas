"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ConceptNeighborhood } from "@/lib/atlas/neighborhood";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="semantic-force-loading">Preparing map…</div>,
});

type SemanticNode = ConceptNeighborhood["nodes"][number] & {
  degree: number;
  x?: number;
  y?: number;
};

type SemanticLink = ConceptNeighborhood["edges"][number];

const categoryColor: Record<string, string> = {
  hierarchy: "#81928a",
  learning: "#3f8875",
  explanatory: "#5b83b9",
  contrast: "#bd7657",
  operational: "#896fa8",
  application: "#a98b3e",
  epistemic: "#5c8f9a",
};

function nodeColor(status: SemanticNode["status"]): string {
  if (status === "reviewed") return "#245e52";
  if (status === "deprecated") return "#9b9d98";
  return "#6d8d82";
}

function drawNode(
  rawNode: object,
  context: CanvasRenderingContext2D,
  scale: number,
) {
  const node = rawNode as SemanticNode;
  if (node.x === undefined || node.y === undefined) return;
  const radius = 5 + Math.min(node.degree, 8) * 1.2;
  context.beginPath();
  context.arc(node.x, node.y, radius, 0, 2 * Math.PI);
  context.fillStyle = nodeColor(node.status);
  context.fill();
  context.lineWidth = 1.5 / scale;
  context.strokeStyle = "#f8f8f3";
  context.stroke();

  if (scale < 0.62) return;
  const fontSize = 11 / scale;
  context.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  context.fillStyle = "#23302b";
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText(node.label, node.x, node.y + radius + 4 / scale);
}

export function SemanticForceGraph({
  dataset,
}: {
  dataset: ConceptNeighborhood;
}) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [enabledKeys, setEnabledKeys] = useState(
    () => new Set(dataset.edges.map((edge) => edge.relationKey)),
  );
  const [hoveredNode, setHoveredNode] = useState<SemanticNode | null>(null);
  const relationKeys = useMemo(
    () => [...new Set(dataset.edges.map((edge) => edge.relationKey))].sort(),
    [dataset.edges],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const links = dataset.edges.filter((edge) =>
      enabledKeys.has(edge.relationKey),
    );
    const degreeById = new Map<string, number>();
    for (const link of links) {
      degreeById.set(link.source, (degreeById.get(link.source) ?? 0) + 1);
      degreeById.set(link.target, (degreeById.get(link.target) ?? 0) + 1);
    }
    return {
      nodes: dataset.nodes.map((node) => ({
        ...node,
        degree: degreeById.get(node.id) ?? 0,
      })),
      links,
    };
  }, [dataset, enabledKeys]);

  return (
    <div className="semantic-force-graph">
      <div className="semantic-force-toolbar">
        <div>
          <p className="eyebrow">Interactive relationship view</p>
          <strong>Drag, zoom, and select an idea</strong>
        </div>
        <fieldset>
          <legend>Show relationships</legend>
          <div className="semantic-force-filters">
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
      <div
        ref={hostRef}
        className="semantic-force-canvas"
        aria-label="Interactive workspace relationship map"
      >
        {width ? (
          <ForceGraph2D
            width={width}
            height={560}
            graphData={graphData}
            backgroundColor="#fbfcf8"
            cooldownTicks={140}
            d3VelocityDecay={0.28}
            nodeId="id"
            linkSource="source"
            linkTarget="target"
            nodeCanvasObject={drawNode}
            nodeCanvasObjectMode={() => "replace"}
            linkColor={(link) =>
              categoryColor[(link as SemanticLink).category] ?? "#81928a"
            }
            linkWidth={(link) =>
              (link as SemanticLink).reviewStatus === "reviewed" ? 1.45 : 0.8
            }
            linkLineDash={(link) =>
              (link as SemanticLink).category === "contrast" ||
              (link as SemanticLink).relationKey === "related_to"
                ? [5, 4]
                : null
            }
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={0.93}
            linkDirectionalArrowColor={(link) =>
              categoryColor[(link as SemanticLink).category] ?? "#81928a"
            }
            onNodeClick={(node) => {
              router.push(`/concepts/${(node as SemanticNode).slug}`);
            }}
            onNodeHover={(node) => {
              setHoveredNode(node ? (node as SemanticNode) : null);
            }}
          />
        ) : (
          <div className="semantic-force-loading" role="status">
            Preparing map…
          </div>
        )}
      </div>
      <div className="semantic-force-inspector" aria-live="polite">
        {hoveredNode ? (
          <>
            <strong>{hoveredNode.label}</strong>
            <span>
              {hoveredNode.degree} visible connection
              {hoveredNode.degree === 1 ? "" : "s"} · {hoveredNode.status}
            </span>
          </>
        ) : (
          <span>
            Hover over an idea to inspect it. Click to open its concept.
          </span>
        )}
      </div>
    </div>
  );
}
