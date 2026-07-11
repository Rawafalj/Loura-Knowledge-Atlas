// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "@/components/search/command-palette";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("CommandPalette", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
  });

  it("supports Cmd+K, explains the match, and opens by keyboard", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            query: "closed-loop",
            concepts: [
              {
                id: "44000000-0000-4000-8000-000000000001",
                type: "concept",
                title: "Feedback Control",
                subtitle: "Systems and control",
                score: 0.03,
                matchReasons: ["alias", "semantic"],
                matchDetail: "Matched alias: Closed-loop regulator",
                snippet: "Regulation using observed outcomes.",
                route: "/concepts/feedback-control",
                contentStatus: "reviewed",
              },
            ],
            sources: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    render(
      <CommandPalette workspaceId="24000000-0000-0000-0000-000000000001" />,
    );
    await user.keyboard("{Meta>}k{/Meta}");
    expect(
      screen.getByRole("dialog", { name: "Search the atlas" }),
    ).toBeVisible();
    await user.type(
      screen.getByRole("textbox", { name: "Search concepts and sources" }),
      "closed-loop",
    );
    expect(
      await screen.findByRole("option", { name: /Feedback Control/i }),
    ).toBeVisible();
    expect(screen.getByText("alias")).toBeVisible();
    expect(screen.getByText("semantic")).toBeVisible();

    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/concepts/feedback-control"),
    );
  });
});
