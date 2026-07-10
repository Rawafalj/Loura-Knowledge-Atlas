import Link from "next/link";
import { Badge } from "@loura/ui";

import type { RelationView } from "@/lib/atlas/queries";

export function RelationshipTable({
  relations,
  selectedConceptSlug,
  canEdit,
}: {
  relations: RelationView[];
  selectedConceptSlug: string;
  canEdit: boolean;
}) {
  return (
    <div className="table-scroll">
      <table className="relation-table">
        <caption>
          Every local relation shown as text. This remains authoritative when
          visualization is unavailable.
        </caption>
        <thead>
          <tr>
            <th scope="col">Related concept</th>
            <th scope="col">Relationship</th>
            <th scope="col">Category</th>
            <th scope="col">Status</th>
            {canEdit ? <th scope="col">Action</th> : null}
          </tr>
        </thead>
        <tbody>
          {relations.map((relation) => (
            <tr key={relation.id}>
              <td>
                <Link href={`/concepts/${relation.otherConcept.slug}`}>
                  {relation.otherConcept.canonical_name}
                </Link>
                {relation.description ? (
                  <small>{relation.description}</small>
                ) : null}
              </td>
              <td>
                <strong>{relation.label}</strong>
                <code>{relation.relationKey}</code>
              </td>
              <td>{relation.category}</td>
              <td>
                <Badge tone={relation.reviewStatus}>
                  {relation.reviewStatus}
                </Badge>
              </td>
              {canEdit ? (
                <td>
                  <Link
                    href={`/concepts/${selectedConceptSlug}/relations/${relation.id}/edit`}
                  >
                    Edit
                  </Link>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
