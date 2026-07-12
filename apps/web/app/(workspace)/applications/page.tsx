import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@loura/ui";

import { requireWorkspaceMembership } from "@/lib/auth/session";
import { listApplications } from "@/lib/applications/service";

export default async function ApplicationsPage() {
  const { membership } = await requireWorkspaceMembership();
  const applications = await listApplications(membership.workspaceId);
  return (
    <>
      <PageHeader
        eyebrow="Decisions · Loura implications"
        title="Loura implications"
        description={
          <p>
            Decisions, components, experiments, and deployment concerns linked
            to canonical knowledge without becoming part of the knowledge
            hierarchy.
          </p>
        }
        actions={
          membership.role !== "viewer" ? (
            <Link
              className="ui-button ui-button--primary"
              href="/applications/new"
            >
              Add application
            </Link>
          ) : (
            <Badge>Read only</Badge>
          )
        }
      />
      {applications.length ? (
        <div className="source-grid">
          {applications.map((application) => (
            <Card className="source-card" key={application.id}>
              <div className="source-card__meta">
                <Badge>
                  {application.application_type.replaceAll("_", " ")}
                </Badge>
                <span>{application.status}</span>
              </div>
              <h2>
                <Link href={`/applications/${application.id}`}>
                  {application.title}
                </Link>
              </h2>
              <p>{application.description_markdown}</p>
              <Link
                className="card-link"
                href={`/applications/${application.id}`}
              >
                Open implication <span aria-hidden="true">→</span>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Loura implications yet"
          action={
            membership.role !== "viewer" ? (
              <Link
                className="ui-button ui-button--primary"
                href="/applications/new"
              >
                Create the first application
              </Link>
            ) : null
          }
        >
          <p>
            Link an independent knowledge concept to a concrete Loura decision,
            artifact, experiment, risk, or deployment question.
          </p>
        </EmptyState>
      )}
    </>
  );
}
