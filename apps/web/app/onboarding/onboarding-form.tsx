"use client";

import { useActionState } from "react";

import { createWorkspace, type OnboardingState } from "./actions";

const initialState: OnboardingState = { status: "idle", message: "" };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(
    createWorkspace,
    initialState,
  );
  return (
    <form action={action} className="stack">
      <label htmlFor="name">Workspace name</label>
      <input
        id="name"
        name="name"
        defaultValue="Loura"
        minLength={2}
        maxLength={80}
        required
      />
      <label htmlFor="slug">Workspace slug</label>
      <input
        id="slug"
        name="slug"
        defaultValue="loura"
        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        required
      />
      <label className="checkbox-row">
        <input name="installSeed" type="checkbox" defaultChecked />
        Install the ten-area atlas and curated first learning route
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Creating workspace…" : "Create private workspace"}
      </button>
      {state.message ? (
        <p className="message error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
