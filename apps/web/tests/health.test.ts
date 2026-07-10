import { describe, expect, it } from "vitest";

import { GET } from "../app/api/health/route";

describe("web health route", () => {
  it("reports readiness without external services", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: "web",
      status: "ok",
      milestone: 0,
    });
  });
});
