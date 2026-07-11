import { NextResponse } from "next/server";
import { z } from "zod";

import { sourceApiError } from "@/lib/sources/api";
import { authorizeSourceMutation } from "@/lib/sources/auth";
import { createMockProposalForSource } from "@/lib/proposals/service";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";

const requestSchema = z.object({ workspaceId: z.uuid() });

export async function POST(
  request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  const requestId = crypto.randomUUID();
  const rate = checkRequestRateLimit(request, "source-extraction", 10, 60_000);
  if (!rate.allowed) {
    return sourceApiError(
      429,
      "RATE_LIMITED",
      "Extraction proposals are temporarily rate limited.",
      requestId,
    );
  }
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return sourceApiError(
      400,
      "VALIDATION_FAILED",
      "Workspace is required.",
      requestId,
    );
  }
  const { workspaceId } = parsed.data;
  const authorization = await authorizeSourceMutation(workspaceId);
  if (!authorization) {
    return sourceApiError(
      403,
      "FORBIDDEN",
      "Owner or editor access is required.",
      requestId,
    );
  }
  try {
    const { sourceId } = await context.params;
    const proposalId = await createMockProposalForSource(workspaceId, sourceId);
    return NextResponse.json({
      proposalId,
      provider: "mock",
      reviewOnly: true,
    });
  } catch (error) {
    const code =
      error instanceof Error && error.message === "SOURCE_NOT_READY"
        ? "CONFLICT"
        : "INTERNAL_ERROR";
    return sourceApiError(
      code === "CONFLICT" ? 409 : 500,
      code,
      code === "CONFLICT"
        ? "A completed parsed source version is required first."
        : "The review proposal could not be created.",
      requestId,
    );
  }
}
