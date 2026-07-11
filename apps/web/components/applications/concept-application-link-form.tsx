"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApplicationOption = { id: string; title: string; status: string };

export function ConceptApplicationLinkForm({
  workspaceId,
  conceptId,
  applications,
}: {
  workspaceId: string;
  conceptId: string;
  applications: ApplicationOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const applicationId = String(form.get("applicationId") ?? "");
    const response = await fetch(
      `/api/applications/${applicationId}/concepts`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          conceptId,
          relevanceNote: form.get("relevanceNote"),
        }),
      },
    );
    if (!response.ok) setError("The concept could not be linked.");
    else {
      event.currentTarget.reset();
      router.refresh();
    }
    setBusy(false);
  }
  if (!applications.length)
    return <p>Create an application first, then return here to link it.</p>;
  return (
    <form className="application-form" onSubmit={submit}>
      <label>
        Application
        <select name="applicationId" required defaultValue="">
          <option value="" disabled>
            Select an application
          </option>
          {applications
            .filter((application) => application.status !== "archived")
            .map((application) => (
              <option value={application.id} key={application.id}>
                {application.title}
              </option>
            ))}
        </select>
      </label>
      <label>
        Why it matters here
        <textarea
          name="relevanceNote"
          required
          minLength={3}
          maxLength={2_000}
          rows={3}
        />
      </label>
      <button
        className="ui-button ui-button--primary"
        disabled={busy}
        type="submit"
      >
        {busy ? "Linking…" : "Link application"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
