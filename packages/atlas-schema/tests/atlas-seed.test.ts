import { describe, expect, it } from "vitest";

import {
  atlasSeedSchema,
  defaultSeedSkeleton,
  normalizeSymmetricRelation,
} from "../src";

type TestConcept = {
  slug: string;
  canonicalName: string;
  domain: string;
  parent: string | null;
  conciseDefinition: string;
  synthesisMarkdown: string;
  aliases: Array<{ value: string }>;
};

const concept = (slug: string, parent: string | null = null): TestConcept => ({
  slug,
  canonicalName: slug,
  domain: "domain",
  parent,
  conciseDefinition: "",
  synthesisMarkdown: "",
  aliases: [],
});

const base = () => ({
  version: 1 as const,
  domains: [
    {
      slug: "domain",
      title: "Domain",
      kind: "core" as const,
      shortDescription: "A domain",
    },
  ],
  relationTypes: [
    {
      key: "prerequisite_for",
      forwardLabel: "prerequisite for",
      inverseLabel: "requires",
      category: "learning" as const,
      directed: true,
      acyclic: true,
    },
    {
      key: "related_to",
      forwardLabel: "related to",
      inverseLabel: "related to",
      category: "explanatory" as const,
      directed: false,
      symmetric: true,
    },
  ],
  concepts: [] as ReturnType<typeof concept>[],
  relations: [] as Array<{ source: string; type: string; target: string }>,
});

describe("atlas seed validation", () => {
  it("accepts the ten-area skeleton and curated first route", () => {
    expect(defaultSeedSkeleton.domains).toHaveLength(10);
    expect(defaultSeedSkeleton.relationTypes).toHaveLength(20);
    expect(defaultSeedSkeleton.concepts).toHaveLength(15);
    expect(defaultSeedSkeleton.paths[0]?.steps).toHaveLength(15);
  });

  it("rejects duplicate slugs", () => {
    const seed = base();
    seed.domains.push(seed.domains[0]!);
    expect(() => atlasSeedSchema.parse(seed)).toThrow(/Duplicate domain slug/);
  });

  it("rejects duplicate unqualified aliases", () => {
    const seed = base();
    seed.concepts = [
      { ...concept("one"), aliases: [{ value: "Shared" }] },
      { ...concept("two"), aliases: [{ value: " shared " }] },
    ];
    expect(() => atlasSeedSchema.parse(seed)).toThrow(/already assigned/);
  });

  it("rejects a canonical-parent cycle", () => {
    const seed = base();
    seed.concepts = [concept("one", "two"), concept("two", "one")];
    expect(() => atlasSeedSchema.parse(seed)).toThrow(
      /Concept hierarchy cycle/,
    );
  });

  it("rejects a prerequisite cycle", () => {
    const seed = base();
    seed.concepts = [concept("one"), concept("two")];
    seed.relations = [
      { source: "one", type: "prerequisite_for", target: "two" },
      { source: "two", type: "prerequisite_for", target: "one" },
    ];
    expect(() => atlasSeedSchema.parse(seed)).toThrow(/Acyclic relation cycle/);
  });

  it("rejects a path that places a prerequisite after its target", () => {
    const seed = base();
    seed.concepts = [concept("one"), concept("two")];
    seed.relations = [
      { source: "one", type: "prerequisite_for", target: "two" },
    ];
    expect(() =>
      atlasSeedSchema.parse({
        ...seed,
        paths: [
          {
            slug: "invalid-route",
            title: "Invalid route",
            steps: [
              { concept: "two", order: 1, targetMastery: 1 },
              { concept: "one", order: 2, targetMastery: 1 },
            ],
          },
        ],
      }),
    ).toThrow(/places prerequisite one after two/);
  });

  it("normalizes symmetric endpoints", () => {
    const seed = atlasSeedSchema.parse({
      ...base(),
      concepts: [concept("alpha"), concept("zeta")],
      relations: [{ source: "zeta", type: "related_to", target: "alpha" }],
    });
    expect(
      normalizeSymmetricRelation(seed.relations[0]!, seed.relationTypes),
    ).toMatchObject({
      source: "alpha",
      target: "zeta",
    });
  });
});
