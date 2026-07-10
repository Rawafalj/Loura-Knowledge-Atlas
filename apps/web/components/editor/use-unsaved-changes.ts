"use client";

import { useEffect } from "react";

export function useUnsavedChanges(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const linkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey
      )
        return;
      const target =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (!target || target.target === "_blank" || !target.href) return;
      if (
        !window.confirm(
          "Leave this page and discard your unsaved atlas changes?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", linkClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", linkClick, true);
    };
  }, [isDirty]);
}
