// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GraphRelationList } from "@/components/graph/graph-relation-list";
import type { ConceptNeighborhood } from "@/lib/atlas/neighborhood";

const neighborhood: ConceptNeighborhood = {
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
  ],
  edges: [
    {
      id: "64000000-0000-0000-0000-000000000001",
      source: "44000000-0000-0000-0000-000000000002",
      target: "44000000-0000-0000-0000-000000000001",
      relationKey: "enables",
      label: "enables",
      category: "explanatory",
      description: "Provides observed state",
      reviewStatus: "reviewed",
    },
  ],
  truncated: false,
};

describe("GraphRelationList", () => {
  it("contains exactly the relationship data represented by the graph", () => {
    render(<GraphRelationList neighborhood={neighborhood} />);
    const table = screen.getByRole("table", {
      name: /1 visible relationships represented/i,
    });
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(within(table).getAllByText("enables")).toHaveLength(2);
    expect(within(table).getByText("Provides observed state")).toBeVisible();
    expect(
      within(table).getByRole("link", { name: "Observation" }),
    ).toHaveAttribute("href", "/concepts/observation");
  });
});
