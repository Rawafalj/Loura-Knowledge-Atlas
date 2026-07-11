import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function authorizeSourceMutation(workspaceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Unable to validate workspace access.");
  if (!data || !["owner", "editor"].includes(data.role)) return null;
  return { supabase, role: data.role };
}
