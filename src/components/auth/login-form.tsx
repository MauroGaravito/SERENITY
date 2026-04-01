"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginFormState } from "@/app/login/actions";

const initialState: LoginFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-link auth-submit" disabled={pending} type="submit">
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="auth-form-card">
      <div className="auth-form-grid">
        <label>
          <span>Email</span>
          <input autoComplete="email" name="email" placeholder="coordination@serenity.local" required type="email" />
        </label>

        <label>
          <span>Password</span>
          <input autoComplete="current-password" name="password" placeholder="SerenityDemo!2026" required type="password" />
        </label>
      </div>

      {state.error ? <p className="error-copy">{state.error}</p> : null}

      <div className="form-actions auth-actions">
        <SubmitButton />
      </div>
    </form>
  );
}

