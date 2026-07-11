CREATE TYPE "public"."ai_run_status" AS ENUM('queued', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ai_run_type" AS ENUM('source_summary', 'extraction', 'resolution', 'synthesis', 'ask', 'assessment');--> statement-breakpoint
CREATE TYPE "public"."proposal_item_status" AS ENUM('pending', 'accepted', 'edited_and_accepted', 'rejected', 'deferred', 'stale');--> statement-breakpoint
CREATE TYPE "public"."proposal_item_type" AS ENUM('create_concept', 'update_concept', 'add_alias', 'add_relation', 'add_prerequisite', 'add_claim', 'add_citation', 'mark_contradiction', 'add_application');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'ready_for_review', 'partially_reviewed', 'accepted', 'rejected', 'mixed', 'archived');--> statement-breakpoint
CREATE TABLE "ai_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_type" "ai_run_type" NOT NULL,
	"status" "ai_run_status" DEFAULT 'queued' NOT NULL,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"prompt_version" text NOT NULL,
	"schema_version" text,
	"idempotency_key" text NOT NULL,
	"input_refs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_hash" text,
	"usage" jsonb,
	"latency_ms" integer,
	"trace_id" text,
	"error_code" text,
	"error_message_sanitized" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_runs_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "ai_runs_workspace_idempotency_unique" UNIQUE("workspace_id","idempotency_key"),
	CONSTRAINT "ai_runs_latency_check" CHECK ("ai_runs"."latency_ms" is null or "ai_runs"."latency_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE "change_proposal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"item_type" "proposal_item_type" NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"base_revision_id" uuid,
	"proposed_payload" jsonb NOT NULL,
	"evidence_segment_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"confidence" numeric(4, 3),
	"rationale" text,
	"status" "proposal_item_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"edited_payload" jsonb,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"applied_object_refs" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "change_proposal_items_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "change_proposal_items_confidence_check" CHECK ("change_proposal_items"."confidence" between 0 and 1),
	CONSTRAINT "change_proposal_items_payload_check" CHECK (jsonb_typeof("change_proposal_items"."proposed_payload") = 'object')
);
--> statement-breakpoint
CREATE TABLE "change_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_version_id" uuid,
	"ai_run_id" uuid,
	"title" text NOT NULL,
	"status" "proposal_status" DEFAULT 'draft' NOT NULL,
	"summary" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "change_proposals_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "change_proposals_title_check" CHECK (length(trim("change_proposals"."title")) > 0)
);
--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_proposal_items" ADD CONSTRAINT "change_proposal_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_proposal_items" ADD CONSTRAINT "change_proposal_items_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_proposal_items" ADD CONSTRAINT "change_proposal_items_proposal_workspace_fk" FOREIGN KEY ("proposal_id","workspace_id") REFERENCES "public"."change_proposals"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_proposals" ADD CONSTRAINT "change_proposals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_proposals" ADD CONSTRAINT "change_proposals_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_proposals" ADD CONSTRAINT "change_proposals_source_version_workspace_fk" FOREIGN KEY ("source_version_id","workspace_id") REFERENCES "public"."source_versions"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_proposals" ADD CONSTRAINT "change_proposals_ai_run_workspace_fk" FOREIGN KEY ("ai_run_id","workspace_id") REFERENCES "public"."ai_runs"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_runs_workspace_created_idx" ON "ai_runs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_runs_workspace_status_idx" ON "ai_runs" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "change_proposal_items_proposal_status_idx" ON "change_proposal_items" USING btree ("workspace_id","proposal_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "change_proposals_workspace_run_unique" ON "change_proposals" USING btree ("workspace_id","ai_run_id") WHERE "change_proposals"."ai_run_id" is not null;--> statement-breakpoint
CREATE INDEX "change_proposals_workspace_status_idx" ON "change_proposals" USING btree ("workspace_id","status","updated_at");

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_proposal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_runs_member_select ON public.ai_runs
FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY ai_runs_curator_insert ON public.ai_runs
FOR INSERT TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id, ARRAY['owner', 'editor'])
  AND (created_by IS NULL OR created_by = auth.uid())
);

