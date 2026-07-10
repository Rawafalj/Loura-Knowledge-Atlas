CREATE TYPE "public"."alias_type" AS ENUM('synonym', 'abbreviation', 'former_name', 'translation', 'common_misnomer');--> statement-breakpoint
CREATE TYPE "public"."audit_actor_type" AS ENUM('user', 'worker', 'system');--> statement-breakpoint
CREATE TYPE "public"."concept_kind" AS ENUM('concept', 'theory', 'mechanism', 'method', 'standard', 'model', 'tool');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'reviewed', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."domain_kind" AS ENUM('root', 'core', 'overlay');--> statement-breakpoint
CREATE TYPE "public"."content_priority" AS ENUM('now', 'next', 'later', 'reference');--> statement-breakpoint
CREATE TYPE "public"."relation_category" AS ENUM('hierarchy', 'learning', 'explanatory', 'contrast', 'operational', 'application', 'epistemic');--> statement-breakpoint
CREATE TYPE "public"."relation_provenance" AS ENUM('human', 'source_extracted', 'inferred');--> statement-breakpoint
CREATE TYPE "public"."revision_change_source" AS ENUM('manual', 'proposal', 'import', 'restore');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"actor_type" "audit_actor_type" NOT NULL,
	"event_type" text NOT NULL,
	"object_type" text NOT NULL,
	"object_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"before_summary" jsonb,
	"after_summary" jsonb,
	"source_proposal_item_id" uuid,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concept_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"alias_normalized" text NOT NULL,
	"alias_type" "alias_type" DEFAULT 'synonym' NOT NULL,
	"language_code" text DEFAULT 'en' NOT NULL,
	"disambiguation_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concept_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_concept_id" uuid NOT NULL,
	"relation_type_id" uuid NOT NULL,
	"target_concept_id" uuid NOT NULL,
	"description" text,
	"confidence" numeric(4, 3),
	"review_status" "content_status" DEFAULT 'draft' NOT NULL,
	"provenance_type" "relation_provenance" DEFAULT 'human' NOT NULL,
	"source_proposal_item_id" uuid,
	"created_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "concept_relations_confidence_check" CHECK ("concept_relations"."confidence" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "concept_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_summary" text NOT NULL,
	"change_source" "revision_change_source" NOT NULL,
	"proposal_item_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "concept_revisions_number_unique" UNIQUE("concept_id","revision_number")
);
--> statement-breakpoint
CREATE TABLE "concepts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"canonical_name" text NOT NULL,
	"concise_definition" text DEFAULT '' NOT NULL,
	"synthesis_markdown" text DEFAULT '' NOT NULL,
	"why_it_exists_markdown" text,
	"mechanism_markdown" text,
	"examples_markdown" text,
	"counterexamples_markdown" text,
	"failure_modes_markdown" text,
	"common_confusions_markdown" text,
	"canonical_domain_id" uuid NOT NULL,
	"canonical_parent_id" uuid,
	"concept_kind" "concept_kind" DEFAULT 'concept' NOT NULL,
	"content_status" "content_status" DEFAULT 'draft' NOT NULL,
	"priority" "content_priority" DEFAULT 'later' NOT NULL,
	"target_mastery" smallint,
	"review_note" text,
	"replacement_concept_id" uuid,
	"last_reviewed_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "concepts_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "concepts_target_mastery_check" CHECK ("concepts"."target_mastery" between 0 and 5),
	CONSTRAINT "concepts_parent_not_self_check" CHECK ("concepts"."canonical_parent_id" is null or "concepts"."canonical_parent_id" <> "concepts"."id"),
	CONSTRAINT "concepts_replacement_not_self_check" CHECK ("concepts"."replacement_concept_id" is null or "concepts"."replacement_concept_id" <> "concepts"."id")
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"short_description" text NOT NULL,
	"scope_markdown" text DEFAULT '' NOT NULL,
	"kind" "domain_kind" NOT NULL,
	"parent_domain_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"content_status" "content_status" DEFAULT 'draft' NOT NULL,
	"priority" "content_priority" DEFAULT 'later' NOT NULL,
	"target_mastery" smallint,
	"last_reviewed_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "domains_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "domains_target_mastery_check" CHECK ("domains"."target_mastery" between 0 and 5),
	CONSTRAINT "domains_parent_not_self_check" CHECK ("domains"."parent_domain_id" is null or "domains"."parent_domain_id" <> "domains"."id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relation_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"key" text NOT NULL,
	"forward_label" text NOT NULL,
	"inverse_label" text NOT NULL,
	"category" "relation_category" NOT NULL,
	"directed" boolean NOT NULL,
	"symmetric" boolean DEFAULT false NOT NULL,
	"acyclic" boolean DEFAULT false NOT NULL,
	"allows_self" boolean DEFAULT false NOT NULL,
	"allowed_source_kinds" text[] DEFAULT '{}'::text[] NOT NULL,
	"allowed_target_kinds" text[] DEFAULT '{}'::text[] NOT NULL,
	"style" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relation_types_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "relation_types_workspace_key_unique" UNIQUE("workspace_id","key"),
	CONSTRAINT "relation_types_symmetry_check" CHECK (not ("relation_types"."symmetric" and "relation_types"."directed"))
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "workspace_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_aliases" ADD CONSTRAINT "concept_aliases_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_aliases" ADD CONSTRAINT "concept_aliases_concept_workspace_fk" FOREIGN KEY ("concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_relations" ADD CONSTRAINT "concept_relations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_relations" ADD CONSTRAINT "concept_relations_source_workspace_fk" FOREIGN KEY ("source_concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_relations" ADD CONSTRAINT "concept_relations_target_workspace_fk" FOREIGN KEY ("target_concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_relations" ADD CONSTRAINT "concept_relations_type_workspace_fk" FOREIGN KEY ("relation_type_id","workspace_id") REFERENCES "public"."relation_types"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_revisions" ADD CONSTRAINT "concept_revisions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_revisions" ADD CONSTRAINT "concept_revisions_concept_workspace_fk" FOREIGN KEY ("concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_canonical_parent_id_concepts_id_fk" FOREIGN KEY ("canonical_parent_id") REFERENCES "public"."concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_replacement_concept_id_concepts_id_fk" FOREIGN KEY ("replacement_concept_id") REFERENCES "public"."concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_domain_workspace_fk" FOREIGN KEY ("canonical_domain_id","workspace_id") REFERENCES "public"."domains"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_parent_workspace_fk" FOREIGN KEY ("canonical_parent_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_replacement_workspace_fk" FOREIGN KEY ("replacement_concept_id","workspace_id") REFERENCES "public"."concepts"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_parent_domain_id_domains_id_fk" FOREIGN KEY ("parent_domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_parent_workspace_fk" FOREIGN KEY ("parent_domain_id","workspace_id") REFERENCES "public"."domains"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_types" ADD CONSTRAINT "relation_types_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_workspace_created_idx" ON "audit_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "concept_aliases_unqualified_unique" ON "concept_aliases" USING btree ("workspace_id","alias_normalized","language_code") WHERE "concept_aliases"."disambiguation_key" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "concept_aliases_qualified_unique" ON "concept_aliases" USING btree ("workspace_id","alias_normalized","language_code","disambiguation_key") WHERE "concept_aliases"."disambiguation_key" is not null;--> statement-breakpoint
CREATE INDEX "concept_aliases_concept_idx" ON "concept_aliases" USING btree ("workspace_id","concept_id");--> statement-breakpoint
CREATE UNIQUE INDEX "concept_relations_active_unique" ON "concept_relations" USING btree ("workspace_id","source_concept_id","relation_type_id","target_concept_id") WHERE "concept_relations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "concept_relations_source_idx" ON "concept_relations" USING btree ("workspace_id","source_concept_id","relation_type_id");--> statement-breakpoint
CREATE INDEX "concept_relations_target_idx" ON "concept_relations" USING btree ("workspace_id","target_concept_id","relation_type_id");--> statement-breakpoint
CREATE INDEX "concept_revisions_workspace_concept_idx" ON "concept_revisions" USING btree ("workspace_id","concept_id");--> statement-breakpoint
CREATE UNIQUE INDEX "concepts_workspace_slug_active_unique" ON "concepts" USING btree ("workspace_id","slug") WHERE "concepts"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "concepts_workspace_domain_idx" ON "concepts" USING btree ("workspace_id","canonical_domain_id");--> statement-breakpoint
CREATE INDEX "concepts_workspace_parent_idx" ON "concepts" USING btree ("workspace_id","canonical_parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "domains_workspace_slug_active_unique" ON "domains" USING btree ("workspace_id","slug") WHERE "domains"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "domains_workspace_parent_idx" ON "domains" USING btree ("workspace_id","parent_domain_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id","workspace_id");

-- Supabase Auth and actor integrity -------------------------------------------------

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_auth_user_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.domains
  ADD CONSTRAINT domains_created_by_profile_fk FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  ADD CONSTRAINT domains_updated_by_profile_fk FOREIGN KEY (updated_by) REFERENCES public.profiles(id);
ALTER TABLE public.concepts
  ADD CONSTRAINT concepts_created_by_profile_fk FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  ADD CONSTRAINT concepts_updated_by_profile_fk FOREIGN KEY (updated_by) REFERENCES public.profiles(id);
ALTER TABLE public.concept_relations
  ADD CONSTRAINT concept_relations_created_by_profile_fk FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  ADD CONSTRAINT concept_relations_reviewed_by_profile_fk FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);
ALTER TABLE public.concept_revisions
  ADD CONSTRAINT concept_revisions_created_by_profile_fk FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.audit_events
  ADD CONSTRAINT audit_events_actor_profile_fk FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id);

-- Shared helpers -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER workspaces_set_updated_at BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER domains_set_updated_at BEFORE UPDATE ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER concepts_set_updated_at BEFORE UPDATE ON public.concepts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER relation_types_set_updated_at BEFORE UPDATE ON public.relation_types
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER concept_relations_set_updated_at BEFORE UPDATE ON public.concept_relations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.normalize_alias_text(alias_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
  SELECT lower(regexp_replace(trim(normalize(alias_value, NFKC)), '\s+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.normalize_concept_alias()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.alias_normalized := public.normalize_alias_text(NEW.alias);
  RETURN NEW;
END;
$$;

CREATE TRIGGER concept_aliases_normalize BEFORE INSERT OR UPDATE OF alias ON public.concept_aliases
FOR EACH ROW EXECUTE FUNCTION public.normalize_concept_alias();

CREATE OR REPLACE FUNCTION public.is_workspace_member(
  workspace_uuid uuid,
  allowed_roles text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members AS member
    WHERE member.workspace_id = workspace_uuid
      AND member.user_id = auth.uid()
      AND (allowed_roles IS NULL OR member.role::text = ANY(allowed_roles))
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, text[]) TO authenticated;

-- Concurrent-safe hierarchy and relation invariants --------------------------------

CREATE OR REPLACE FUNCTION public.prevent_domain_parent_cycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.parent_domain_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.workspace_id::text, 101));
  IF EXISTS (
    WITH RECURSIVE ancestors(id) AS (
      SELECT NEW.parent_domain_id
      UNION
      SELECT domain.parent_domain_id
      FROM public.domains AS domain
      JOIN ancestors ON domain.id = ancestors.id
      WHERE domain.workspace_id = NEW.workspace_id
        AND domain.parent_domain_id IS NOT NULL
        AND domain.id <> NEW.id
    )
    SELECT 1 FROM ancestors WHERE id = NEW.id
  ) THEN
    RAISE EXCEPTION 'domain parent cycle detected' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER domains_prevent_parent_cycle
BEFORE INSERT OR UPDATE OF parent_domain_id, workspace_id ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.prevent_domain_parent_cycle();

CREATE OR REPLACE FUNCTION public.prevent_concept_parent_cycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.canonical_parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.workspace_id::text, 102));
  IF EXISTS (
    WITH RECURSIVE ancestors(id) AS (
      SELECT NEW.canonical_parent_id
      UNION
      SELECT concept.canonical_parent_id
      FROM public.concepts AS concept
      JOIN ancestors ON concept.id = ancestors.id
      WHERE concept.workspace_id = NEW.workspace_id
        AND concept.canonical_parent_id IS NOT NULL
        AND concept.id <> NEW.id
    )
    SELECT 1 FROM ancestors WHERE id = NEW.id
  ) THEN
    RAISE EXCEPTION 'canonical parent cycle detected' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER concepts_prevent_parent_cycle
BEFORE INSERT OR UPDATE OF canonical_parent_id, workspace_id ON public.concepts
FOR EACH ROW EXECUTE FUNCTION public.prevent_concept_parent_cycle();

CREATE OR REPLACE FUNCTION public.validate_concept_relation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  relation_definition public.relation_types%ROWTYPE;
  source_kind text;
  target_kind text;
  swap_id uuid;
BEGIN
  SELECT * INTO relation_definition
  FROM public.relation_types
  WHERE id = NEW.relation_type_id AND workspace_id = NEW.workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'relation type does not belong to workspace' USING ERRCODE = '23503';
  END IF;
  IF NEW.source_concept_id = NEW.target_concept_id AND NOT relation_definition.allows_self THEN
    RAISE EXCEPTION 'relation type does not allow self-relations' USING ERRCODE = '23514';
  END IF;

  SELECT concept_kind::text INTO source_kind
  FROM public.concepts WHERE id = NEW.source_concept_id AND workspace_id = NEW.workspace_id;
  SELECT concept_kind::text INTO target_kind
  FROM public.concepts WHERE id = NEW.target_concept_id AND workspace_id = NEW.workspace_id;
  IF source_kind IS NULL OR target_kind IS NULL THEN
    RAISE EXCEPTION 'relation endpoint does not belong to workspace' USING ERRCODE = '23503';
  END IF;
  IF cardinality(relation_definition.allowed_source_kinds) > 0
     AND NOT source_kind = ANY(relation_definition.allowed_source_kinds) THEN
    RAISE EXCEPTION 'source concept kind is not allowed for relation type' USING ERRCODE = '23514';
  END IF;
  IF cardinality(relation_definition.allowed_target_kinds) > 0
     AND NOT target_kind = ANY(relation_definition.allowed_target_kinds) THEN
    RAISE EXCEPTION 'target concept kind is not allowed for relation type' USING ERRCODE = '23514';
  END IF;

  IF relation_definition.symmetric AND NEW.source_concept_id::text > NEW.target_concept_id::text THEN
    swap_id := NEW.source_concept_id;
    NEW.source_concept_id := NEW.target_concept_id;
    NEW.target_concept_id := swap_id;
  END IF;

  IF relation_definition.acyclic THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.workspace_id::text || NEW.relation_type_id::text, 103));
    IF EXISTS (
      WITH RECURSIVE reachable(id) AS (
        SELECT NEW.target_concept_id
        UNION
        SELECT relation.target_concept_id
        FROM public.concept_relations AS relation
        JOIN reachable ON relation.source_concept_id = reachable.id
        WHERE relation.workspace_id = NEW.workspace_id
          AND relation.relation_type_id = NEW.relation_type_id
          AND relation.deleted_at IS NULL
          AND relation.id <> NEW.id
      )
      SELECT 1 FROM reachable WHERE id = NEW.source_concept_id
    ) THEN
      RAISE EXCEPTION 'acyclic relation cycle detected' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER concept_relations_validate
BEFORE INSERT OR UPDATE OF workspace_id, source_concept_id, relation_type_id, target_concept_id, deleted_at
ON public.concept_relations
FOR EACH ROW EXECUTE FUNCTION public.validate_concept_relation();

CREATE OR REPLACE FUNCTION public.protect_last_workspace_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Cascading a workspace deletion must be able to remove its memberships.
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  IF OLD.role = 'owner' AND (TG_OP = 'DELETE' OR NEW.role <> 'owner')
     AND NOT EXISTS (
       SELECT 1 FROM public.workspace_members
       WHERE workspace_id = OLD.workspace_id AND user_id <> OLD.user_id AND role = 'owner'
     ) THEN
    RAISE EXCEPTION 'workspace must retain at least one owner' USING ERRCODE = '23514';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER workspace_members_protect_last_owner
BEFORE UPDATE OF role OR DELETE ON public.workspace_members
FOR EACH ROW EXECUTE FUNCTION public.protect_last_workspace_owner();

CREATE OR REPLACE FUNCTION public.prevent_workspace_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.workspace_id <> OLD.workspace_id THEN
    RAISE EXCEPTION 'workspace_id is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER workspace_members_workspace_immutable BEFORE UPDATE OF workspace_id ON public.workspace_members
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER domains_workspace_immutable BEFORE UPDATE OF workspace_id ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER concepts_workspace_immutable BEFORE UPDATE OF workspace_id ON public.concepts
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER concept_aliases_workspace_immutable BEFORE UPDATE OF workspace_id ON public.concept_aliases
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER relation_types_workspace_immutable BEFORE UPDATE OF workspace_id ON public.relation_types
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER concept_relations_workspace_immutable BEFORE UPDATE OF workspace_id ON public.concept_relations
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER concept_revisions_workspace_immutable BEFORE UPDATE OF workspace_id ON public.concept_revisions
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER audit_events_workspace_immutable BEFORE UPDATE OF workspace_id ON public.audit_events
FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();

CREATE OR REPLACE FUNCTION public.preserve_creation_actor()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.created_by <> OLD.created_by THEN
    RAISE EXCEPTION 'created_by is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER domains_creation_actor_immutable BEFORE UPDATE OF created_by ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.preserve_creation_actor();
CREATE TRIGGER concepts_creation_actor_immutable BEFORE UPDATE OF created_by ON public.concepts
FOR EACH ROW EXECUTE FUNCTION public.preserve_creation_actor();
CREATE TRIGGER concept_relations_creation_actor_immutable BEFORE UPDATE OF created_by ON public.concept_relations
FOR EACH ROW EXECUTE FUNCTION public.preserve_creation_actor();

-- Row Level Security ---------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY workspaces_select_member ON public.workspaces FOR SELECT TO authenticated
USING (public.is_workspace_member(id));
CREATE POLICY workspaces_update_owner ON public.workspaces FOR UPDATE TO authenticated
USING (public.is_workspace_member(id, ARRAY['owner']))
WITH CHECK (public.is_workspace_member(id, ARRAY['owner']));

CREATE POLICY workspace_members_select_member ON public.workspace_members FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY workspace_members_insert_owner ON public.workspace_members FOR INSERT TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner']));
CREATE POLICY workspace_members_update_owner ON public.workspace_members FOR UPDATE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner']))
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner']));
CREATE POLICY workspace_members_delete_owner ON public.workspace_members FOR DELETE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner']));

CREATE POLICY domains_select_member ON public.domains FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY domains_insert_editor ON public.domains FOR INSERT TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id, ARRAY['owner', 'editor'])
  AND created_by = auth.uid() AND updated_by = auth.uid()
);
CREATE POLICY domains_update_editor ON public.domains FOR UPDATE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
WITH CHECK (
  public.is_workspace_member(workspace_id, ARRAY['owner', 'editor'])
  AND updated_by = auth.uid()
);
CREATE POLICY domains_delete_editor ON public.domains FOR DELETE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY concepts_select_member ON public.concepts FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY concepts_insert_editor ON public.concepts FOR INSERT TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id, ARRAY['owner', 'editor'])
  AND created_by = auth.uid() AND updated_by = auth.uid()
);
CREATE POLICY concepts_update_editor ON public.concepts FOR UPDATE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
WITH CHECK (
  public.is_workspace_member(workspace_id, ARRAY['owner', 'editor'])
  AND updated_by = auth.uid()
);
CREATE POLICY concepts_delete_editor ON public.concepts FOR DELETE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY concept_aliases_select_member ON public.concept_aliases FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY concept_aliases_insert_editor ON public.concept_aliases FOR INSERT TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));
CREATE POLICY concept_aliases_update_editor ON public.concept_aliases FOR UPDATE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));
CREATE POLICY concept_aliases_delete_editor ON public.concept_aliases FOR DELETE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY relation_types_select_member ON public.relation_types FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY relation_types_insert_owner ON public.relation_types FOR INSERT TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner']));
CREATE POLICY relation_types_update_owner ON public.relation_types FOR UPDATE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner']))
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner']));
CREATE POLICY relation_types_delete_owner ON public.relation_types FOR DELETE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner']));

