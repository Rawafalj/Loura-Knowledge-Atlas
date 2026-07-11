"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArchiveApplicationButton({
  workspaceId,
  applicationId,
}: {
  workspaceId: string;
  applicationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function archive() {
    if (
      !window.confirm(
        "Archive this application? Its canonical concept links will remain intact.",
      )
    )
      return;
    setBusy(true);
    await fetch(`/api/applications/${applicationId}/archive`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    setBusy(false);
    router.refresh();
  }
  return (
    <button
      className="ui-button ui-button--secondary"
      type="button"
      onClick={archive}
      disabled={busy}
    >
      {busy ? "Archiving…" : "Archive"}
    </button>
  );
}
