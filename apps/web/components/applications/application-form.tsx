"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApplicationForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        title: form.get("title"),
        description: form.get("description"),
        applicationType: form.get("applicationType"),
        status: form.get("status"),
        projectTag: form.get("projectTag") || null,
        externalUrl: form.get("externalUrl") || null,
      }),
    });
    if (!response.ok) {
      setError("The application could not be created.");
    } else {
      const result = (await response.json()) as { id: string };
      router.push(`/applications/${result.id}`);
    }
    setBusy(false);
  }

  return (
    <form className="application-form" onSubmit={submit}>
      <label>
        Title
        <input name="title" required maxLength={240} />
      </label>
      <label>
        Type
        <select name="applicationType" defaultValue="component">
          <option value="decision">Decision</option>
          <option value="component">Component</option>
          <option value="experiment">Experiment</option>
          <option value="deployment_question">Deployment question</option>
          <option value="artifact">Artifact</option>
          <option value="risk">Risk</option>
          <option value="requirement">Requirement</option>
        </select>
      </label>
      <label>
        Status
        <select name="status" defaultValue="proposed">
          <option value="proposed">Proposed</option>
          <option value="active">Active</option>
          <option value="decided">Decided</option>
          <option value="validated">Validated</option>
        </select>
      </label>
      <label>
        Description
        <textarea name="description" required rows={7} />
      </label>
      <label>
        Project tag
        <input name="projectTag" maxLength={120} />
      </label>
      <label>
        External URL
        <input name="externalUrl" type="url" placeholder="https://…" />
      </label>
      <div className="button-row">
        <button
          className="ui-button ui-button--primary"
          disabled={busy}
          type="submit"
        >
          {busy ? "Creating…" : "Create application"}
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
