import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, EmptyState, PageHeader } from "@loura/ui";

import { ConceptGraph } from "@/components/graph/concept-graph";
import { ConceptApplicationLinkForm } from "@/components/applications/concept-application-link-form";
import { MasteryForm } from "@/components/learning/mastery-form";
import { Markdown } from "@/components/markdown";
import { RelationshipTable } from "@/components/relationship-table";
import { getConceptNeighborhood } from "@/lib/atlas/neighborhood-query";
import { getConceptView } from "@/lib/atlas/queries";
import { requireWorkspaceMembership } from "@/lib/auth/session";
import { MASTERY_LEVEL_LABELS } from "@/lib/learning/contracts";
import { getConceptMastery } from "@/lib/learning/service";
import {
  listApplications,
  listApplicationsForConcept,
} from "@/lib/applications/service";

const tabs = [
  "overview",
  "relationships",
  "sources",
  "loura",
  "history",
] as const;
type ConceptTab = (typeof tabs)[number];

function tabFrom(value: string | undefined): ConceptTab {
  return tabs.includes(value as ConceptTab)
    ? (value as ConceptTab)
    : "overview";
}

function ReadingSection({
  title,
  markdown,
}: {
  title: string;
  markdown: string | null;
}) {
  if (!markdown?.trim()) return null;
  return (
    <section className="reading-section">
      <h2>{title}</h2>
      <Markdown>{markdown}</Markdown>
    </section>
  );
}

