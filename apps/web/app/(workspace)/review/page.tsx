import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@loura/ui";

import { requireWorkspaceMembership } from "@/lib/auth/session";
import { listProposals } from "@/lib/proposals/service";

export default async function ReviewQueuePage() {
  const { membership } = await requireWorkspaceMembership();
  const proposals = await listProposals(membership.workspaceId);
  return (
    <>
      <PageHeader
        eyebrow="Curate · Human review"
        title="Change proposal queue"
        description={
          <p>
            AI can suggest evidence-bound changes. Canonical knowledge changes
            only after a reviewable human decision.
          </p>
        }
      />
      {proposals.length ? (
        <div className="source-grid" aria-label="Change proposals">
          {proposals.map((proposal) => (
            <Card className="source-card" key={proposal.id}>
              <div className="source-card__meta">
                <Badge>{proposal.status.replaceAll("_", " ")}</Badge>
                <span>
                  {new Date(proposal.updated_at).toLocaleDateString()}
                </span>
              </div>
              <h2>
                <Link href={`/review/${proposal.id}`}>{proposal.title}</Link>
              </h2>
              <p>{proposal.summary ?? "No summary recorded."}</p>
              <Link className="card-link" href={`/review/${proposal.id}`}>
                Inspect proposal <span aria-hidden="true">→</span>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No proposals waiting for review">
          <p>
            Parsed sources will appear here when a review-only extraction run
            produces candidates.
          </p>
        </EmptyState>
      )}
    </>
  );
}
