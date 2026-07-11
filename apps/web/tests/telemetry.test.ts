import { describe, expect, it } from "vitest";

import { redactTelemetryProperties } from "@/lib/observability/telemetry";

describe("telemetry redaction", () => {
  it("never forwards source or answer text", () => {
    expect(
      redactTelemetryProperties({
        question: "private question",
        answer: "private answer",
        sourceText: "private source",
        citationCount: 2,
        route: "/ask",
      }),
    ).toEqual({ citationCount: 2, route: "/ask" });
  });
});
