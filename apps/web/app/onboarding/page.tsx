import { redirect } from "next/navigation";

import {
  getCurrentMembership,
  requireAuthenticatedUser,
} from "@/lib/auth/session";

import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireAuthenticatedUser();
  if (await getCurrentMembership(user.id)) redirect("/atlas");
  return (
    <main className="auth-page">
      <p className="eyebrow">First owner setup</p>
      <h1>Start with a useful outcome</h1>
      <p>
        Set up a private space to understand Loura, work from evidence, and
        choose what to learn next. You can change the structure later.
      </p>
      <OnboardingForm />
    </main>
  );
}
