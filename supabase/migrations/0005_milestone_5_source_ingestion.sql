CREATE TYPE "public"."external_ai_policy" AS ENUM('allowed', 'denied', 'explicit_per_run');--> statement-breakpoint
CREATE TYPE "public"."ingestion_job_status" AS ENUM('queued', 'running', 'completed', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."ingestion_stage" AS ENUM('download', 'parse', 'persist', 'segment');--> statement-breakpoint
CREATE TYPE "public"."source_ingestion_status" AS ENUM('pending', 'queued', 'parsing', 'persisting', 'segmenting', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_origin" AS ENUM('file', 'url');--> statement-breakpoint
CREATE TYPE "public"."source_quality" AS ENUM('canonical', 'primary', 'secondary', 'practitioner', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."source_segment_type" AS ENUM('heading', 'paragraph', 'list', 'table', 'figure_caption', 'code', 'formula', 'transcript', 'other');--> statement-breakpoint
CREATE TYPE "public"."source_sensitivity" AS ENUM('public', 'internal', 'confidential');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('book', 'paper', 'standard', 'course', 'documentation', 'article', 'webpage', 'report', 'thesis', 'dataset', 'note', 'other');--> statement-breakpoint
CREATE TYPE "public"."source_version_status" AS ENUM('processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "ingestion_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"source_version_id" uuid,
	"queue_message_id" bigint,
	"status" "ingestion_job_status" DEFAULT 'queued' NOT NULL,
	"stage" "ingestion_stage" DEFAULT 'download' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"progress" numeric(5, 2) DEFAULT '0' NOT NULL,
	"idempotency_key" text NOT NULL,
	"parser_profile" text NOT NULL,
	"extraction_schema_version" text NOT NULL,
	"allow_external_ai" boolean DEFAULT false NOT NULL,
	"force_reprocess" boolean DEFAULT false NOT NULL,
	"requested_by" uuid NOT NULL,
	"error_code" text,
	"error_message_sanitized" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "ingestion_jobs_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "ingestion_jobs_workspace_idempotency_unique" UNIQUE("workspace_id","idempotency_key"),
	CONSTRAINT "ingestion_jobs_attempt_check" CHECK ("ingestion_jobs"."attempt_count" >= 0),
	CONSTRAINT "ingestion_jobs_progress_check" CHECK ("ingestion_jobs"."progress" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "source_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_version_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"stable_key" text NOT NULL,
	"segment_type" "source_segment_type" NOT NULL,
	"heading_path" text[] DEFAULT '{}'::text[] NOT NULL,
	"text" text NOT NULL,
	"token_count" integer NOT NULL,
	"page_start" integer,
	"page_end" integer,
	"provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"search_document" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("text", '')), 'B')) STORED,
	"embedding" vector(1536),
	"embedding_model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_segments_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "source_segments_version_ordinal_unique" UNIQUE("source_version_id","ordinal"),
	CONSTRAINT "source_segments_version_stable_key_unique" UNIQUE("source_version_id","stable_key"),
	CONSTRAINT "source_segments_ordinal_check" CHECK ("source_segments"."ordinal" > 0),
	CONSTRAINT "source_segments_text_check" CHECK (length(trim("source_segments"."text")) > 0),
	CONSTRAINT "source_segments_token_count_check" CHECK ("source_segments"."token_count" > 0),
	CONSTRAINT "source_segments_page_range_check" CHECK ("source_segments"."page_start" is null or ("source_segments"."page_start" > 0 and ("source_segments"."page_end" is null or "source_segments"."page_end" >= "source_segments"."page_start")))
);
--> statement-breakpoint
CREATE TABLE "source_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"file_checksum_sha256" text NOT NULL,
	"parser_name" text NOT NULL,
	"parser_version" text NOT NULL,
	"parser_profile" text NOT NULL,
	"docling_json_path" text,
	"markdown_path" text,
	"extracted_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"page_count" integer,
	"language_code" text,
	"processing_status" "source_version_status" DEFAULT 'processing' NOT NULL,
	"error_code" text,
	"error_message_sanitized" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "source_versions_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "source_versions_source_number_unique" UNIQUE("source_id","version_number"),
	CONSTRAINT "source_versions_workspace_idempotency_unique" UNIQUE("workspace_id","idempotency_key"),
	CONSTRAINT "source_versions_number_check" CHECK ("source_versions"."version_number" > 0),
	CONSTRAINT "source_versions_checksum_check" CHECK ("source_versions"."file_checksum_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"origin" "source_origin" NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"source_type" "source_type" NOT NULL,
	"authors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"organization" text,
	"publication_date" date,
	"external_url" text,
	"final_url" text,
	"external_identifier" text,
	"quality" "source_quality" DEFAULT 'unknown' NOT NULL,
	"sensitivity" "source_sensitivity" DEFAULT 'internal' NOT NULL,
	"external_ai_policy" "external_ai_policy" DEFAULT 'denied' NOT NULL,
	"rights_note" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_name" text,
	"file_mime_type" text,
	"file_size_bytes" bigint,
	"file_checksum_sha256" text,
	"storage_path" text,
	"ingestion_status" "source_ingestion_status" DEFAULT 'pending' NOT NULL,
	"latest_source_version_id" uuid,
	"added_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "sources_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "sources_title_check" CHECK (length(trim("sources"."title")) > 0),
	CONSTRAINT "sources_rights_note_check" CHECK (length(trim("sources"."rights_note")) >= 3),
	CONSTRAINT "sources_checksum_check" CHECK ("sources"."file_checksum_sha256" is null or "sources"."file_checksum_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "sources_origin_fields_check" CHECK (("sources"."origin" = 'file' and "sources"."file_name" is not null and "sources"."external_url" is null)
          or ("sources"."origin" = 'url' and "sources"."external_url" is not null)),
	CONSTRAINT "sources_file_size_check" CHECK ("sources"."file_size_bytes" is null or "sources"."file_size_bytes" > 0)
);
--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_requested_by_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_source_workspace_fk" FOREIGN KEY ("source_id","workspace_id") REFERENCES "public"."sources"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_version_workspace_fk" FOREIGN KEY ("source_version_id","workspace_id") REFERENCES "public"."source_versions"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_segments" ADD CONSTRAINT "source_segments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_segments" ADD CONSTRAINT "source_segments_version_workspace_fk" FOREIGN KEY ("source_version_id","workspace_id") REFERENCES "public"."source_versions"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_source_workspace_fk" FOREIGN KEY ("source_id","workspace_id") REFERENCES "public"."sources"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_added_by_profiles_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ingestion_jobs_status_created_idx" ON "ingestion_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ingestion_jobs_workspace_source_idx" ON "ingestion_jobs" USING btree ("workspace_id","source_id","created_at");--> statement-breakpoint
CREATE INDEX "source_segments_version_ordinal_idx" ON "source_segments" USING btree ("workspace_id","source_version_id","ordinal");--> statement-breakpoint
CREATE INDEX "source_segments_search_document_idx" ON "source_segments" USING gin ("search_document");--> statement-breakpoint
CREATE INDEX "source_versions_source_created_idx" ON "source_versions" USING btree ("workspace_id","source_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_workspace_checksum_active_unique" ON "sources" USING btree ("workspace_id","file_checksum_sha256") WHERE "sources"."file_checksum_sha256" is not null and "sources"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "sources_workspace_status_created_idx" ON "sources" USING btree ("workspace_id","ingestion_status","created_at");
--> statement-breakpoint

ALTER TABLE public.sources
ADD CONSTRAINT sources_latest_version_workspace_fk
FOREIGN KEY (latest_source_version_id, workspace_id)
REFERENCES public.source_versions(id, workspace_id);--> statement-breakpoint

CREATE EXTENSION IF NOT EXISTS pgmq;--> statement-breakpoint
SELECT pgmq.create('source_ingest');--> statement-breakpoint

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'source-files',
    'source-files',
    false,
    52428800,
    ARRAY[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/markdown',
      'text/html',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/tiff'
    ]
  ),
  ('source-derived', 'source-derived', false, 52428800, ARRAY['application/json', 'text/markdown'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;--> statement-breakpoint

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.source_versions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.source_segments ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY sources_member_select ON public.sources
FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));--> statement-breakpoint
CREATE POLICY source_versions_member_select ON public.source_versions
FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));--> statement-breakpoint
CREATE POLICY source_segments_member_select ON public.source_segments
FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));--> statement-breakpoint
CREATE POLICY ingestion_jobs_member_select ON public.ingestion_jobs
FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));--> statement-breakpoint

