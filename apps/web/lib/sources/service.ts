import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listSources(workspaceId: string) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("sources")
    .select(
      "id, title, source_type, authors, organization, publication_date, quality, sensitivity, ingestion_status, created_at, file_name, external_url",
    )
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (result.error)
    throw new Error(`Unable to load sources: ${result.error.code}`);
  return result.data;
}

export async function getSourceDetail(workspaceId: string, sourceId: string) {
  const supabase = await createSupabaseServerClient();
  const [sourceResult, versionsResult, jobsResult] = await Promise.all([
    supabase
      .from("sources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", sourceId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("source_versions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("source_id", sourceId)
      .order("version_number", { ascending: false }),
    supabase
      .from("ingestion_jobs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("source_id", sourceId)
      .order("created_at", { ascending: false }),
  ]);
  if (sourceResult.error || versionsResult.error || jobsResult.error) {
    throw new Error("Unable to load source detail.");
  }
  if (!sourceResult.data) return null;
  const latestVersionId = sourceResult.data.latest_source_version_id;
  const segmentsResult = latestVersionId
    ? await supabase
        .from("source_segments")
        .select(
          "id, ordinal, stable_key, segment_type, heading_path, text, token_count, page_start, page_end, provenance",
        )
        .eq("workspace_id", workspaceId)
        .eq("source_version_id", latestVersionId)
        .order("ordinal")
        .limit(200)
    : { data: [], error: null };
  if (segmentsResult.error) throw new Error("Unable to load source segments.");
  return {
    source: sourceResult.data,
    versions: versionsResult.data,
    jobs: jobsResult.data,
    segments: segmentsResult.data,
  };
}
