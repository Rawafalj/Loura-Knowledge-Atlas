import Link from "next/link";
import { Badge, Card, PageHeader } from "@loura/ui";

import { getWorldMap } from "@/lib/atlas/queries";
import { requireWorkspaceMembership } from "@/lib/auth/session";
import { recommendedAction, startingPointFrom } from "@/lib/experience/home";
import { listLearningPaths } from "@/lib/learning/service";
import { listSources } from "@/lib/sources/service";

export default async function WorkspaceHomePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const [{ user, membership }, query] = await Promise.all([
    requireWorkspaceMembership(),
    searchParams,
  ]);
  const [world, paths, sources] = await Promise.all([
    getWorldMap(membership.workspaceId),
    listLearningPaths(membership.workspaceId, user.id),
    listSources(membership.workspaceId),
  ]);
  const nextPath = paths.find((path) => path.nextConcept);
  const action = recommendedAction({
    startingPoint: startingPointFrom(query.start),
    hasSources: sources.length > 0,
    hasCompletedSources: sources.some(
      (source) => source.ingestion_status === "completed",
    ),
    nextPath: nextPath?.nextConcept
      ? {
          slug: nextPath.slug,
          title: nextPath.title,
          conceptName: nextPath.nextConcept.name,
        }
      : null,
  });
  const reviewedConcepts = world.concepts.filter(
    (concept) => concept.content_status === "reviewed",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Home · Your next useful move"
        title={`Welcome to ${membership.workspace.name}`}
        description={
          <p>
            Build a trustworthy understanding of Loura, learn what matters, and
            turn evidence into better decisions.
          </p>
        }
      />
      <section
        className="home-recommendation"
        aria-labelledby="next-step-heading"
      >
        <div>
          <p className="eyebrow">{action.eyebrow}</p>
          <h2 id="next-step-heading">{action.title}</h2>
          <p>{action.description}</p>
          <Link className="ui-button ui-button--primary" href={action.href}>
            {action.label}
          </Link>
        </div>
        <div className="home-recommendation__status">
          <span>Current evidence</span>
          <strong>
            {sources.length} source{sources.length === 1 ? "" : "s"}
          </strong>
          <small>
            {sources.some((source) => source.ingestion_status === "completed")
              ? "At least one source is ready for cited answers."
              : "Add or finish processing a source for cited answers."}
          </small>
        </div>
      </section>
      <section className="home-mode-grid" aria-label="Choose a workspace mode">
        <Card className="home-mode-card">
          <p className="eyebrow">Understand</p>
          <h2>See where an idea belongs</h2>
          <p>
            Start from stable domains and concepts, then follow only the
            relationships that help answer your question.
          </p>
          <Link className="card-link" href="/atlas">
            Open knowledge landscape <span aria-hidden="true">→</span>
          </Link>
        </Card>
        <Card className="home-mode-card">
          <p className="eyebrow">Learn</p>
          <h2>Know what to focus on next</h2>
          <p>
            Follow deliberate routes that explain prerequisites and keep your
            evidence of progress separate from canonical knowledge.
          </p>
          <Link className="card-link" href="/paths">
            View learning routes <span aria-hidden="true">→</span>
          </Link>
        </Card>
        <Card className="home-mode-card">
          <p className="eyebrow">Ask</p>
          <h2>Get an answer you can inspect</h2>
          <p>
            Ask focused questions and trace important claims back to stored
            source passages.
          </p>
          <Link className="card-link" href="/ask">
            Ask a grounded question <span aria-hidden="true">→</span>
          </Link>
        </Card>
      </section>
      <section className="home-context" aria-labelledby="workspace-at-a-glance">
        <div className="section-heading">
          <div>
            <p className="eyebrow">At a glance</p>
            <h2 id="workspace-at-a-glance">Your workspace today</h2>
          </div>
          <Link href="/atlas">Open knowledge landscape</Link>
        </div>
        <div className="home-context__metrics">
          <div>
            <strong>
              {world.roots.length + world.core.length + world.overlays.length}
            </strong>
            <span>knowledge areas</span>
          </div>
          <div>
            <strong>{world.concepts.length}</strong>
            <span>concepts</span>
          </div>
          <div>
            <strong>{reviewedConcepts}</strong>
            <span>reviewed concepts</span>
          </div>
          <div>
            <strong>{paths.length}</strong>
            <span>learning routes</span>
          </div>
        </div>
        {sources.length === 0 ? (
          <div className="home-context__notice">
            <Badge tone="accent">Next capability</Badge>
            <p>
              Add a source when you want Ask Atlas to answer from your own
              evidence, not only the curated atlas.
            </p>
            <Link href="/sources/new">Add evidence</Link>
          </div>
        ) : null}
      </section>
    </>
  );
}
