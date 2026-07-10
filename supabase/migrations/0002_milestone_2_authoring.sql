-- Milestone 2: transactional concept, alias, revision, and relation authoring.

CREATE OR REPLACE FUNCTION public.shares_workspace_with(profile_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members AS viewer_membership
    JOIN public.workspace_members AS profile_membership
      ON profile_membership.workspace_id = viewer_membership.workspace_id
    WHERE viewer_membership.user_id = auth.uid()
      AND profile_membership.user_id = profile_uuid
  );
$$;

REVOKE ALL ON FUNCTION public.shares_workspace_with(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shares_workspace_with(uuid) TO authenticated;

DROP POLICY profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_workspace_peer ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.shares_workspace_with(id));

CREATE OR REPLACE FUNCTION public.concept_snapshot(p_concept_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'id', concept.id,
    'slug', concept.slug,
    'canonicalName', concept.canonical_name,
    'conciseDefinition', concept.concise_definition,
    'synthesisMarkdown', concept.synthesis_markdown,
    'whyItExistsMarkdown', concept.why_it_exists_markdown,
    'mechanismMarkdown', concept.mechanism_markdown,
    'examplesMarkdown', concept.examples_markdown,
    'counterexamplesMarkdown', concept.counterexamples_markdown,
    'failureModesMarkdown', concept.failure_modes_markdown,
    'commonConfusionsMarkdown', concept.common_confusions_markdown,
    'canonicalDomainId', concept.canonical_domain_id,
    'canonicalParentId', concept.canonical_parent_id,
    'conceptKind', concept.concept_kind,
    'contentStatus', concept.content_status,
    'priority', concept.priority,
    'targetMastery', concept.target_mastery,
    'reviewNote', concept.review_note,
    'replacementConceptId', concept.replacement_concept_id,
    'lastReviewedAt', concept.last_reviewed_at,
    'updatedAt', concept.updated_at,
    'aliases', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', alias.id,
          'value', alias.alias,
          'type', alias.alias_type,
          'languageCode', alias.language_code,
          'disambiguationKey', alias.disambiguation_key
        ) ORDER BY alias.alias_normalized, alias.language_code
      )
      FROM public.concept_aliases AS alias
      WHERE alias.concept_id = concept.id
        AND alias.workspace_id = concept.workspace_id
    ), '[]'::jsonb)
  )
  FROM public.concepts AS concept
  WHERE concept.id = p_concept_id;
$$;

