import { NextResponse } from "next/server";

import { sourceApiError } from "@/lib/sources/api";
import { authorizeSourceMutation } from "@/lib/sources/auth";
import { retryJobSchema } from "@/lib/sources/contracts";

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { jobId } = await context.params;
  const payload: unknown = await request.json().catch(() => null);
  const parsed = retryJobSchema.safeParse(payload);
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
  const result = await authorization.supabase.rpc("retry_ingestion_job", {
    p_workspace_id: parsed.data.workspaceId,
    p_job_id: jobId,
  });
  if (result.error) {
    return sourceApiError(
      409,
      "CONFLICT",
      "This ingestion job cannot be retried.",
      requestId,
    );
  }
  return NextResponse.json(result.data);
}
