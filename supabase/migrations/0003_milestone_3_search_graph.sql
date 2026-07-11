CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;--> statement-breakpoint
ALTER TABLE "concepts" ADD COLUMN "search_document" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("canonical_name", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("concise_definition", '')), 'B') ||
          setweight(to_tsvector('english',
            coalesce("synthesis_markdown", '') || ' ' ||
            coalesce("why_it_exists_markdown", '') || ' ' ||
            coalesce("mechanism_markdown", '') || ' ' ||
            coalesce("examples_markdown", '') || ' ' ||
            coalesce("counterexamples_markdown", '') || ' ' ||
            coalesce("failure_modes_markdown", '') || ' ' ||
            coalesce("common_confusions_markdown", '')
          ), 'C')) STORED;--> statement-breakpoint
ALTER TABLE "concepts" ADD COLUMN "embedding" extensions.vector(1536);--> statement-breakpoint
ALTER TABLE "concepts" ADD COLUMN "embedding_model" text;--> statement-breakpoint
ALTER TABLE "concepts" ADD COLUMN "embedding_updated_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "concepts_search_document_idx" ON "concepts" USING gin ("search_document");--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.search_concepts_lexical(
  p_workspace_id uuid,
  p_query text,
  p_domain_ids uuid[] DEFAULT NULL,
  p_content_statuses public.content_status[] DEFAULT NULL,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  rank bigint,
  lexical_score real,
  title_match boolean,
  alias_match boolean,
  text_match boolean,
  matched_alias text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH input AS (
    SELECT
      websearch_to_tsquery('english', trim(p_query)) AS query,
      lower(trim(p_query)) AS needle
  ),
  candidates AS (
    SELECT
      concept.id,
      ts_rank_cd(concept.search_document, input.query)::real AS lexical_score,
      lower(concept.canonical_name) = input.needle
        OR lower(concept.canonical_name) LIKE '%' || input.needle || '%' AS title_match,
      COALESCE(alias_hit.alias_match, false) AS alias_match,
      concept.search_document @@ input.query AS text_match,
      alias_hit.matched_alias
    FROM public.concepts AS concept
    CROSS JOIN input
    LEFT JOIN LATERAL (
      SELECT true AS alias_match, min(alias.alias) AS matched_alias
      FROM public.concept_aliases AS alias
      WHERE alias.workspace_id = concept.workspace_id
        AND alias.concept_id = concept.id
        AND (
          alias.alias_normalized = input.needle
          OR alias.alias_normalized LIKE '%' || input.needle || '%'
        )
      HAVING count(*) > 0
    ) AS alias_hit ON true
    WHERE concept.workspace_id = p_workspace_id
      AND concept.deleted_at IS NULL
      AND (p_domain_ids IS NULL OR concept.canonical_domain_id = ANY(p_domain_ids))
      AND (p_content_statuses IS NULL OR concept.content_status = ANY(p_content_statuses))
      AND (
        concept.search_document @@ input.query
        OR lower(concept.canonical_name) LIKE '%' || input.needle || '%'
        OR COALESCE(alias_hit.alias_match, false)
      )
  ),
  ranked AS (
    SELECT
      candidates.*,
      row_number() OVER (
        ORDER BY
          title_match DESC,
          alias_match DESC,
          lexical_score DESC,
          id
      ) AS result_rank
    FROM candidates
  )
  SELECT
    ranked.id,
    ranked.result_rank,
    ranked.lexical_score,
    ranked.title_match,
    ranked.alias_match,
    ranked.text_match,
    ranked.matched_alias
  FROM ranked
  ORDER BY ranked.result_rank
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.search_concepts_semantic(
  p_workspace_id uuid,
  p_query_embedding extensions.vector(1536),
  p_domain_ids uuid[] DEFAULT NULL,
  p_content_statuses public.content_status[] DEFAULT NULL,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  rank bigint,
  semantic_distance real
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    concept.id,
    row_number() OVER (
      ORDER BY concept.embedding OPERATOR(extensions.<=>) p_query_embedding, concept.id
    ) AS result_rank,
    (concept.embedding OPERATOR(extensions.<=>) p_query_embedding)::real AS semantic_distance
  FROM public.concepts AS concept
  WHERE concept.workspace_id = p_workspace_id
    AND concept.deleted_at IS NULL
    AND concept.embedding IS NOT NULL
    AND (p_domain_ids IS NULL OR concept.canonical_domain_id = ANY(p_domain_ids))
    AND (p_content_statuses IS NULL OR concept.content_status = ANY(p_content_statuses))
  ORDER BY concept.embedding OPERATOR(extensions.<=>) p_query_embedding, concept.id
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.set_concept_embedding(
  p_workspace_id uuid,
  p_concept_id uuid,
  p_embedding extensions.vector(1536),
  p_embedding_model text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL OR NOT public.is_workspace_member(
    p_workspace_id,
    ARRAY['owner', 'editor']
  ) THEN
    RAISE EXCEPTION 'owner or editor role required' USING ERRCODE = '42501';
  END IF;
  IF p_embedding_model IS NULL OR length(trim(p_embedding_model)) = 0 THEN
    RAISE EXCEPTION 'embedding model is required' USING ERRCODE = '22023';
  END IF;
  UPDATE public.concepts
  SET embedding = p_embedding,
      embedding_model = trim(p_embedding_model),
      embedding_updated_at = now()
  WHERE id = p_concept_id
    AND workspace_id = p_workspace_id
    AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'concept not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.get_concept_neighborhood(
  p_workspace_id uuid,
  p_concept_id uuid,
  p_depth integer DEFAULT 2,
  p_node_cap integer DEFAULT 100,
  p_relation_keys text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF p_depth < 1 OR p_depth > 2 THEN
    RAISE EXCEPTION 'graph depth must be 1 or 2' USING ERRCODE = '22023';
  END IF;
  IF p_node_cap < 2 OR p_node_cap > 500 THEN
    RAISE EXCEPTION 'graph node cap must be between 2 and 500' USING ERRCODE = '22023';
  END IF;
  IF NOT public.is_workspace_member(p_workspace_id) THEN
    RAISE EXCEPTION 'workspace membership required' USING ERRCODE = '42501';
  END IF;

  WITH RECURSIVE edges_all AS MATERIALIZED (
    SELECT
      relation.id::text AS id,
      relation.source_concept_id AS source_id,
      relation.target_concept_id AS target_id,
      relation_type.key AS relation_key,
      relation_type.forward_label AS label,
      relation_type.category::text AS category,
      relation.description,
      relation.review_status::text AS review_status
    FROM public.concept_relations AS relation
    JOIN public.relation_types AS relation_type
      ON relation_type.id = relation.relation_type_id
      AND relation_type.workspace_id = relation.workspace_id
    WHERE relation.workspace_id = p_workspace_id
      AND relation.deleted_at IS NULL
      AND relation.review_status <> 'deprecated'
      AND (p_relation_keys IS NULL OR relation_type.key = ANY(p_relation_keys))
    UNION ALL
    SELECT
      'parent:' || child.id::text,
      child.canonical_parent_id,
      child.id,
      'canonical_parent',
      'contains',
      'hierarchy',
      NULL::text,
      child.content_status::text
    FROM public.concepts AS child
    WHERE child.workspace_id = p_workspace_id
      AND child.deleted_at IS NULL
      AND child.canonical_parent_id IS NOT NULL
      AND (p_relation_keys IS NULL OR 'canonical_parent' = ANY(p_relation_keys))
  ),
  walk(concept_id, depth, path) AS (
    SELECT p_concept_id, 0, ARRAY[p_concept_id]
    UNION ALL
    SELECT
      CASE
        WHEN edge.source_id = walk.concept_id THEN edge.target_id
        ELSE edge.source_id
      END,
      walk.depth + 1,
      walk.path || CASE
        WHEN edge.source_id = walk.concept_id THEN edge.target_id
        ELSE edge.source_id
      END
    FROM walk
    JOIN edges_all AS edge
      ON edge.source_id = walk.concept_id OR edge.target_id = walk.concept_id
    WHERE walk.depth < p_depth
      AND NOT (
        CASE
          WHEN edge.source_id = walk.concept_id THEN edge.target_id
          ELSE edge.source_id
        END = ANY(walk.path)
      )
  ),
  reachable AS (
    SELECT concept_id, min(depth)::integer AS depth
    FROM walk
    GROUP BY concept_id
  ),
  selected_nodes AS MATERIALIZED (
    SELECT concept.id, concept.slug, concept.canonical_name, concept.content_status,
      concept.canonical_domain_id, reachable.depth
    FROM reachable
    JOIN public.concepts AS concept ON concept.id = reachable.concept_id
    WHERE concept.workspace_id = p_workspace_id
      AND concept.deleted_at IS NULL
    ORDER BY reachable.depth, concept.canonical_name, concept.id
    LIMIT p_node_cap
  ),
  selected_edges AS (
    SELECT edge.*
    FROM edges_all AS edge
    WHERE EXISTS (SELECT 1 FROM selected_nodes WHERE id = edge.source_id)
      AND EXISTS (SELECT 1 FROM selected_nodes WHERE id = edge.target_id)
  )
  SELECT jsonb_build_object(
    'selectedConceptId', p_concept_id,
    'nodes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', node.id,
        'slug', node.slug,
        'label', node.canonical_name,
        'status', node.content_status,
        'domainId', node.canonical_domain_id,
        'depth', node.depth
      ) ORDER BY node.depth, node.canonical_name, node.id)
      FROM selected_nodes AS node
    ), '[]'::jsonb),
    'edges', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', edge.id,
        'source', edge.source_id,
        'target', edge.target_id,
        'relationKey', edge.relation_key,
        'label', edge.label,
        'category', edge.category,
        'description', edge.description,
        'reviewStatus', edge.review_status
      ) ORDER BY edge.relation_key, edge.source_id, edge.target_id, edge.id)
      FROM selected_edges AS edge
    ), '[]'::jsonb),
    'truncated', (SELECT count(*) FROM reachable) > (SELECT count(*) FROM selected_nodes)
  ) INTO v_result;

  IF NOT EXISTS (
    SELECT 1 FROM public.concepts
    WHERE id = p_concept_id
      AND workspace_id = p_workspace_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'concept not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_result;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.search_concepts_lexical(
  uuid, text, uuid[], public.content_status[], integer
) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.search_concepts_lexical(
  uuid, text, uuid[], public.content_status[], integer
) TO authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.search_concepts_semantic(
  uuid, extensions.vector, uuid[], public.content_status[], integer
) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.search_concepts_semantic(
  uuid, extensions.vector, uuid[], public.content_status[], integer
) TO authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.set_concept_embedding(
  uuid, uuid, extensions.vector, text
) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.set_concept_embedding(
  uuid, uuid, extensions.vector, text
) TO authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.get_concept_neighborhood(
  uuid, uuid, integer, integer, text[]
) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.get_concept_neighborhood(
  uuid, uuid, integer, integer, text[]
) TO authenticated;
