import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  learningPathInputSchema,
  masteryInputSchema,
  type LearningPathInput,
  type MasteryInput,
} from "./contracts";

export async function saveMastery(workspaceId: string, rawInput: MasteryInput) {
  const input = masteryInputSchema.parse(rawInput);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("update_user_mastery", {
    p_workspace_id: workspaceId,
    p_concept_id: input.conceptId,
    p_current_level: input.currentLevel,
    p_target_level: input.targetLevel,
    p_status: input.status,
    p_evidence_type: input.evidenceType,
    p_note: input.note || undefined,
    p_artifact_url: input.artifactUrl || undefined,
  });
  if (error) throw new Error(`Unable to update mastery: ${error.code}`);
  return data;
}

export async function saveLearningPath(
  workspaceId: string,
  rawInput: LearningPathInput,
) {
  const input = learningPathInputSchema.parse(rawInput);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("upsert_learning_path", {
    p_workspace_id: workspaceId,
    p_payload: input,
    p_path_id: input.id ?? undefined,
  });
  if (error) throw new Error(`Unable to save learning path: ${error.code}`);
  return data;
}

export async function savePrerequisiteWaiver(
  workspaceId: string,
  input: {
    pathId: string;
    targetConceptId: string;
    prerequisiteConceptId: string;
    reason: string;
  },
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "set_learning_prerequisite_waiver",
    {
      p_workspace_id: workspaceId,
      p_learning_path_id: input.pathId,
      p_target_concept_id: input.targetConceptId,
      p_prerequisite_concept_id: input.prerequisiteConceptId,
      p_reason: input.reason,
    },
  );
  if (error) throw new Error(`Unable to save waiver: ${error.code}`);
  return data;
}
