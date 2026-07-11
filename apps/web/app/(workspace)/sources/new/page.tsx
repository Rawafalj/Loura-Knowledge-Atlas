import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@loura/ui";

import { SourceForm } from "@/components/sources/source-form";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function NewSourcePage() {
  const { membership } = await requireWorkspaceMembership();
  if (membership.role === "viewer") redirect("/sources");
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/sources">Sources</Link>
        <span>/</span>
        <span>Add source</span>
      </nav>
      <PageHeader
        eyebrow="Curate · Deterministic ingestion"
        title="Add a private source"
        description={
          <p>
            Record rights and sensitivity before placing an immutable original
            into private storage.
          </p>
        }
      />
      <SourceForm workspaceId={membership.workspaceId} />
    </>
  );
}
