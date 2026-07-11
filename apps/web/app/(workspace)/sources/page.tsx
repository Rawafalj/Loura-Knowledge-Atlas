import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@loura/ui";

import { requireWorkspaceMembership } from "@/lib/auth/session";
import { listSources } from "@/lib/sources/service";

function authorLine(authors: unknown, organization: string | null) {
  if (Array.isArray(authors)) {
    const names = authors.flatMap((author) =>
      typeof author === "object" && author && "name" in author
        ? [String(author.name)]
        : [],
    );
    if (names.length) return names.join(", ");
  }
  return organization ?? "Author not recorded";
}

export default async function SourcesPage() {
  const { membership } = await requireWorkspaceMembership();
  const sources = await listSources(membership.workspaceId);
  const canAdd = membership.role !== "viewer";
  return (
    <>
      <PageHeader
        eyebrow="Curate · Private evidence"
        title="Source library"
        description={
          <p>
            Immutable originals, parser-versioned documents, and exact
            structural segments—the evidence layer beneath later citations.
          </p>
        }
        actions={
          canAdd ? (
            <Link className="ui-button ui-button--primary" href="/sources/new">
              Add source
            </Link>
          ) : (
            <Badge>Read only source library</Badge>
          )
        }
      />
      {sources.length ? (
        <div className="source-grid">
          {sources.map((source) => (
            <Card className="source-card" key={source.id}>
              <div className="source-card__meta">
                <Badge>{source.source_type}</Badge>
                <span
                  className={`source-status source-status--${source.ingestion_status}`}
                >
                  {source.ingestion_status.replaceAll("_", " ")}
                </span>
              </div>
              <h2>
                <Link href={`/sources/${source.id}`}>{source.title}</Link>
              </h2>
              <p>{authorLine(source.authors, source.organization)}</p>
              <dl className="source-facts">
                <div>
                  <dt>Quality</dt>
                  <dd>{source.quality}</dd>
                </div>
                <div>
                  <dt>Sensitivity</dt>
                  <dd>{source.sensitivity}</dd>
                </div>
                <div>
                  <dt>Published</dt>
                  <dd>{source.publication_date ?? "Not recorded"}</dd>
                </div>
              </dl>
              <Link className="card-link" href={`/sources/${source.id}`}>
                Open source <span aria-hidden="true">→</span>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No private sources yet"
          action={
            canAdd ? (
              <Link
                className="ui-button ui-button--primary"
                href="/sources/new"
              >
                Add the first source
              </Link>
            ) : null
          }
        >
          <p>
            Add a permitted file or one explicit public URL. Ingestion remains
            deterministic and performs no AI extraction.
          </p>
        </EmptyState>
      )}
    </>
  );
}
