"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { bootstrapWorkspace } from "@/lib/atlas/bootstrap";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export type OnboardingState = { status: "idle" | "error"; message: string };

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  installSeed: z.boolean(),
});

export async function createWorkspace(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  await requireAuthenticatedUser();
  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    installSeed: formData.get("installSeed") === "on",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a valid workspace name and lowercase URL slug.",
    };
  }
  try {
    await bootstrapWorkspace(parsed.data);
  } catch {
    return {
      status: "error",
      message: "Workspace setup failed. The slug may already be in use.",
    };
  }
  redirect("/atlas");
}
