import Link from "next/link";
import { EmptyState, PageHeader } from "@loura/ui";

import {
  ConceptEditor,
  type ConceptEditorValue,
} from "@/components/editor/concept-editor";
import { getAuthoringOptions } from "@/lib/atlas/queries";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function NewConceptPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const [{ domain: domainSlug }, { membership }] = await Promise.all([
    searchParams,
    requireWorkspaceMembership(),
  ]);
  const options = await getAuthoringOptions(membership.workspaceId);
  if (membership.role === "viewer") {
    return (
      <EmptyState title="This workspace role is read only">
        <p>Viewers can browse canonical content but cannot create drafts.</p>
      </EmptyState>
    );
  }
  const selectedDomain =
    options.domains.find((domain) => domain.slug === domainSlug) ??
    options.domains[0];
  if (!selectedDomain) {
    return (
      <EmptyState
        title="Create a domain before adding concepts"
        action={
          <Link className="ui-button ui-button--secondary" href="/atlas">
            Return to world map
          </Link>
        }
      >
        <p>Every concept needs one canonical domain for stable orientation.</p>
      </EmptyState>
    );
  }
  const initialValue: ConceptEditorValue = {
    id: null,
    updatedAt: null,
    slug: "",
    canonicalName: "",
    conciseDefinition: "",
    synthesisMarkdown: "",
    whyItExistsMarkdown: "",
    mechanismMarkdown: "",
    examplesMarkdown: "",
    counterexamplesMarkdown: "",
    failureModesMarkdown: "",
    commonConfusionsMarkdown: "",
    canonicalDomainId: selectedDomain.id,
    canonicalParentId: "",
    conceptKind: "concept",
    contentStatus: "draft",
    priority: "later",
    targetMastery: "",
    reviewNote: "",
    replacementConceptId: "",
    aliases: [],
    changeSummary: "Created canonical concept draft",
  };
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/atlas">World map</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">New concept</span>
      </nav>
      <PageHeader
        eyebrow="Curate · Canonical structure"
        title="Create a concept draft"
        description={
          <p>
            Choose one stable home, then express cross-domain truth through
            typed relations.
          </p>
        }
      />
      <ConceptEditor
        mode="create"
        initialValue={initialValue}
        domains={options.domains}
        concepts={options.concepts}
        canReview={membership.role === "owner"}
      />
    </>
  );
}
