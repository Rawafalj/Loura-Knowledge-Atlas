import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@loura/ui";

import { ArchiveApplicationButton } from "@/components/applications/archive-application-button";
import { ApplicationEditForm } from "@/components/applications/application-edit-form";
import { Markdown } from "@/components/markdown";
import { getApplicationDetail } from "@/lib/applications/service";
import { requireWorkspaceMembership } from "@/lib/auth/session";
import { safeExternalUrl } from "@/lib/applications/contracts";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const { membership } = await requireWorkspaceMembership();
  const detail = await getApplicationDetail(
    membership.workspaceId,
    applicationId,
  );
  if (!detail) notFound();
  const applicationUrl = detail.application.external_url
    ? safeExternalUrl(detail.application.external_url)
    : null;
  const conceptById = new Map(
    detail.concepts.map((concept) => [concept.id, concept]),
  );
  const canEdit =
    membership.role !== "viewer" && detail.application.status !== "archived";
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/applications">Loura applications</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{detail.application.title}</span>
      </nav>
      <PageHeader
        eyebrow={`Apply · ${detail.application.application_type.replaceAll("_", " ")}`}
        title={detail.application.title}
        description={
          <p>
            Project context and implications are kept separate from canonical
            knowledge.
          </p>
        }
        actions={
          <div className="action-row">
            <Badge>{detail.application.status}</Badge>
            {membership.role !== "viewer" &&
            detail.application.status !== "archived" ? (
              <ArchiveApplicationButton
                workspaceId={membership.workspaceId}
                applicationId={detail.application.id}
              />
            ) : null}
          </div>
        }
      />
      <div className="status-row">
        {detail.application.project_tag ? (
          <span>Project: {detail.application.project_tag}</span>
        ) : null}
        <span>
          Updated {new Date(detail.application.updated_at).toLocaleString()}
        </span>
        {applicationUrl ? (
          <a href={applicationUrl} target="_blank" rel="noreferrer">
            Open external artifact ↗
          </a>
        ) : null}
      </div>
      <div className="source-detail-grid">
        <Card>
          <p className="eyebrow">Application context</p>
          <Markdown>{detail.application.description_markdown}</Markdown>
        </Card>
        <Card>
          <p className="eyebrow">Canonical concepts</p>
          {detail.links.length ? (
            <ul>
              {detail.links.map((link) => {
                const concept = conceptById.get(link.concept_id);
                return (
                  <li key={`${link.concept_id}-${link.application_id}`}>
                    {concept ? (
                      <Link href={`/concepts/${concept.slug}`}>
                        {concept.canonical_name}
                      </Link>
                    ) : (
                      link.concept_id
                    )}
                    <p>{link.relevance_note}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No canonical concepts linked yet.</p>
          )}
          <p className="muted-section">
            Links provide context only; archiving this application never edits
            the concept.
          </p>
        </Card>
      </div>
      {canEdit ? (
        <details className="reading-section">
          <summary>
            <strong>Edit application</strong>
          </summary>
          <ApplicationEditForm
            workspaceId={membership.workspaceId}
            application={detail.application}
          />
        </details>
      ) : null}
    </>
  );
}
