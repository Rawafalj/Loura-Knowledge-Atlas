import { NextResponse } from "next/server";

import { searchRequestSchema } from "@/lib/search/contracts";
import { searchAtlas } from "@/lib/search/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";

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
  const rate = checkRequestRateLimit(request, "search", 60, 60_000);
  if (!rate.allowed) {
    return apiError(
      429,
      "RATE_LIMITED",
      "Search is temporarily rate limited. Try again shortly.",
      requestId,
    );
  }
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

  const supabase = await createSupabaseServerClient();
  const membershipResult = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", parsed.data.workspaceId)
    .limit(1)
    .maybeSingle();
  if (membershipResult.error) {
    return apiError(
      500,
      "INTERNAL_ERROR",
      "Unable to validate workspace access.",
      requestId,
    );
  }
  if (!membershipResult.data) {
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
    const results = await searchAtlas(parsed.data.workspaceId, input);
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
