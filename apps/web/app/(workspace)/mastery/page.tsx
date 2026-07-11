import Link from "next/link";
import { Badge, PageHeader } from "@loura/ui";

import { MasteryForm } from "@/components/learning/mastery-form";
import { requireWorkspaceMembership } from "@/lib/auth/session";
import { MASTERY_LEVEL_LABELS } from "@/lib/learning/contracts";
import { getMasteryView } from "@/lib/learning/service";

export default async function MasteryPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  const { user, membership } = await requireWorkspaceMembership();
  const concepts = await getMasteryView(membership.workspaceId, user.id);
  const domains = new Map<string, typeof concepts>();
  for (const concept of concepts) {
    const rows = domains.get(concept.domainTitle) ?? [];
    rows.push(concept);
    domains.set(concept.domainTitle, rows);
  }
  const gaps = concepts.filter((concept) => concept.gap > 0).length;
  return (
    <>
      <PageHeader
        eyebrow="Learn · Personal state"
        title="Mastery"
        description={
          <p>
            Your evidence-backed learning state. Canonical concepts and paths
            remain separate from these personal records.
          </p>
        }
        actions={<Badge tone="accent">{gaps} target gaps</Badge>}
      />
      {query.saved ? (
        <p className="form-banner form-banner--success" role="status">
          Mastery and evidence saved.
        </p>
      ) : null}
      {query.error ? (
        <p className="form-banner form-banner--error" role="alert">
          {query.error}
        </p>
      ) : null}
      <div className="mastery-summary">
        <div>
          <strong>
            {concepts.filter((concept) => concept.currentLevel >= 1).length}
          </strong>
          <span>Concepts progressed</span>
        </div>
        <div>
          <strong>
            {concepts.filter((concept) => concept.currentLevel >= 2).length}
          </strong>
          <span>Applied or deeper</span>
        </div>
        <div>
          <strong>{gaps}</strong>
          <span>Open target gaps</span>
        </div>
      </div>
      {[...domains.entries()].map(([domain, rows]) => (
        <section className="mastery-domain" key={domain}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Domain</p>
              <h2>{domain}</h2>
            </div>
            <span className="section-count">{rows.length} concepts</span>
          </div>
          <div className="mastery-table-wrap">
            <table className="mastery-table">
              <thead>
                <tr>
                  <th>Concept</th>
                  <th>Current</th>
                  <th>Target</th>
                  <th>Gap</th>
                  <th>Last evidence</th>
                  <th>Active path</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((concept) => (
                  <tr key={concept.id}>
                    <td>
                      <Link href={`/concepts/${concept.slug}`}>
                        {concept.name}
                      </Link>
                      <Badge>{concept.status.replaceAll("_", " ")}</Badge>
                    </td>
                    <td>
                      {concept.currentLevel} ·{" "}
                      {MASTERY_LEVEL_LABELS[concept.currentLevel]}
                    </td>
                    <td>
                      {concept.targetLevel} ·{" "}
                      {MASTERY_LEVEL_LABELS[concept.targetLevel]}
                    </td>
                    <td>{concept.gap}</td>
                    <td>
                      {concept.lastEvidence ? (
                        <>
                          <span>
                            {concept.lastEvidence.evidence_type.replaceAll(
                              "_",
                              " ",
                            )}
                          </span>
                          <small>
                            {new Date(
                              concept.lastEvidence.created_at,
                            ).toLocaleDateString()}
                          </small>
                        </>
                      ) : (
                        "No evidence"
                      )}
                    </td>
                    <td>
                      {concept.paths.map((path) => (
                        <Link href={`/paths/${path.slug}`} key={path.slug}>
                          {path.title}
                        </Link>
                      ))}
                    </td>
                    <td>
                      <details>
                        <summary>Update</summary>
                        <MasteryForm
                          compact
                          concept={{
                            id: concept.id,
                            slug: concept.slug,
                            name: concept.name,
                          }}
                          currentLevel={concept.currentLevel}
                          targetLevel={concept.targetLevel}
                          status={concept.status}
                          returnTo="/mastery"
                        />
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
