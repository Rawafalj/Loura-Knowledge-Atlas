"use client";

import Link from "next/link";

export default function RouteError({ reset }: { reset: () => void }) {
  return (
    <main className="recovery-page">
      <p className="eyebrow">Something needs attention</p>
      <h1>This part of the workspace did not load.</h1>
      <p>
        Your workspace data has not been changed. Try again, or return home and
        return to the atlas while we recover this view.
      </p>
      <div className="button-row">
        <button
          className="ui-button ui-button--primary"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
        <Link className="ui-button ui-button--secondary" href="/atlas">
          Return to atlas
        </Link>
      </div>
    </main>
  );
}
