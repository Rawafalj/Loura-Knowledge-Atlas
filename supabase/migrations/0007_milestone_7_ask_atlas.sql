CREATE TYPE "public"."ask_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."ask_answer_status" AS ENUM('complete', 'insufficient_evidence', 'failed');--> statement-breakpoint

CREATE TABLE "ask_threads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text,
  "scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ask_threads_id_workspace_unique" UNIQUE("id", "workspace_id"),
  CONSTRAINT "ask_threads_scope_check" CHECK (jsonb_typeof("scope") = 'object')
);--> statement-breakpoint

CREATE TABLE "ask_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "thread_id" uuid NOT NULL,
  "role" "ask_message_role" NOT NULL,
  "content_markdown" text NOT NULL,
  "answer_status" "ask_answer_status" DEFAULT 'complete' NOT NULL,
  "retrieved_concept_ids" uuid[],
  "cited_segment_ids" uuid[],
  "ai_run_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ask_messages_id_workspace_unique" UNIQUE("id", "workspace_id"),
  CONSTRAINT "ask_messages_content_check" CHECK (length(trim("content_markdown")) > 0)
);--> statement-breakpoint

ALTER TABLE "ask_threads" ADD CONSTRAINT "ask_threads_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_threads" ADD CONSTRAINT "ask_threads_user_id_profiles_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_messages" ADD CONSTRAINT "ask_messages_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_messages" ADD CONSTRAINT "ask_messages_thread_workspace_fk"
  FOREIGN KEY ("thread_id", "workspace_id") REFERENCES "public"."ask_threads"("id", "workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_messages" ADD CONSTRAINT "ask_messages_ai_run_workspace_fk"
  FOREIGN KEY ("ai_run_id", "workspace_id") REFERENCES "public"."ai_runs"("id", "workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "ask_threads_workspace_user_updated_idx"
  ON "ask_threads" USING btree ("workspace_id", "user_id", "updated_at");--> statement-breakpoint
CREATE INDEX "ask_messages_workspace_thread_created_idx"
  ON "ask_messages" USING btree ("workspace_id", "thread_id", "created_at");--> statement-breakpoint

ALTER TABLE public.ask_threads ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.ask_messages ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Threads are private to their creating user, even inside a shared workspace.
-- The workspace membership check prevents a user from probing another workspace.
CREATE POLICY ask_threads_owner_select ON public.ask_threads
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  AND public.is_workspace_member(workspace_id)
);
CREATE POLICY ask_threads_owner_insert ON public.ask_threads
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_workspace_member(workspace_id)
);
CREATE POLICY ask_threads_owner_update ON public.ask_threads
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  AND public.is_workspace_member(workspace_id)
)
WITH CHECK (
  user_id = auth.uid()
  AND public.is_workspace_member(workspace_id)
);
CREATE POLICY ask_threads_owner_delete ON public.ask_threads
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  AND public.is_workspace_member(workspace_id)
);

CREATE POLICY ask_messages_thread_owner_select ON public.ask_messages
FOR SELECT TO authenticated
USING (
  public.is_workspace_member(workspace_id)
  AND EXISTS (
    SELECT 1 FROM public.ask_threads t
    WHERE t.id = ask_messages.thread_id
      AND t.workspace_id = ask_messages.workspace_id
      AND t.user_id = auth.uid()
  )
);
CREATE POLICY ask_messages_thread_owner_insert ON public.ask_messages
FOR INSERT TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id)
  AND EXISTS (
    SELECT 1 FROM public.ask_threads t
    WHERE t.id = ask_messages.thread_id
      AND t.workspace_id = ask_messages.workspace_id
      AND t.user_id = auth.uid()
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ask_threads TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT ON public.ask_messages TO authenticated;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.protect_ask_thread_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'ask thread ownership is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER ask_threads_set_updated_at
BEFORE UPDATE ON public.ask_threads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER ask_threads_owner_immutable
BEFORE UPDATE OF workspace_id, user_id ON public.ask_threads
FOR EACH ROW EXECUTE FUNCTION public.protect_ask_thread_owner();--> statement-breakpoint
CREATE TRIGGER ask_messages_workspace_immutable
BEFORE UPDATE OF workspace_id ON public.ask_messages
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();

CREATE OR REPLACE FUNCTION public.validate_ask_message_citations()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_segment_id uuid;
BEGIN
  IF NEW.role = 'assistant'::public.ask_message_role
     AND cardinality(coalesce(NEW.cited_segment_ids, '{}'::uuid[])) > 0 THEN
    FOREACH v_segment_id IN ARRAY NEW.cited_segment_ids LOOP
      IF v_segment_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM public.source_segments segment
        JOIN public.source_versions version
          ON version.id = segment.source_version_id
         AND version.workspace_id = segment.workspace_id
         AND version.processing_status = 'completed'::public.source_version_status
        JOIN public.sources source
          ON source.id = version.source_id
         AND source.workspace_id = version.workspace_id
         AND source.deleted_at IS NULL
        WHERE segment.id = v_segment_id AND segment.workspace_id = NEW.workspace_id
      ) THEN
        RAISE EXCEPTION 'Ask citation must reference a completed source segment in this workspace'
          USING ERRCODE = '23503';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER ask_messages_validate_citations
BEFORE INSERT OR UPDATE OF workspace_id, role, cited_segment_ids
ON public.ask_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_ask_message_citations();
