import { defaultSeedSkeleton, type AtlasSeed } from "@loura/atlas-schema";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BootstrapWorkspaceInput = {
  name: string;
  slug: string;
  installSeed: boolean;
};

export async function bootstrapWorkspace(
  input: BootstrapWorkspaceInput,
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const seed: AtlasSeed | null = input.installSeed ? defaultSeedSkeleton : null;
  const { data, error } = await supabase.rpc("bootstrap_workspace", {
    p_name: input.name,
    p_slug: input.slug,
    p_seed: seed,
  });
  if (error) throw new Error(`Unable to bootstrap workspace: ${error.code}`);
  return data;
}

export async function installAtlasSeed(
  workspaceId: string,
  seed: AtlasSeed = defaultSeedSkeleton,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("install_atlas_seed", {
    p_workspace_id: workspaceId,
    p_seed: seed,
  });
  if (error) throw new Error(`Unable to install atlas seed: ${error.code}`);
  return data;
}
