import { describe, expect, it } from "vitest";

import { cn } from "../src";

describe("cn", () => {
  it("joins only present class names", () => {
    expect(cn("base", false, undefined, "active", null)).toBe("base active");
  });
});
