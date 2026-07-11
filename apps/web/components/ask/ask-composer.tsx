"use client";

import { useRef, useState } from "react";

import { Markdown } from "@/components/markdown";

type Citation = {
  citationId: string;
  citation?: {
    sourceId: string;
    sourceTitle: string;
    text: string;
    ordinal?: number;
    location?: string;
  };
};

export function AskComposer({ workspaceId }: { workspaceId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [conceptIds, setConceptIds] = useState<string[]>([]);
  const [insufficient, setInsufficient] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function ask() {
    if (!question.trim() || busy) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setAnswer(null);
    setCitations([]);
    setConceptIds([]);
    setInsufficient(false);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Accept: "text/event-stream",
        },
        signal: controller.signal,
        body: JSON.stringify({
          workspaceId,
          threadId,
          question,
          scope: { reviewedOnly: true, includeDraftProposals: false },
        }),
      });
      if (!response.ok || !response.body)
        throw new Error("Ask Atlas is unavailable.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const eventName = raw.match(/^event: (.+)$/m)?.[1];
          const data = raw.match(/^data: (.+)$/m)?.[1];
          if (!eventName || !data) continue;
          const payload = JSON.parse(data) as Record<string, unknown>;
          if (eventName === "answer.delta")
            setAnswer(String(payload.text ?? ""));
          if (eventName === "answer.citation")
            setCitations((current) => [
              ...current,
              payload as unknown as Citation,
            ]);
          if (eventName === "answer.concepts")
            setConceptIds((payload.conceptIds as string[]) ?? []);
          if (eventName === "answer.insufficient_evidence")
            setInsufficient(true);
          if (eventName === "answer.completed") {
            setThreadId(
              typeof payload.threadId === "string" ? payload.threadId : null,
            );
            const completed = payload.answer as
              | { answerMarkdown?: string; evidenceAssessment?: string }
              | undefined;
            if (completed?.answerMarkdown) setAnswer(completed.answerMarkdown);
            if (completed?.evidenceAssessment === "insufficient")
              setInsufficient(true);
          }
          if (eventName === "answer.error")
            setError(String(payload.message ?? "Ask Atlas failed."));
        }
      }
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) {
        setError(
          caught instanceof Error ? caught.message : "Ask Atlas failed.",
        );
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  return (
    <div className="ask-layout">
      <form
        className="ask-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void ask();
        }}
      >
        <label htmlFor="ask-question">Question</label>
        <textarea
          id="ask-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask why a retry can create a dangerous duplicate action…"
          rows={5}
        />
        <p className="form-help">
          Reviewed concepts and completed source segments only. Source text is
          treated as untrusted evidence.
        </p>
        <div className="button-row">
          <button
            className="ui-button ui-button--primary"
            disabled={busy || !question.trim()}
            type="submit"
          >
            {busy ? "Answering…" : "Ask Atlas"}
          </button>
          {busy ? (
            <button
              className="ui-button"
              onClick={() => abortRef.current?.abort()}
              type="button"
            >
              Stop
            </button>
          ) : null}
        </div>
        {error ? <p role="alert">{error}</p> : null}
      </form>
      <section className="ask-answer" aria-live="polite" aria-busy={busy}>
        <p className="eyebrow">Grounded answer</p>
        {insufficient ? (
          <p className="ask-insufficient">
            The reviewed atlas does not contain enough evidence to answer this
            confidently.
          </p>
        ) : null}
        {answer ? (
          <Markdown>{answer}</Markdown>
        ) : (
          <p className="form-help">
            Your answer will appear here with exact source citations.
          </p>
        )}
        {conceptIds.length ? (
          <p className="form-help">Concepts used: {conceptIds.join(", ")}</p>
        ) : null}
        {citations.length ? (
          <aside className="ask-citations" aria-label="Citations">
            <h2>Citations</h2>
            {citations.map((citation) => (
              <blockquote key={citation.citationId}>
                {citation.citation ? (
                  <a
                    href={`/sources/${citation.citation.sourceId}#segment-${citation.citationId}`}
                  >
                    {citation.citation.sourceTitle} · segment{" "}
                    {citation.citation.ordinal ?? citation.citationId}
                  </a>
                ) : (
                  <span>{citation.citationId}</span>
                )}
                {citation.citation ? <p>{citation.citation.text}</p> : null}
              </blockquote>
            ))}
          </aside>
        ) : null}
      </section>
    </div>
  );
}
