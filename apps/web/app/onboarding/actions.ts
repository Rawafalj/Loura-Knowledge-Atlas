"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { bootstrapWorkspace } from "@/lib/atlas/bootstrap";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export type OnboardingState = { status: "idle" | "error"; message: string };

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  installSeed: z.boolean(),
});

function generatedWorkspaceSlug(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const base = normalized || "loura-workspace";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createWorkspace(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  await requireAuthenticatedUser();
  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    installSeed: formData.get("installSeed") === "on",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Name the workspace to create your atlas.",
    };
  }
  try {
    await bootstrapWorkspace({
      name: parsed.data.name,
      slug: generatedWorkspaceSlug(parsed.data.name),
      installSeed: parsed.data.installSeed,
    });
  } catch {
    return {
      status: "error",
      message: "Workspace setup failed. Try again in a moment.",
    };
  }
  redirect("/atlas");
}
