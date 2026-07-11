import { NextResponse } from "next/server";

export function sourceApiError(
  status: number,
  code: string,
  message: string,
  requestId: string,
) {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}
