import { describe, expect, it } from "vitest";

import {
  createConceptInputSchema,
  relationInputSchema,
} from "@/lib/atlas/contracts";

const conceptInput = () => ({
  slug: "system-boundary",
  canonicalName: "System boundary",
  conciseDefinition:
    "A chosen separation between a system and its environment.",
  synthesisMarkdown: "# System boundary",
  canonicalDomainId: "31000000-0000-4000-8000-000000000001",
  canonicalParentId: "",
  conceptKind: "concept",
  contentStatus: "draft",
  priority: "now",
  targetMastery: "2",
  replacementConceptId: "",
  aliases: [] as Array<{
    value: string;
    type: "synonym";
    languageCode: string;
    disambiguationKey: string | null;
  }>,
  changeSummary: "Created the canonical draft",
});

describe("Milestone 2 authoring contracts", () => {
  it("normalizes optional concept fields", () => {
    expect(createConceptInputSchema.parse(conceptInput())).toMatchObject({
      canonicalParentId: null,
      replacementConceptId: null,
      targetMastery: 2,
    });
  });

  it("rejects duplicate normalized aliases before database work", () => {
    const input = conceptInput();
    input.aliases = [
      {
        value: "Closed Loop",
        type: "synonym",
        languageCode: "en",
        disambiguationKey: null,
      },
      {
        value: " closed   loop ",
        type: "synonym",
        languageCode: "en",
        disambiguationKey: null,
      },
    ];
    expect(() => createConceptInputSchema.parse(input)).toThrow(
      /Duplicate alias/,
    );
  });

  it("rejects a relation with identical endpoints", () => {
    expect(() =>
      relationInputSchema.parse({
        sourceConceptId: "41000000-0000-4000-8000-000000000001",
        targetConceptId: "41000000-0000-4000-8000-000000000001",
        relationTypeId: "51000000-0000-4000-8000-000000000001",
        description: "",
        reviewStatus: "draft",
      }),
    ).toThrow(/different concepts/);
  });
});
