import { NextResponse } from "next/server";
import { z } from "zod";

import { sourceApiError } from "@/lib/sources/api";
import { authorizeSourceMutation } from "@/lib/sources/auth";
import { urlSourceSchema } from "@/lib/sources/contracts";
import { assertSafeSourceUrl } from "@/lib/sources/url-safety";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";

const createdUrlSourceSchema = z.object({
  sourceId: z.uuid(),
  jobId: z.uuid(),
  status: z.string(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const rate = checkRequestRateLimit(request, "source-url", 10, 60_000);
  if (!rate.allowed)
    return sourceApiError(
      429,
      "RATE_LIMITED",
      "URL ingestion is temporarily rate limited.",
      requestId,
    );
  const payload: unknown = await request.json().catch(() => null);
  const parsed = urlSourceSchema.safeParse(payload);
  if (!parsed.success) {
    return sourceApiError(
      400,
      "VALIDATION_FAILED",
      "Check the URL and source metadata.",
      requestId,
    );
  }
  let safeUrl: string;
  try {
    safeUrl = await assertSafeSourceUrl(parsed.data.url);
  } catch {
    return sourceApiError(
      400,
      "VALIDATION_FAILED",
      "The URL is not permitted by the private-network safety policy.",
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
  const created = await authorization.supabase.rpc("create_url_source", {
    p_workspace_id: parsed.data.workspaceId,
    p_url: safeUrl,
    p_metadata: parsed.data.metadata,
    p_parser_profile: "default-v1",
    p_extraction_schema_version: "deterministic-v1",
  });
  if (created.error) {
    return sourceApiError(
      400,
      "VALIDATION_FAILED",
      "The URL source could not be queued.",
      requestId,
    );
  }
  return NextResponse.json(createdUrlSourceSchema.parse(created.data));
}