CREATE POLICY change_proposals_member_select ON public.change_proposals
FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY change_proposals_curator_insert ON public.change_proposals
FOR INSERT TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id, ARRAY['owner', 'editor'])
  AND (created_by IS NULL OR created_by = auth.uid())
);

CREATE POLICY change_proposal_items_member_select ON public.change_proposal_items
FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY change_proposal_items_curator_insert ON public.change_proposal_items
FOR INSERT TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE OR REPLACE FUNCTION public.validate_change_proposal_item_evidence()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_source_version_id uuid;
  v_source_version_status public.source_version_status;
  v_segment_id uuid;
BEGIN
  IF NEW.evidence_segment_ids IS NULL THEN
    RAISE EXCEPTION 'proposal evidence segment IDs are required' USING ERRCODE = '23514';
  END IF;

  IF cardinality(NEW.evidence_segment_ids) = 0 THEN
    RAISE EXCEPTION 'proposal items require at least one evidence segment' USING ERRCODE = '23514';
  END IF;

  SELECT source_version_id INTO v_source_version_id
  FROM public.change_proposals
  WHERE id = NEW.proposal_id AND workspace_id = NEW.workspace_id;
  IF v_source_version_id IS NULL THEN
    RAISE EXCEPTION 'evidence requires a source-backed proposal' USING ERRCODE = '23514';
  END IF;

  SELECT processing_status INTO v_source_version_status
  FROM public.source_versions
  WHERE id = v_source_version_id AND workspace_id = NEW.workspace_id;
  IF v_source_version_status IS DISTINCT FROM 'completed'::public.source_version_status THEN
    RAISE EXCEPTION 'evidence requires a completed source version' USING ERRCODE = '23514';
  END IF;

  FOREACH v_segment_id IN ARRAY NEW.evidence_segment_ids LOOP
    IF v_segment_id IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.source_segments
      WHERE id = v_segment_id
        AND workspace_id = NEW.workspace_id
        AND source_version_id = v_source_version_id
    ) THEN
      RAISE EXCEPTION 'proposal evidence segment does not belong to its source version'
        USING ERRCODE = '23503';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER change_proposal_items_validate_evidence
BEFORE INSERT OR UPDATE OF proposal_id, workspace_id, evidence_segment_ids
ON public.change_proposal_items
FOR EACH ROW EXECUTE FUNCTION public.validate_change_proposal_item_evidence();

CREATE TRIGGER change_proposals_set_updated_at
BEFORE UPDATE ON public.change_proposals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ai_runs_workspace_immutable
BEFORE UPDATE OF workspace_id ON public.ai_runs
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER change_proposals_workspace_immutable
BEFORE UPDATE OF workspace_id ON public.change_proposals
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER change_proposal_items_workspace_immutable
BEFORE UPDATE OF workspace_id ON public.change_proposal_items
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();

CREATE OR REPLACE FUNCTION public.protect_reviewed_proposal_item()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  IF OLD.status <> 'pending'::public.proposal_item_status THEN
    RAISE EXCEPTION 'reviewed proposal items are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER change_proposal_items_immutable_after_review
BEFORE UPDATE OR DELETE ON public.change_proposal_items
FOR EACH ROW EXECUTE FUNCTION public.protect_reviewed_proposal_item();

GRANT SELECT, INSERT ON public.ai_runs, public.change_proposals, public.change_proposal_items
TO authenticated;

