import { NextResponse } from "next/server";

import { sourceApiError } from "@/lib/sources/api";
import { reviewProposalItem } from "@/lib/proposals/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ proposalId: string; itemId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { proposalId, itemId } = await context.params;
  const payload: unknown = await request.json().catch(() => null);
  try {
    const result = await reviewProposalItem(proposalId, itemId, payload);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "STALE_PROPOSAL") {
      return sourceApiError(
        409,
        "STALE_PROPOSAL",
        "The canonical content changed after this proposal was created.",
        requestId,
      );
    }
    return sourceApiError(
      400,
      "VALIDATION_FAILED",
      "The proposal review could not be applied.",
      requestId,
    );
  }
}
