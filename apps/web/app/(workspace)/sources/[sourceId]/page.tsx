import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@loura/ui";

import { JobProgress } from "@/components/sources/job-progress";
import { requireWorkspaceMembership } from "@/lib/auth/session";
import { getSourceDetail } from "@/lib/sources/service";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const { membership } = await requireWorkspaceMembership();
  const detail = await getSourceDetail(membership.workspaceId, sourceId);
  if (!detail) notFound();
  const latestJob = detail.jobs[0];
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/sources">Sources</Link>
        <span>/</span>
        <span>{detail.source.title}</span>
      </nav>
      <PageHeader
        eyebrow="Evidence · Private source"
        title={detail.source.title}
        description={
          <p>
            {detail.source.origin === "file"
              ? detail.source.file_name
              : detail.source.external_url}
          </p>
        }
        actions={
          <div className="source-header-badges">
            <Badge>{detail.source.source_type}</Badge>
            <Badge>{detail.source.quality}</Badge>
            <Badge>{detail.source.sensitivity}</Badge>
          </div>
        }
      />
      {latestJob ? (
        <JobProgress
          initialJob={latestJob}
          workspaceId={membership.workspaceId}
        />
      ) : null}
      <div className="source-detail-grid">
        <Card>
          <p className="eyebrow">Metadata</p>
          <h2>Source record</h2>
          <dl className="source-metadata-list">
            <div>
              <dt>Rights</dt>
              <dd>{detail.source.rights_note}</dd>
            </div>
            <div>
              <dt>External AI</dt>
              <dd>{detail.source.external_ai_policy.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Checksum</dt>
              <dd>
                <code>
                  {detail.source.file_checksum_sha256 ??
                    "Computed after URL download"}
                </code>
              </dd>
            </div>
            <div>
              <dt>Storage</dt>
              <dd>Private, signed access only</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <p className="eyebrow">Version history</p>
          <h2>Immutable parser outputs</h2>
          {detail.versions.length ? (
            <ol className="version-list">
              {detail.versions.map((version) => (
                <li key={version.id}>
                  <strong>Version {version.version_number}</strong>
                  <span>
                    {version.parser_name} {version.parser_version}
                  </span>
                  <span>{version.processing_status}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p>No completed parser version yet.</p>
          )}
        </Card>
      </div>
      <section className="source-segments" aria-labelledby="segments-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Parsed document</p>
            <h2 id="segments-heading">Structural segments</h2>
          </div>
          <span>{detail.segments.length} visible segments</span>
        </div>
        {detail.segments.length ? (
          <ol>
            {detail.segments.map((segment) => (
              <li key={segment.id} id={`segment-${segment.id}`}>
                <header>
                  <span>
                    #{segment.ordinal} ·{" "}
                    {segment.segment_type.replaceAll("_", " ")}
                  </span>
                  <code>{segment.stable_key}</code>
                </header>
                {segment.heading_path.length ? (
                  <p className="segment-heading-path">
                    {segment.heading_path.join(" / ")}
                  </p>
                ) : null}
                <p>{segment.text}</p>
                <footer>
                  <span>{segment.token_count} estimated tokens</span>
                  <span>
                    {segment.page_start
                      ? `Page ${segment.page_start}${segment.page_end && segment.page_end !== segment.page_start ? `–${segment.page_end}` : ""}`
                      : "Structural location"}
                  </span>
                </footer>
              </li>
            ))}
          </ol>
        ) : (
          <Card>
            <p>
              Segments appear here after deterministic parsing completes. The
              original remains retained if parsing fails.
            </p>
          </Card>
        )}
      </section>
    </>
  );
}
