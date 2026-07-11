import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, EmptyState, PageHeader } from "@loura/ui";

import { Markdown } from "@/components/markdown";
import {
  getDomainView,
  type ConceptTreeNode,
  type DomainTreeNode,
} from "@/lib/atlas/queries";
import { requireWorkspaceMembership } from "@/lib/auth/session";

function DomainHierarchy({ node }: { node: DomainTreeNode }) {
  return (
    <li>
      <Link href={`/atlas/domains/${node.slug}`}>{node.title}</Link>
      {node.children.length ? (
        <ul>
          {node.children.map((child) => (
            <DomainHierarchy key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ConceptHierarchy({ nodes }: { nodes: ConceptTreeNode[] }) {
  return (
    <ul className="concept-tree">
      {nodes.map((concept) => (
        <li key={concept.id}>
          <div className="concept-tree__row">
            <div>
              <Link href={`/concepts/${concept.slug}`}>
                {concept.canonical_name}
              </Link>
              {concept.concise_definition ? (
                <p>{concept.concise_definition}</p>
              ) : null}
            </div>
            <Badge tone={concept.content_status}>
              {concept.content_status}
            </Badge>
          </div>
          {concept.children.length ? (
            <ConceptHierarchy nodes={concept.children} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domainSlug: string }>;
}) {
  const { domainSlug } = await params;
  const { membership } = await requireWorkspaceMembership();
  const view = await getDomainView(membership.workspaceId, domainSlug);
  if (!view) notFound();
  const canEdit = membership.role !== "viewer";

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/atlas">World map</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{view.domain.title}</span>
      </nav>
      <PageHeader
        eyebrow={`${view.domain.kind} knowledge area`}
        title={view.domain.title}
        description={<p>{view.domain.short_description}</p>}
        actions={
          canEdit ? (
            <Link
              className="ui-button ui-button--primary"
              href={`/concepts/new?domain=${view.domain.slug}`}
            >
              Add concept
            </Link>
          ) : (
            <Badge>Read only</Badge>
          )
        }
      />
      <div className="status-row">
        <Badge tone={view.domain.content_status}>
          {view.domain.content_status}
        </Badge>
        <span>Priority: {view.domain.priority}</span>
        <span>
          Last reviewed:{" "}
          {view.domain.last_reviewed_at
            ? new Date(view.domain.last_reviewed_at).toLocaleDateString()
            : "Not yet"}
        </span>
      </div>

      <div className="domain-layout">
        <aside
          className="context-panel"
          aria-labelledby="domain-hierarchy-heading"
        >
          <p className="eyebrow">Stable geography</p>
          <h2 id="domain-hierarchy-heading">Domain hierarchy</h2>
          <ul className="domain-tree">
            <DomainHierarchy node={view.domainTree} />
          </ul>
        </aside>
        <div className="domain-content">
          <section className="reading-section">
            <p className="eyebrow">Overview</p>
            <h2>Scope and boundary</h2>
            {view.domain.scope_markdown ? (
              <Markdown>{view.domain.scope_markdown}</Markdown>
            ) : (
              <p className="quiet">
                No reviewed scope statement has been written yet.
              </p>
            )}
          </section>
          <section
            className="reading-section"
            aria-labelledby="concepts-heading"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Concepts</p>
                <h2 id="concepts-heading">Canonical hierarchy</h2>
              </div>
              <span className="section-count">
                {view.concepts.length} concepts
              </span>
            </div>
            {view.conceptTree.length ? (
              <ConceptHierarchy nodes={view.conceptTree} />
            ) : (
              <EmptyState
                title="This domain has no concepts yet"
                action={
                  canEdit ? (
                    <Link
                      className="ui-button ui-button--primary"
                      href={`/concepts/new?domain=${view.domain.slug}`}
                    >
                      Create the first draft
                    </Link>
                  ) : null
                }
              >
                <p>
                  The seed preserves geography without pretending placeholder
                  content is reviewed knowledge.
                </p>
              </EmptyState>
            )}
          </section>
          <section
            className="placeholder-grid"
            aria-label="Domain companion views"
          >
            <div>
              <strong>Map</strong>
              <span>Open a concept to explore its local relationship map.</span>
            </div>
            <div>
              <strong>Paths</strong>
              <span>Learning routes begin in Milestone 4.</span>
            </div>
            <div>
              <strong>Sources and gaps</strong>
              <span>Deterministic ingestion begins in Milestone 5.</span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
