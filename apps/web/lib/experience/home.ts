export type StartingPoint = "understand" | "learn" | "evidence" | "apply";

export type RecommendedAction = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  label: string;
};

export function startingPointFrom(
  value: string | undefined,
): StartingPoint | null {
  return value === "understand" ||
    value === "learn" ||
    value === "evidence" ||
    value === "apply"
    ? value
    : null;
}

export function recommendedAction({
  startingPoint,
  hasSources,
  hasCompletedSources,
  nextPath,
}: {
  startingPoint: StartingPoint | null;
  hasSources: boolean;
  hasCompletedSources: boolean;
  nextPath: { slug: string; title: string; conceptName: string } | null;
}): RecommendedAction {
  if (startingPoint === "evidence" || !hasSources) {
    return {
      eyebrow: "Start with evidence",
      title: "Add one source you want to understand",
      description:
        "A completed source gives Ask Atlas something real to cite and lets you inspect the evidence behind an answer.",
      href: "/sources/new",
      label: "Add a source",
    };
  }
  if (startingPoint === "learn" && nextPath) {
    return {
      eyebrow: "Continue learning",
      title: `Start with ${nextPath.conceptName}`,
      description: `Your next ready step is in ${nextPath.title}. The route explains what to learn and why it comes next.`,
      href: `/paths/${nextPath.slug}`,
      label: "Open learning route",
    };
  }
  if (startingPoint === "apply") {
    return {
      eyebrow: "Build decision context",
      title: "Find the knowledge behind your decision",
      description:
        "Start from the knowledge landscape, then connect relevant concepts and evidence to a concrete Loura decision.",
      href: "/atlas",
      label: "Explore knowledge",
    };
  }
  if (hasCompletedSources) {
    return {
      eyebrow: "Ask with evidence",
      title: "Ask a focused question and verify the answer",
      description:
        "Ask Atlas will answer only from reviewed concepts and completed source passages, then show the evidence it used.",
      href: "/ask",
      label: "Ask Atlas",
    };
  }
  if (nextPath) {
    return {
      eyebrow: "A clear next step",
      title: `Continue with ${nextPath.conceptName}`,
      description: `This is the next ready concept in ${nextPath.title}. You can learn from the starter atlas before adding private evidence.`,
      href: `/paths/${nextPath.slug}`,
      label: "Open learning route",
    };
  }
  return {
    eyebrow: "Understand the landscape",
    title: "Find the part of Loura you want to understand",
    description:
      "Browse the stable knowledge landscape, open a domain, and follow connected ideas at your own pace.",
    href: "/atlas",
    label: "Explore knowledge",
  };
}
