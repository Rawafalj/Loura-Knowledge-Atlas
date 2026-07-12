"use client";

import { useActionState } from "react";

import { requestMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle", message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(
    requestMagicLink,
    initialState,
  );
  return (
    <form action={action} className="stack">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send private sign-in link"}
      </button>
      {state.message ? (
        <p
          className={state.status === "error" ? "message error" : "message"}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
