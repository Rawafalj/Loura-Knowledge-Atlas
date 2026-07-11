import { z } from "zod";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { proposalReviewSchema } from "./contracts";

const proposalSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid(),
  source_version_id: z.uuid().nullable(),
  ai_run_id: z.uuid().nullable(),
  title: z.string(),
  status: z.string(),
  summary: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const itemSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid(),
  proposal_id: z.uuid(),
  item_type: z.string(),
  target_type: z.string().nullable(),
  target_id: z.uuid().nullable(),
  base_revision_id: z.uuid().nullable(),
  proposed_payload: z.record(z.string(), z.unknown()),
  evidence_segment_ids: z.array(z.uuid()),
  confidence: z.number().nullable(),
  rationale: z.string().nullable(),
  status: z.string(),
  rejection_reason: z.string().nullable(),
  edited_payload: z.record(z.string(), z.unknown()).nullable(),
  reviewed_at: z.string().nullable(),
});

export type Proposal = z.infer<typeof proposalSchema>;
export type ProposalItem = z.infer<typeof itemSchema>;

export async function createMockProposalForSource(
  workspaceId: string,
  sourceId: string,
) {
  const supabase = await createSupabaseServerClient();
  const sourceResult = await supabase
    .from("sources")
    .select("id, title, latest_source_version_id")
    .eq("workspace_id", workspaceId)
    .eq("id", sourceId)
    .maybeSingle();
  if (sourceResult.error || !sourceResult.data?.latest_source_version_id) {
    throw new Error("SOURCE_NOT_READY");
  }
  const versionId = sourceResult.data.latest_source_version_id;
  const segmentsResult = await supabase
    .from("source_segments")
    .select("id, ordinal, text")
    .eq("workspace_id", workspaceId)
    .eq("source_version_id", versionId)
    .order("ordinal")
    .limit(1);
  if (segmentsResult.error || !segmentsResult.data[0]) {
    throw new Error("SOURCE_NOT_READY");
  }
  const segment = segmentsResult.data[0];
  const idempotencyKey = `mock-extraction:${versionId}:atlas-extract-v1`;
  const existingRun = await supabase
    .from("ai_runs")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existingRun.error) throw new Error("EXTRACTION_FAILED");
  if (existingRun.data) {
    const existingProposal = await supabase
      .from("change_proposals")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("ai_run_id", existingRun.data.id)
      .maybeSingle();
    if (existingProposal.data) return existingProposal.data.id;
  }

  const run = await supabase
    .from("ai_runs")
    .insert({
      workspace_id: workspaceId,
      run_type: "extraction",
      status: "completed",
      provider: "mock",
      model_id: "deterministic-fixture",
      prompt_version: "atlas-extract-prompt-v1",
      schema_version: "atlas-extract-v1",
      idempotency_key: idempotencyKey,
      input_refs: {
        sourceId,
        sourceVersionId: versionId,
        segmentIds: [segment.id],
      },
    })
    .select("id")
    .single();
  if (run.error || !run.data) throw new Error("EXTRACTION_FAILED");
  const proposal = await supabase
    .from("change_proposals")
    .insert({
      workspace_id: workspaceId,
      source_version_id: versionId,
      ai_run_id: run.data.id,
      title: `Mock extraction · ${sourceResult.data.title}`,
      status: "ready_for_review",
      summary:
        "Deterministic mock output for review-flow validation; it does not assert new canonical knowledge.",
    })
    .select("id")
    .single();
  if (proposal.error || !proposal.data) throw new Error("EXTRACTION_FAILED");
  const item = await supabase.from("change_proposal_items").insert({
    workspace_id: workspaceId,
    proposal_id: proposal.data.id,
    item_type: "add_citation",
    proposed_payload: {
      sourceTitle: sourceResult.data.title,
      segmentOrdinal: segment.ordinal,
      excerptPreview: segment.text.slice(0, 280),
    },
    evidence_segment_ids: [segment.id],
    confidence: 0.25,
    rationale:
      "Mock provider output; inspect the exact stored segment before accepting.",
  });
  if (item.error) throw new Error("EXTRACTION_FAILED");
  return proposal.data.id;
}

export async function listProposals(workspaceId: string) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("change_proposals")
    .select(
      "id, workspace_id, source_version_id, ai_run_id, title, status, summary, created_at, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (result.error) throw new Error("Unable to load the proposal queue.");
  return z.array(proposalSchema).parse(result.data);
}

export async function getProposalDetail(
  workspaceId: string,
  proposalId: string,
) {
  const supabase = await createSupabaseServerClient();
  const proposalResult = await supabase
    .from("change_proposals")
    .select(
      "id, workspace_id, source_version_id, ai_run_id, title, status, summary, created_at, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", proposalId)
    .maybeSingle();
  if (proposalResult.error) throw new Error("Unable to load the proposal.");
  if (!proposalResult.data) return null;

  const sourceVersionResult = proposalResult.data.source_version_id
    ? await supabase
        .from("source_versions")
        .select("source_id")
        .eq("workspace_id", workspaceId)
        .eq("id", proposalResult.data.source_version_id)
        .maybeSingle()
    : { data: null, error: null };
  if (sourceVersionResult.error)
    throw new Error("Unable to load proposal source.");

  const itemsResult = await supabase
    .from("change_proposal_items")
    .select(
      "id, workspace_id, proposal_id, item_type, target_type, target_id, base_revision_id, proposed_payload, evidence_segment_ids, confidence, rationale, status, rejection_reason, edited_payload, reviewed_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("proposal_id", proposalId)
    .order("created_at");
  if (itemsResult.error) throw new Error("Unable to load proposal items.");
  const proposal = proposalSchema.parse(proposalResult.data);
  const items = z.array(itemSchema).parse(itemsResult.data);
  const segmentIds = [
    ...new Set(items.flatMap((item) => item.evidence_segment_ids)),
  ];
  const segmentsResult = segmentIds.length
    ? await supabase
        .from("source_segments")
        .select(
          "id, ordinal, stable_key, segment_type, heading_path, text, page_start, page_end",
        )
        .eq("workspace_id", workspaceId)
        .in("id", segmentIds)
    : { data: [], error: null };
  if (segmentsResult.error)
    throw new Error("Unable to load proposal evidence.");
  return {
    proposal,
    items,
    segments: segmentsResult.data,
    sourceId: sourceVersionResult.data?.source_id ?? null,
  };
}

export async function reviewProposalItem(
  proposalId: string,
  itemId: string,
  rawInput: unknown,
) {
  const input = proposalReviewSchema.parse(rawInput);
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("review_change_proposal_item", {
    p_workspace_id: input.workspaceId,
    p_proposal_id: proposalId,
    p_item_id: itemId,
    p_action: input.action,
    p_edited_payload: (input.editedPayload ?? null) as Json,
    p_reason: input.reason ?? undefined,
  });
  if (result.error) {
    if (result.error.code === "40001") throw new Error("STALE_PROPOSAL");
    throw new Error("The proposal item could not be reviewed.");
  }
  return result.data;
}