CREATE POLICY source_files_member_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'source-files'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  AND public.is_workspace_member(((storage.foldername(name))[1])::uuid)
);--> statement-breakpoint
CREATE POLICY source_files_curator_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'source-files'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  AND public.is_workspace_member(
    ((storage.foldername(name))[1])::uuid,
    ARRAY['owner', 'editor']
  )
);--> statement-breakpoint
CREATE POLICY source_derived_member_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'source-derived'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  AND public.is_workspace_member(((storage.foldername(name))[1])::uuid)
);--> statement-breakpoint

CREATE TRIGGER sources_set_updated_at BEFORE UPDATE ON public.sources
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
CREATE TRIGGER sources_workspace_immutable BEFORE UPDATE OF workspace_id ON public.sources
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();--> statement-breakpoint
CREATE TRIGGER source_versions_workspace_immutable BEFORE UPDATE OF workspace_id ON public.source_versions
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();--> statement-breakpoint
CREATE TRIGGER source_segments_workspace_immutable BEFORE UPDATE OF workspace_id ON public.source_segments
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();--> statement-breakpoint
CREATE TRIGGER ingestion_jobs_workspace_immutable BEFORE UPDATE OF workspace_id ON public.ingestion_jobs
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.protect_source_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.origin <> OLD.origin OR NEW.added_by <> OLD.added_by THEN
    RAISE EXCEPTION 'source origin and creator are immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.file_checksum_sha256 IS NOT NULL
     AND NEW.file_checksum_sha256 IS DISTINCT FROM OLD.file_checksum_sha256 THEN
    RAISE EXCEPTION 'source checksum is immutable once recorded' USING ERRCODE = '23514';
  END IF;
  IF OLD.storage_path IS NOT NULL AND NEW.storage_path IS DISTINCT FROM OLD.storage_path THEN
    RAISE EXCEPTION 'source storage path is immutable once recorded' USING ERRCODE = '23514';
  END IF;
  IF OLD.external_url IS NOT NULL AND NEW.external_url IS DISTINCT FROM OLD.external_url THEN
    RAISE EXCEPTION 'original source URL is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER sources_protect_identity BEFORE UPDATE ON public.sources
