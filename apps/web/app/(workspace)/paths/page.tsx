import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@loura/ui";

import { requireWorkspaceMembership } from "@/lib/auth/session";
import { listLearningPaths } from "@/lib/learning/service";

export default async function LearningPathsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const { user, membership } = await requireWorkspaceMembership();
  const paths = await listLearningPaths(membership.workspaceId, user.id);
  const canEdit = membership.role !== "viewer";
  return (
    <>
      <PageHeader
        eyebrow="Learn · Curated routes"
        title="Learning paths"
        description={
          <p>
            Ordered routes that make prerequisite gaps and the next ready
            concept explicit.
          </p>
        }
        actions={
          canEdit ? (
            <Link className="ui-button ui-button--primary" href="/paths/new">
              Create path
            </Link>
          ) : (
            <Badge>Read only path structure</Badge>
          )
        }
      />
      {query.error ? (
        <p className="form-banner form-banner--error" role="alert">
          {query.error}
        </p>
      ) : null}
      {paths.length ? (
        <div className="path-grid">
          {paths.map((path) => (
            <Card className="path-card" key={path.id}>
              <div className="path-card__meta">
                <Badge tone={path.contentStatus}>{path.contentStatus}</Badge>
                <span>
                  {path.completedCount} of {path.stepCount} targets met
                </span>
              </div>
              <h2>
                <Link href={`/paths/${path.slug}`}>{path.title}</Link>
              </h2>
              <p>{path.purposeMarkdown}</p>
              <div
                className="progress-track"
                aria-label={`${path.progressPercent}% complete`}
              >
                <span style={{ width: `${path.progressPercent}%` }} />
              </div>
              <strong>{path.progressPercent}% target mastery complete</strong>
              {path.nextConcept ? (
                <p className="next-ready-line">
                  Next ready:{" "}
                  <Link href={`/concepts/${path.nextConcept.slug}`}>
                    {path.nextConcept.name}
                  </Link>
                </p>
              ) : (
                <p className="next-ready-line">
                  No uncompleted step is currently ready.
                </p>
              )}
              <Link className="card-link" href={`/paths/${path.slug}`}>
                Open route <span aria-hidden="true">→</span>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No learning paths yet"
          action={
            canEdit ? (
              <Link className="ui-button ui-button--primary" href="/paths/new">
                Create the first route
              </Link>
            ) : null
          }
        >
          <p>
            Paths remain deliberate, editable canonical routes rather than
            generated recommendations.
          </p>
        </EmptyState>
      )}
    </>
  );
}
