CREATE TYPE public.loura_application_type AS ENUM (
  'decision', 'component', 'experiment', 'deployment_question', 'artifact', 'risk', 'requirement'
);
CREATE TYPE public.loura_application_status AS ENUM (
  'proposed', 'active', 'decided', 'validated', 'archived'
);

CREATE TABLE public.loura_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  application_type public.loura_application_type NOT NULL,
  title text NOT NULL,
  description_markdown text NOT NULL,
  implication_markdown text,
  status public.loura_application_status NOT NULL DEFAULT 'proposed',
  owner_user_id uuid REFERENCES public.profiles(id),
  project_tag text,
  external_url text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT loura_applications_id_workspace_unique UNIQUE (id, workspace_id),
  CONSTRAINT loura_applications_title_check CHECK (length(trim(title)) > 0),
  CONSTRAINT loura_applications_description_check CHECK (length(trim(description_markdown)) > 0),
  CONSTRAINT loura_applications_external_url_check CHECK (external_url IS NULL OR external_url ~ '^https?://[^[:space:]]+$'),
  CONSTRAINT loura_applications_archived_check CHECK (
    (status = 'archived' AND archived_at IS NOT NULL) OR
    (status <> 'archived' AND archived_at IS NULL)
  )
);

CREATE TABLE public.concept_applications (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL,
  application_id uuid NOT NULL,
  relevance_note text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, concept_id, application_id),
  CONSTRAINT concept_applications_concept_workspace_fk
    FOREIGN KEY (concept_id, workspace_id) REFERENCES public.concepts(id, workspace_id) ON DELETE CASCADE,
  CONSTRAINT concept_applications_application_workspace_fk
    FOREIGN KEY (application_id, workspace_id) REFERENCES public.loura_applications(id, workspace_id) ON DELETE CASCADE,
  CONSTRAINT concept_applications_relevance_check CHECK (length(trim(relevance_note)) >= 3)
);

CREATE INDEX loura_applications_workspace_status_idx
  ON public.loura_applications (workspace_id, status, updated_at);
CREATE INDEX concept_applications_workspace_application_idx
  ON public.concept_applications (workspace_id, application_id);
CREATE INDEX concept_applications_workspace_concept_idx
  ON public.concept_applications (workspace_id, concept_id);

ALTER TABLE public.loura_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY loura_applications_select_member ON public.loura_applications
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY loura_applications_insert_editor ON public.loura_applications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']) AND created_by = auth.uid());
CREATE POLICY loura_applications_update_editor ON public.loura_applications
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']))
  WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));
CREATE POLICY loura_applications_delete_owner ON public.loura_applications
  FOR DELETE TO authenticated USING (public.is_workspace_member(workspace_id, ARRAY['owner']));

CREATE POLICY concept_applications_select_member ON public.concept_applications
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY concept_applications_insert_editor ON public.concept_applications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));
CREATE POLICY concept_applications_delete_editor ON public.concept_applications
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id, ARRAY['owner', 'editor']));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loura_applications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.concept_applications TO authenticated;

CREATE TRIGGER loura_applications_set_updated_at
  BEFORE UPDATE ON public.loura_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER loura_applications_workspace_immutable
  BEFORE UPDATE OF workspace_id ON public.loura_applications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();
CREATE TRIGGER concept_applications_workspace_immutable
  BEFORE UPDATE OF workspace_id ON public.concept_applications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_workspace_reassignment();

CREATE OR REPLACE FUNCTION public.validate_loura_application_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.owner_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = NEW.workspace_id AND wm.user_id = NEW.owner_user_id
  ) THEN
    RAISE EXCEPTION 'application owner must be a workspace member' USING ERRCODE = '23503';
  END IF;
  IF NEW.created_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = NEW.workspace_id AND wm.user_id = NEW.created_by
  ) THEN
    RAISE EXCEPTION 'application creator must be a workspace member' USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER loura_applications_validate_owner
  BEFORE INSERT OR UPDATE OF workspace_id, owner_user_id, created_by
  ON public.loura_applications FOR EACH ROW
  EXECUTE FUNCTION public.validate_loura_application_owner();

