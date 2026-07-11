import { PageHeader } from "@loura/ui";

import { ApplicationForm } from "@/components/applications/application-form";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export default async function NewApplicationPage() {
  const { membership } = await requireWorkspaceMembership();
  return (
    <>
      <PageHeader
        eyebrow="Apply · Loura overlay"
        title="New application"
        description={
          <p>
            Describe the project context separately from the canonical concept.
          </p>
        }
      />
      <ApplicationForm workspaceId={membership.workspaceId} />
    </>
  );
}
