import { NextResponse } from "next/server";

import { requireWorkspaceMembership } from "@/lib/auth/session";
import { searchRequestSchema } from "@/lib/search/contracts";
import { searchAtlas } from "@/lib/search/service";

export const runtime = "nodejs";

function apiError(
  status: number,
  code: string,
  message: string,
  requestId: string,
) {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const payload: unknown = await request.json().catch(() => null);
  const parsed = searchRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(
      400,
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ?? "Check the search request.",
      requestId,
    );
  }

  const { membership } = await requireWorkspaceMembership();
  if (parsed.data.workspaceId !== membership.workspaceId) {
    return apiError(
      403,
      "FORBIDDEN",
      "Search is restricted to the active workspace.",
      requestId,
    );
  }

  try {
    const input = {
      query: parsed.data.query,
      scope: parsed.data.scope,
      limit: parsed.data.limit,
    };
    const results = await searchAtlas(membership.workspaceId, input);
    return NextResponse.json(results, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return apiError(
      500,
      "INTERNAL_ERROR",
      "Search is temporarily unavailable.",
      requestId,
    );
  }
}