CREATE OR REPLACE FUNCTION public.protect_loura_application_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'application workspace and creator are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER loura_applications_identity_immutable
  BEFORE UPDATE OF workspace_id, created_by ON public.loura_applications
  FOR EACH ROW EXECUTE FUNCTION public.protect_loura_application_identity();

CREATE OR REPLACE FUNCTION public.create_loura_application(
  p_workspace_id uuid,
  p_application_type public.loura_application_type,
  p_title text,
  p_description_markdown text,
  p_implication_markdown text DEFAULT NULL,
  p_status public.loura_application_status DEFAULT 'proposed',
  p_owner_user_id uuid DEFAULT NULL,
  p_project_tag text DEFAULT NULL,
  p_external_url text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := auth.uid(); v_app public.loura_applications%ROWTYPE;
BEGIN
  IF v_user IS NULL OR NOT public.is_workspace_member(p_workspace_id, ARRAY['owner','editor']) THEN
    RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501';
  END IF;
  IF p_status = 'archived' THEN
    RAISE EXCEPTION 'new applications cannot be archived' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.loura_applications (
    workspace_id, application_type, title, description_markdown, implication_markdown,
    status, owner_user_id, project_tag, external_url, created_by
  ) VALUES (
    p_workspace_id, p_application_type, trim(p_title), trim(p_description_markdown),
    NULLIF(trim(p_implication_markdown), ''), p_status, p_owner_user_id,
    NULLIF(trim(p_project_tag), ''), NULLIF(trim(p_external_url), ''), v_user
  ) RETURNING * INTO v_app;
  INSERT INTO public.audit_events (workspace_id, actor_user_id, actor_type, event_type, object_type, object_id, summary, after_summary)
  VALUES (p_workspace_id, v_user, 'user', 'loura_application.created', 'loura_application', v_app.id,
    'Created Loura application', jsonb_build_object('title', v_app.title, 'status', v_app.status));
  RETURN to_jsonb(v_app);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_loura_application(
  p_workspace_id uuid, p_application_id uuid,
  p_application_type public.loura_application_type DEFAULT NULL,
  p_title text DEFAULT NULL, p_description_markdown text DEFAULT NULL,
  p_implication_markdown text DEFAULT NULL,
  p_status public.loura_application_status DEFAULT NULL,
  p_owner_user_id uuid DEFAULT NULL, p_project_tag text DEFAULT NULL,
  p_external_url text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := auth.uid(); v_before public.loura_applications%ROWTYPE; v_app public.loura_applications%ROWTYPE;
BEGIN
  IF v_user IS NULL OR NOT public.is_workspace_member(p_workspace_id, ARRAY['owner','editor']) THEN
    RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_before FROM public.loura_applications
    WHERE id = p_application_id AND workspace_id = p_workspace_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'application not found' USING ERRCODE = 'P0002'; END IF;
  IF v_before.status = 'archived' THEN RAISE EXCEPTION 'archived applications are immutable' USING ERRCODE = '22023'; END IF;
  UPDATE public.loura_applications SET
    application_type = COALESCE(p_application_type, application_type),
    title = COALESCE(NULLIF(trim(p_title), ''), title),
    description_markdown = COALESCE(NULLIF(trim(p_description_markdown), ''), description_markdown),
    implication_markdown = CASE WHEN p_implication_markdown IS NULL THEN implication_markdown ELSE NULLIF(trim(p_implication_markdown), '') END,
    status = COALESCE(p_status, status),
    archived_at = CASE WHEN p_status = 'archived' THEN now() WHEN p_status IS NOT NULL AND p_status <> 'archived' THEN NULL ELSE archived_at END,
    owner_user_id = CASE WHEN p_owner_user_id IS NULL THEN owner_user_id ELSE p_owner_user_id END,
    project_tag = CASE WHEN p_project_tag IS NULL THEN project_tag ELSE NULLIF(trim(p_project_tag), '') END,
    external_url = CASE WHEN p_external_url IS NULL THEN external_url ELSE NULLIF(trim(p_external_url), '') END
    WHERE id = p_application_id AND workspace_id = p_workspace_id RETURNING * INTO v_app;
  INSERT INTO public.audit_events (workspace_id, actor_user_id, actor_type, event_type, object_type, object_id, summary, before_summary, after_summary)
  VALUES (p_workspace_id, v_user, 'user', 'loura_application.updated', 'loura_application', v_app.id,
    'Updated Loura application', to_jsonb(v_before), to_jsonb(v_app));
  RETURN to_jsonb(v_app);
END;
$$;

CREATE OR REPLACE FUNCTION public.link_concept_application(
  p_workspace_id uuid, p_concept_id uuid, p_application_id uuid, p_relevance_note text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := auth.uid(); v_link public.concept_applications%ROWTYPE;
BEGIN
  IF v_user IS NULL OR NOT public.is_workspace_member(p_workspace_id, ARRAY['owner','editor']) THEN RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.loura_applications WHERE id = p_application_id AND workspace_id = p_workspace_id AND status = 'archived') THEN RAISE EXCEPTION 'cannot link an archived application' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.concept_applications (workspace_id, concept_id, application_id, relevance_note, created_by)
  VALUES (p_workspace_id, p_concept_id, p_application_id, trim(p_relevance_note), v_user)
  ON CONFLICT (workspace_id, concept_id, application_id) DO UPDATE SET relevance_note = EXCLUDED.relevance_note
  RETURNING * INTO v_link;
  INSERT INTO public.audit_events (workspace_id, actor_user_id, actor_type, event_type, object_type, object_id, summary, after_summary)
  VALUES (p_workspace_id, v_user, 'user', 'concept_application.linked', 'concept_application', p_application_id,
    'Linked concept to Loura application', jsonb_build_object('conceptId', p_concept_id, 'applicationId', p_application_id, 'relevanceNote', v_link.relevance_note));
  RETURN to_jsonb(v_link);
END;
$$;

CREATE OR REPLACE FUNCTION public.unlink_concept_application(
  p_workspace_id uuid, p_concept_id uuid, p_application_id uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL OR NOT public.is_workspace_member(p_workspace_id, ARRAY['owner','editor']) THEN RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501'; END IF;
  DELETE FROM public.concept_applications WHERE workspace_id = p_workspace_id AND concept_id = p_concept_id AND application_id = p_application_id;
  IF FOUND THEN
    INSERT INTO public.audit_events (workspace_id, actor_user_id, actor_type, event_type, object_type, object_id, summary, after_summary)
    VALUES (p_workspace_id, v_user, 'user', 'concept_application.unlinked', 'concept_application', p_application_id,
      'Unlinked concept from Loura application', jsonb_build_object('conceptId', p_concept_id, 'applicationId', p_application_id));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_loura_application(p_workspace_id uuid, p_application_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := auth.uid(); v_app public.loura_applications%ROWTYPE;
BEGIN
  IF v_user IS NULL OR NOT public.is_workspace_member(p_workspace_id, ARRAY['owner','editor']) THEN RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501'; END IF;
  UPDATE public.loura_applications SET status = 'archived', archived_at = now()
    WHERE id = p_application_id AND workspace_id = p_workspace_id RETURNING * INTO v_app;
  IF NOT FOUND THEN RAISE EXCEPTION 'application not found' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO public.audit_events (workspace_id, actor_user_id, actor_type, event_type, object_type, object_id, summary, after_summary)
  VALUES (p_workspace_id, v_user, 'user', 'loura_application.archived', 'loura_application', v_app.id,
    'Archived Loura application', jsonb_build_object('status', 'archived'));
  RETURN to_jsonb(v_app);
END;
$$;

REVOKE ALL ON FUNCTION public.create_loura_application(uuid, public.loura_application_type, text, text, text, public.loura_application_status, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_loura_application(uuid, uuid, public.loura_application_type, text, text, text, public.loura_application_status, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_concept_application(uuid, uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unlink_concept_application(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archive_loura_application(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_loura_application(uuid, public.loura_application_type, text, text, text, public.loura_application_status, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_loura_application(uuid, uuid, public.loura_application_type, text, text, text, public.loura_application_status, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_concept_application(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_concept_application(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_loura_application(uuid, uuid) TO authenticated;
