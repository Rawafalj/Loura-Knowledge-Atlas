"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  learningPathInputSchema,
  masteryInputSchema,
} from "@/lib/learning/contracts";
import {
  saveLearningPath,
  saveMastery,
  savePrerequisiteWaiver,
} from "@/lib/learning/mutations";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export async function updateMasteryAction(formData: FormData) {
  const { membership } = await requireWorkspaceMembership();
  const rawReturnTo = String(formData.get("returnTo") || "/mastery");
  const safeReturnTo =
    rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : "/mastery";
  const parsed = masteryInputSchema.safeParse({
    conceptId: formData.get("conceptId"),
    conceptSlug: formData.get("conceptSlug"),
    currentLevel: formData.get("currentLevel"),
    targetLevel: formData.get("targetLevel"),
    status: formData.get("status"),
    evidenceType: formData.get("evidenceType"),
    note: formData.get("note"),
    artifactUrl: formData.get("artifactUrl"),
    returnTo: safeReturnTo,
  });
  if (!parsed.success) {
    redirect(
      `${safeReturnTo}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the mastery update")}`,
    );
  }
  await saveMastery(membership.workspaceId, parsed.data);
  revalidatePath("/mastery");
  revalidatePath(`/concepts/${parsed.data.conceptSlug}`);
  revalidatePath("/paths");
  redirect(`${parsed.data.returnTo}?saved=mastery`);
}

export async function saveLearningPathAction(formData: FormData) {
  const { membership } = await requireWorkspaceMembership();
  if (membership.role === "viewer") redirect("/paths");
  const raw = String(formData.get("payload") ?? "");
  const parsed = learningPathInputSchema.safeParse(
    (() => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return null;
      }
    })(),
  );
  if (!parsed.success) redirect("/paths?error=Check+the+path+editor+fields");
  const input = parsed.data;
  await saveLearningPath(membership.workspaceId, input);
  revalidatePath("/paths");
  revalidatePath(`/paths/${input.slug}`);
  redirect(`/paths/${input.slug}?saved=path`);
}

export async function saveWaiverAction(formData: FormData) {
  const { membership } = await requireWorkspaceMembership();
  const pathSlug = String(formData.get("pathSlug") ?? "");
  await savePrerequisiteWaiver(membership.workspaceId, {
    pathId: String(formData.get("pathId") ?? ""),
    targetConceptId: String(formData.get("targetConceptId") ?? ""),
    prerequisiteConceptId: String(formData.get("prerequisiteConceptId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  revalidatePath(`/paths/${pathSlug}`);
  redirect(`/paths/${pathSlug}?saved=waiver`);
}
