import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@loura/ui";

import { PathEditor } from "@/components/learning/path-editor";
import { requireWorkspaceMembership } from "@/lib/auth/session";
import {
  getLearningPath,
  listPathEditorConcepts,
} from "@/lib/learning/service";

export default async function EditLearningPathPage({
  params,
}: {
  params: Promise<{ pathSlug: string }>;
}) {
  const { pathSlug } = await params;
  const { user, membership } = await requireWorkspaceMembership();
  if (membership.role === "viewer") redirect(`/paths/${pathSlug}`);
  const [path, concepts] = await Promise.all([
    getLearningPath(membership.workspaceId, user.id, pathSlug),
    listPathEditorConcepts(membership.workspaceId),
  ]);
  if (!path) notFound();
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/paths">Learning paths</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/paths/${path.slug}`}>{path.title}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Edit</span>
      </nav>
      <PageHeader
        eyebrow="Curate · Learning"
        title={`Edit ${path.title}`}
        description={
          <p>
            Saving replaces the ordered step set atomically and preserves
            learner mastery separately.
          </p>
        }
      />
      <PathEditor
        concepts={concepts}
        initial={{
          id: path.id,
          slug: path.slug,
          title: path.title,
          purposeMarkdown: path.purposeMarkdown,
          targetOutcomeMarkdown: path.targetOutcomeMarkdown,
          contentStatus: path.contentStatus,
          steps: path.steps.map((step) => ({
            conceptSlug: step.conceptSlug,
            stepOrder: step.stepOrder,
            branchKey: step.branchKey,
            mandatory: step.mandatory,
            rationale: step.rationale ?? "",
            learningObjective: step.learningObjective ?? "",
            targetMastery: step.targetMastery,
            requiredPriorMastery: step.requiredPriorMastery,
            exerciseMarkdown: step.exerciseMarkdown ?? "",
          })),
        }}
      />
    </>
  );
}
