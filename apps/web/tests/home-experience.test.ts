import { describe, expect, it } from "vitest";

import { recommendedAction, startingPointFrom } from "@/lib/experience/home";

describe("workspace Home experience", () => {
  it("uses an explicit evidence starting point before other recommendations", () => {
    expect(
      recommendedAction({
        startingPoint: "evidence",
        hasSources: true,
        hasCompletedSources: true,
        nextPath: null,
      }).href,
    ).toBe("/sources/new");
  });

  it("guides a learner to their next ready path", () => {
    const action = recommendedAction({
      startingPoint: "learn",
      hasSources: true,
      hasCompletedSources: false,
      nextPath: {
        slug: "platform-foundations",
        title: "Platform foundations",
        conceptName: "Idempotency",
      },
    });
    expect(action.href).toBe("/paths/platform-foundations");
    expect(action.title).toContain("Idempotency");
  });

  it("does not send a workspace with no sources to Ask Atlas", () => {
    expect(
      recommendedAction({
        startingPoint: null,
        hasSources: false,
        hasCompletedSources: false,
        nextPath: null,
      }).href,
    ).toBe("/sources/new");
  });

  it("accepts only supported onboarding starting points", () => {
    expect(startingPointFrom("learn")).toBe("learn");
    expect(startingPointFrom("anything-else")).toBeNull();
  });
});
