CREATE TYPE "public"."mastery_evidence_type" AS ENUM('self_assessment', 'explanation', 'quiz', 'applied_analysis', 'design_artifact', 'critique', 'external_evaluation');--> statement-breakpoint
CREATE TYPE "public"."mastery_status" AS ENUM('not_started', 'learning', 'applied', 'mastered', 'revisit');--> statement-breakpoint
CREATE TABLE "learning_path_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"learning_path_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"branch_key" text DEFAULT 'main' NOT NULL,
	"mandatory" boolean DEFAULT true NOT NULL,
	"rationale" text,
	"learning_objective" text,
	"target_mastery" smallint NOT NULL,
	"required_prior_mastery" smallint DEFAULT 1 NOT NULL,
	"exercise_markdown" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_path_steps_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "learning_path_steps_order_unique" UNIQUE("learning_path_id","branch_key","step_order"),
	CONSTRAINT "learning_path_steps_concept_unique" UNIQUE("learning_path_id","branch_key","concept_id"),
	CONSTRAINT "learning_path_steps_order_check" CHECK ("learning_path_steps"."step_order" > 0),
	CONSTRAINT "learning_path_steps_target_mastery_check" CHECK ("learning_path_steps"."target_mastery" between 0 and 5),
	CONSTRAINT "learning_path_steps_prior_mastery_check" CHECK ("learning_path_steps"."required_prior_mastery" between 0 and 5)
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"purpose_markdown" text DEFAULT '' NOT NULL,
	"target_outcome_markdown" text DEFAULT '' NOT NULL,
	"content_status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_paths_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "learning_paths_workspace_slug_unique" UNIQUE("workspace_id","slug")
);
--> statement-breakpoint
CREATE TABLE "learning_prerequisite_waivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"learning_path_id" uuid NOT NULL,
	"target_concept_id" uuid NOT NULL,
	"prerequisite_concept_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_waivers_unique" UNIQUE("workspace_id","user_id","learning_path_id","target_concept_id","prerequisite_concept_id"),
	CONSTRAINT "learning_waivers_reason_check" CHECK (length(trim("learning_prerequisite_waivers"."reason")) >= 3),
	CONSTRAINT "learning_waivers_distinct_concepts_check" CHECK ("learning_prerequisite_waivers"."target_concept_id" <> "learning_prerequisite_waivers"."prerequisite_concept_id")
);
--> statement-breakpoint
CREATE TABLE "mastery_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"level_claimed" smallint NOT NULL,
	"evidence_type" "mastery_evidence_type" NOT NULL,
	"note" text,
	"artifact_url" text,
	"ai_assessment" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mastery_evidence_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "mastery_evidence_level_check" CHECK ("mastery_evidence"."level_claimed" between 0 and 5),
	CONSTRAINT "mastery_evidence_content_check" CHECK ("mastery_evidence"."note" is not null or "mastery_evidence"."artifact_url" is not null)
);
--> statement-breakpoint
CREATE TABLE "user_mastery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"current_level" smallint DEFAULT 0 NOT NULL,
	"target_level" smallint DEFAULT 1 NOT NULL,
	"status" "mastery_status" DEFAULT 'not_started' NOT NULL,
	"last_evidence_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_mastery_workspace_user_concept_unique" UNIQUE("workspace_id","user_id","concept_id"),
	CONSTRAINT "user_mastery_current_level_check" CHECK ("user_mastery"."current_level" between 0 and 5),
	CONSTRAINT "user_mastery_target_level_check" CHECK ("user_mastery"."target_level" between 0 and 5)
);
--> statement-breakpoint
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_path_workspace_fk" FOREIGN KEY ("learning_path_id","workspace_id") REFERENCES "public"."learning_paths"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_concept_workspace_fk" FOREIGN KEY ("concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_prerequisite_waivers" ADD CONSTRAINT "learning_prerequisite_waivers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_prerequisite_waivers" ADD CONSTRAINT "learning_prerequisite_waivers_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_prerequisite_waivers" ADD CONSTRAINT "learning_waivers_path_workspace_fk" FOREIGN KEY ("learning_path_id","workspace_id") REFERENCES "public"."learning_paths"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_prerequisite_waivers" ADD CONSTRAINT "learning_waivers_target_workspace_fk" FOREIGN KEY ("target_concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_prerequisite_waivers" ADD CONSTRAINT "learning_waivers_prerequisite_workspace_fk" FOREIGN KEY ("prerequisite_concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_evidence" ADD CONSTRAINT "mastery_evidence_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_evidence" ADD CONSTRAINT "mastery_evidence_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_evidence" ADD CONSTRAINT "mastery_evidence_concept_workspace_fk" FOREIGN KEY ("concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mastery" ADD CONSTRAINT "user_mastery_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mastery" ADD CONSTRAINT "user_mastery_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mastery" ADD CONSTRAINT "user_mastery_concept_workspace_fk" FOREIGN KEY ("concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mastery" ADD CONSTRAINT "user_mastery_evidence_workspace_fk" FOREIGN KEY ("last_evidence_id","workspace_id") REFERENCES "public"."mastery_evidence"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_path_steps_path_order_idx" ON "learning_path_steps" USING btree ("workspace_id","learning_path_id","branch_key","step_order");--> statement-breakpoint
CREATE INDEX "learning_paths_workspace_status_idx" ON "learning_paths" USING btree ("workspace_id","content_status");--> statement-breakpoint
CREATE INDEX "learning_waivers_user_path_idx" ON "learning_prerequisite_waivers" USING btree ("workspace_id","user_id","learning_path_id");--> statement-breakpoint
CREATE INDEX "mastery_evidence_user_concept_idx" ON "mastery_evidence" USING btree ("workspace_id","user_id","concept_id","created_at");--> statement-breakpoint
CREATE INDEX "user_mastery_user_status_idx" ON "user_mastery" USING btree ("workspace_id","user_id","status");

CREATE TRIGGER learning_paths_set_updated_at BEFORE UPDATE ON public.learning_paths
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER learning_path_steps_set_updated_at BEFORE UPDATE ON public.learning_path_steps
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER learning_paths_workspace_immutable BEFORE UPDATE OF workspace_id ON public.learning_paths
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();--> statement-breakpoint
CREATE TRIGGER learning_path_steps_workspace_immutable BEFORE UPDATE OF workspace_id ON public.learning_path_steps
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();--> statement-breakpoint
CREATE TRIGGER mastery_evidence_workspace_immutable BEFORE UPDATE OF workspace_id ON public.mastery_evidence
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();--> statement-breakpoint
CREATE TRIGGER user_mastery_workspace_immutable BEFORE UPDATE OF workspace_id ON public.user_mastery
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();--> statement-breakpoint
CREATE TRIGGER learning_waivers_workspace_immutable BEFORE UPDATE OF workspace_id ON public.learning_prerequisite_waivers
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();--> statement-breakpoint
CREATE TRIGGER learning_paths_creation_actor_immutable BEFORE UPDATE OF created_by ON public.learning_paths
FOR EACH ROW EXECUTE FUNCTION public.preserve_creation_actor();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.reject_mastery_evidence_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'mastery evidence is append-only' USING ERRCODE = '55000';
END;
$$;--> statement-breakpoint
CREATE TRIGGER mastery_evidence_append_only
BEFORE UPDATE ON public.mastery_evidence
FOR EACH ROW EXECUTE FUNCTION public.reject_mastery_evidence_mutation();--> statement-breakpoint

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.mastery_evidence ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.user_mastery ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.learning_prerequisite_waivers ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY learning_paths_select_member ON public.learning_paths FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));--> statement-breakpoint
CREATE POLICY learning_paths_insert_editor ON public.learning_paths FOR INSERT TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']) AND created_by = auth.uid() AND updated_by = auth.uid());--> statement-breakpoint
CREATE POLICY learning_paths_update_editor ON public.learning_paths FOR UPDATE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']) AND updated_by = auth.uid());--> statement-breakpoint
CREATE POLICY learning_paths_delete_editor ON public.learning_paths FOR DELETE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));--> statement-breakpoint

