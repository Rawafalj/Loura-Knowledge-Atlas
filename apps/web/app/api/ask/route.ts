import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AskServiceError,
  generateMockAskAnswer,
  persistAskExchange,
  retrieveAskEvidence,
} from "@/lib/ask/service";
import { askRequestSchema } from "@/lib/ask/contracts";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";
import { trackProductEvent } from "@/lib/observability/telemetry";

export const runtime = "nodejs";

function event(type: string, data: unknown) {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const rate = checkRequestRateLimit(request, "ask", 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Ask Atlas is temporarily rate limited. Try again shortly.",
          requestId,
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }
  const parsed = askRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "Check the question and scope.",
          requestId,
        },
      },
      { status: 400 },
    );
  }
  const supabase = await createSupabaseServerClient();
  const userResult = await supabase.auth.getUser();
  if (userResult.error || !userResult.data.user) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHENTICATED",
          message: "Sign in to ask Atlas.",
          requestId,
        },
      },
      { status: 401 },
    );
  }
  const membership = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", parsed.data.workspaceId)
    .eq("user_id", userResult.data.user.id)
    .maybeSingle();
  if (membership.error || !membership.data) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Ask Atlas is restricted to the active workspace.",
          requestId,
        },
      },
      { status: 403 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (type: string, data: unknown) =>
        controller.enqueue(encoder.encode(event(type, data)));
      try {
        send("answer.started", { requestId });
        const evidence = await retrieveAskEvidence(
          parsed.data.workspaceId,
          parsed.data,
        );
        if (request.signal.aborted) return controller.close();
        const answer = await generateMockAskAnswer(
          parsed.data.question,
          evidence,
        );
        if (request.signal.aborted) return controller.close();
        send("answer.delta", { text: answer.answerMarkdown });
        for (const citationId of answer.citationIds) {
          const citation = evidence.bundle.segments.find(
            (segment) => segment.id === citationId,
          );
          send("answer.citation", { citationId, citation });
        }
        send("answer.concepts", { conceptIds: answer.conceptIds });
        if (answer.evidenceAssessment === "insufficient") {
          send("answer.insufficient_evidence", {
            message: answer.answerMarkdown,
          });
        }
        const threadId = await persistAskExchange({
          workspaceId: parsed.data.workspaceId,
          userId: userResult.data.user.id,
          threadId: parsed.data.threadId,
          question: parsed.data.question,
          answerMarkdown: answer.answerMarkdown,
          answerStatus:
            answer.evidenceAssessment === "insufficient"
              ? "insufficient_evidence"
              : "complete",
          conceptIds: answer.conceptIds,
          citationIds: answer.citationIds,
          scope: parsed.data.scope,
        });
        trackProductEvent("ask.completed", {
          workspaceId: parsed.data.workspaceId,
          citationCount: answer.citationIds.length,
          evidenceAssessment: answer.evidenceAssessment,
        });
        send("answer.completed", { threadId, answer });
        controller.close();
      } catch (error) {
        if (request.signal.aborted) return controller.close();
        const message =
          error instanceof AskServiceError &&
          error.code === "INSUFFICIENT_EVIDENCE"
            ? "The reviewed atlas does not contain enough evidence to answer this confidently."
            : "Ask Atlas could not complete this answer.";
        send("answer.error", { message, requestId });
        controller.close();
      }
    },
    cancel() {
      // The request signal is checked between retrieval, generation, and
      // persistence so cancellation cannot publish a partial answer.
    },
  });
  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
    },
  });
}
