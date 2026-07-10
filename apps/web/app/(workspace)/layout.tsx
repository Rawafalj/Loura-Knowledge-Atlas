import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, membership } = await requireWorkspaceMembership();
  return (
    <WorkspaceShell membership={membership} userEmail={user.email ?? null}>
      {children}
    </WorkspaceShell>
  );
}
