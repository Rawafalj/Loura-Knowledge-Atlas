import { describe, expect, it } from "vitest";

import {
  applicationInputSchema,
  conceptApplicationLinkSchema,
  safeExternalUrl,
} from "@/lib/applications/contracts";

describe("Loura application bridge contracts", () => {
  it("requires a meaningful relevance note and typed application", () => {
    expect(() =>
      conceptApplicationLinkSchema.parse({
        applicationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        conceptId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        relevanceNote: "no",
      }),
    ).toThrow();
    expect(
      applicationInputSchema.parse({
        title: "Connector retry protocol",
        description: "A component decision linked to retry semantics.",
        applicationType: "component",
      }).status,
    ).toBe("proposed");
  });

  it("only permits safe external HTTP(S) URLs", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("https://example.com/design")).toBe(
      "https://example.com/design",
    );
  });

  it("normalizes the database markdown description alias", () => {
    expect(
      applicationInputSchema.parse({
        title: "Retry artifact",
        descriptionMarkdown: "A durable artifact description.",
        applicationType: "artifact",
      }),
    ).toMatchObject({
      description: "A durable artifact description.",
      descriptionMarkdown: "A durable artifact description.",
      status: "proposed",
    });
  });

  it("rejects empty descriptions and malformed link identifiers", () => {
    expect(() =>
      applicationInputSchema.parse({
        title: "Missing context",
        description: " ",
        applicationType: "risk",
      }),
    ).toThrow();
    expect(() =>
      conceptApplicationLinkSchema.parse({
        applicationId: "not-a-uuid",
        conceptId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        relevanceNote: "Useful context",
      }),
    ).toThrow();
  });
});
