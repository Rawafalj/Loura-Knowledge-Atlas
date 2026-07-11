import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  applicationInputSchema,
  applicationUpdateSchema,
  conceptApplicationLinkSchema,
  type ApplicationInput,
  type ApplicationUpdateInput,
  type ConceptApplicationLinkInput,
} from "./contracts";

const applicationSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid(),
  application_type: z.string(),
  title: z.string(),
  description_markdown: z.string(),
  implication_markdown: z.string().nullable(),
  status: z.string(),
  owner_user_id: z.uuid().nullable(),
  project_tag: z.string().nullable(),
  external_url: z.string().nullable(),
  created_by: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable(),
});

const linkSchema = z.object({
  workspace_id: z.uuid(),
  concept_id: z.uuid(),
  application_id: z.uuid(),
  relevance_note: z.string(),
  created_by: z.uuid(),
  created_at: z.string(),
});

export type LouraApplication = z.infer<typeof applicationSchema>;
export type ConceptApplicationLink = z.infer<typeof linkSchema>;

export async function listApplications(workspaceId: string) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("loura_applications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (result.error) throw new Error("Unable to load Loura applications.");
  return z.array(applicationSchema).parse(result.data);
}

export async function getApplicationDetail(
  workspaceId: string,
  applicationId: string,
) {
  const supabase = await createSupabaseServerClient();
  const applicationResult = await supabase
    .from("loura_applications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", applicationId)
    .maybeSingle();
  if (applicationResult.error)
    throw new Error("Unable to load Loura application.");
  if (!applicationResult.data) return null;
  const linksResult = await supabase
    .from("concept_applications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("application_id", applicationId)
    .order("created_at");
  if (linksResult.error) throw new Error("Unable to load application links.");
  const links = z.array(linkSchema).parse(linksResult.data);
  const conceptIds = links.map((link) => link.concept_id);
  const conceptsResult = conceptIds.length
    ? await supabase
        .from("concepts")
        .select("id, slug, canonical_name, concise_definition, content_status")
        .eq("workspace_id", workspaceId)
        .in("id", conceptIds)
    : { data: [], error: null };
  if (conceptsResult.error) throw new Error("Unable to load linked concepts.");
  return {
    application: applicationSchema.parse(applicationResult.data),
    links,
    concepts: conceptsResult.data,
  };
}

export async function listApplicationsForConcept(
  workspaceId: string,
  conceptId: string,
) {
  const supabase = await createSupabaseServerClient();
  const linksResult = await supabase
    .from("concept_applications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("concept_id", conceptId)
    .order("created_at", { ascending: false });
  if (linksResult.error)
    throw new Error("Unable to load concept applications.");
  const links = z.array(linkSchema).parse(linksResult.data);
  if (!links.length) return [];
  const applicationIds = links.map((link) => link.application_id);
  const applicationsResult = await supabase
    .from("loura_applications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .in("id", applicationIds);
  if (applicationsResult.error)
    throw new Error("Unable to load concept applications.");
  const applications = z
    .array(applicationSchema)
    .parse(applicationsResult.data);
  const byId = new Map(
    applications.map((application) => [application.id, application]),
  );
  return links.flatMap((link) => {
    const application = byId.get(link.application_id);
    return application ? [{ link, application }] : [];
  });
}

export async function createApplication(
  workspaceId: string,
  rawInput: ApplicationInput,
) {
  const input = applicationInputSchema.parse(rawInput);
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("create_loura_application", {
    p_workspace_id: workspaceId,
    p_application_type: input.applicationType,
    p_title: input.title,
    p_description_markdown: input.description,
    p_implication_markdown: undefined,
    p_status: input.status,
    p_owner_user_id: input.ownerUserId ?? undefined,
    p_project_tag: input.projectTag ?? undefined,
    p_external_url: input.externalUrl || undefined,
  });
  if (result.error) throw new Error("Unable to create Loura application.");
  return applicationSchema.parse(result.data);
}

export async function updateApplication(
  workspaceId: string,
  rawInput: ApplicationUpdateInput,
) {
  const input = applicationUpdateSchema.parse(rawInput);
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("update_loura_application", {
    p_workspace_id: workspaceId,
    p_application_id: input.applicationId,
    p_application_type: input.applicationType,
    p_title: input.title,
    p_description_markdown: input.description,
    p_implication_markdown: undefined,
    p_status: input.status,
    p_owner_user_id: input.ownerUserId ?? undefined,
    p_project_tag: input.projectTag ?? undefined,
    p_external_url: input.externalUrl || undefined,
  });
  if (result.error)
    throw new Error(
      result.error.code === "40001"
        ? "STALE_APPLICATION"
        : "Unable to update Loura application.",
    );
  return applicationSchema.parse(result.data);
}

export async function linkConceptApplication(
  workspaceId: string,
  rawInput: ConceptApplicationLinkInput,
) {
  const input = conceptApplicationLinkSchema.parse(rawInput);
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("link_concept_application", {
    p_workspace_id: workspaceId,
    p_concept_id: input.conceptId,
    p_application_id: input.applicationId,
    p_relevance_note: input.relevanceNote,
  });
  if (result.error)
    throw new Error("Unable to link this concept to the application.");
  return linkSchema.parse(result.data);
}

export async function unlinkConceptApplication(
  workspaceId: string,
  input: { applicationId: string; conceptId: string },
) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("unlink_concept_application", {
    p_workspace_id: workspaceId,
    p_concept_id: input.conceptId,
    p_application_id: input.applicationId,
  });
  if (result.error) throw new Error("Unable to unlink this concept.");
}

export async function archiveApplication(
  workspaceId: string,
  applicationId: string,
) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("archive_loura_application", {
    p_workspace_id: workspaceId,
    p_application_id: applicationId,
  });
  if (result.error) throw new Error("Unable to archive Loura application.");
  return applicationSchema.parse(result.data);
}
