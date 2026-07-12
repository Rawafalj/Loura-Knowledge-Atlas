import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@loura/ui";

import { GraphRelationList } from "@/components/graph/graph-relation-list";
import { SemanticForceGraph } from "@/components/graph/semantic-force-graph";
import { getSemanticMap } from "@/lib/atlas/neighborhood-query";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function RelationshipMapPage() {
  const { membership } = await requireWorkspaceMembership();
  const map = await getSemanticMap(membership.workspaceId);

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/atlas">Atlas</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Relationship map</span>
      </nav>
      <PageHeader
        eyebrow="Explore · Relationship map"
        title="Explore connected concepts"
        description={
          <p>
            A bounded view of canonical hierarchy and typed relationships. This
            is a relationship explorer, not a claim of semantic similarity.
            Click a concept to inspect it.
          </p>
        }
        actions={<Badge tone="accent">Bounded exploration</Badge>}
      />
      {map.nodes.length ? (
        <section className="semantic-map-panel" aria-labelledby="map-heading">
          <div className="semantic-map-panel__header">
            <div>
              <p className="eyebrow">Orient first</p>
              <h2 id="map-heading">Relationship explorer</h2>
            </div>
            <span className="section-count">
              {map.nodes.length} concepts · {map.edges.length} connections
            </span>
          </div>
          <SemanticForceGraph dataset={map} />
          <details className="graph-list-fallback">
            <summary>Open as an accessible relationship list</summary>
            <GraphRelationList neighborhood={map} />
          </details>
        </section>
      ) : (
        <EmptyState
          title="Your relationship map is ready for its first concept"
          action={
            membership.role !== "viewer" ? (
              <Link
                className="ui-button ui-button--primary"
                href="/concepts/new"
              >
                Create concept
              </Link>
            ) : null
          }
        >
          <p>
            Add a canonical concept first. Typed relationships appear here as
            the atlas becomes connected.
          </p>
        </EmptyState>
      )}
      <section
        className="semantic-map-legend"
        aria-label="Relationship map guidance"
      >
        <div>
          <strong>Solid lines</strong>
          <span>Typed relationships</span>
        </div>
        <div>
          <strong>Dashed lines</strong>
          <span>Contrast or related ideas</span>
        </div>
        <div>
          <strong>List view</strong>
          <span>Open the relationship list below the map</span>
        </div>
      </section>
    </>
  );
}
