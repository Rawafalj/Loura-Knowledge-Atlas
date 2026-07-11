import { describe, expect, it, beforeEach } from "vitest";

import {
  consumeRateLimit,
  resetRateLimitBucketsForTests,
} from "@/lib/security/rate-limit";

describe("rate limiting", () => {
  beforeEach(() => resetRateLimitBucketsForTests());

  it("bounds a key and reports a retry window", () => {
    expect(consumeRateLimit("test", 2, 60_000, 1_000).allowed).toBe(true);
    expect(consumeRateLimit("test", 2, 60_000, 1_001).allowed).toBe(true);
    const blocked = consumeRateLimit("test", 2, 60_000, 1_002);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(60);
    expect(consumeRateLimit("test", 2, 60_000, 61_001).allowed).toBe(true);
  });
});
