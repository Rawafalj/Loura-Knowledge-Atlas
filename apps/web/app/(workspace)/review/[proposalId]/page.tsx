import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader } from "@loura/ui";

import { ProposalItemReview } from "@/components/proposals/proposal-item-review";
import { requireWorkspaceMembership } from "@/lib/auth/session";
import { getProposalDetail } from "@/lib/proposals/service";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = await params;
  const { membership } = await requireWorkspaceMembership();
  const detail = await getProposalDetail(membership.workspaceId, proposalId);
  if (!detail) notFound();
  const canReview = membership.role !== "viewer";
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/review">Review queue</Link>
        <span>/</span>
        <span>{detail.proposal.title}</span>
      </nav>
      <PageHeader
        eyebrow="Curate · Proposal detail"
        title={detail.proposal.title}
        description={
          <p>
            {detail.proposal.summary ?? "Evidence-bound candidate changes."}
          </p>
        }
        actions={<Badge>{detail.proposal.status.replaceAll("_", " ")}</Badge>}
      />
      <section className="proposal-list" aria-label="Proposal items">
        {detail.items.map((item) => (
          <ProposalItemReview
            key={item.id}
            item={item}
            segments={detail.segments}
            workspaceId={membership.workspaceId}
            proposalId={detail.proposal.id}
            sourceId={detail.sourceId}
            canReview={canReview}
          />
        ))}
      </section>
    </>
  );
}
