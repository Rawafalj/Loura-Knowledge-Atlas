import { describe, expect, it } from "vitest";

import { safeMarkdownUrl } from "@/components/markdown";
import { GET } from "@/app/api/health/route";

describe("release security hardening", () => {
  it("allows only safe Markdown link protocols", () => {
    expect(safeMarkdownUrl("https://example.test/reference")).toBe(
      "https://example.test/reference",
    );
    expect(safeMarkdownUrl("/concepts/retries")).toBe("/concepts/retries");
    expect(safeMarkdownUrl("mailto:owner@example.test")).toBe(
      "mailto:owner@example.test",
    );
    expect(safeMarkdownUrl("javascript:alert(1)")).toBe("");
    expect(safeMarkdownUrl("data:text/html,alert(1)")).toBe("");
  });

  it("reports the release milestone from the health endpoint", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      service: "web",
      status: "ok",
      milestone: 9,
    });
  });
});
