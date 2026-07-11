// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobProgress } from "@/components/sources/job-progress";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("source job progress", () => {
  it("announces a sanitized failure and exposes safe retry", () => {
    render(
      <JobProgress
        workspaceId="00000000-0000-4000-8000-000000000001"
        initialJob={{
          id: "00000000-0000-4000-8000-000000000002",
          status: "failed",
          stage: "parse",
          progress: "30",
          attempt_count: 1,
          error_code: "INGESTION_FAILED",
          error_message_sanitized: "The source could not be processed.",
        }}
      />,
    );

    expect(screen.getByLabelText("Ingestion progress")).toHaveTextContent(
      "parse · 30%",
    );
    expect(screen.getByRole("button", { name: "Retry safely" })).toBeEnabled();
    expect(
      screen.getByText("The source could not be processed."),
    ).toBeVisible();
  });
});
