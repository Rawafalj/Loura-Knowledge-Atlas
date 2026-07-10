import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@loura/ui";

import {
  RelationEditor,
  RemoveRelationForm,
  type RelationEditorValue,
} from "@/components/editor/relation-editor";
import {
  getAuthoringOptions,
  getConceptView,
  getRelationById,
} from "@/lib/atlas/queries";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function EditRelationPage({
  params,
}: {
  params: Promise<{ conceptSlug: string; relationId: string }>;
}) {
  const [{ conceptSlug, relationId }, { membership }] = await Promise.all([
    params,
    requireWorkspaceMembership(),
  ]);
  if (membership.role === "viewer")
    redirect(`/concepts/${conceptSlug}?tab=relationships`);
  const [view, relation, options] = await Promise.all([
    getConceptView(membership.workspaceId, conceptSlug),
    getRelationById(membership.workspaceId, relationId),
    getAuthoringOptions(membership.workspaceId),
  ]);
  if (
    !view ||
    !relation ||
    (relation.source_concept_id !== view.concept.id &&
      relation.target_concept_id !== view.concept.id)
  ) {
    notFound();
  }
  const initialValue: RelationEditorValue = {
    id: relation.id,
    updatedAt: relation.updated_at,
    sourceConceptId: relation.source_concept_id,
    relationTypeId: relation.relation_type_id,
    targetConceptId: relation.target_concept_id,
    description: relation.description ?? "",
    reviewStatus: relation.review_status,
  };
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/concepts/${view.concept.slug}?tab=relationships`}>
          {view.concept.canonical_name}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Edit relationship</span>
      </nav>
      <PageHeader
        eyebrow="Curate · Typed graph"
        title="Edit relationship"
        description={
          <p>
            PostgreSQL revalidates endpoint kinds, symmetry, self rules, and
            cycles on save.
          </p>
        }
      />
      <RelationEditor
        mode="update"
        initialValue={initialValue}
        originSlug={view.concept.slug}
        concepts={options.concepts}
        relationTypes={options.relationTypes}
        canReview={membership.role === "owner"}
      />
      <RemoveRelationForm
        relationId={relation.id}
        expectedUpdatedAt={relation.updated_at}
        originSlug={view.concept.slug}
      />
    </>
  );
}
