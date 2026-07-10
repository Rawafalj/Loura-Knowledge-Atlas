// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useUnsavedChanges } from "@/components/editor/use-unsaved-changes";

function Harness({ dirty }: { dirty: boolean }) {
  useUnsavedChanges(dirty);
  return <a href="/atlas">Leave editor</a>;
}

describe("useUnsavedChanges", () => {
  it("blocks browser unload and cancelled internal navigation while dirty", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Harness dirty />);

    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByRole("link", { name: "Leave editor" }));
    expect(confirm).toHaveBeenCalledWith(
      "Leave this page and discard your unsaved atlas changes?",
    );
    confirm.mockRestore();
  });
});
