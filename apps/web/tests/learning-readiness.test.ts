import { describe, expect, it } from "vitest";

import {
  calculatePathReadiness,
  findNextReadyStep,
  validatePathOrder,
  type ReadinessStep,
} from "@/lib/learning/readiness";

const steps: ReadinessStep[] = [
  {
    id: "step-a",
    conceptId: "a",
    conceptName: "System boundary",
    stepOrder: 1,
    branchKey: "main",
    mandatory: true,
    targetMastery: 2,
    requiredPriorMastery: 1,
  },
  {
    id: "step-b",
    conceptId: "b",
    conceptName: "Desired state",
    stepOrder: 2,
    branchKey: "main",
    mandatory: true,
    targetMastery: 2,
    requiredPriorMastery: 1,
  },
];

describe("learning path readiness", () => {
  it("flags a prerequisite that appears after its dependent step", () => {
    const issues = validatePathOrder(steps, [
      { prerequisiteConceptId: "b", targetConceptId: "a" },
    ]);
    expect(issues).toEqual([
      expect.objectContaining({ kind: "ordered_after_target" }),
    ]);
  });

  it("requires mandatory prior targets before advancing", () => {
    const readiness = calculatePathReadiness(
      steps,
      [{ prerequisiteConceptId: "a", targetConceptId: "b" }],
      new Map(),
      [],
    );
    expect(readiness[0]).toMatchObject({ ready: true, complete: false });
    expect(readiness[1]).toMatchObject({ ready: false, complete: false });
    expect(findNextReadyStep(readiness)?.stepId).toBe("step-a");
  });

  it("honors mastery thresholds and reasoned external waivers", () => {
    const readiness = calculatePathReadiness(
      [steps[0]!],
      [{ prerequisiteConceptId: "external", targetConceptId: "a" }],
      new Map([["external", 0]]),
      [
        {
          prerequisiteConceptId: "external",
          targetConceptId: "a",
          reason: "Equivalent prior work was reviewed.",
        },
      ],
    );
    expect(readiness[0]).toMatchObject({
      ready: true,
      waivedPrerequisites: [
        expect.objectContaining({
          reason: expect.stringContaining("reviewed"),
        }),
      ],
    });

    const mastered = calculatePathReadiness(
      steps,
      [{ prerequisiteConceptId: "a", targetConceptId: "b" }],
      new Map([
        ["a", 2],
        ["b", 0],
      ]),
      [],
    );
    expect(mastered[1]).toMatchObject({ ready: true, complete: false });
    expect(findNextReadyStep(mastered)?.stepId).toBe("step-b");
  });
});
