import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@loura/ui";

import { PathEditor } from "@/components/learning/path-editor";
import { requireWorkspaceMembership } from "@/lib/auth/session";
import { listPathEditorConcepts } from "@/lib/learning/service";

export default async function NewLearningPathPage() {
  const { membership } = await requireWorkspaceMembership();
  if (membership.role === "viewer") redirect("/paths");
  const concepts = await listPathEditorConcepts(membership.workspaceId);
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/paths">Learning paths</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">New path</span>
      </nav>
      <PageHeader
        eyebrow="Curate · Learning"
        title="Create a learning path"
        description={
          <p>
            Build an ordered canonical route. Readiness is derived from path
            order, explicit prerequisites, mastery, and reasoned waivers.
          </p>
        }
      />
      <PathEditor
        concepts={concepts}
        initial={{
          id: null,
          slug: "",
          title: "",
          purposeMarkdown: "",
          targetOutcomeMarkdown: "",
          contentStatus: "draft",
          steps: concepts[0]
            ? [
                {
                  conceptSlug: concepts[0].slug,
                  stepOrder: 1,
                  branchKey: "main",
                  mandatory: true,
                  rationale: "",
                  learningObjective: "",
                  targetMastery: 1,
                  requiredPriorMastery: 1,
                  exerciseMarkdown: "",
                },
              ]
            : [],
        }}
      />
    </>
  );
}
