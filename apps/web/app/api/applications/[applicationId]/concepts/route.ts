import { NextResponse } from "next/server";
import { z } from "zod";

import { conceptApplicationLinkSchema } from "@/lib/applications/contracts";
import {
  linkConceptApplication,
  unlinkConceptApplication,
} from "@/lib/applications/service";
import { authorizeSourceMutation } from "@/lib/sources/auth";

const linkRequestSchema = z.object({
  workspaceId: z.uuid(),
  conceptId: z.uuid(),
  relevanceNote: z.string().trim().min(3).max(2_000),
});
const unlinkRequestSchema = z.object({
  workspaceId: z.uuid(),
  conceptId: z.uuid(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { applicationId } = await context.params;
  const parsed = linkRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "A concept and relevance note are required.",
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
      await linkConceptApplication(
        parsed.data.workspaceId,
        conceptApplicationLinkSchema.parse({ ...parsed.data, applicationId }),
      ),
    );
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "CONFLICT",
          message: "The concept could not be linked.",
          requestId,
        },
      },
      { status: 409 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { applicationId } = await context.params;
  const parsed = unlinkRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "A concept is required.",
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
    await unlinkConceptApplication(parsed.data.workspaceId, {
      ...parsed.data,
      applicationId,
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "CONFLICT",
          message: "The concept could not be unlinked.",
          requestId,
        },
      },
      { status: 409 },
    );
  }
}
