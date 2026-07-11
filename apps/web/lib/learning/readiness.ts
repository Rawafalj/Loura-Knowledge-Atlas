export type ReadinessStep = {
  id: string;
  conceptId: string;
  conceptName: string;
  stepOrder: number;
  branchKey: string;
  mandatory: boolean;
  targetMastery: number;
  requiredPriorMastery: number;
};

export type PrerequisiteEdge = {
  prerequisiteConceptId: string;
  targetConceptId: string;
};

export type ReadinessWaiver = PrerequisiteEdge & { reason: string };

export type PathValidationIssue = {
  targetConceptId: string;
  prerequisiteConceptId: string;
  kind: "missing" | "ordered_after_target";
  message: string;
};

export type StepReadiness = {
  stepId: string;
  complete: boolean;
  ready: boolean;
  currentLevel: number;
  blockers: Array<{
    conceptId: string;
    conceptName: string;
    requiredLevel: number;
    currentLevel: number;
    kind: "prior_step" | "prerequisite";
  }>;
  waivedPrerequisites: ReadinessWaiver[];
};

export function validatePathOrder(
  steps: readonly ReadinessStep[],
  prerequisites: readonly PrerequisiteEdge[],
): PathValidationIssue[] {
  const mainSteps = new Map(
    steps
      .filter((step) => step.branchKey === "main")
      .map((step) => [step.conceptId, step]),
  );
  return prerequisites.flatMap((edge): PathValidationIssue[] => {
    const target = mainSteps.get(edge.targetConceptId);
    if (!target) return [];
    const prerequisite = mainSteps.get(edge.prerequisiteConceptId);
    if (!prerequisite) {
      return [
        {
          ...edge,
          kind: "missing" as const,
          message: "A prerequisite is absent from the main route.",
        },
      ];
    }
    if (prerequisite.stepOrder >= target.stepOrder) {
      return [
        {
          ...edge,
          kind: "ordered_after_target" as const,
          message: "A prerequisite appears at or after the dependent step.",
        },
      ];
    }
    return [];
  });
}

export function calculatePathReadiness(
  steps: readonly ReadinessStep[],
  prerequisites: readonly PrerequisiteEdge[],
  masteryByConcept: ReadonlyMap<string, number>,
  waivers: readonly ReadinessWaiver[],
): StepReadiness[] {
  const ordered = [...steps].sort(
    (left, right) =>
      left.stepOrder - right.stepOrder || left.id.localeCompare(right.id),
  );
  const names = new Map(
    steps.map((step) => [step.conceptId, step.conceptName]),
  );
  const waiverKeys = new Map(
    waivers.map((waiver) => [
      `${waiver.prerequisiteConceptId}:${waiver.targetConceptId}`,
      waiver,
    ]),
  );

  return ordered.map((step) => {
    const currentLevel = masteryByConcept.get(step.conceptId) ?? 0;
    const priorBlockers = ordered
      .filter(
        (prior) =>
          prior.branchKey === step.branchKey &&
          prior.mandatory &&
          prior.stepOrder < step.stepOrder,
      )
      .filter(
        (prior) =>
          (masteryByConcept.get(prior.conceptId) ?? 0) < prior.targetMastery,
      )
      .map((prior) => ({
        conceptId: prior.conceptId,
        conceptName: prior.conceptName,
        requiredLevel: prior.targetMastery,
        currentLevel: masteryByConcept.get(prior.conceptId) ?? 0,
        kind: "prior_step" as const,
      }));
    const waivedPrerequisites: ReadinessWaiver[] = [];
    const prerequisiteBlockers = prerequisites
      .filter((edge) => edge.targetConceptId === step.conceptId)
      .flatMap((edge) => {
        const waiver = waiverKeys.get(
          `${edge.prerequisiteConceptId}:${edge.targetConceptId}`,
        );
        if (waiver) {
          waivedPrerequisites.push(waiver);
          return [];
        }
        const prerequisiteLevel =
          masteryByConcept.get(edge.prerequisiteConceptId) ?? 0;
        return prerequisiteLevel < step.requiredPriorMastery
          ? [
              {
                conceptId: edge.prerequisiteConceptId,
                conceptName:
                  names.get(edge.prerequisiteConceptId) ??
                  "External prerequisite",
                requiredLevel: step.requiredPriorMastery,
                currentLevel: prerequisiteLevel,
                kind: "prerequisite" as const,
              },
            ]
          : [];
      });
    const blockers = [...priorBlockers, ...prerequisiteBlockers].filter(
      (blocker, index, all) =>
        all.findIndex(
          (candidate) => candidate.conceptId === blocker.conceptId,
        ) === index,
    );
    return {
      stepId: step.id,
      complete: currentLevel >= step.targetMastery,
      ready: blockers.length === 0,
      currentLevel,
      blockers,
      waivedPrerequisites,
    };
  });
}

export function findNextReadyStep(
  readiness: readonly StepReadiness[],
): StepReadiness | null {
  return readiness.find((step) => step.ready && !step.complete) ?? null;
}
