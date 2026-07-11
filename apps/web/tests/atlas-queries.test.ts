import { describe, expect, it } from "vitest";

import { buildConceptNeighborhood } from "@/lib/atlas/neighborhood";
import {
  buildConceptTree,
  mapRelations,
  organizeWorldDomains,
  type ConceptSummary,
} from "@/lib/atlas/queries";
import type { Tables } from "@/lib/supabase/database.types";

const now = "2026-07-10T00:00:00.000Z";

function domain(overrides: Partial<Tables<"domains">> = {}): Tables<"domains"> {
  return {
    id: "31000000-0000-0000-0000-000000000001",
    workspace_id: "21000000-0000-0000-0000-000000000001",
    slug: "systems",
    title: "Systems",
    short_description: "Systems thinking",
    scope_markdown: "",
    kind: "core",
    parent_domain_id: null,
    sort_order: 0,
    content_status: "draft",
    priority: "later",
    target_mastery: null,
    last_reviewed_at: null,
    created_by: "11000000-0000-0000-0000-000000000001",
    updated_by: "11000000-0000-0000-0000-000000000001",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...overrides,
  };
}

function concept(
  id: string,
  name: string,
  overrides: Partial<ConceptSummary> = {},
): ConceptSummary {
  return {
    id,
    slug: name.toLowerCase().replaceAll(" ", "-"),
    canonical_name: name,
    concise_definition: "",
    canonical_domain_id: "31000000-0000-0000-0000-000000000001",
    canonical_parent_id: null,
    concept_kind: "concept",
    content_status: "draft",
    priority: "later",
    ...overrides,
  };
}

const alpha = concept("41000000-0000-0000-0000-000000000001", "Alpha", {
  content_status: "reviewed",
  priority: "now",
});
const beta = concept("41000000-0000-0000-0000-000000000002", "Beta");

function relationType(): Tables<"relation_types"> {
  return {
    id: "51000000-0000-0000-0000-000000000001",
    workspace_id: "21000000-0000-0000-0000-000000000001",
    key: "prerequisite_for",
    forward_label: "prerequisite for",
    inverse_label: "requires",
    category: "learning",
    directed: true,
    symmetric: false,
    acyclic: true,
    allows_self: false,
    allowed_source_kinds: [],
    allowed_target_kinds: [],
    style: {},
    is_system: true,
    created_at: now,
    updated_at: now,
  };
}

function relation(): Tables<"concept_relations"> {
  return {
    id: "61000000-0000-0000-0000-000000000001",
    workspace_id: "21000000-0000-0000-0000-000000000001",
    source_concept_id: alpha.id,
    relation_type_id: relationType().id,
    target_concept_id: beta.id,
    description: null,
    confidence: null,
    review_status: "reviewed",
    provenance_type: "human",
    source_proposal_item_id: null,
    created_by: "11000000-0000-0000-0000-000000000001",
    reviewed_by: "11000000-0000-0000-0000-000000000001",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

describe("atlas reading transformations", () => {
  it("groups domains and calculates honest reviewed coverage", () => {
    const world = organizeWorldDomains([domain()], [alpha, beta]);
    expect(world.core[0]).toMatchObject({
      conceptCount: 2,
      reviewedCount: 1,
      reviewedCoverage: 50,
    });
    expect(world.core[0]?.keyConcepts[0]?.canonical_name).toBe("Alpha");
    expect(world.concepts.map((concept) => concept.canonical_name)).toEqual([
      "Alpha",
      "Beta",
    ]);
  });

  it("builds canonical concept hierarchy", () => {
    const tree = buildConceptTree([
      alpha,
      { ...beta, canonical_parent_id: alpha.id },
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.children[0]?.canonical_name).toBe("Beta");
  });

  it("uses the inverse relation label when reading from the target", () => {
    const mapped = mapRelations(
      beta.id,
      [relation()],
      [alpha, beta],
      [relationType()],
    );
    expect(mapped[0]).toMatchObject({
      direction: "incoming",
      label: "requires",
    });
  });

  it("caps the graph neighborhood while retaining list truth", () => {
    const gamma = concept("41000000-0000-0000-0000-000000000003", "Gamma");
    const relations = [
      ...mapRelations(alpha.id, [relation()], [alpha, beta], [relationType()]),
      ...mapRelations(
        alpha.id,
        [
          {
            ...relation(),
            id: "61000000-0000-0000-0000-000000000002",
            target_concept_id: gamma.id,
          },
        ],
        [alpha, gamma],
        [relationType()],
      ),
    ];
    const neighborhood = buildConceptNeighborhood(
      {
        concept: {
          ...alpha,
          workspace_id: "21000000-0000-0000-0000-000000000001",
          synthesis_markdown: "",
          why_it_exists_markdown: null,
          mechanism_markdown: null,
          examples_markdown: null,
          counterexamples_markdown: null,
          failure_modes_markdown: null,
          common_confusions_markdown: null,
          target_mastery: null,
          review_note: null,
          replacement_concept_id: null,
          search_document: null,
          embedding: null,
          embedding_model: null,
          embedding_updated_at: null,
          last_reviewed_at: now,
          created_by: "11000000-0000-0000-0000-000000000001",
          updated_by: "11000000-0000-0000-0000-000000000001",
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        relations,
      },
      2,
    );
    expect(neighborhood.nodes).toHaveLength(2);
    expect(neighborhood.truncated).toBe(true);
    expect(relations).toHaveLength(2);
  });
});
