import Link from "next/link";

import type { ConceptNeighborhood } from "@/lib/atlas/neighborhood";

export function GraphRelationList({
  neighborhood,
}: {
  neighborhood: ConceptNeighborhood;
}) {
  const nodeById = new Map(neighborhood.nodes.map((node) => [node.id, node]));
  if (!neighborhood.edges.length) {
    return <p className="quiet">No relationships match these graph filters.</p>;
  }
  return (
    <div className="table-scroll">
      <table className="relation-table graph-relation-table">
        <caption>
          {neighborhood.edges.length} visible relationships represented in the
          local graph
        </caption>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">Relationship</th>
            <th scope="col">Target</th>
            <th scope="col">Qualification</th>
          </tr>
        </thead>
        <tbody>
          {neighborhood.edges.map((edge) => {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) return null;
            return (
              <tr key={edge.id}>
                <td>
                  <Link href={`/concepts/${source.slug}`}>{source.label}</Link>
                </td>
                <td>
                  {edge.label}
                  <code>{edge.relationKey}</code>
                </td>
                <td>
                  <Link href={`/concepts/${target.slug}`}>{target.label}</Link>
                </td>
                <td>{edge.description || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