REVOKE ALL ON FUNCTION public.concept_snapshot(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.replace_concept_aliases(
  p_workspace_id uuid,
  p_concept_id uuid,
  p_aliases jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  alias_item jsonb;
BEGIN
  DELETE FROM public.concept_aliases
  WHERE workspace_id = p_workspace_id AND concept_id = p_concept_id;

  FOR alias_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_aliases, '[]'::jsonb))
  LOOP
    IF length(trim(COALESCE(alias_item->>'value', ''))) = 0 THEN
      RAISE EXCEPTION 'alias value is required' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.concept_aliases (
      workspace_id,
      concept_id,
      alias,
      alias_normalized,
      alias_type,
      language_code,
      disambiguation_key
    ) VALUES (
      p_workspace_id,
      p_concept_id,
      trim(alias_item->>'value'),
      public.normalize_alias_text(alias_item->>'value'),
      COALESCE((alias_item->>'type')::public.alias_type, 'synonym'),
      COALESCE(NULLIF(trim(alias_item->>'languageCode'), ''), 'en'),
      NULLIF(trim(alias_item->>'disambiguationKey'), '')
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_concept_aliases(uuid, uuid, jsonb) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.create_atlas_concept(
  p_workspace_id uuid,
  p_payload jsonb,
  p_change_summary text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_concept_id uuid;
  v_status public.content_status;
  v_revision_id uuid;
  v_snapshot jsonb;
BEGIN
  IF NOT public.is_workspace_member(p_workspace_id, ARRAY['owner', 'editor']) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(p_payload->>'slug', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     OR length(trim(COALESCE(p_payload->>'canonicalName', ''))) < 2
     OR length(trim(COALESCE(p_change_summary, ''))) < 3 THEN
    RAISE EXCEPTION 'invalid concept payload' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.domains
    WHERE id = (p_payload->>'canonicalDomainId')::uuid
      AND workspace_id = p_workspace_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'canonical domain not found' USING ERRCODE = '23503';
  END IF;

  v_status := COALESCE((p_payload->>'contentStatus')::public.content_status, 'draft');
  IF v_status = 'reviewed' AND NOT public.is_workspace_member(p_workspace_id, ARRAY['owner']) THEN
    v_status := 'draft';
  END IF;

  INSERT INTO public.concepts (
    workspace_id,
    slug,
    canonical_name,
    concise_definition,
    synthesis_markdown,
    why_it_exists_markdown,
    mechanism_markdown,
    examples_markdown,
    counterexamples_markdown,
    failure_modes_markdown,
    common_confusions_markdown,
    canonical_domain_id,
    canonical_parent_id,
    concept_kind,
    content_status,
    priority,
    target_mastery,
    review_note,
    replacement_concept_id,
    last_reviewed_at,
    created_by,
    updated_by
  ) VALUES (
    p_workspace_id,
    p_payload->>'slug',
    trim(p_payload->>'canonicalName'),
    trim(COALESCE(p_payload->>'conciseDefinition', '')),
    COALESCE(p_payload->>'synthesisMarkdown', ''),
    NULLIF(trim(p_payload->>'whyItExistsMarkdown'), ''),
    NULLIF(trim(p_payload->>'mechanismMarkdown'), ''),
    NULLIF(trim(p_payload->>'examplesMarkdown'), ''),
    NULLIF(trim(p_payload->>'counterexamplesMarkdown'), ''),
    NULLIF(trim(p_payload->>'failureModesMarkdown'), ''),
    NULLIF(trim(p_payload->>'commonConfusionsMarkdown'), ''),
    (p_payload->>'canonicalDomainId')::uuid,
    NULLIF(p_payload->>'canonicalParentId', '')::uuid,
    COALESCE((p_payload->>'conceptKind')::public.concept_kind, 'concept'),
    v_status,
    COALESCE((p_payload->>'priority')::public.content_priority, 'later'),
    NULLIF(p_payload->>'targetMastery', '')::smallint,
    NULLIF(trim(p_payload->>'reviewNote'), ''),
    NULLIF(p_payload->>'replacementConceptId', '')::uuid,
    CASE WHEN v_status = 'reviewed' THEN now() ELSE NULL END,
    auth.uid(),
    auth.uid()
  ) RETURNING id INTO v_concept_id;

  PERFORM public.replace_concept_aliases(
    p_workspace_id,
    v_concept_id,
    COALESCE(p_payload->'aliases', '[]'::jsonb)
  );
  v_snapshot := public.concept_snapshot(v_concept_id);

  INSERT INTO public.concept_revisions (
    workspace_id,
    concept_id,
    revision_number,
    snapshot,
    change_summary,
    change_source,
    created_by
  ) VALUES (
    p_workspace_id,
    v_concept_id,
    1,
    v_snapshot,
    trim(p_change_summary),
    'manual',
    auth.uid()
  ) RETURNING id INTO v_revision_id;

  INSERT INTO public.audit_events (
    workspace_id,
    actor_user_id,
    actor_type,
    event_type,
    object_type,
    object_id,
    summary,
    after_summary
  ) VALUES (
    p_workspace_id,
    auth.uid(),
    'user',
    'concept.created',
    'concept',
    v_concept_id,
    trim(p_change_summary),
    v_snapshot
  );

  RETURN jsonb_build_object(
    'id', v_concept_id,
    'slug', p_payload->>'slug',
    'revisionId', v_revision_id,
    'contentStatus', v_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_atlas_concept(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_atlas_concept(uuid, jsonb, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_atlas_concept(
  p_workspace_id uuid,
  p_concept_id uuid,
  p_expected_updated_at timestamptz,
  p_payload jsonb,
  p_change_summary text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_before public.concepts%ROWTYPE;
  v_before_snapshot jsonb;
  v_after_snapshot jsonb;
  v_status public.content_status;
  v_revision_number integer;
  v_revision_id uuid;
BEGIN
  IF NOT public.is_workspace_member(p_workspace_id, ARRAY['owner', 'editor']) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF length(trim(COALESCE(p_payload->>'canonicalName', ''))) < 2
     OR length(trim(COALESCE(p_change_summary, ''))) < 3 THEN
    RAISE EXCEPTION 'invalid concept payload' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_concept_id::text, 201));
  SELECT * INTO v_before
  FROM public.concepts
  WHERE id = p_concept_id
    AND workspace_id = p_workspace_id
    AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'concept not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_before.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'concept changed since editor opened' USING ERRCODE = '40001';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.domains
    WHERE id = (p_payload->>'canonicalDomainId')::uuid
      AND workspace_id = p_workspace_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'canonical domain not found' USING ERRCODE = '23503';
  END IF;

  v_before_snapshot := public.concept_snapshot(p_concept_id);
  v_status := COALESCE((p_payload->>'contentStatus')::public.content_status, 'draft');
  IF v_status = 'reviewed' AND NOT public.is_workspace_member(p_workspace_id, ARRAY['owner']) THEN
    v_status := 'draft';
  END IF;

  UPDATE public.concepts
  SET canonical_name = trim(p_payload->>'canonicalName'),
      concise_definition = trim(COALESCE(p_payload->>'conciseDefinition', '')),
      synthesis_markdown = COALESCE(p_payload->>'synthesisMarkdown', ''),
      why_it_exists_markdown = NULLIF(trim(p_payload->>'whyItExistsMarkdown'), ''),
      mechanism_markdown = NULLIF(trim(p_payload->>'mechanismMarkdown'), ''),
      examples_markdown = NULLIF(trim(p_payload->>'examplesMarkdown'), ''),
      counterexamples_markdown = NULLIF(trim(p_payload->>'counterexamplesMarkdown'), ''),
      failure_modes_markdown = NULLIF(trim(p_payload->>'failureModesMarkdown'), ''),
      common_confusions_markdown = NULLIF(trim(p_payload->>'commonConfusionsMarkdown'), ''),
      canonical_domain_id = (p_payload->>'canonicalDomainId')::uuid,
      canonical_parent_id = NULLIF(p_payload->>'canonicalParentId', '')::uuid,
      concept_kind = COALESCE((p_payload->>'conceptKind')::public.concept_kind, 'concept'),
      content_status = v_status,
      priority = COALESCE((p_payload->>'priority')::public.content_priority, 'later'),
      target_mastery = NULLIF(p_payload->>'targetMastery', '')::smallint,
      review_note = NULLIF(trim(p_payload->>'reviewNote'), ''),
      replacement_concept_id = NULLIF(p_payload->>'replacementConceptId', '')::uuid,
      last_reviewed_at = CASE WHEN v_status = 'reviewed' THEN now() ELSE last_reviewed_at END,
      updated_by = auth.uid(),
      updated_at = now()
  WHERE id = p_concept_id AND workspace_id = p_workspace_id;

  PERFORM public.replace_concept_aliases(
    p_workspace_id,
    p_concept_id,
    COALESCE(p_payload->'aliases', '[]'::jsonb)
  );

  SELECT COALESCE(max(revision_number), 0) + 1 INTO v_revision_number
  FROM public.concept_revisions
  WHERE concept_id = p_concept_id;
  v_after_snapshot := public.concept_snapshot(p_concept_id);

  INSERT INTO public.concept_revisions (
    workspace_id,
    concept_id,
    revision_number,
    snapshot,
    change_summary,
    change_source,
    created_by
  ) VALUES (
    p_workspace_id,
    p_concept_id,
    v_revision_number,
    v_after_snapshot,
    trim(p_change_summary),
    'manual',
    auth.uid()
  ) RETURNING id INTO v_revision_id;

  INSERT INTO public.audit_events (
    workspace_id,
    actor_user_id,
    actor_type,
    event_type,
    object_type,
    object_id,
    summary,
    before_summary,
    after_summary
  ) VALUES (
    p_workspace_id,
    auth.uid(),
    'user',
    CASE WHEN v_status = 'deprecated' AND v_before.content_status <> 'deprecated'
      THEN 'concept.deprecated' ELSE 'concept.updated' END,
    'concept',
    p_concept_id,
    trim(p_change_summary),
    v_before_snapshot,
    v_after_snapshot
  );

  RETURN jsonb_build_object(
    'id', p_concept_id,
    'slug', v_before.slug,
    'revisionId', v_revision_id,
    'revisionNumber', v_revision_number,
    'contentStatus', v_status,
    'updatedAt', v_after_snapshot->>'updatedAt'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_atlas_concept(uuid, uuid, timestamptz, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_atlas_concept(uuid, uuid, timestamptz, jsonb, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_atlas_relation(
  p_workspace_id uuid,
  p_source_concept_id uuid,
  p_relation_type_id uuid,
  p_target_concept_id uuid,
  p_description text,
  p_review_status public.content_status
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_relation public.concept_relations%ROWTYPE;
  v_status public.content_status;
BEGIN
  IF NOT public.is_workspace_member(p_workspace_id, ARRAY['owner', 'editor']) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  v_status := COALESCE(p_review_status, 'draft');
  IF v_status = 'reviewed' AND NOT public.is_workspace_member(p_workspace_id, ARRAY['owner']) THEN
    v_status := 'draft';
  END IF;

  INSERT INTO public.concept_relations (
    workspace_id,
    source_concept_id,
    relation_type_id,
    target_concept_id,
    description,
    review_status,
    provenance_type,
    created_by,
    reviewed_by
  ) VALUES (
    p_workspace_id,
    p_source_concept_id,
    p_relation_type_id,
    p_target_concept_id,
    NULLIF(trim(p_description), ''),
    v_status,
    'human',
    auth.uid(),
    CASE WHEN v_status = 'reviewed' THEN auth.uid() ELSE NULL END
  ) RETURNING * INTO v_relation;

  INSERT INTO public.audit_events (
    workspace_id,
    actor_user_id,
    actor_type,
    event_type,
    object_type,
    object_id,
    summary,
    after_summary
  ) VALUES (
    p_workspace_id,
    auth.uid(),
    'user',
    'concept_relation.created',
    'concept_relation',
    v_relation.id,
    'Concept relation created',
    to_jsonb(v_relation)
  );

  RETURN jsonb_build_object(
    'id', v_relation.id,
    'sourceConceptId', v_relation.source_concept_id,
    'targetConceptId', v_relation.target_concept_id,
    'reviewStatus', v_relation.review_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_atlas_relation(uuid, uuid, uuid, uuid, text, public.content_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_atlas_relation(uuid, uuid, uuid, uuid, text, public.content_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_atlas_relation(
  p_workspace_id uuid,
  p_relation_id uuid,
  p_expected_updated_at timestamptz,
  p_source_concept_id uuid,
  p_relation_type_id uuid,
  p_target_concept_id uuid,
  p_description text,
  p_review_status public.content_status
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_before public.concept_relations%ROWTYPE;
  v_after public.concept_relations%ROWTYPE;
  v_status public.content_status;
BEGIN
  IF NOT public.is_workspace_member(p_workspace_id, ARRAY['owner', 'editor']) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_before FROM public.concept_relations
  WHERE id = p_relation_id
    AND workspace_id = p_workspace_id
    AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'relation not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_before.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'relation changed since editor opened' USING ERRCODE = '40001';
  END IF;
  v_status := COALESCE(p_review_status, 'draft');
  IF v_status = 'reviewed' AND NOT public.is_workspace_member(p_workspace_id, ARRAY['owner']) THEN
    v_status := 'draft';
  END IF;

  UPDATE public.concept_relations
  SET source_concept_id = p_source_concept_id,
      relation_type_id = p_relation_type_id,
      target_concept_id = p_target_concept_id,
      description = NULLIF(trim(p_description), ''),
      review_status = v_status,
      reviewed_by = CASE WHEN v_status = 'reviewed' THEN auth.uid() ELSE NULL END,
      updated_at = now()
  WHERE id = p_relation_id AND workspace_id = p_workspace_id
  RETURNING * INTO v_after;

  INSERT INTO public.audit_events (
    workspace_id,
    actor_user_id,
    actor_type,
    event_type,
    object_type,
    object_id,
    summary,
    before_summary,
    after_summary
  ) VALUES (
    p_workspace_id,
    auth.uid(),
    'user',
    'concept_relation.updated',
    'concept_relation',
    p_relation_id,
    'Concept relation updated',
    to_jsonb(v_before),
    to_jsonb(v_after)
  );

  RETURN jsonb_build_object(
    'id', v_after.id,
    'sourceConceptId', v_after.source_concept_id,
    'targetConceptId', v_after.target_concept_id,
    'reviewStatus', v_after.review_status,
    'updatedAt', v_after.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_atlas_relation(uuid, uuid, timestamptz, uuid, uuid, uuid, text, public.content_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_atlas_relation(uuid, uuid, timestamptz, uuid, uuid, uuid, text, public.content_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_atlas_relation(
  p_workspace_id uuid,
  p_relation_id uuid,
  p_expected_updated_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_before public.concept_relations%ROWTYPE;
BEGIN
  IF NOT public.is_workspace_member(p_workspace_id, ARRAY['owner', 'editor']) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_before FROM public.concept_relations
  WHERE id = p_relation_id
    AND workspace_id = p_workspace_id
    AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'relation not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_before.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'relation changed since editor opened' USING ERRCODE = '40001';
  END IF;

  UPDATE public.concept_relations
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_relation_id AND workspace_id = p_workspace_id;

  INSERT INTO public.audit_events (
    workspace_id,
    actor_user_id,
    actor_type,
    event_type,
    object_type,
    object_id,
    summary,
    before_summary
  ) VALUES (
    p_workspace_id,
    auth.uid(),
    'user',
    'concept_relation.removed',
    'concept_relation',
    p_relation_id,
    'Concept relation removed',
    to_jsonb(v_before)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.remove_atlas_relation(uuid, uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_atlas_relation(uuid, uuid, timestamptz) TO authenticated;
