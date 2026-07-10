import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <p className="eyebrow">Private research workspace</p>
      <h1>Loura Knowledge Atlas</h1>
      <p>
        Sign in with your email address. No source or question content is sent
        to analytics.
      </p>
      <LoginForm />
    </main>
  );
}
