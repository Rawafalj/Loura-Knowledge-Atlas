import { PageHeader } from "@loura/ui";

import { AskComposer } from "@/components/ask/ask-composer";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function AskPage() {
  const { membership } = await requireWorkspaceMembership();
  return (
    <>
      <PageHeader
        eyebrow="Ask · Grounded reasoning"
        title="Ask Atlas"
        description={
          <p>
            Ask across the reviewed atlas. Answers are bounded by retrieved
            concepts and exact stored source segments.
          </p>
        }
      />
      <AskComposer workspaceId={membership.workspaceId} />
    </>
  );
}
