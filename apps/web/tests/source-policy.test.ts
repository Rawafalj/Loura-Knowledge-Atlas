import { describe, expect, it } from "vitest";

import { validateSourceFile } from "@/lib/sources/file-policy";
import { assertSafeSourceUrl, isUnsafeAddress } from "@/lib/sources/url-safety";

describe("source file and URL policy", () => {
  it("rejects unsupported and oversized files", () => {
    expect(validateSourceFile("application/x-msdownload", 100)?.code).toBe(
      "UNSUPPORTED_SOURCE_TYPE",
    );
    expect(validateSourceFile("application/pdf", 51 * 1024 * 1024)?.code).toBe(
      "SOURCE_TOO_LARGE",
    );
    expect(validateSourceFile("application/pdf", 1024)).toBeNull();
  });

  it("rejects private, loopback, metadata, and non-http URLs", async () => {
    expect(isUnsafeAddress("127.0.0.1")).toBe(true);
    expect(isUnsafeAddress("169.254.169.254")).toBe(true);
    expect(isUnsafeAddress("10.0.0.2")).toBe(true);
    expect(isUnsafeAddress("198.51.100.12")).toBe(true);
    expect(isUnsafeAddress("203.0.113.12")).toBe(true);
    expect(isUnsafeAddress("93.184.216.34")).toBe(false);
    await expect(
      assertSafeSourceUrl("https://private.example/source", async () => [
        { address: "192.168.1.5", family: 4 },
      ]),
    ).rejects.toThrow(/private or unsafe/);
    await expect(
      assertSafeSourceUrl("file:///etc/passwd", async () => []),
    ).rejects.toThrow(/HTTP or HTTPS/);
    await expect(
      assertSafeSourceUrl("http://[::1]/source", async () => []),
    ).rejects.toThrow(/private or unsafe/);
  });

  it("accepts a public HTTPS destination", async () => {
    await expect(
      assertSafeSourceUrl("https://example.org/source.pdf", async () => [
        { address: "93.184.216.34", family: 4 },
      ]),
    ).resolves.toBe("https://example.org/source.pdf");
  });
});
