import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspaceMembership = {
  workspaceId: string;
  role: "owner" | "editor" | "viewer";
  workspace: {
    name: string;
    slug: string;
  };
};

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return user;
}

export async function getCurrentMembership(
  userId: string,
): Promise<WorkspaceMembership | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces!inner(name, slug)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error)
    throw new Error(`Unable to load workspace membership: ${error.code}`);
  if (!data) return null;
  return {
    workspaceId: data.workspace_id,
    role: data.role,
    workspace: {
      name: data.workspaces.name,
      slug: data.workspaces.slug,
    },
  };
}

export async function requireWorkspaceMembership() {
  const user = await requireAuthenticatedUser();
  const membership = await getCurrentMembership(user.id);
  if (!membership) redirect("/onboarding");
  return { user, membership };
}
