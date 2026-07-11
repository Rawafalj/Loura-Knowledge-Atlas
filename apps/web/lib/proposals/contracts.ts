import { z } from "zod";

export const proposalItemTypes = [
  "create_concept",
  "update_concept",
  "add_alias",
  "add_relation",
  "add_prerequisite",
  "add_claim",
  "add_citation",
  "mark_contradiction",
  "add_application",
] as const;

export const proposalItemStatuses = [
  "pending",
  "accepted",
  "edited_and_accepted",
  "rejected",
  "deferred",
  "stale",
] as const;

export const proposalReviewSchema = z.object({
  workspaceId: z.uuid(),
  action: z.enum(["accept", "edit_and_accept", "reject", "defer"]),
  editedPayload: z.record(z.string(), z.unknown()).nullable().optional(),
  reason: z.string().trim().max(2000).nullable().optional(),
});

export type ProposalReviewInput = z.infer<typeof proposalReviewSchema>;

export function isCitationOnlyProposal(
  itemType: (typeof proposalItemTypes)[number],
) {
  return itemType === "add_citation";
}
