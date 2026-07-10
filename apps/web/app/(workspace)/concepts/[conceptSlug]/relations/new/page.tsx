import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState, PageHeader } from "@loura/ui";

import {
  RelationEditor,
  type RelationEditorValue,
} from "@/components/editor/relation-editor";
import { getAuthoringOptions, getConceptView } from "@/lib/atlas/queries";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function NewRelationPage({
  params,
}: {
  params: Promise<{ conceptSlug: string }>;
}) {
  const [{ conceptSlug }, { membership }] = await Promise.all([
    params,
    requireWorkspaceMembership(),
  ]);
  if (membership.role === "viewer")
    redirect(`/concepts/${conceptSlug}?tab=relationships`);
  const [view, options] = await Promise.all([
    getConceptView(membership.workspaceId, conceptSlug),
    getAuthoringOptions(membership.workspaceId),
  ]);
  if (!view) notFound();
  if (options.concepts.length < 2) {
    return (
      <EmptyState
        title="Create another concept first"
        action={
          <Link
            className="ui-button ui-button--primary"
            href={`/concepts/new?domain=${view.domain.slug}`}
          >
            Create concept
          </Link>
        }
      >
        <p>A relationship requires two canonical endpoints.</p>
      </EmptyState>
    );
  }
  const initialValue: RelationEditorValue = {
    id: null,
    updatedAt: null,
    sourceConceptId: view.concept.id,
    relationTypeId:
      options.relationTypes.find(
        (relationType) => relationType.key === "related_to",
      )?.id ??
      options.relationTypes[0]?.id ??
      "",
    targetConceptId: "",
    description: "",
    reviewStatus: "draft",
  };
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/concepts/${view.concept.slug}?tab=relationships`}>
          {view.concept.canonical_name}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">New relationship</span>
      </nav>
      <PageHeader
        eyebrow="Curate · Typed graph"
        title="Add a relationship"
        description={
          <p>
            One stored edge exposes forward or inverse language depending on
            reading direction.
          </p>
        }
      />
      <RelationEditor
        mode="create"
        initialValue={initialValue}
        originSlug={view.concept.slug}
        concepts={options.concepts}
        relationTypes={options.relationTypes}
        canReview={membership.role === "owner"}
      />
    </>
  );
}
