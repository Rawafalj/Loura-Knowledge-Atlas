import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  calculatePathReadiness,
  findNextReadyStep,
  validatePathOrder,
  type PrerequisiteEdge,
  type ReadinessStep,
  type ReadinessWaiver,
} from "./readiness";

export type LearningPathSummary = {
  id: string;
  slug: string;
  title: string;
  purposeMarkdown: string;
  contentStatus: "draft" | "reviewed" | "deprecated";
  stepCount: number;
  completedCount: number;
  progressPercent: number;
  nextConcept: { slug: string; name: string } | null;
};

export type LearningPathView = {
  id: string;
  slug: string;
  title: string;
  purposeMarkdown: string;
  targetOutcomeMarkdown: string;
  contentStatus: "draft" | "reviewed" | "deprecated";
  steps: Array<
    ReadinessStep & {
      conceptSlug: string;
      definition: string;
      domainTitle: string;
      rationale: string | null;
      learningObjective: string | null;
      exerciseMarkdown: string | null;
      readiness: ReturnType<typeof calculatePathReadiness>[number];
    }
  >;
  validationIssues: ReturnType<typeof validatePathOrder>;
  nextReadyStepId: string | null;
  progressPercent: number;
};

type PathRow = {
  id: string;
  slug: string;
  title: string;
  purpose_markdown: string;
  target_outcome_markdown: string;
  content_status: "draft" | "reviewed" | "deprecated";
};

type StepRow = {
  id: string;
  learning_path_id: string;
  concept_id: string;
  step_order: number;
  branch_key: string;
  mandatory: boolean;
  rationale: string | null;
  learning_objective: string | null;
  target_mastery: number;
  required_prior_mastery: number;
  exercise_markdown: string | null;
  concepts: {
    slug: string;
    canonical_name: string;
    concise_definition: string;
    domains: { title: string };
  };
};

async function loadPathData(workspaceId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const [pathsResult, stepsResult, masteryResult, waiversResult, typeResult] =
    await Promise.all([
      supabase
        .from("learning_paths")
        .select(
          "id, slug, title, purpose_markdown, target_outcome_markdown, content_status",
        )
        .eq("workspace_id", workspaceId)
        .neq("content_status", "deprecated")
        .order("title"),
      supabase
        .from("learning_path_steps")
        .select(
          "id, learning_path_id, concept_id, step_order, branch_key, mandatory, rationale, learning_objective, target_mastery, required_prior_mastery, exercise_markdown, concepts!inner(slug, canonical_name, concise_definition, domains!inner(title))",
        )
        .eq("workspace_id", workspaceId)
        .order("step_order"),
      supabase
        .from("user_mastery")
        .select("concept_id, current_level")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId),
      supabase
        .from("learning_prerequisite_waivers")
        .select(
          "learning_path_id, target_concept_id, prerequisite_concept_id, reason",
        )
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId),
      supabase
        .from("relation_types")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("key", "prerequisite_for")
        .maybeSingle(),
    ]);
  for (const result of [
    pathsResult,
    stepsResult,
    masteryResult,
    waiversResult,
    typeResult,
  ]) {
    if (result.error)
      throw new Error(`Unable to load learning data: ${result.error.code}`);
  }

  const relationResult = typeResult.data
    ? await supabase
        .from("concept_relations")
        .select("source_concept_id, target_concept_id")
        .eq("workspace_id", workspaceId)
        .eq("relation_type_id", typeResult.data.id)
        .is("deleted_at", null)
        .neq("review_status", "deprecated")
    : { data: [], error: null };
  if (relationResult.error) {
    throw new Error(
      `Unable to load learning prerequisites: ${relationResult.error.code}`,
    );
  }
  return {
    paths: pathsResult.data as PathRow[],
    steps: stepsResult.data as unknown as StepRow[],
    masteryByConcept: new Map(
      (masteryResult.data ?? []).map((row) => [
        row.concept_id,
        row.current_level,
      ]),
    ),
    waivers: waiversResult.data ?? [],
    prerequisites: relationResult.data.map((relation) => ({
      prerequisiteConceptId: relation.source_concept_id,
      targetConceptId: relation.target_concept_id,
    })) satisfies PrerequisiteEdge[],
  };
}

