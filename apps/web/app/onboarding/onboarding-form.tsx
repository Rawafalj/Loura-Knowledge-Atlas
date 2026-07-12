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
      <label htmlFor="name">
        <span>What should we call this workspace?</span>
        <input
          id="name"
          name="name"
          defaultValue="Loura"
          minLength={2}
          maxLength={80}
          required
        />
      </label>
      <label className="checkbox-row">
        <input name="installSeed" type="checkbox" defaultChecked />
        <span>
          <strong>Install the starter atlas</strong>
          <small>
            Recommended: a stable ten-area knowledge geography you can deepen
            with evidence over time.
          </small>
        </span>
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Creating workspace…" : "Create workspace"}
      </button>
      {state.message ? (
        <p className="message error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
