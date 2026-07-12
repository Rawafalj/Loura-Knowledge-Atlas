import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@loura/ui";

import { ConceptGraph } from "@/components/graph/concept-graph";
import { getSemanticMap } from "@/lib/atlas/neighborhood-query";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function SemanticMapPage() {
  const { membership } = await requireWorkspaceMembership();
  const map = await getSemanticMap(membership.workspaceId);

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/atlas">Explore</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Semantic map</span>
      </nav>
      <PageHeader
        eyebrow="Explore · Semantic map"
        title="See how ideas connect"
        description={
          <p>
            A bounded visual map of the workspace’s reviewed concepts,
            hierarchy, and typed relationships. Double-click a node to open it.
          </p>
        }
        actions={<Badge tone="accent">Evidence-aware</Badge>}
      />
      {map.nodes.length ? (
        <section className="semantic-map-panel" aria-labelledby="map-heading">
          <div className="semantic-map-panel__header">
            <div>
              <p className="eyebrow">Orient first</p>
              <h2 id="map-heading">Knowledge in motion</h2>
            </div>
            <span className="section-count">
              {map.nodes.length} concepts · {map.edges.length} connections
            </span>
          </div>
          <ConceptGraph dataset={map} scope="semantic" />
        </section>
      ) : (
        <EmptyState
          title="Your semantic map is ready for its first concept"
          action={
            membership.role !== "viewer" ? (
              <Link className="ui-button ui-button--primary" href="/concepts/new">
                Create concept
              </Link>
            ) : null
          }
        >
          <p>
            Add a canonical concept first. Relationships will appear here as
            the atlas becomes connected.
          </p>
        </EmptyState>
      )}
      <section className="semantic-map-legend" aria-label="Map guidance">
        <div><strong>Solid lines</strong><span>Typed relationships</span></div>
        <div><strong>Dashed lines</strong><span>Contrast or related ideas</span></div>
        <div><strong>List view</strong><span>Open the relationship list below the map</span></div>
      </section>
    </>
  );
}