function buildPathView(
  path: PathRow,
  rows: StepRow[],
  masteryByConcept: ReadonlyMap<string, number>,
  prerequisites: PrerequisiteEdge[],
  waivers: Array<{
    learning_path_id: string;
    target_concept_id: string;
    prerequisite_concept_id: string;
    reason: string;
  }>,
): LearningPathView {
  const readinessSteps: ReadinessStep[] = rows.map((row) => ({
    id: row.id,
    conceptId: row.concept_id,
    conceptName: row.concepts.canonical_name,
    stepOrder: row.step_order,
    branchKey: row.branch_key,
    mandatory: row.mandatory,
    targetMastery: row.target_mastery,
    requiredPriorMastery: row.required_prior_mastery,
  }));
  const pathWaivers: ReadinessWaiver[] = waivers
    .filter((waiver) => waiver.learning_path_id === path.id)
    .map((waiver) => ({
      prerequisiteConceptId: waiver.prerequisite_concept_id,
      targetConceptId: waiver.target_concept_id,
      reason: waiver.reason,
    }));
  const readiness = calculatePathReadiness(
    readinessSteps,
    prerequisites,
    masteryByConcept,
    pathWaivers,
  );
  const readinessByStep = new Map(readiness.map((item) => [item.stepId, item]));
  const completed = readiness.filter((item) => item.complete).length;
  return {
    id: path.id,
    slug: path.slug,
    title: path.title,
    purposeMarkdown: path.purpose_markdown,
    targetOutcomeMarkdown: path.target_outcome_markdown,
    contentStatus: path.content_status,
    steps: rows.map((row) => ({
      ...readinessSteps.find((step) => step.id === row.id)!,
      conceptSlug: row.concepts.slug,
      definition: row.concepts.concise_definition,
      domainTitle: row.concepts.domains.title,
      rationale: row.rationale,
      learningObjective: row.learning_objective,
      exerciseMarkdown: row.exercise_markdown,
      readiness: readinessByStep.get(row.id)!,
    })),
    validationIssues: validatePathOrder(readinessSteps, prerequisites),
    nextReadyStepId: findNextReadyStep(readiness)?.stepId ?? null,
    progressPercent: rows.length
      ? Math.round((completed / rows.length) * 100)
      : 0,
  };
}

export async function listLearningPaths(
  workspaceId: string,
  userId: string,
): Promise<LearningPathSummary[]> {
  const data = await loadPathData(workspaceId, userId);
  return data.paths.map((path) => {
    const view = buildPathView(
      path,
      data.steps.filter((step) => step.learning_path_id === path.id),
      data.masteryByConcept,
      data.prerequisites,
      data.waivers,
    );
    const next = view.steps.find((step) => step.id === view.nextReadyStepId);
    return {
      id: path.id,
      slug: path.slug,
      title: path.title,
      purposeMarkdown: path.purpose_markdown,
      contentStatus: path.content_status,
      stepCount: view.steps.length,
      completedCount: view.steps.filter((step) => step.readiness.complete)
        .length,
      progressPercent: view.progressPercent,
      nextConcept: next
        ? { slug: next.conceptSlug, name: next.conceptName }
        : null,
    };
  });
}

export async function getLearningPath(
  workspaceId: string,
  userId: string,
  slug: string,
): Promise<LearningPathView | null> {
  const data = await loadPathData(workspaceId, userId);
  const path = data.paths.find((candidate) => candidate.slug === slug);
  if (!path) return null;
  return buildPathView(
    path,
    data.steps.filter((step) => step.learning_path_id === path.id),
    data.masteryByConcept,
    data.prerequisites,
    data.waivers,
  );
}

