import { NextResponse } from "next/server";

import { sourceApiError } from "@/lib/sources/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { jobId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("ingestion_jobs")
    .select(
      "id, source_id, source_version_id, status, stage, progress, attempt_count, error_code, error_message_sanitized",
    )
    .eq("id", jobId)
    .maybeSingle();
  if (result.error || !result.data) {
    return sourceApiError(
      404,
      "NOT_FOUND",
      "Ingestion job was not found.",
      requestId,
    );
  }
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
