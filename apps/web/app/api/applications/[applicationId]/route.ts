import { NextResponse } from "next/server";
import { z } from "zod";

import { applicationUpdateSchema } from "@/lib/applications/contracts";
import { updateApplication } from "@/lib/applications/service";
import { authorizeSourceMutation } from "@/lib/sources/auth";

const requestSchema = z.object({
  workspaceId: z.uuid(),
  input: applicationUpdateSchema,
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { applicationId } = await context.params;
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success || parsed.data.input.applicationId !== applicationId) {
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
  }
  if (!(await authorizeSourceMutation(parsed.data.workspaceId))) {
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
  }
  try {
    return NextResponse.json(
      await updateApplication(parsed.data.workspaceId, parsed.data.input),
    );
  } catch (error) {
    const stale =
      error instanceof Error && error.message === "STALE_APPLICATION";
    return NextResponse.json(
      {
        error: {
          code: stale ? "CONFLICT" : "INTERNAL_ERROR",
          message: stale
            ? "The application changed; reload and try again."
            : "The application could not be updated.",
          requestId,
        },
      },
      { status: stale ? 409 : 500 },
    );
  }
}