export async function getMasteryView(workspaceId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const [conceptsResult, masteryResult, evidenceResult, stepsResult] =
    await Promise.all([
      supabase
        .from("concepts")
        .select(
          "id, slug, canonical_name, target_mastery, canonical_domain_id, domains!inner(title)",
        )
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .neq("content_status", "deprecated")
        .order("canonical_name"),
      supabase
        .from("user_mastery")
        .select(
          "concept_id, current_level, target_level, status, last_evidence_id, updated_at",
        )
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId),
      supabase
        .from("mastery_evidence")
        .select("id, concept_id, evidence_type, note, artifact_url, created_at")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("learning_path_steps")
        .select("concept_id, learning_paths!inner(slug, title)")
        .eq("workspace_id", workspaceId),
    ]);
  for (const result of [
    conceptsResult,
    masteryResult,
    evidenceResult,
    stepsResult,
  ]) {
    if (result.error)
      throw new Error(`Unable to load mastery view: ${result.error.code}`);
  }
  const mastery = new Map(
    (masteryResult.data ?? []).map((row) => [row.concept_id, row]),
  );
  const evidence = new Map(
    (evidenceResult.data ?? []).map((row) => [row.concept_id, row]),
  );
  const pathsByConcept = new Map<
    string,
    Array<{ slug: string; title: string }>
  >();
  for (const row of stepsResult.data ?? []) {
    const existing = pathsByConcept.get(row.concept_id) ?? [];
    existing.push(row.learning_paths);
    pathsByConcept.set(row.concept_id, existing);
  }
  return (conceptsResult.data ?? []).map((concept) => {
    const record = mastery.get(concept.id);
    const currentLevel = record?.current_level ?? 0;
    const targetLevel = record?.target_level ?? concept.target_mastery ?? 1;
    return {
      id: concept.id,
      slug: concept.slug,
      name: concept.canonical_name,
      domainTitle: concept.domains.title,
      currentLevel,
      targetLevel,
      gap: Math.max(0, targetLevel - currentLevel),
      status: record?.status ?? ("not_started" as const),
      lastEvidence: evidence.get(concept.id) ?? null,
      paths: pathsByConcept.get(concept.id) ?? [],
    };
  });
}

export async function getConceptMastery(
  workspaceId: string,
  userId: string,
  conceptId: string,
  defaultTarget: number | null,
) {
  const supabase = await createSupabaseServerClient();
  const [masteryResult, evidenceResult, pathsResult] = await Promise.all([
    supabase
      .from("user_mastery")
      .select("current_level, target_level, status, updated_at")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("concept_id", conceptId)
      .maybeSingle(),
    supabase
      .from("mastery_evidence")
      .select(
        "id, level_claimed, evidence_type, note, artifact_url, created_at",
      )
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("concept_id", conceptId)
      .order("created_at", { ascending: false }),
    supabase
      .from("learning_path_steps")
      .select("step_order, learning_paths!inner(slug, title, content_status)")
      .eq("workspace_id", workspaceId)
      .eq("concept_id", conceptId),
  ]);
  if (masteryResult.error || evidenceResult.error || pathsResult.error) {
    throw new Error("Unable to load concept mastery");
  }
  return {
    currentLevel: masteryResult.data?.current_level ?? 0,
    targetLevel: masteryResult.data?.target_level ?? defaultTarget ?? 1,
    status: masteryResult.data?.status ?? ("not_started" as const),
    updatedAt: masteryResult.data?.updated_at ?? null,
    evidence: evidenceResult.data,
    paths: (pathsResult.data ?? [])
      .filter((row) => row.learning_paths.content_status !== "deprecated")
      .map((row) => ({
        slug: row.learning_paths.slug,
        title: row.learning_paths.title,
        stepOrder: row.step_order,
      })),
  };
}

export async function listPathEditorConcepts(workspaceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("concepts")
    .select("slug, canonical_name, domains!inner(title)")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .neq("content_status", "deprecated")
    .order("canonical_name");
  if (error) throw new Error(`Unable to load path concepts: ${error.code}`);
  return data.map((concept) => ({
    slug: concept.slug,
    name: concept.canonical_name,
    domainTitle: concept.domains.title,
  }));
}
