import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuditEventInput = {
  workspaceId: string;
  eventType: string;
  objectType: string;
  objectId: string;
  summary: string;
  beforeSummary?: Json;
  afterSummary?: Json;
  requestId?: string;
};

export async function recordAuditEvent(
  input: AuditEventInput,
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_audit_event", {
    p_workspace_id: input.workspaceId,
    p_event_type: input.eventType,
    p_object_type: input.objectType,
    p_object_id: input.objectId,
    p_summary: input.summary,
    p_before_summary: input.beforeSummary,
    p_after_summary: input.afterSummary,
    p_request_id: input.requestId,
  });
  if (error) throw new Error(`Unable to record audit event: ${error.code}`);
  return data;
}