export default async function ConceptPage({
  params,
  searchParams,
}: {
  params: Promise<{ conceptSlug: string }>;
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>;
}) {
  const [{ conceptSlug }, query] = await Promise.all([params, searchParams]);
  const { user, membership } = await requireWorkspaceMembership();
  const view = await getConceptView(membership.workspaceId, conceptSlug);
  if (!view) notFound();
  const mastery = await getConceptMastery(
    membership.workspaceId,
    user.id,
    view.concept.id,
    view.concept.target_mastery,
  );
  const activeTab = tabFrom(query.tab);
  const canEdit = membership.role !== "viewer";
  const neighborhood =
    activeTab === "relationships"
      ? await getConceptNeighborhood(membership.workspaceId, view.concept.id)
      : null;
  const louraApplications =
    activeTab === "loura"
      ? await listApplicationsForConcept(
          membership.workspaceId,
          view.concept.id,
        )
      : [];
  const applicationOptions =
    activeTab === "loura" && canEdit
      ? await listApplications(membership.workspaceId)
      : [];

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/atlas">World map</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/atlas/domains/${view.domain.slug}`}>
          {view.domain.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{view.concept.canonical_name}</span>
      </nav>
      <PageHeader
        eyebrow={`${view.concept.concept_kind} · ${view.domain.title}`}
        title={view.concept.canonical_name}
        description={
          <div>
            {view.aliases.length ? (
              <p className="aliases-line">
                Also known as{" "}
                {view.aliases.map((alias) => alias.alias).join(", ")}
              </p>
            ) : null}
            {view.concept.concise_definition ? (
              <p>{view.concept.concise_definition}</p>
            ) : null}
          </div>
        }
        actions={
          canEdit ? (
            <div className="action-row">
              <Link
                className="ui-button ui-button--secondary"
                href={`/concepts/${view.concept.slug}/relations/new`}
              >
                Add relation
              </Link>
              <Link
                className="ui-button ui-button--primary"
                href={`/concepts/${view.concept.slug}/edit`}
              >
                Edit concept
              </Link>
            </div>
          ) : (
            <Badge>Read only</Badge>
          )
        }
      />
      <div className="status-row">
        <Badge tone={view.concept.content_status}>
          {view.concept.content_status}
        </Badge>
        <span>Priority: {view.concept.priority}</span>
        <span>
          Mastery: {mastery.currentLevel} ·{" "}
          {MASTERY_LEVEL_LABELS[mastery.currentLevel]} / target{" "}
          {mastery.targetLevel}
        </span>
        <span>Revision {view.revisions[0]?.revision_number ?? 0}</span>
      </div>
      {query.saved === "mastery" ? (
        <p className="form-banner form-banner--success" role="status">
          Mastery and evidence saved.
        </p>
      ) : null}
      {query.error ? (
        <p className="form-banner form-banner--error" role="alert">
          {query.error}
        </p>
      ) : null}

      {view.concept.content_status === "deprecated" ? (
        <aside className="deprecation-notice">
          <strong>This concept is deprecated.</strong>
          {view.replacement ? (
            <span>
              Use{" "}
              <Link href={`/concepts/${view.replacement.slug}`}>
                {view.replacement.canonical_name}
              </Link>{" "}
              when appropriate.
            </span>
          ) : (
            <span>No replacement has been designated.</span>
          )}
        </aside>
      ) : null}

      <nav className="tab-list" aria-label="Concept sections">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={
              tab === "overview"
                ? `/concepts/${view.concept.slug}`
                : `/concepts/${view.concept.slug}?tab=${tab}`
            }
            aria-current={activeTab === tab ? "page" : undefined}
          >
            {tab === "loura"
              ? "Loura"
              : `${tab[0]?.toUpperCase()}${tab.slice(1)}`}
          </Link>
        ))}
      </nav>

      <div className="concept-layout">
        <div className="concept-content">
          {activeTab === "overview" ? (
            <>
              {!view.concept.synthesis_markdown &&
              !view.concept.why_it_exists_markdown ? (
                <EmptyState title="This draft has no synthesis yet">
                  <p>
                    The canonical structure is present, but no explanation is
                    presented as reviewed knowledge.
                  </p>
                </EmptyState>
              ) : null}
              <ReadingSection
                title="Why this concept exists"
                markdown={view.concept.why_it_exists_markdown}
              />
              <ReadingSection
                title="Synthesis"
                markdown={view.concept.synthesis_markdown}
              />
              <ReadingSection
                title="Mechanism or formal treatment"
                markdown={view.concept.mechanism_markdown}
              />
              <ReadingSection
                title="Examples"
                markdown={view.concept.examples_markdown}
              />
              <ReadingSection
                title="Counterexamples"
                markdown={view.concept.counterexamples_markdown}
              />
              <ReadingSection
                title="Failure modes and limitations"
                markdown={view.concept.failure_modes_markdown}
              />
              <ReadingSection
                title="Common confusions"
                markdown={view.concept.common_confusions_markdown}
              />
              <section className="reading-section muted-section">
                <h2>Claims and evidence</h2>
                <p>
                  Claims and exact source evidence arrive with deterministic
                  source ingestion in Milestone 5.
                </p>
              </section>
            </>
          ) : null}

          {activeTab === "relationships" ? (
            <section
              className="reading-section"
              aria-labelledby="relationships-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Accessible graph truth</p>
                  <h2 id="relationships-heading">Typed relationships</h2>
                </div>
                <span className="section-count">
                  {view.relations.length} edges
                </span>
              </div>
              {neighborhood ? <ConceptGraph dataset={neighborhood} /> : null}
              {view.relations.length ? (
                <RelationshipTable
                  relations={view.relations}
                  selectedConceptSlug={view.concept.slug}
                  canEdit={canEdit}
                />
              ) : (
                <EmptyState
                  title="No typed relationships yet"
                  action={
                    canEdit ? (
                      <Link
                        className="ui-button ui-button--primary"
                        href={`/concepts/${view.concept.slug}/relations/new`}
                      >
                        Add the first relationship
                      </Link>
                    ) : null
                  }
                >
                  <p>
                    Canonical parentage still provides orientation. Semantic
                    edges can be added deliberately.
                  </p>
                </EmptyState>
              )}
            </section>
          ) : null}

          {activeTab === "sources" ? (
            <EmptyState title="No source passages are available yet">
              <p>
                Milestone 5 will add immutable sources and exact segment
                citations. This placeholder does not fabricate evidence.
              </p>
            </EmptyState>
          ) : null}

          {activeTab === "loura" ? (
            <section
              className="reading-section"
              aria-labelledby="loura-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Project overlay</p>
                  <h2 id="loura-heading">Loura applications</h2>
                </div>
                <span className="section-count">
                  {louraApplications.length} links
                </span>
              </div>
              {louraApplications.length ? (
                <ul className="source-list">
                  {louraApplications.map(({ application, link }) => (
                    <li key={application.id}>
                      <div className="source-card__meta">
                        <Badge>
                          {application.application_type.replaceAll("_", " ")}
                        </Badge>
                        <span>{application.status}</span>
                      </div>
                      <h3>
                        <Link href={`/applications/${application.id}`}>
                          {application.title}
                        </Link>
                      </h3>
                      <p>{link.relevance_note}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No Loura applications are linked yet">
                  <p>
                    Project implications remain visibly separate from canonical
                    knowledge.
                  </p>
                </EmptyState>
              )}
              {canEdit ? (
                <details>
                  <summary>Link an application</summary>
                  <ConceptApplicationLinkForm
                    workspaceId={membership.workspaceId}
                    conceptId={view.concept.id}
                    applications={applicationOptions.map((application) => ({
                      id: application.id,
                      title: application.title,
                      status: application.status,
                    }))}
                  />
                </details>
              ) : null}
            </section>
          ) : null}

          {activeTab === "history" ? (
            <section
              className="reading-section"
              aria-labelledby="history-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Immutable snapshots</p>
                  <h2 id="history-heading">Revision history</h2>
                </div>
                <span className="section-count">
                  {view.revisions.length} revisions
                </span>
              </div>
              <ol className="revision-list" reversed>
                {view.revisions.map((revision) => (
                  <li key={revision.id}>
                    <div>
                      <strong>Revision {revision.revision_number}</strong>
                      <Badge>{revision.change_source}</Badge>
                    </div>
                    <p>{revision.change_summary}</p>
                    <small>
                      {revision.actorName ?? "Workspace member"} ·{" "}
                      <time dateTime={revision.created_at}>
                        {new Date(revision.created_at).toLocaleString()}
                      </time>
                    </small>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="concept-rail" aria-label="Concept context">
          <div>
            <p className="eyebrow">Canonical place</p>
            <strong>{view.domain.title}</strong>
            {view.parent ? (
              <p>
                Parent:{" "}
                <Link href={`/concepts/${view.parent.slug}`}>
                  {view.parent.canonical_name}
                </Link>
              </p>
            ) : (
              <p>Top-level concept in this domain.</p>
            )}
          </div>
          <div>
            <p className="eyebrow">Prerequisites</p>
            {view.relations.filter(
              (relation) =>
                relation.relationKey === "prerequisite_for" &&
                relation.direction === "incoming",
            ).length ? (
              <ul>
                {view.relations
                  .filter(
                    (relation) =>
                      relation.relationKey === "prerequisite_for" &&
                      relation.direction === "incoming",
                  )
                  .map((relation) => (
                    <li key={relation.id}>
                      <Link href={`/concepts/${relation.otherConcept.slug}`}>
                        {relation.otherConcept.canonical_name}
                      </Link>
                    </li>
                  ))}
              </ul>
            ) : (
              <p>No explicit prerequisites.</p>
            )}
          </div>
          <div>
            <p className="eyebrow">Personal mastery</p>
            <strong>
              {mastery.currentLevel} ·{" "}
              {MASTERY_LEVEL_LABELS[mastery.currentLevel]}
            </strong>
            <p>
              Target {mastery.targetLevel} ·{" "}
              {MASTERY_LEVEL_LABELS[mastery.targetLevel]}
            </p>
            <details className="concept-mastery-control">
              <summary>Update with evidence</summary>
              <MasteryForm
                compact
                concept={{
                  id: view.concept.id,
                  slug: view.concept.slug,
                  name: view.concept.canonical_name,
                }}
                currentLevel={mastery.currentLevel}
                targetLevel={mastery.targetLevel}
                status={mastery.status}
                returnTo={`/concepts/${view.concept.slug}`}
              />
            </details>
            {mastery.evidence.length ? (
              <Link href="/mastery">
                View {mastery.evidence.length} evidence record(s)
              </Link>
            ) : (
              <p>No evidence recorded.</p>
            )}
          </div>
          <div>
            <p className="eyebrow">Last updated</p>
            <time dateTime={view.concept.updated_at}>
              {new Date(view.concept.updated_at).toLocaleString()}
            </time>
          </div>
          <div>
            <p className="eyebrow">Learning paths</p>
            {mastery.paths.length ? (
              <ul>
                {mastery.paths.map((path) => (
                  <li key={path.slug}>
                    <Link href={`/paths/${path.slug}`}>
                      Step {path.stepOrder} · {path.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Not currently assigned to a route.</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
