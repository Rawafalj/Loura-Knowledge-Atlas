// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RelationshipTable } from "@/components/relationship-table";
import type { RelationView } from "@/lib/atlas/queries";

const relation: RelationView = {
  id: "61000000-0000-0000-0000-000000000001",
  updatedAt: "2026-07-10T00:00:00.000Z",
  direction: "incoming",
  label: "requires",
  relationKey: "prerequisite_for",
  category: "learning",
  description: "Required before the selected concept",
  reviewStatus: "reviewed",
  otherConcept: {
    id: "41000000-0000-0000-0000-000000000001",
    slug: "observation",
    canonical_name: "Observation",
    concise_definition: "",
    canonical_domain_id: "31000000-0000-0000-0000-000000000001",
    canonical_parent_id: null,
    concept_kind: "concept",
    content_status: "reviewed",
    priority: "now",
  },
  sourceConceptId: "41000000-0000-0000-0000-000000000001",
  targetConceptId: "41000000-0000-0000-0000-000000000002",
  relationTypeId: "51000000-0000-0000-0000-000000000001",
};

describe("RelationshipTable", () => {
  it("exposes complete relation meaning without graph interaction", () => {
    render(
      <RelationshipTable
        relations={[relation]}
        selectedConceptSlug="feedback"
        canEdit={false}
      />,
    );
    const table = screen.getByRole("table", { name: /every local relation/i });
    expect(
      within(table).getByRole("link", { name: "Observation" }),
    ).toHaveAttribute("href", "/concepts/observation");
    expect(within(table).getByText("requires")).toBeVisible();
    expect(within(table).getByText("prerequisite_for")).toBeVisible();
    expect(
      within(table).queryByRole("link", { name: "Edit" }),
    ).not.toBeInTheDocument();
  });
});
