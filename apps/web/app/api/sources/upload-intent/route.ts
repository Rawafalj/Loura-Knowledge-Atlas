import { NextResponse } from "next/server";
import { z } from "zod";

import { sourceApiError } from "@/lib/sources/api";
import { authorizeSourceMutation } from "@/lib/sources/auth";
import { uploadIntentSchema } from "@/lib/sources/contracts";
import { validateSourceFile } from "@/lib/sources/file-policy";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";

const createdSourceSchema = z.object({
  sourceId: z.uuid(),
  storagePath: z.string().min(1),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const rate = checkRequestRateLimit(request, "source-upload", 20, 60_000);
  if (!rate.allowed)
    return sourceApiError(
      429,
      "RATE_LIMITED",
      "Uploads are temporarily rate limited.",
      requestId,
    );
  const payload: unknown = await request.json().catch(() => null);
  const parsed = uploadIntentSchema.safeParse(payload);
  if (!parsed.success) {
    return sourceApiError(
      400,
      "VALIDATION_FAILED",
      "Check the source metadata and file.",
      requestId,
    );
  }
  const fileError = validateSourceFile(
    parsed.data.mimeType,
    parsed.data.sizeBytes,
  );
  if (fileError)
    return sourceApiError(400, fileError.code, fileError.message, requestId);
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
  const created = await supabase.rpc("create_file_source", {
    p_workspace_id: parsed.data.workspaceId,
    p_file_name: parsed.data.fileName,
    p_mime_type: parsed.data.mimeType,
    p_size_bytes: parsed.data.sizeBytes,
    p_checksum_sha256: parsed.data.checksumSha256,
    p_metadata: parsed.data.metadata,
  });
  if (created.error) {
    const duplicate = created.error.code === "23505";
    return sourceApiError(
      duplicate ? 409 : 400,
      duplicate ? "DUPLICATE_SOURCE" : "VALIDATION_FAILED",
      duplicate
        ? "This file already exists in the workspace."
        : "The source could not be created.",
      requestId,
    );
  }
  const source = createdSourceSchema.parse(created.data);
  const signed = await supabase.storage
    .from("source-files")
    .createSignedUploadUrl(source.storagePath);
  if (signed.error) {
    return sourceApiError(
      500,
      "INTERNAL_ERROR",
      "A private upload target could not be created.",
      requestId,
    );
  }
  return NextResponse.json({
    ...source,
    signedUploadUrl: signed.data.signedUrl,
    token: signed.data.token,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  });
}
