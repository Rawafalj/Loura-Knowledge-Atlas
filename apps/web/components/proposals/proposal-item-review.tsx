"use client";

import { useState } from "react";

type Item = {
  id: string;
  item_type: string;
  proposed_payload: Record<string, unknown>;
  evidence_segment_ids: string[];
  confidence: number | null;
  rationale: string | null;
  status: string;
  rejection_reason: string | null;
};

type Segment = {
  id: string;
  ordinal: number;
  stable_key: string;
  segment_type: string;
  heading_path: string[];
  text: string;
  page_start: number | null;
  page_end: number | null;
};

export function ProposalItemReview({
  item,
  segments,
  workspaceId,
  proposalId,
  sourceId,
  canReview,
}: {
  item: Item;
  segments: Segment[];
  workspaceId: string;
  proposalId: string;
  sourceId: string | null;
  canReview: boolean;
}) {
  const [status, setStatus] = useState(item.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const evidence = segments.filter((segment) =>
    item.evidence_segment_ids.includes(segment.id),
  );

  async function review(action: "accept" | "reject" | "defer") {
    setBusy(true);
    setError(null);
    const response = await fetch(
      `/api/proposals/${proposalId}/items/${item.id}/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action,
          reason: action === "reject" ? "Rejected during review." : null,
        }),
      },
    );
    if (!response.ok) {
      setError(
        response.status === 409
          ? "This item is stale; reload and resolve the conflict."
          : "Review failed.",
      );
    } else {
      const result = (await response.json()) as { status?: string };
      setStatus(result.status ?? (action === "accept" ? "accepted" : action));
    }
    setBusy(false);
  }

  return (
    <article
      className="proposal-item"
      aria-labelledby={`proposal-item-${item.id}`}
    >
      <div className="proposal-item__current">
        <p className="eyebrow">Candidate change</p>
        <h2 id={`proposal-item-${item.id}`}>
          {item.item_type.replaceAll("_", " ")}
        </h2>
        <pre>{JSON.stringify(item.proposed_payload, null, 2)}</pre>
        <p>
          Confidence:{" "}
          {item.confidence === null
            ? "not recorded"
            : `${Math.round(item.confidence * 100)}%`}
        </p>
        {item.rationale ? <p>{item.rationale}</p> : null}
      </div>
      <div className="proposal-item__evidence">
        <p className="eyebrow">Evidence</p>
        {evidence.length ? (
          evidence.map((segment) => (
            <blockquote key={segment.id}>
              {sourceId ? (
                <a href={`/sources/${sourceId}#segment-${segment.id}`}>
                  Segment {segment.ordinal}
                </a>
              ) : (
                <span>Segment {segment.ordinal}</span>
              )}
              <p>{segment.text}</p>
            </blockquote>
          ))
        ) : (
          <p>No stored evidence segment matched this item.</p>
        )}
      </div>
      <div className="proposal-item__actions">
        <span>Status: {status.replaceAll("_", " ")}</span>
        {canReview && status === "pending" ? (
          <div className="button-row">
            <button
              className="ui-button ui-button--primary"
              disabled={busy}
              onClick={() => review("accept")}
              type="button"
            >
              Accept
            </button>
            <button
              className="ui-button"
              disabled={busy}
              onClick={() => review("defer")}
              type="button"
            >
              Defer
            </button>
            <button
              className="ui-button"
              disabled={busy}
              onClick={() => review("reject")}
              type="button"
            >
              Reject
            </button>
          </div>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
      </div>
    </article>
  );
}
