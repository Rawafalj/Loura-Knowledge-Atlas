"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateProposalButton({
  workspaceId,
  sourceId,
}: {
  workspaceId: string;
  sourceId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/sources/${sourceId}/extract`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    if (!response.ok) {
      setError(
        "A completed parsed version is required before proposing changes.",
      );
    } else {
      const result = (await response.json()) as { proposalId: string };
      router.push(`/review/${result.proposalId}`);
    }
    setBusy(false);
  }

  return (
    <div>
      <button
        className="ui-button"
        disabled={busy}
        onClick={generate}
        type="button"
      >
        {busy ? "Preparing review…" : "Generate review-only proposal"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