CREATE POLICY concept_relations_select_member ON public.concept_relations FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY concept_relations_insert_editor ON public.concept_relations FOR INSERT TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id, ARRAY['owner', 'editor'])
  AND created_by = auth.uid()
);
CREATE POLICY concept_relations_update_editor ON public.concept_relations FOR UPDATE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));
CREATE POLICY concept_relations_delete_editor ON public.concept_relations FOR DELETE TO authenticated
USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

CREATE POLICY concept_revisions_select_member ON public.concept_revisions FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));
CREATE POLICY concept_revisions_insert_editor ON public.concept_revisions FOR INSERT TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id, ARRAY['owner', 'editor'])
  AND created_by = auth.uid()
);

CREATE POLICY audit_events_select_member ON public.audit_events FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concepts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concept_aliases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relation_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concept_relations TO authenticated;
GRANT SELECT, INSERT ON public.concept_revisions TO authenticated;
GRANT SELECT ON public.audit_events TO authenticated;

-- Audit and atomic bootstrap/import services ---------------------------------------

CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_workspace_id uuid,
  p_event_type text,
  p_object_type text,
  p_object_id uuid,
  p_summary text,
  p_before_summary jsonb DEFAULT NULL,
  p_after_summary jsonb DEFAULT NULL,
  p_request_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  event_id uuid;
