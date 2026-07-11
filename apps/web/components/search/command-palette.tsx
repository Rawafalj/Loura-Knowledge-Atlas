"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@loura/ui";

import {
  searchResponseSchema,
  type SearchResponse,
  type SearchResult,
} from "@/lib/search/contracts";

type SearchStatus = "idle" | "searching" | "ready" | "error";

function MatchReasons({ result }: { result: SearchResult }) {
  return (
    <span className="search-match-reasons" aria-label="Match reasons">
      {result.matchReasons.map((reason) => (
        <Badge key={reason} tone={reason === "semantic" ? "accent" : undefined}>
          {reason}
        </Badge>
      ))}
    </span>
  );
}

export function CommandPalette({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const results = useMemo(
    () => [...(response?.concepts ?? []), ...(response?.sources ?? [])],
    [response],
  );

  const close = () => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (event.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const searchResponse = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, query, limit: 12 }),
          signal: controller.signal,
        });
        if (!searchResponse.ok) throw new Error("Search request failed");
        const data = searchResponseSchema.parse(await searchResponse.json());
        setResponse(data);
        setSelectedIndex(0);
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setResponse(null);
        setStatus("error");
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query, workspaceId]);

  const openResult = (result: SearchResult) => {
    setOpen(false);
    router.push(result.route);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (current) => (current - 1 + results.length) % results.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const result = results[selectedIndex];
      if (result) openResult(result);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        className="utility-search-trigger"
        type="button"
        onClick={() => {
          setOpen(true);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
        aria-haspopup="dialog"
      >
        <span>Search the atlas</span>
        <kbd>⌘ K</kbd>
      </button>
      {open ? (
        <div className="command-palette-layer">
          <button
            className="command-palette-backdrop"
            type="button"
            aria-label="Close search"
            onClick={close}
          />
          <section
            className="command-palette"
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-palette-heading"
          >
            <div className="command-palette__header">
              <div>
                <p className="eyebrow">Find · Navigate</p>
                <h2 id="command-palette-heading">Search the atlas</h2>
              </div>
              <button className="text-button" type="button" onClick={close}>
                Close
              </button>
            </div>
            <label className="command-search-field">
              <span className="sr-only">Search concepts and sources</span>
              <input
                ref={inputRef}
                value={query}
                placeholder="Try a title, alias, or plain-language description"
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  setSelectedIndex(0);
                  if (nextQuery.trim().length >= 2) {
                    setStatus("searching");
                  } else {
                    setStatus("idle");
                    setResponse(null);
                  }
                }}
                onKeyDown={onInputKeyDown}
                aria-controls="command-search-results"
                aria-activedescendant={
                  results[selectedIndex]
                    ? `search-result-${results[selectedIndex].id}`
                    : undefined
                }
              />
            </label>
            <div
              className="command-palette__body"
              id="command-search-results"
              role="listbox"
              aria-label="Search results"
            >
              {status === "idle" ? (
                <div className="command-palette__empty">
                  <strong>Search stable knowledge geography.</strong>
                  <p>
                    Results explain whether the title, an alias, indexed text,
                    or semantic retrieval produced the match.
                  </p>
                </div>
              ) : null}
              {status === "searching" ? (
                <p className="search-status" role="status">
                  Searching lexical and semantic indexes…
                </p>
              ) : null}
              {status === "error" ? (
                <p className="message error" role="alert">
                  Search is temporarily unavailable. Your atlas remains
                  accessible through domains and concept links.
                </p>
              ) : null}
              {status === "ready" && !results.length ? (
                <div className="command-palette__empty" role="status">
                  <strong>No atlas matches</strong>
                  <p>Try a canonical term, alias, or a broader description.</p>
                </div>
              ) : null}
              {results.map((result, index) => (
                <button
                  id={`search-result-${result.id}`}
                  key={`${result.type}:${result.id}`}
                  className="search-result"
                  data-selected={index === selectedIndex}
                  type="button"
                  role="option"
                  aria-selected={index === selectedIndex}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => openResult(result)}
                >
                  <span className="search-result__content">
                    <span>
                      <strong>{result.title}</strong>
                      {result.contentStatus ? (
                        <Badge tone={result.contentStatus}>
                          {result.contentStatus}
                        </Badge>
                      ) : null}
                    </span>
                    {result.subtitle ? <small>{result.subtitle}</small> : null}
                    {result.snippet ? <p>{result.snippet}</p> : null}
                    {result.matchDetail ? (
                      <small>{result.matchDetail}</small>
                    ) : null}
                  </span>
                  <MatchReasons result={result} />
                </button>
              ))}
            </div>
            <footer className="command-palette__footer">
              <span>↑↓ select</span>
              <span>Enter open</span>
              <span>Esc close</span>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
