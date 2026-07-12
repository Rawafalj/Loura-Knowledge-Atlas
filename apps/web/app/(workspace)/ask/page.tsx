import { PageHeader } from "@loura/ui";

import { AskComposer } from "@/components/ask/ask-composer";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function AskPage() {
  const { membership } = await requireWorkspaceMembership();
  return (
    <>
      <PageHeader
        eyebrow="Ask · Guided judgment"
        title="Ask Atlas"
        description={
          <p>
            Ask a question about the atlas. Answers distinguish available
            evidence from inference, cite exact stored source segments, and say
            when the current evidence is insufficient.
          </p>
        }
      />
      <AskComposer workspaceId={membership.workspaceId} />
    </>
  );
}
