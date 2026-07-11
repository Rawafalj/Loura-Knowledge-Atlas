import { NextResponse } from "next/server";

import { sourceApiError } from "@/lib/sources/api";
import { authorizeSourceMutation } from "@/lib/sources/auth";
import { finalizeUploadSchema } from "@/lib/sources/contracts";

async function sha256Hex(content: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", content);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { sourceId } = await context.params;
  const payload: unknown = await request.json().catch(() => null);
  const parsed = finalizeUploadSchema.safeParse(payload);
  if (!parsed.success) {
    return sourceApiError(
      400,
      "VALIDATION_FAILED",
      "Workspace is required.",
      requestId,
    );
  }
  const authorization = await authorizeSourceMutation(parsed.data.workspaceId);
  if (!authorization) {
    return sourceApiError(
      403,
      "FORBIDDEN",
      "Owner or editor access is required.",
      requestId,
    );
  }
  const { supabase } = authorization;
  const sourceResult = await supabase
    .from("sources")
    .select("id, storage_path, file_checksum_sha256, file_size_bytes")
    .eq("workspace_id", parsed.data.workspaceId)
    .eq("id", sourceId)
    .maybeSingle();
  if (sourceResult.error || !sourceResult.data?.storage_path) {
    return sourceApiError(
      404,
      "NOT_FOUND",
      "Source upload was not found.",
      requestId,
    );
  }
  const downloaded = await supabase.storage
    .from("source-files")
    .download(sourceResult.data.storage_path);
  if (downloaded.error) {
    return sourceApiError(
      409,
      "CONFLICT",
      "The private upload has not completed.",
      requestId,
    );
  }
  const bytes = await downloaded.data.arrayBuffer();
  const checksum = await sha256Hex(bytes);
  if (
    checksum !== sourceResult.data.file_checksum_sha256 ||
    bytes.byteLength !== sourceResult.data.file_size_bytes
  ) {
    return sourceApiError(
      409,
      "CONFLICT",
      "The uploaded bytes do not match the declared checksum and size.",
      requestId,
    );
  }
  const queued = await supabase.rpc("enqueue_source_ingestion", {
    p_workspace_id: parsed.data.workspaceId,
    p_source_id: sourceId,
    p_parser_profile: "default-v1",
    p_extraction_schema_version: "deterministic-v1",
  });
  if (queued.error) {
    return sourceApiError(
      500,
      "INTERNAL_ERROR",
      "The ingestion job could not be queued.",
      requestId,
    );
  }
  return NextResponse.json(queued.data);
}
