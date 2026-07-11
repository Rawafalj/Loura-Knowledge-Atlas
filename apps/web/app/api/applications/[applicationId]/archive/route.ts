import { NextResponse } from "next/server";
import { z } from "zod";

import { archiveApplication } from "@/lib/applications/service";
import { authorizeSourceMutation } from "@/lib/sources/auth";

const requestSchema = z.object({ workspaceId: z.uuid() });

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { applicationId } = await context.params;
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "Workspace is required.",
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
      await archiveApplication(parsed.data.workspaceId, applicationId),
    );
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "CONFLICT",
          message: "The application could not be archived.",
          requestId,
        },
      },
      { status: 409 },
    );
  }
}