CREATE POLICY learning_path_steps_select_member ON public.learning_path_steps FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));--> statement-breakpoint
CREATE POLICY learning_path_steps_insert_editor ON public.learning_path_steps FOR INSERT TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));--> statement-breakpoint
CREATE POLICY learning_path_steps_update_editor ON public.learning_path_steps FOR UPDATE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));--> statement-breakpoint
CREATE POLICY learning_path_steps_delete_editor ON public.learning_path_steps FOR DELETE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));--> statement-breakpoint

CREATE POLICY mastery_evidence_select_own ON public.mastery_evidence FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id) AND user_id = auth.uid());--> statement-breakpoint
CREATE POLICY user_mastery_select_own ON public.user_mastery FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id) AND user_id = auth.uid());--> statement-breakpoint
CREATE POLICY learning_waivers_select_own ON public.learning_prerequisite_waivers FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id) AND user_id = auth.uid());--> statement-breakpoint

REVOKE ALL ON public.learning_paths, public.learning_path_steps, public.mastery_evidence, public.user_mastery, public.learning_prerequisite_waivers FROM anon;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_paths, public.learning_path_steps TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.mastery_evidence, public.user_mastery, public.learning_prerequisite_waivers TO authenticated;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.update_user_mastery(
  p_workspace_id uuid,
  p_concept_id uuid,
  p_current_level smallint,
  p_target_level smallint,
  p_status public.mastery_status,
  p_evidence_type public.mastery_evidence_type,
  p_note text DEFAULT NULL,
  p_artifact_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_evidence_id uuid;
  v_mastery_id uuid;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_workspace_member(p_workspace_id) THEN
    RAISE EXCEPTION 'workspace membership required' USING ERRCODE = '42501';
  END IF;
  IF p_current_level NOT BETWEEN 0 AND 5 OR p_target_level NOT BETWEEN 0 AND 5 THEN
    RAISE EXCEPTION 'mastery levels must be between 0 and 5' USING ERRCODE = '22023';
  END IF;
  IF p_status = 'not_started' AND p_current_level <> 0 THEN
    RAISE EXCEPTION 'not-started mastery must remain at level 0' USING ERRCODE = '22023';
  END IF;
  IF p_status = 'applied' AND p_current_level < 2 THEN
    RAISE EXCEPTION 'applied status requires level 2 or higher' USING ERRCODE = '22023';
  END IF;
  IF p_status = 'mastered' AND p_current_level < p_target_level THEN
    RAISE EXCEPTION 'mastered status requires the target level' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(length(trim(p_note)), 0) = 0 AND COALESCE(length(trim(p_artifact_url)), 0) = 0 THEN
    RAISE EXCEPTION 'mastery evidence requires a note or artifact URL' USING ERRCODE = '22023';
  END IF;
  IF p_artifact_url IS NOT NULL AND trim(p_artifact_url) !~ '^https?://[^[:space:]]+$' THEN
    RAISE EXCEPTION 'artifact URL must use HTTP or HTTPS' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.concepts
    WHERE id = p_concept_id AND workspace_id = p_workspace_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'concept not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.mastery_evidence (
    workspace_id, user_id, concept_id, level_claimed, evidence_type, note, artifact_url
  ) VALUES (
    p_workspace_id, v_user_id, p_concept_id, p_current_level, p_evidence_type,
    NULLIF(trim(p_note), ''), NULLIF(trim(p_artifact_url), '')
  ) RETURNING id INTO v_evidence_id;

  INSERT INTO public.user_mastery (
    workspace_id, user_id, concept_id, current_level, target_level, status, last_evidence_id
  ) VALUES (
    p_workspace_id, v_user_id, p_concept_id, p_current_level, p_target_level, p_status, v_evidence_id
  )
  ON CONFLICT (workspace_id, user_id, concept_id) DO UPDATE SET
    current_level = EXCLUDED.current_level,
    target_level = EXCLUDED.target_level,
    status = EXCLUDED.status,
    last_evidence_id = EXCLUDED.last_evidence_id,
    updated_at = now()
  RETURNING id INTO v_mastery_id;

  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id,
    summary, after_summary
  ) VALUES (
    p_workspace_id, v_user_id, 'user', 'mastery.updated', 'user_mastery', v_mastery_id,
    'Learner updated mastery with evidence',
    jsonb_build_object('conceptId', p_concept_id, 'currentLevel', p_current_level, 'targetLevel', p_target_level, 'status', p_status, 'evidenceId', v_evidence_id)
  );

  RETURN jsonb_build_object('masteryId', v_mastery_id, 'evidenceId', v_evidence_id);
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.update_user_mastery(uuid, uuid, smallint, smallint, public.mastery_status, public.mastery_evidence_type, text, text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.update_user_mastery(uuid, uuid, smallint, smallint, public.mastery_status, public.mastery_evidence_type, text, text) TO authenticated;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.set_learning_prerequisite_waiver(
  p_workspace_id uuid,
  p_learning_path_id uuid,
  p_target_concept_id uuid,
  p_prerequisite_concept_id uuid,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_waiver_id uuid;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_workspace_member(p_workspace_id) THEN
    RAISE EXCEPTION 'workspace membership required' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(length(trim(p_reason)), 0) < 3 THEN
    RAISE EXCEPTION 'waiver reason is required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.concept_relations relation
    JOIN public.relation_types relation_type
      ON relation_type.id = relation.relation_type_id AND relation_type.workspace_id = relation.workspace_id
    WHERE relation.workspace_id = p_workspace_id
      AND relation.source_concept_id = p_prerequisite_concept_id
      AND relation.target_concept_id = p_target_concept_id
      AND relation_type.key = 'prerequisite_for'
      AND relation.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'prerequisite relation not found' USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.learning_paths
    WHERE id = p_learning_path_id AND workspace_id = p_workspace_id
  ) THEN
    RAISE EXCEPTION 'learning path not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.learning_prerequisite_waivers (
    workspace_id, user_id, learning_path_id, target_concept_id, prerequisite_concept_id, reason
  ) VALUES (
    p_workspace_id, v_user_id, p_learning_path_id, p_target_concept_id, p_prerequisite_concept_id, trim(p_reason)
  )
  ON CONFLICT (workspace_id, user_id, learning_path_id, target_concept_id, prerequisite_concept_id)
  DO UPDATE SET reason = EXCLUDED.reason
  RETURNING id INTO v_waiver_id;
  RETURN v_waiver_id;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.set_learning_prerequisite_waiver(uuid, uuid, uuid, uuid, text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.set_learning_prerequisite_waiver(uuid, uuid, uuid, uuid, text) TO authenticated;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.upsert_learning_path(
  p_workspace_id uuid,
  p_payload jsonb,
  p_path_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_path_id uuid;
  v_step jsonb;
  v_concept_id uuid;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_workspace_member(p_workspace_id, ARRAY['owner', 'editor']) THEN
    RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501';
  END IF;
  IF p_payload->>'slug' !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     OR COALESCE(length(trim(p_payload->>'title')), 0) < 2
     OR jsonb_array_length(COALESCE(p_payload->'steps', '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'invalid learning path payload' USING ERRCODE = '22023';
  END IF;

  IF p_path_id IS NULL THEN
    INSERT INTO public.learning_paths (
      workspace_id, slug, title, purpose_markdown, target_outcome_markdown,
      content_status, created_by, updated_by
    ) VALUES (
      p_workspace_id, p_payload->>'slug', trim(p_payload->>'title'),
      COALESCE(p_payload->>'purposeMarkdown', ''),
      COALESCE(p_payload->>'targetOutcomeMarkdown', ''),
      COALESCE((p_payload->>'contentStatus')::public.content_status, 'draft'),
      v_user_id, v_user_id
    ) RETURNING id INTO v_path_id;
  ELSE
    UPDATE public.learning_paths SET
      slug = p_payload->>'slug',
      title = trim(p_payload->>'title'),
      purpose_markdown = COALESCE(p_payload->>'purposeMarkdown', ''),
      target_outcome_markdown = COALESCE(p_payload->>'targetOutcomeMarkdown', ''),
      content_status = COALESCE((p_payload->>'contentStatus')::public.content_status, 'draft'),
      updated_by = v_user_id
    WHERE id = p_path_id AND workspace_id = p_workspace_id
    RETURNING id INTO v_path_id;
    IF v_path_id IS NULL THEN
      RAISE EXCEPTION 'learning path not found' USING ERRCODE = 'P0002';
    END IF;
    DELETE FROM public.learning_path_steps
    WHERE learning_path_id = v_path_id AND workspace_id = p_workspace_id;
  END IF;

  FOR v_step IN SELECT value FROM jsonb_array_elements(p_payload->'steps') LOOP
    SELECT id INTO v_concept_id FROM public.concepts
    WHERE workspace_id = p_workspace_id
      AND slug = v_step->>'conceptSlug'
      AND deleted_at IS NULL;
    IF v_concept_id IS NULL THEN
      RAISE EXCEPTION 'unknown path concept: %', v_step->>'conceptSlug' USING ERRCODE = '23503';
    END IF;
    INSERT INTO public.learning_path_steps (
      workspace_id, learning_path_id, concept_id, step_order, branch_key, mandatory,
      rationale, learning_objective, target_mastery, required_prior_mastery, exercise_markdown
    ) VALUES (
      p_workspace_id, v_path_id, v_concept_id, (v_step->>'stepOrder')::integer,
      COALESCE(NULLIF(v_step->>'branchKey', ''), 'main'),
      COALESCE((v_step->>'mandatory')::boolean, true),
      NULLIF(v_step->>'rationale', ''), NULLIF(v_step->>'learningObjective', ''),
      (v_step->>'targetMastery')::smallint,
      COALESCE((v_step->>'requiredPriorMastery')::smallint, 1),
      NULLIF(v_step->>'exerciseMarkdown', '')
    );
  END LOOP;

  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id, summary, after_summary
  ) VALUES (
    p_workspace_id, v_user_id, 'user',
    CASE WHEN p_path_id IS NULL THEN 'learning_path.created' ELSE 'learning_path.updated' END,
    'learning_path', v_path_id, 'Canonical learning path saved',
    jsonb_build_object('slug', p_payload->>'slug', 'steps', jsonb_array_length(p_payload->'steps'))
  );
  RETURN v_path_id;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.upsert_learning_path(uuid, jsonb, uuid) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.upsert_learning_path(uuid, jsonb, uuid) TO authenticated;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.install_learning_seed(p_workspace_id uuid, p_seed jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_path jsonb;
  v_step jsonb;
  v_path_id uuid;
  v_concept_id uuid;
BEGIN
  IF NOT public.is_workspace_member(p_workspace_id, ARRAY['owner']) THEN
    RAISE EXCEPTION 'owner role required to install learning seed' USING ERRCODE = '42501';
  END IF;
  FOR v_path IN SELECT value FROM jsonb_array_elements(COALESCE(p_seed->'paths', '[]'::jsonb)) LOOP
    INSERT INTO public.learning_paths (
      workspace_id, slug, title, purpose_markdown, target_outcome_markdown,
      content_status, created_by, updated_by
    ) VALUES (
      p_workspace_id, v_path->>'slug', v_path->>'title',
      COALESCE(v_path->>'purposeMarkdown', ''),
      COALESCE(v_path->>'targetOutcomeMarkdown', ''),
      COALESCE((v_path->>'status')::public.content_status, 'draft'),
      auth.uid(), auth.uid()
    ) ON CONFLICT (workspace_id, slug) DO NOTHING;
    SELECT id INTO v_path_id FROM public.learning_paths
    WHERE workspace_id = p_workspace_id AND slug = v_path->>'slug';

    FOR v_step IN SELECT value FROM jsonb_array_elements(COALESCE(v_path->'steps', '[]'::jsonb)) LOOP
      SELECT id INTO v_concept_id FROM public.concepts
      WHERE workspace_id = p_workspace_id AND slug = v_step->>'concept' AND deleted_at IS NULL;
      IF v_concept_id IS NULL THEN
        RAISE EXCEPTION 'unknown path concept: %', v_step->>'concept' USING ERRCODE = '23503';
      END IF;
      INSERT INTO public.learning_path_steps (
        workspace_id, learning_path_id, concept_id, step_order, branch_key, mandatory,
        rationale, learning_objective, target_mastery, required_prior_mastery, exercise_markdown
      ) VALUES (
        p_workspace_id, v_path_id, v_concept_id, (v_step->>'order')::integer,
        COALESCE(NULLIF(v_step->>'branchKey', ''), 'main'),
        COALESCE((v_step->>'mandatory')::boolean, true),
        v_step->>'rationale', v_step->>'learningObjective',
        (v_step->>'targetMastery')::smallint,
        COALESCE((v_step->>'requiredPriorMastery')::smallint, 1),
        v_step->>'exerciseMarkdown'
      ) ON CONFLICT (learning_path_id, branch_key, step_order) DO NOTHING;
    END LOOP;
  END LOOP;
  RETURN jsonb_build_object(
    'paths', (SELECT count(*) FROM public.learning_paths WHERE workspace_id = p_workspace_id),
    'steps', (SELECT count(*) FROM public.learning_path_steps WHERE workspace_id = p_workspace_id)
  );
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.install_learning_seed(uuid, jsonb) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.install_learning_seed(uuid, jsonb) TO authenticated;
