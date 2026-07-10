import { requireWorkspaceMembership } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AtlasFoundationPage() {
  const { user, membership } = await requireWorkspaceMembership();
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("domains")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", membership.workspaceId)
    .is("deleted_at", null);

  return (
    <main>
      <p className="eyebrow">Milestone 1 · Database foundation</p>
      <h1>{membership.workspace.name}</h1>
      <p>
        Signed in as {user.email}. Role: <strong>{membership.role}</strong>.
      </p>
      <dl className="facts">
        <div>
          <dt>Workspace</dt>
          <dd>{membership.workspace.slug}</dd>
        </div>
        <div>
          <dt>Seed domains</dt>
          <dd>{count ?? 0}</dd>
        </div>
      </dl>
      <p>
        Atlas browsing and concept authoring intentionally begin in Milestone 2.
      </p>
      <form action={signOut}>
        <button type="submit" className="secondary">
          Sign out
        </button>
      </form>
    </main>
  );
}
