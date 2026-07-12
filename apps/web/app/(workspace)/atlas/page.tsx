import Link from "next/link";
import { Badge, Card, PageHeader } from "@loura/ui";

import { requireWorkspaceMembership } from "@/lib/auth/session";
import { getWorldMap, type WorldDomain } from "@/lib/atlas/queries";

function DomainGroup({
  id,
  title,
  description,
  domains,
}: {
  id: string;
  title: string;
  description: string;
  domains: WorldDomain[];
}) {
  return (
    <section
      className="world-section"
      id={id}
      aria-labelledby={`${id}-heading`}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">{title}</p>
          <h2 id={`${id}-heading`}>{description}</h2>
        </div>
        <span className="section-count">{domains.length} areas</span>
      </div>
      <div className="domain-grid">
        {domains.map((domain) => (
          <Card key={domain.id} className="domain-card">
            <div className="domain-card__meta">
              <Badge tone={domain.content_status}>
                {domain.content_status}
              </Badge>
              <span>{domain.conceptCount} concepts</span>
            </div>
            <h3>
              <Link href={`/atlas/domains/${domain.slug}`}>{domain.title}</Link>
            </h3>
            <p>{domain.short_description}</p>
            <dl className="compact-facts">
              <div>
                <dt>Reviewed coverage</dt>
                <dd>{domain.reviewedCoverage}%</dd>
              </div>
              <div>
                <dt>Target mastery</dt>
                <dd>{domain.target_mastery ?? "—"}</dd>
              </div>
            </dl>
            {domain.keyConcepts.length ? (
              <div className="key-concepts">
                <span>Key concepts</span>
                {domain.keyConcepts.map((concept) => (
                  <Link href={`/concepts/${concept.slug}`} key={concept.id}>
                    {concept.canonical_name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="quiet">
                No concepts yet. This geography remains an honest draft.
              </p>
            )}
            <Link className="card-link" href={`/atlas/domains/${domain.slug}`}>
              Open domain <span aria-hidden="true">→</span>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default async function WorldMapPage() {
  const { membership } = await requireWorkspaceMembership();
  const world = await getWorldMap(membership.workspaceId);
  const canEdit = membership.role !== "viewer";
  return (
    <>
      <PageHeader
        eyebrow="Loura Knowledge Atlas"
        title="How can we build Loura well?"
        description={
          <p>
            Explore the external knowledge terrain required to understand,
            design, build, govern, and improve Loura. Start broad, then follow
            concepts, relationships, and evidence at the depth you need.
          </p>
        }
        actions={
          canEdit ? (
            <Link className="ui-button ui-button--primary" href="/concepts/new">
              Create concept draft
            </Link>
          ) : (
            <Badge>Read only</Badge>
          )
        }
      />
      <section
        className="atlas-orientation"
        aria-labelledby="atlas-reading-heading"
      >
        <div>
          <p className="eyebrow">Read the atlas</p>
          <h2 id="atlas-reading-heading">A map, not a maze</h2>
          <p>
            Domains provide stable geography. Concepts are the landmarks.
            Evidence supports what the atlas says, while Loura implications
            remain visibly separate from canonical knowledge.
          </p>
        </div>
        <ol className="atlas-orientation__legend">
          <li>
            <strong>1</strong>
            <span>Orient in a domain</span>
          </li>
          <li>
            <strong>2</strong>
            <span>Inspect a concept and its relationships</span>
          </li>
          <li>
            <strong>3</strong>
            <span>Verify with stored source passages</span>
          </li>
        </ol>
      </section>
      <p className="orientation-note">
        <strong>Tree for orientation; graph for relationships.</strong> Cards
        and hierarchy remain fully usable without graph code.
      </p>
      <DomainGroup
        id="supporting-roots"
        title="Supporting roots"
        description="Foundations pulled into active learning when needed"
        domains={world.roots}
      />
      <DomainGroup
        id="domains"
        title="Core branches"
        description="Independent bodies of knowledge central to the atlas"
        domains={world.core}
      />
      <DomainGroup
        id="overlays"
        title="Industrial overlay"
        description="Operational context crossing the core branches"
        domains={world.overlays}
      />
      <section
        className="world-section"
        id="concepts"
        aria-labelledby="concepts-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Concept index</p>
            <h2 id="concepts-heading">Canonical concepts across the atlas</h2>
          </div>
          <span className="section-count">
            {world.concepts.length} concepts
          </span>
        </div>
        {world.concepts.length ? (
          <ul className="concept-index">
            {world.concepts.map((concept) => (
              <li key={concept.id}>
                <div>
                  <Link href={`/concepts/${concept.slug}`}>
                    {concept.canonical_name}
                  </Link>
                  <p>{concept.concise_definition || "Definition pending."}</p>
                </div>
                <Badge tone={concept.content_status}>
                  {concept.content_status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="concept-index__empty">
            <p>
              No concepts yet. Drafts appear here after a curator creates their
              canonical identity.
            </p>
          </Card>
        )}
      </section>
    </>
  );
}
