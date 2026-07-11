// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MasteryForm } from "@/components/learning/mastery-form";

vi.mock("@/app/(workspace)/learning-actions", () => ({
  updateMasteryAction: vi.fn(),
}));

describe("MasteryForm", () => {
  it("requires explicit evidence and explains that reading is not mastery", () => {
    render(
      <MasteryForm
        concept={{
          id: crypto.randomUUID(),
          slug: "boundary",
          name: "Boundary",
        }}
        currentLevel={0}
        targetLevel={2}
        status="not_started"
        returnTo="/mastery"
      />,
    );
    expect(screen.getByLabelText("Current level")).toHaveValue("0");
    expect(screen.getByLabelText("Evidence type")).toBeInTheDocument();
    expect(screen.getByLabelText("Evidence note")).toBeInTheDocument();
    expect(
      screen.getByText(/Page views never change mastery/),
    ).toBeInTheDocument();
  });
});