FOR EACH ROW EXECUTE FUNCTION public.protect_source_identity();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.protect_completed_source_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  IF OLD.processing_status = 'completed' THEN
    RAISE EXCEPTION 'completed source versions are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;--> statement-breakpoint
CREATE TRIGGER source_versions_immutable_when_completed
BEFORE UPDATE OR DELETE ON public.source_versions
FOR EACH ROW EXECUTE FUNCTION public.protect_completed_source_version();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.protect_completed_source_segment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_status public.source_version_status;
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  SELECT processing_status INTO v_status
  FROM public.source_versions
  WHERE id = OLD.source_version_id AND workspace_id = OLD.workspace_id;
  IF v_status = 'completed' THEN
    RAISE EXCEPTION 'segments of completed source versions are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;--> statement-breakpoint
CREATE TRIGGER source_segments_immutable_when_completed
BEFORE UPDATE OR DELETE ON public.source_segments
FOR EACH ROW EXECUTE FUNCTION public.protect_completed_source_segment();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.validate_latest_source_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.latest_source_version_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.source_versions version
    WHERE version.id = NEW.latest_source_version_id
      AND version.workspace_id = NEW.workspace_id
      AND version.source_id = NEW.id
      AND version.processing_status = 'completed'
  ) THEN
    RAISE EXCEPTION 'latest source version must be a completed version of this source'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER sources_validate_latest_version
