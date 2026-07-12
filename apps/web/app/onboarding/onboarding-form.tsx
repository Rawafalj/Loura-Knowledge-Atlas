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
      <fieldset className="starting-point-picker">
        <legend>What would you like to do first?</legend>
        <p>Choose a starting point. You can switch modes at any time.</p>
        <label>
          <input
            defaultChecked
            name="startingPoint"
            type="radio"
            value="understand"
          />
          <span>
            <strong>Understand a topic</strong>
            <small>Explore the knowledge landscape and connected ideas.</small>
          </span>
        </label>
        <label>
          <input name="startingPoint" type="radio" value="learn" />
          <span>
            <strong>Follow a learning route</strong>
            <small>
              See what matters next and work through it deliberately.
            </small>
          </span>
        </label>
        <label>
          <input name="startingPoint" type="radio" value="evidence" />
          <span>
            <strong>Add evidence</strong>
            <small>Bring in a private source for later cited answers.</small>
          </span>
        </label>
        <label>
          <input name="startingPoint" type="radio" value="apply" />
          <span>
            <strong>Connect knowledge to a decision</strong>
            <small>
              Start from the context behind a Loura decision or question.
            </small>
          </span>
        </label>
      </fieldset>
      <label className="checkbox-row">
        <input name="installSeed" type="checkbox" defaultChecked />
        <span>
          <strong>Install the starter atlas</strong>
          <small>
            Recommended: ten knowledge areas and one curated learning route.
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
