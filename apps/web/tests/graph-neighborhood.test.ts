import { describe, expect, it } from "vitest";

import {
  filterConceptNeighborhood,
  type ConceptNeighborhood,
} from "@/lib/atlas/neighborhood";
import { layoutNeighborhood } from "@/lib/graph/layout";

const dataset: ConceptNeighborhood = {
  selectedConceptId: "44000000-0000-0000-0000-000000000001",
  nodes: [
    {
      id: "44000000-0000-0000-0000-000000000001",
      slug: "feedback",
      label: "Feedback",
      status: "reviewed",
      domainId: "34000000-0000-0000-0000-000000000001",
      depth: 0,
    },
    {
      id: "44000000-0000-0000-0000-000000000002",
      slug: "observation",
      label: "Observation",
      status: "reviewed",
      domainId: "34000000-0000-0000-0000-000000000001",
      depth: 1,
    },
    {
      id: "44000000-0000-0000-0000-000000000003",
      slug: "verification",
      label: "Verification",
      status: "draft",
      domainId: "34000000-0000-0000-0000-000000000001",
      depth: 2,
    },
  ],
  edges: [
    {
      id: "64000000-0000-0000-0000-000000000001",
      source: "44000000-0000-0000-0000-000000000002",
      target: "44000000-0000-0000-0000-000000000001",
      relationKey: "enables",
      label: "enables",
      category: "explanatory",
      description: null,
      reviewStatus: "reviewed",
    },
    {
      id: "64000000-0000-0000-0000-000000000002",
      source: "44000000-0000-0000-0000-000000000001",
      target: "44000000-0000-0000-0000-000000000003",
      relationKey: "verified_by",
      label: "verified by",
      category: "epistemic",
      description: "Outcome evidence",
      reviewStatus: "draft",
    },
  ],
  truncated: false,
};

describe("bounded concept graph", () => {
  it("enforces the node cap deterministically", () => {
    const result = filterConceptNeighborhood(dataset, {
      depth: 2,
      nodeCap: 2,
    });
    expect(result.nodes.map((node) => node.label)).toEqual([
      "Feedback",
      "Observation",
    ]);
    expect(result.truncated).toBe(true);
    expect(result.edges).toHaveLength(1);
  });

  it("applies relation filters before expanding", () => {
    const result = filterConceptNeighborhood(dataset, {
      depth: 2,
      relationKeys: ["verified_by"],
    });
    expect(result.nodes.map((node) => node.label)).toEqual([
      "Feedback",
      "Verification",
    ]);
    expect(result.edges[0]?.relationKey).toBe("verified_by");
  });

  it("produces stable ELK positions for the same bounded graph", async () => {
    const first = await layoutNeighborhood(dataset);
    const second = await layoutNeighborhood(dataset);
    expect(second).toEqual(first);
    expect(
      new Set(
        first.nodes.map((node) => `${node.position.x}:${node.position.y}`),
      ).size,
    ).toBe(3);
  });
});