BEFORE INSERT OR UPDATE OF latest_source_version_id ON public.sources
FOR EACH ROW EXECUTE FUNCTION public.validate_latest_source_version();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.create_file_source(
  p_workspace_id uuid,
  p_file_name text,
  p_mime_type text,
  p_size_bytes bigint,
  p_checksum_sha256 text,
  p_metadata jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_source_id uuid := gen_random_uuid();
  v_storage_path text;
  v_duplicate_id uuid;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_workspace_member(
    p_workspace_id, ARRAY['owner', 'editor']
  ) THEN
    RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501';
  END IF;
  IF p_file_name IS NULL OR p_file_name !~ '^[A-Za-z0-9][A-Za-z0-9._ -]{0,199}$' THEN
    RAISE EXCEPTION 'file name is invalid' USING ERRCODE = '22023';
  END IF;
  IF p_size_bytes IS NULL OR p_size_bytes <= 0 OR p_size_bytes > 52428800 THEN
    RAISE EXCEPTION 'source file size is invalid' USING ERRCODE = '22023';
  END IF;
  IF p_checksum_sha256 IS NULL OR p_checksum_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'source checksum is invalid' USING ERRCODE = '22023';
  END IF;
  SELECT id INTO v_duplicate_id FROM public.sources
  WHERE workspace_id = p_workspace_id
    AND file_checksum_sha256 = p_checksum_sha256
    AND deleted_at IS NULL
  LIMIT 1;
  IF v_duplicate_id IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate source checksum' USING ERRCODE = '23505', DETAIL = v_duplicate_id::text;
  END IF;
  v_storage_path := p_workspace_id::text || '/' || v_source_id::text || '/' ||
    p_checksum_sha256 || '/' || p_file_name;
  INSERT INTO public.sources (
    id, workspace_id, origin, title, subtitle, source_type, authors, organization,
    publication_date, external_identifier, quality, sensitivity, external_ai_policy,
    rights_note, tags, file_name, file_mime_type, file_size_bytes,
    file_checksum_sha256, storage_path, ingestion_status, added_by
  ) VALUES (
    v_source_id, p_workspace_id, 'file', trim(p_metadata->>'title'),
    NULLIF(trim(COALESCE(p_metadata->>'subtitle', '')), ''),
    (p_metadata->>'sourceType')::public.source_type,
    COALESCE(p_metadata->'authors', '[]'::jsonb),
    NULLIF(trim(COALESCE(p_metadata->>'organization', '')), ''),
    NULLIF(p_metadata->>'publicationDate', '')::date,
    NULLIF(trim(COALESCE(p_metadata->>'externalIdentifier', '')), ''),
    (p_metadata->>'quality')::public.source_quality,
    (p_metadata->>'sensitivity')::public.source_sensitivity,
    (p_metadata->>'externalAiPolicy')::public.external_ai_policy,
    trim(p_metadata->>'rightsNote'),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_metadata->'tags', '[]'::jsonb))),
    p_file_name, p_mime_type, p_size_bytes, p_checksum_sha256, v_storage_path,
    'pending', v_user_id
  );
  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id,
    summary, after_summary
  ) VALUES (
    p_workspace_id, v_user_id, 'user', 'source.created', 'source', v_source_id,
    'Created private file source', jsonb_build_object('origin', 'file', 'checksum', p_checksum_sha256)
  );
  RETURN jsonb_build_object('sourceId', v_source_id, 'storagePath', v_storage_path);
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.enqueue_source_ingestion(
  p_workspace_id uuid,
  p_source_id uuid,
  p_parser_profile text DEFAULT 'default-v1',
  p_extraction_schema_version text DEFAULT 'deterministic-v1'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_source public.sources%ROWTYPE;
  v_job public.ingestion_jobs%ROWTYPE;
  v_idempotency_key text;
  v_message jsonb;
  v_message_id bigint;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_workspace_member(
    p_workspace_id, ARRAY['owner', 'editor']
  ) THEN
    RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501';
  END IF;
  IF length(trim(COALESCE(p_parser_profile, ''))) = 0
     OR length(trim(COALESCE(p_extraction_schema_version, ''))) = 0 THEN
    RAISE EXCEPTION 'ingestion profiles are required' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_source_id::text, 0));
  SELECT * INTO v_source FROM public.sources
  WHERE id = p_source_id AND workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_source.id IS NULL THEN
    RAISE EXCEPTION 'source not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_source.origin = 'file' AND (
    v_source.storage_path IS NULL OR v_source.file_checksum_sha256 IS NULL
  ) THEN
    RAISE EXCEPTION 'file upload is not finalized' USING ERRCODE = '23514';
  END IF;
  v_idempotency_key := p_source_id::text || ':' ||
    COALESCE(v_source.file_checksum_sha256, 'url') || ':' ||
    trim(p_parser_profile) || ':' || trim(p_extraction_schema_version);
  SELECT * INTO v_job FROM public.ingestion_jobs
  WHERE workspace_id = p_workspace_id AND idempotency_key = v_idempotency_key;
  IF v_job.id IS NOT NULL AND v_job.status IN ('queued', 'running', 'completed') THEN
    RETURN jsonb_build_object('jobId', v_job.id, 'status', v_job.status, 'reused', true);
  END IF;
  IF v_job.id IS NULL THEN
    INSERT INTO public.ingestion_jobs (
      workspace_id, source_id, status, stage, idempotency_key, parser_profile,
      extraction_schema_version, allow_external_ai, requested_by
    ) VALUES (
      p_workspace_id, p_source_id, 'queued', 'download', v_idempotency_key,
      trim(p_parser_profile), trim(p_extraction_schema_version), false, v_user_id
    ) RETURNING * INTO v_job;
  ELSE
    UPDATE public.ingestion_jobs SET
      status = 'queued', stage = 'download', progress = 0, requested_by = v_user_id,
      error_code = NULL, error_message_sanitized = NULL, started_at = NULL,
      completed_at = NULL
    WHERE id = v_job.id RETURNING * INTO v_job;
  END IF;
  v_message := jsonb_build_object(
    'version', 1,
    'jobId', v_job.id,
    'workspaceId', p_workspace_id,
    'sourceId', p_source_id,
    'requestedBy', v_user_id,
    'parserProfile', trim(p_parser_profile),
    'extractionSchemaVersion', trim(p_extraction_schema_version),
    'allowExternalAi', false,
    'forceReprocess', false
  );
  SELECT * INTO v_message_id FROM pgmq.send('source_ingest', v_message);
  UPDATE public.ingestion_jobs SET queue_message_id = v_message_id WHERE id = v_job.id;
  UPDATE public.sources SET ingestion_status = 'queued' WHERE id = p_source_id;
  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id,
    summary, after_summary
  ) VALUES (
    p_workspace_id, v_user_id, 'user', 'ingestion.queued', 'ingestion_job', v_job.id,
    'Queued deterministic source ingestion',
    jsonb_build_object('sourceId', p_source_id, 'parserProfile', trim(p_parser_profile))
  );
  RETURN jsonb_build_object('jobId', v_job.id, 'status', 'queued', 'reused', false);
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.create_url_source(
  p_workspace_id uuid,
  p_url text,
  p_metadata jsonb,
  p_parser_profile text DEFAULT 'default-v1',
  p_extraction_schema_version text DEFAULT 'deterministic-v1'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_source_id uuid := gen_random_uuid();
  v_job jsonb;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_workspace_member(
    p_workspace_id, ARRAY['owner', 'editor']
  ) THEN
    RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501';
  END IF;
  IF p_url IS NULL OR p_url !~ '^https?://' THEN
    RAISE EXCEPTION 'URL must use HTTP or HTTPS' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.sources (
    id, workspace_id, origin, title, subtitle, source_type, authors, organization,
    publication_date, external_url, external_identifier, quality, sensitivity,
    external_ai_policy, rights_note, tags, ingestion_status, added_by
  ) VALUES (
    v_source_id, p_workspace_id, 'url', trim(p_metadata->>'title'),
    NULLIF(trim(COALESCE(p_metadata->>'subtitle', '')), ''),
    (p_metadata->>'sourceType')::public.source_type,
    COALESCE(p_metadata->'authors', '[]'::jsonb),
    NULLIF(trim(COALESCE(p_metadata->>'organization', '')), ''),
    NULLIF(p_metadata->>'publicationDate', '')::date,
    p_url, NULLIF(trim(COALESCE(p_metadata->>'externalIdentifier', '')), ''),
    (p_metadata->>'quality')::public.source_quality,
    (p_metadata->>'sensitivity')::public.source_sensitivity,
    (p_metadata->>'externalAiPolicy')::public.external_ai_policy,
    trim(p_metadata->>'rightsNote'),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_metadata->'tags', '[]'::jsonb))),
    'pending', v_user_id
  );
  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id,
    summary, after_summary
  ) VALUES (
    p_workspace_id, v_user_id, 'user', 'source.created', 'source', v_source_id,
    'Created explicit URL source', jsonb_build_object('origin', 'url')
  );
  v_job := public.enqueue_source_ingestion(
    p_workspace_id, v_source_id, p_parser_profile, p_extraction_schema_version
  );
  RETURN jsonb_build_object(
    'sourceId', v_source_id,
    'jobId', v_job->>'jobId',
    'status', v_job->>'status'
  );
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.retry_ingestion_job(
  p_workspace_id uuid,
  p_job_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_job public.ingestion_jobs%ROWTYPE;
  v_message_id bigint;
  v_message jsonb;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_workspace_member(
    p_workspace_id, ARRAY['owner', 'editor']
  ) THEN
    RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_job_id::text, 0));
  SELECT * INTO v_job FROM public.ingestion_jobs
  WHERE id = p_job_id AND workspace_id = p_workspace_id;
  IF v_job.id IS NULL THEN
    RAISE EXCEPTION 'ingestion job not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_job.status = 'completed' THEN
    RETURN jsonb_build_object('jobId', v_job.id, 'status', 'completed', 'reused', true);
  END IF;
  IF v_job.status NOT IN ('failed', 'dead_letter') THEN
    RAISE EXCEPTION 'only failed jobs can be retried' USING ERRCODE = '23514';
  END IF;
  v_message := jsonb_build_object(
    'version', 1,
    'jobId', v_job.id,
    'workspaceId', v_job.workspace_id,
    'sourceId', v_job.source_id,
    'requestedBy', v_user_id,
    'parserProfile', v_job.parser_profile,
    'extractionSchemaVersion', v_job.extraction_schema_version,
    'allowExternalAi', false,
    'forceReprocess', false
  );
  SELECT * INTO v_message_id FROM pgmq.send('source_ingest', v_message);
  UPDATE public.ingestion_jobs SET
    status = 'queued', stage = 'download', progress = 0, queue_message_id = v_message_id,
    requested_by = v_user_id, error_code = NULL, error_message_sanitized = NULL,
    started_at = NULL, completed_at = NULL
  WHERE id = p_job_id;
  UPDATE public.sources SET ingestion_status = 'queued' WHERE id = v_job.source_id;
  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id, summary
  ) VALUES (
    p_workspace_id, v_user_id, 'user', 'ingestion.retried', 'ingestion_job', p_job_id,
    'Retried deterministic source ingestion'
  );
  RETURN jsonb_build_object('jobId', p_job_id, 'status', 'queued', 'reused', true);
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.create_file_source(uuid, text, text, bigint, text, jsonb) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_file_source(uuid, text, text, bigint, text, jsonb) TO authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.enqueue_source_ingestion(uuid, uuid, text, text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.enqueue_source_ingestion(uuid, uuid, text, text) TO authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.create_url_source(uuid, text, jsonb, text, text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_url_source(uuid, text, jsonb, text, text) TO authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.retry_ingestion_job(uuid, uuid) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.retry_ingestion_job(uuid, uuid) TO authenticated;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.search_source_segments_lexical(
  p_workspace_id uuid,
  p_query text,
  p_source_types public.source_type[] DEFAULT NULL,
  p_source_qualities public.source_quality[] DEFAULT NULL,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  source_id uuid,
  segment_id uuid,
  title text,
  source_type public.source_type,
  quality public.source_quality,
  rank bigint,
  lexical_score real,
  snippet text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH matches AS (
    SELECT
      source.id AS source_id,
      segment.id AS segment_id,
      source.title,
      source.source_type,
      source.quality,
      ts_rank_cd(segment.search_document, websearch_to_tsquery('english', trim(p_query)))::real
        AS lexical_score,
      ts_headline(
        'english', segment.text, websearch_to_tsquery('english', trim(p_query)),
        'MaxWords=32, MinWords=12'
      ) AS snippet
    FROM public.source_segments segment
    JOIN public.source_versions version
      ON version.id = segment.source_version_id
      AND version.workspace_id = segment.workspace_id
      AND version.processing_status = 'completed'
    JOIN public.sources source
      ON source.id = version.source_id
      AND source.workspace_id = version.workspace_id
      AND source.deleted_at IS NULL
    WHERE segment.workspace_id = p_workspace_id
      AND segment.search_document @@ websearch_to_tsquery('english', trim(p_query))
      AND (p_source_types IS NULL OR source.source_type = ANY(p_source_types))
      AND (p_source_qualities IS NULL OR source.quality = ANY(p_source_qualities))
  ),
  best_per_source AS (
    SELECT DISTINCT ON (matches.source_id) matches.*
    FROM matches
    ORDER BY matches.source_id, matches.lexical_score DESC, matches.segment_id
  )
  SELECT
    best.source_id,
    best.segment_id,
    best.title,
    best.source_type,
    best.quality,
    row_number() OVER (ORDER BY best.lexical_score DESC, best.source_id),
    best.lexical_score,
    best.snippet
  FROM best_per_source best
  ORDER BY best.lexical_score DESC, best.source_id
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.search_source_segments_lexical(
  uuid, text, public.source_type[], public.source_quality[], integer
) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.search_source_segments_lexical(
  uuid, text, public.source_type[], public.source_quality[], integer
) TO authenticated;
--> statement-breakpoint
GRANT SELECT ON public.sources, public.source_versions, public.source_segments, public.ingestion_jobs
TO authenticated;