BEGIN
  IF NOT public.is_workspace_member(p_workspace_id, ARRAY['owner', 'editor']) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id,
    summary, before_summary, after_summary, request_id
  ) VALUES (
    p_workspace_id, auth.uid(), 'user', p_event_type, p_object_type, p_object_id,
    p_summary, p_before_summary, p_after_summary, p_request_id
  ) RETURNING id INTO event_id;
  RETURN event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_audit_event(uuid, text, text, uuid, text, jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_audit_event(uuid, text, text, uuid, text, jsonb, jsonb, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.install_atlas_seed(p_workspace_id uuid, p_seed jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  domain_item jsonb;
  relation_type_item jsonb;
  concept_item jsonb;
  alias_item jsonb;
  relation_item jsonb;
  v_domain_id uuid;
  v_concept_id uuid;
  v_source_id uuid;
  v_target_id uuid;
  v_type_id uuid;
BEGIN
  IF NOT public.is_workspace_member(p_workspace_id, ARRAY['owner']) THEN
    RAISE EXCEPTION 'owner role required to install atlas seed' USING ERRCODE = '42501';
  END IF;
  IF COALESCE((p_seed->>'version')::integer, 0) <> 1 THEN
    RAISE EXCEPTION 'unsupported atlas seed version' USING ERRCODE = '22023';
  END IF;

  FOR domain_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_seed->'domains', '[]'::jsonb)) LOOP
    INSERT INTO public.domains (
      workspace_id, slug, title, short_description, scope_markdown, kind,
      sort_order, content_status, priority, target_mastery, created_by, updated_by
    ) VALUES (
      p_workspace_id,
      domain_item->>'slug',
      domain_item->>'title',
      domain_item->>'shortDescription',
      COALESCE(domain_item->>'scopeMarkdown', ''),
      (domain_item->>'kind')::public.domain_kind,
      COALESCE((domain_item->>'sortOrder')::integer, 0),
      COALESCE((domain_item->>'status')::public.content_status, 'draft'),
      COALESCE((domain_item->>'priority')::public.content_priority, 'later'),
      (domain_item->>'targetMastery')::smallint,
      auth.uid(), auth.uid()
    ) ON CONFLICT (workspace_id, slug) WHERE deleted_at IS NULL DO NOTHING;
  END LOOP;

  FOR domain_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_seed->'domains', '[]'::jsonb)) LOOP
    IF domain_item->>'parent' IS NOT NULL THEN
      SELECT id INTO v_domain_id FROM public.domains
      WHERE workspace_id = p_workspace_id
        AND slug = domain_item->>'parent'
        AND deleted_at IS NULL;
      IF v_domain_id IS NULL THEN
        RAISE EXCEPTION 'unknown parent domain: %', domain_item->>'parent' USING ERRCODE = '23503';
      END IF;
      UPDATE public.domains
      SET parent_domain_id = v_domain_id
      WHERE workspace_id = p_workspace_id
        AND slug = domain_item->>'slug'
        AND deleted_at IS NULL;
    END IF;
  END LOOP;

  FOR relation_type_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_seed->'relationTypes', '[]'::jsonb)) LOOP
    INSERT INTO public.relation_types (
      workspace_id, key, forward_label, inverse_label, category, directed, "symmetric",
      acyclic, allows_self, allowed_source_kinds, allowed_target_kinds, is_system
    ) VALUES (
      p_workspace_id,
      relation_type_item->>'key',
      relation_type_item->>'forwardLabel',
      relation_type_item->>'inverseLabel',
      (relation_type_item->>'category')::public.relation_category,
      COALESCE((relation_type_item->>'directed')::boolean, false),
      COALESCE((relation_type_item->>'symmetric')::boolean, false),
      COALESCE((relation_type_item->>'acyclic')::boolean, false),
      COALESCE((relation_type_item->>'allowsSelf')::boolean, false),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(relation_type_item->'allowedSourceKinds', '[]'::jsonb))),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(relation_type_item->'allowedTargetKinds', '[]'::jsonb))),
      COALESCE((relation_type_item->>'isSystem')::boolean, true)
    ) ON CONFLICT (workspace_id, key) DO NOTHING;
  END LOOP;

  FOR concept_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_seed->'concepts', '[]'::jsonb)) LOOP
    SELECT id INTO v_domain_id FROM public.domains
    WHERE workspace_id = p_workspace_id AND slug = concept_item->>'domain' AND deleted_at IS NULL;
    IF v_domain_id IS NULL THEN
      RAISE EXCEPTION 'unknown canonical domain: %', concept_item->>'domain' USING ERRCODE = '23503';
    END IF;
    INSERT INTO public.concepts (
      workspace_id, slug, canonical_name, concise_definition, synthesis_markdown,
      canonical_domain_id, concept_kind, content_status, priority, target_mastery,
      created_by, updated_by
    ) VALUES (
      p_workspace_id,
      concept_item->>'slug',
      concept_item->>'canonicalName',
      COALESCE(concept_item->>'conciseDefinition', ''),
      COALESCE(concept_item->>'synthesisMarkdown', ''),
      v_domain_id,
      COALESCE((concept_item->>'kind')::public.concept_kind, 'concept'),
      COALESCE((concept_item->>'status')::public.content_status, 'draft'),
      COALESCE((concept_item->>'priority')::public.content_priority, 'later'),
      (concept_item->>'targetMastery')::smallint,
      auth.uid(), auth.uid()
    ) ON CONFLICT (workspace_id, slug) WHERE deleted_at IS NULL DO NOTHING;
  END LOOP;

  FOR concept_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_seed->'concepts', '[]'::jsonb)) LOOP
    SELECT id INTO v_concept_id FROM public.concepts
    WHERE workspace_id = p_workspace_id AND slug = concept_item->>'slug' AND deleted_at IS NULL;
    IF concept_item->>'parent' IS NOT NULL THEN
      SELECT id INTO v_source_id FROM public.concepts
      WHERE workspace_id = p_workspace_id
        AND slug = concept_item->>'parent'
        AND deleted_at IS NULL;
      IF v_source_id IS NULL THEN
        RAISE EXCEPTION 'unknown parent concept: %', concept_item->>'parent' USING ERRCODE = '23503';
      END IF;
      UPDATE public.concepts
      SET canonical_parent_id = v_source_id
      WHERE id = v_concept_id AND workspace_id = p_workspace_id;
    END IF;

    FOR alias_item IN SELECT value FROM jsonb_array_elements(COALESCE(concept_item->'aliases', '[]'::jsonb)) LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.concept_aliases
        WHERE workspace_id = p_workspace_id
          AND concept_aliases.concept_id = v_concept_id
          AND alias_normalized = public.normalize_alias_text(alias_item->>'value')
          AND language_code = COALESCE(alias_item->>'languageCode', 'en')
          AND disambiguation_key IS NOT DISTINCT FROM alias_item->>'disambiguationKey'
      ) THEN
        INSERT INTO public.concept_aliases (
          workspace_id, concept_id, alias, alias_normalized, alias_type, language_code, disambiguation_key
        ) VALUES (
          p_workspace_id, v_concept_id, alias_item->>'value', public.normalize_alias_text(alias_item->>'value'),
          COALESCE((alias_item->>'type')::public.alias_type, 'synonym'),
          COALESCE(alias_item->>'languageCode', 'en'), alias_item->>'disambiguationKey'
        );
      END IF;
    END LOOP;

    INSERT INTO public.concept_revisions (
      workspace_id, concept_id, revision_number, snapshot, change_summary, change_source, created_by
    ) VALUES (
      p_workspace_id, v_concept_id, 1, concept_item, 'Imported from atlas seed', 'import', auth.uid()
    ) ON CONFLICT (concept_id, revision_number) DO NOTHING;
  END LOOP;

  FOR relation_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_seed->'relations', '[]'::jsonb)) LOOP
    SELECT id INTO v_source_id FROM public.concepts
    WHERE workspace_id = p_workspace_id AND slug = relation_item->>'source' AND deleted_at IS NULL;
    SELECT id INTO v_target_id FROM public.concepts
    WHERE workspace_id = p_workspace_id AND slug = relation_item->>'target' AND deleted_at IS NULL;
    SELECT id INTO v_type_id FROM public.relation_types
    WHERE workspace_id = p_workspace_id AND key = relation_item->>'type';
    IF v_source_id IS NULL OR v_target_id IS NULL OR v_type_id IS NULL THEN
      RAISE EXCEPTION 'seed relation has an unknown reference' USING ERRCODE = '23503';
    END IF;
    INSERT INTO public.concept_relations (
      workspace_id, source_concept_id, relation_type_id, target_concept_id,
      description, review_status, provenance_type, created_by
    ) VALUES (
      p_workspace_id, v_source_id, v_type_id, v_target_id, relation_item->>'description',
      COALESCE((relation_item->>'status')::public.content_status, 'draft'), 'human', auth.uid()
    ) ON CONFLICT (workspace_id, source_concept_id, relation_type_id, target_concept_id)
      WHERE deleted_at IS NULL DO NOTHING;
  END LOOP;

  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id, summary, after_summary
  ) VALUES (
    p_workspace_id, auth.uid(), 'user', 'atlas.seed_imported', 'workspace', p_workspace_id,
    'Validated atlas seed installed',
    jsonb_build_object(
      'domains', jsonb_array_length(COALESCE(p_seed->'domains', '[]'::jsonb)),
      'concepts', jsonb_array_length(COALESCE(p_seed->'concepts', '[]'::jsonb)),
      'relationTypes', jsonb_array_length(COALESCE(p_seed->'relationTypes', '[]'::jsonb)),
      'relations', jsonb_array_length(COALESCE(p_seed->'relations', '[]'::jsonb))
    )
  );

  RETURN jsonb_build_object(
    'workspaceId', p_workspace_id,
    'domains', (SELECT count(*) FROM public.domains WHERE workspace_id = p_workspace_id AND deleted_at IS NULL),
    'concepts', (SELECT count(*) FROM public.concepts WHERE workspace_id = p_workspace_id AND deleted_at IS NULL),
    'relationTypes', (SELECT count(*) FROM public.relation_types WHERE workspace_id = p_workspace_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.install_atlas_seed(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.install_atlas_seed(uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.bootstrap_workspace(
  p_name text,
  p_slug text,
  p_seed jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_workspace_id uuid;
  v_display_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 2 OR p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'invalid workspace name or slug' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'user already belongs to a workspace' USING ERRCODE = '23505';
  END IF;

  v_display_name := COALESCE(auth.jwt()->'user_metadata'->>'display_name', auth.jwt()->>'email');
  INSERT INTO public.profiles (id, display_name)
  VALUES (v_user_id, v_display_name)
  ON CONFLICT (id) DO UPDATE SET display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.workspaces (name, slug, created_by)
  VALUES (trim(p_name), p_slug, v_user_id)
  RETURNING id INTO v_workspace_id;
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, v_user_id, 'owner');

  INSERT INTO public.audit_events (
    workspace_id, actor_user_id, actor_type, event_type, object_type, object_id, summary
  ) VALUES (
    v_workspace_id, v_user_id, 'user', 'workspace.created', 'workspace', v_workspace_id,
    'Workspace bootstrapped by first owner'
  );

  IF p_seed IS NOT NULL THEN
    PERFORM public.install_atlas_seed(v_workspace_id, p_seed);
  END IF;
  RETURN v_workspace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_workspace(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_workspace(text, text, jsonb) TO authenticated;
