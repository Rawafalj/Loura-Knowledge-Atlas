import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <p className="eyebrow">Private Loura workspace</p>
      <h1>Understand before you act.</h1>
      <p>
        Build a trustworthy understanding of Loura, follow what matters next,
        and work from evidence you can inspect.
      </p>
      <LoginForm />
    </main>
  );
}