-- Review is the only authenticated path that may turn a proposal into a
-- canonical change. Worker/service-role code may create proposal rows, but it
-- never receives a canonical-write function.
CREATE OR REPLACE FUNCTION public.review_change_proposal_item(
  p_workspace_id uuid,
  p_proposal_id uuid,
  p_item_id uuid,
  p_action text,
  p_edited_payload jsonb DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role public.workspace_role;
  v_item public.change_proposal_items%ROWTYPE;
  v_proposal public.change_proposals%ROWTYPE;
  v_payload jsonb;
  v_latest_revision uuid;
  v_applied_id uuid;
  v_remaining integer;
  v_accepted integer;
  v_rejected integer;
  v_deferred integer;
  v_proposal_status public.proposal_status;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;
  SELECT role INTO v_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = v_user_id;
  IF v_role IS NULL OR v_role NOT IN ('owner', 'editor') THEN
    RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('accept', 'edit_and_accept', 'reject', 'defer') THEN
    RAISE EXCEPTION 'invalid proposal review action' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_proposal
  FROM public.change_proposals
  WHERE id = p_proposal_id AND workspace_id = p_workspace_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'proposal not found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_item
  FROM public.change_proposal_items
  WHERE id = p_item_id AND proposal_id = p_proposal_id AND workspace_id = p_workspace_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'proposal item not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_item.status <> 'pending' THEN
    RETURN jsonb_build_object('itemId', v_item.id, 'status', v_item.status, 'proposalStatus', v_proposal.status);
  END IF;
  IF p_action = 'reject' AND length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'rejection reason is required' USING ERRCODE = '22023';
  END IF;

  IF v_item.base_revision_id IS NOT NULL AND v_item.target_type = 'concept'
     AND v_item.target_id IS NOT NULL THEN
    SELECT id INTO v_latest_revision
    FROM public.concept_revisions
    WHERE workspace_id = p_workspace_id AND concept_id = v_item.target_id
    ORDER BY revision_number DESC
    LIMIT 1;
    IF v_latest_revision IS DISTINCT FROM v_item.base_revision_id THEN
      UPDATE public.change_proposal_items
      SET status = 'stale', rejection_reason = 'Canonical content changed after proposal creation',
          reviewed_by = v_user_id, reviewed_at = now()
      WHERE id = v_item.id;
      RAISE EXCEPTION 'proposal is stale' USING ERRCODE = '40001';
    END IF;
  END IF;

  IF p_action IN ('accept', 'edit_and_accept') THEN
    IF v_role <> 'owner' AND v_item.item_type <> 'add_citation'::public.proposal_item_type THEN
      RAISE EXCEPTION 'owner approval is required for structural proposals' USING ERRCODE = '42501';
    END IF;
    v_payload := CASE WHEN p_action = 'edit_and_accept' THEN p_edited_payload ELSE v_item.proposed_payload END;
    IF v_payload IS NULL OR jsonb_typeof(v_payload) <> 'object' THEN
      RAISE EXCEPTION 'edited proposal payload must be an object' USING ERRCODE = '22023';
    END IF;

    IF v_item.item_type = 'create_concept'::public.proposal_item_type THEN
      v_applied_id := (public.create_atlas_concept(p_workspace_id, v_payload, 'Accepted AI proposal') ->> 'id')::uuid;
      UPDATE public.concept_revisions
      SET change_source = 'proposal', proposal_item_id = v_item.id
      WHERE concept_id = v_applied_id AND workspace_id = p_workspace_id
        AND revision_number = (SELECT max(revision_number) FROM public.concept_revisions WHERE concept_id = v_applied_id);
    ELSIF v_item.item_type = 'update_concept'::public.proposal_item_type THEN
      v_applied_id := v_item.target_id;
      IF v_applied_id IS NULL THEN RAISE EXCEPTION 'update proposal target is required' USING ERRCODE = '22023'; END IF;
      PERFORM public.update_atlas_concept(
        p_workspace_id, v_applied_id,
        (SELECT updated_at FROM public.concepts WHERE id = v_applied_id AND workspace_id = p_workspace_id),
        v_payload, 'Accepted AI proposal'
      );
      UPDATE public.concept_revisions
      SET change_source = 'proposal', proposal_item_id = v_item.id
      WHERE concept_id = v_applied_id AND workspace_id = p_workspace_id
        AND revision_number = (SELECT max(revision_number) FROM public.concept_revisions WHERE concept_id = v_applied_id);
    ELSIF v_item.item_type IN ('add_relation'::public.proposal_item_type, 'add_prerequisite'::public.proposal_item_type) THEN
      v_applied_id := (public.create_atlas_relation(
        p_workspace_id,
        (v_payload->>'sourceConceptId')::uuid,
        (v_payload->>'relationTypeId')::uuid,
        (v_payload->>'targetConceptId')::uuid,
        v_payload->>'description',
        'draft'
      ) ->> 'id')::uuid;
      UPDATE public.concept_relations
      SET provenance_type = 'source_extracted', source_proposal_item_id = v_item.id
      WHERE id = v_applied_id AND workspace_id = p_workspace_id;
    ELSIF v_item.item_type = 'add_alias'::public.proposal_item_type THEN
      v_applied_id := v_item.target_id;
      IF v_applied_id IS NULL THEN RAISE EXCEPTION 'alias proposal target is required' USING ERRCODE = '22023'; END IF;
      INSERT INTO public.concept_aliases (
        workspace_id, concept_id, alias, alias_normalized, alias_type, language_code, disambiguation_key
      ) VALUES (
        p_workspace_id, v_applied_id, trim(v_payload->>'alias'),
        public.normalize_alias_text(v_payload->>'alias'),
        coalesce((v_payload->>'aliasType')::public.alias_type, 'synonym'),
        coalesce(nullif(trim(v_payload->>'languageCode'), ''), 'en'),
        nullif(trim(v_payload->>'disambiguationKey'), '')
      ) RETURNING id INTO v_applied_id;
    ELSE
      -- Citation-only and unsupported future item types remain review history
      -- until their typed canonical service is introduced.
      v_applied_id := v_item.target_id;
    END IF;
  END IF;

  UPDATE public.change_proposal_items
  SET status = CASE p_action
    WHEN 'accept' THEN 'accepted'::public.proposal_item_status
    WHEN 'edit_and_accept' THEN 'edited_and_accepted'::public.proposal_item_status
    WHEN 'reject' THEN 'rejected'::public.proposal_item_status
    ELSE 'deferred'::public.proposal_item_status END,
    edited_payload = CASE WHEN p_action = 'edit_and_accept' THEN v_payload ELSE edited_payload END,
    rejection_reason = CASE WHEN p_action = 'reject' THEN trim(p_reason) ELSE rejection_reason END,
    reviewed_by = v_user_id, reviewed_at = now(),
    applied_object_refs = CASE WHEN p_action IN ('accept', 'edit_and_accept')
      THEN jsonb_build_object('id', v_applied_id) ELSE applied_object_refs END
  WHERE id = v_item.id;

  SELECT count(*) FILTER (WHERE status = 'pending'),
         count(*) FILTER (WHERE status IN ('accepted', 'edited_and_accepted')),
         count(*) FILTER (WHERE status = 'rejected'),
         count(*) FILTER (WHERE status IN ('deferred', 'stale'))
  INTO v_remaining, v_accepted, v_rejected, v_deferred
  FROM public.change_proposal_items WHERE proposal_id = p_proposal_id AND workspace_id = p_workspace_id;
  v_proposal_status := CASE
    WHEN v_remaining > 0 THEN 'partially_reviewed'
    WHEN v_accepted > 0 AND (v_rejected > 0 OR v_deferred > 0) THEN 'mixed'
    WHEN v_accepted > 0 THEN 'accepted'
    ELSE 'rejected' END;
  UPDATE public.change_proposals SET status = v_proposal_status WHERE id = p_proposal_id;
  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id,
    summary, after_summary, source_proposal_item_id
  ) VALUES (
    p_workspace_id, v_user_id, 'user', 'proposal.' || p_action, 'change_proposal_item', v_item.id,
    'Reviewed AI proposal item', jsonb_build_object('status', p_action, 'appliedObjectId', v_applied_id), v_item.id
  );
  RETURN jsonb_build_object('itemId', v_item.id, 'status',
    CASE p_action WHEN 'accept' THEN 'accepted' WHEN 'edit_and_accept' THEN 'edited_and_accepted'
      WHEN 'reject' THEN 'rejected' ELSE 'deferred' END,
    'proposalStatus', v_proposal_status, 'appliedObjectRefs', jsonb_build_object('id', v_applied_id));
END;
$$;

REVOKE ALL ON FUNCTION public.review_change_proposal_item(uuid, uuid, uuid, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_change_proposal_item(uuid, uuid, uuid, text, jsonb, text) TO authenticated;
