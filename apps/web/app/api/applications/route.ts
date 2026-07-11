import { NextResponse } from "next/server";
import { z } from "zod";

import { createApplication } from "@/lib/applications/service";
import {
  applicationInputSchema,
  applicationStatuses,
  applicationTypes,
} from "@/lib/applications/contracts";
import { authorizeSourceMutation } from "@/lib/sources/auth";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";

const topLevelRequestSchema = z.object({
  workspaceId: z.uuid(),
  applicationType: z.enum(applicationTypes),
  title: z.string(),
  description: z.string().optional(),
  descriptionMarkdown: z.string().optional(),
  implicationMarkdown: z.string().nullable().optional(),
  status: z.enum(applicationStatuses).optional(),
  ownerUserId: z.string().nullable().optional(),
  projectTag: z.string().nullable().optional(),
  externalUrl: z.string().optional(),
});
const requestSchema = z.union([
  z.object({ workspaceId: z.uuid(), input: applicationInputSchema }),
  topLevelRequestSchema,
]);

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const rate = checkRequestRateLimit(request, "application-write", 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Application changes are temporarily rate limited.",
          requestId,
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "Check the application fields.",
          requestId,
        },
      },
      { status: 400 },
    );
  const inputResult =
    "input" in parsed.data
      ? { success: true as const, data: parsed.data.input }
      : applicationInputSchema.safeParse(parsed.data);
  if (!inputResult.success)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "Check the application fields.",
          requestId,
        },
      },
      { status: 400 },
    );
  if (!(await authorizeSourceMutation(parsed.data.workspaceId)))
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Owner or editor access is required.",
          requestId,
        },
      },
      { status: 403 },
    );
  try {
    return NextResponse.json(
      await createApplication(parsed.data.workspaceId, inputResult.data),
    );
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "The application could not be created.",
          requestId,
        },
      },
      { status: 500 },
    );
  }
}
