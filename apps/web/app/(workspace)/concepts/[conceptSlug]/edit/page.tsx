import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@loura/ui";

import {
  ConceptEditor,
  type ConceptEditorValue,
} from "@/components/editor/concept-editor";
import { getAuthoringOptions, getConceptView } from "@/lib/atlas/queries";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function EditConceptPage({
  params,
}: {
  params: Promise<{ conceptSlug: string }>;
}) {
  const [{ conceptSlug }, { membership }] = await Promise.all([
    params,
    requireWorkspaceMembership(),
  ]);
  if (membership.role === "viewer") redirect(`/concepts/${conceptSlug}`);
  const [view, options] = await Promise.all([
    getConceptView(membership.workspaceId, conceptSlug),
    getAuthoringOptions(membership.workspaceId),
  ]);
  if (!view) notFound();
  const concept = view.concept;
  const initialValue: ConceptEditorValue = {
    id: concept.id,
    updatedAt: concept.updated_at,
    slug: concept.slug,
    canonicalName: concept.canonical_name,
    conciseDefinition: concept.concise_definition,
    synthesisMarkdown: concept.synthesis_markdown,
    whyItExistsMarkdown: concept.why_it_exists_markdown ?? "",
    mechanismMarkdown: concept.mechanism_markdown ?? "",
    examplesMarkdown: concept.examples_markdown ?? "",
    counterexamplesMarkdown: concept.counterexamples_markdown ?? "",
    failureModesMarkdown: concept.failure_modes_markdown ?? "",
    commonConfusionsMarkdown: concept.common_confusions_markdown ?? "",
    canonicalDomainId: concept.canonical_domain_id,
    canonicalParentId: concept.canonical_parent_id ?? "",
    conceptKind: concept.concept_kind,
    contentStatus: concept.content_status,
    priority: concept.priority,
    targetMastery: concept.target_mastery?.toString() ?? "",
    reviewNote: concept.review_note ?? "",
    replacementConceptId: concept.replacement_concept_id ?? "",
    aliases: view.aliases.map((alias) => ({
      value: alias.alias,
      type: alias.alias_type,
      languageCode: alias.language_code,
      disambiguationKey: alias.disambiguation_key,
    })),
    changeSummary: "",
  };
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/concepts/${concept.slug}`}>{concept.canonical_name}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Edit</span>
      </nav>
      <PageHeader
        eyebrow="Curate · Revisioned authoring"
        title={`Edit ${concept.canonical_name}`}
        description={
          <p>
            Saving creates an immutable snapshot and audit event in the same
            transaction.
          </p>
        }
      />
      <ConceptEditor
        mode="update"
        initialValue={initialValue}
        domains={options.domains}
        concepts={options.concepts}
        canReview={membership.role === "owner"}
      />
    </>
  );
}
