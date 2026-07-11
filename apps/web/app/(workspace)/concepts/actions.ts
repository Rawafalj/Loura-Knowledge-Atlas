"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createConceptInputSchema,
  parseAliasesFormValue,
  relationInputSchema,
  updateConceptInputSchema,
  updateRelationInputSchema,
} from "@/lib/atlas/contracts";
import {
  AtlasMutationError,
  createConcept,
  createRelation,
  removeRelation,
  updateConcept,
  updateRelation,
} from "@/lib/atlas/mutations";
import { requireWorkspaceMembership } from "@/lib/auth/session";

export type AtlasActionState = {
  status: "idle" | "error" | "success";
  message: string;
  route?: string;
};

const routeSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function conceptFields(formData: FormData) {
  return {
    canonicalName: value(formData, "canonicalName"),
    conciseDefinition: value(formData, "conciseDefinition"),
    synthesisMarkdown: value(formData, "synthesisMarkdown"),
    whyItExistsMarkdown: value(formData, "whyItExistsMarkdown"),
    mechanismMarkdown: value(formData, "mechanismMarkdown"),
    examplesMarkdown: value(formData, "examplesMarkdown"),
    counterexamplesMarkdown: value(formData, "counterexamplesMarkdown"),
    failureModesMarkdown: value(formData, "failureModesMarkdown"),
    commonConfusionsMarkdown: value(formData, "commonConfusionsMarkdown"),
    canonicalDomainId: value(formData, "canonicalDomainId"),
    canonicalParentId: value(formData, "canonicalParentId"),
    conceptKind: value(formData, "conceptKind"),
    contentStatus: value(formData, "contentStatus"),
    priority: value(formData, "priority"),
    targetMastery: value(formData, "targetMastery"),
    reviewNote: value(formData, "reviewNote"),
    replacementConceptId: value(formData, "replacementConceptId"),
    aliases: parseAliasesFormValue(formData.get("aliases")),
    changeSummary: value(formData, "changeSummary"),
  };
}

function actionError(error: unknown): AtlasActionState {
  if (error instanceof AtlasMutationError) {
    return { status: "error", message: error.message };
  }
  if (error instanceof z.ZodError) {
    return {
      status: "error",
      message: error.issues[0]?.message ?? "Check the form values.",
    };
  }
  if (error instanceof Error && error.message === "Aliases are invalid.") {
    return { status: "error", message: error.message };
  }
  return { status: "error", message: "The atlas change could not be saved." };
}

export async function createConceptAction(
  _previousState: AtlasActionState,
  formData: FormData,
): Promise<AtlasActionState> {
  try {
    const { membership } = await requireWorkspaceMembership();
    const input = createConceptInputSchema.parse({
      ...conceptFields(formData),
      slug: value(formData, "slug"),
    });
    const result = await createConcept(membership.workspaceId, input);
    revalidatePath("/atlas");
    revalidatePath(`/concepts/${result.slug}`);
    return {
      status: "success",
      message: result.searchIndexed
        ? "Concept created."
        : "Concept created; semantic indexing is pending.",
      route: `/concepts/${result.slug}`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateConceptAction(
  _previousState: AtlasActionState,
  formData: FormData,
): Promise<AtlasActionState> {
  try {
    const { membership } = await requireWorkspaceMembership();
    const input = updateConceptInputSchema.parse({
      ...conceptFields(formData),
      conceptId: value(formData, "conceptId"),
      expectedUpdatedAt: value(formData, "expectedUpdatedAt"),
    });
    const result = await updateConcept(membership.workspaceId, input);
    revalidatePath("/atlas");
    revalidatePath(`/concepts/${result.slug}`);
    return {
      status: "success",
      message: result.searchIndexed
        ? "Concept and revision saved."
        : "Concept saved; semantic indexing is pending.",
      route: `/concepts/${result.slug}`,
    };
  } catch (error) {
    return actionError(error);
  }
}

function relationFields(formData: FormData) {
  return {
    sourceConceptId: value(formData, "sourceConceptId"),
    relationTypeId: value(formData, "relationTypeId"),
    targetConceptId: value(formData, "targetConceptId"),
    description: value(formData, "description"),
    reviewStatus: value(formData, "reviewStatus"),
  };
}

export async function createRelationAction(
  _previousState: AtlasActionState,
  formData: FormData,
): Promise<AtlasActionState> {
  try {
    const { membership } = await requireWorkspaceMembership();
    const input = relationInputSchema.parse(relationFields(formData));
    await createRelation(membership.workspaceId, input);
    const originSlug = routeSlugSchema.parse(value(formData, "originSlug"));
    revalidatePath(`/concepts/${originSlug}`);
    return {
      status: "success",
      message: "Relationship created.",
      route: `/concepts/${originSlug}?tab=relationships`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateRelationAction(
  _previousState: AtlasActionState,
  formData: FormData,
): Promise<AtlasActionState> {
  try {
    const { membership } = await requireWorkspaceMembership();
    const input = updateRelationInputSchema.parse({
      ...relationFields(formData),
      relationId: value(formData, "relationId"),
      expectedUpdatedAt: value(formData, "expectedUpdatedAt"),
    });
    await updateRelation(membership.workspaceId, input);
    const originSlug = routeSlugSchema.parse(value(formData, "originSlug"));
    revalidatePath(`/concepts/${originSlug}`);
    return {
      status: "success",
      message: "Relationship updated.",
      route: `/concepts/${originSlug}?tab=relationships`,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeRelationAction(
  _previousState: AtlasActionState,
  formData: FormData,
): Promise<AtlasActionState> {
  try {
    const { membership } = await requireWorkspaceMembership();
    const relationId = z.uuid().parse(value(formData, "relationId"));
    const expectedUpdatedAt = z.iso
      .datetime({ offset: true })
      .parse(value(formData, "expectedUpdatedAt"));
    const originSlug = routeSlugSchema.parse(value(formData, "originSlug"));
    await removeRelation(membership.workspaceId, relationId, expectedUpdatedAt);
    revalidatePath(`/concepts/${originSlug}`);
    return {
      status: "success",
      message: "Relationship removed.",
      route: `/concepts/${originSlug}?tab=relationships`,
    };
  } catch (error) {
    return actionError(error);
  }
}
