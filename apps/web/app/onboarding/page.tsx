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
      <h1>Create the private atlas workspace</h1>
      <p>
        The first authenticated user becomes owner. Seed entries remain draft
        until deliberately reviewed.
      </p>
      <OnboardingForm />
    </main>
  );
}
