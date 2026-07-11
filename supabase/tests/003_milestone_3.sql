begin;

select plan(14);

select has_extension('vector', 'pgvector extension is enabled');

create function public.m3_test_vector(p_position integer)
returns vector
language plpgsql
immutable
set search_path = ''
as $$
declare
  values real[] := array_fill(0::real, array[1536]);
begin
  values[p_position] := 1;
  return values::extensions.vector;
end;
$$;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm3-owner@example.test', '', now(), now(), now()),
  ('13000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm3-viewer@example.test', '', now(), now(), now());

insert into public.profiles (id, display_name) values
  ('13000000-0000-0000-0000-000000000001', 'Milestone 3 Owner'),
  ('13000000-0000-0000-0000-000000000002', 'Milestone 3 Viewer');

insert into public.workspaces (id, name, slug, created_by) values
  ('23000000-0000-0000-0000-000000000001', 'Milestone 3', 'milestone-3', '13000000-0000-0000-0000-000000000001'),
  ('23000000-0000-0000-0000-000000000002', 'Private M3', 'private-m3', '13000000-0000-0000-0000-000000000001');

insert into public.workspace_members (workspace_id, user_id, role) values
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'owner'),
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000002', 'viewer'),
  ('23000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', 'owner');

insert into public.domains (
  id, workspace_id, slug, title, short_description, kind, created_by, updated_by
) values
  ('33000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'control', 'Control', 'Control systems', 'core', '13000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001'),
  ('33000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000001', 'software', 'Software', 'Reliable software', 'core', '13000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001'),
  ('33000000-0000-0000-0000-000000000003', '23000000-0000-0000-0000-000000000002', 'private', 'Private', 'Other workspace', 'core', '13000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001');

insert into public.concepts (
  id, workspace_id, slug, canonical_name, concise_definition, synthesis_markdown,
  canonical_domain_id, content_status, created_by, updated_by
) values
  ('43000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'feedback-control', 'Feedback Control', 'Regulation using observed outcomes', 'A controller compares observation with a desired state.', '33000000-0000-0000-0000-000000000001', 'reviewed', '13000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001'),
  ('43000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000001', 'idempotency', 'Idempotency', 'Repeated execution has the same intended effect', 'Idempotent operations make uncertain retries safer.', '33000000-0000-0000-0000-000000000002', 'draft', '13000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001'),
  ('43000000-0000-0000-0000-000000000003', '23000000-0000-0000-0000-000000000001', 'verification', 'Verification', 'Checking that specified work occurred', 'Verification differs from outcome validation.', '33000000-0000-0000-0000-000000000002', 'reviewed', '13000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001'),
  ('43000000-0000-0000-0000-000000000004', '23000000-0000-0000-0000-000000000002', 'private-control', 'Private Control', 'Must not leak', '', '33000000-0000-0000-0000-000000000003', 'reviewed', '13000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001');

insert into public.concept_aliases (
  workspace_id, concept_id, alias, alias_normalized, alias_type
) values (
  '23000000-0000-0000-0000-000000000001',
  '43000000-0000-0000-0000-000000000001',
  'Closed-loop regulator',
  'closed-loop regulator',
  'synonym'
);

insert into public.relation_types (
  id, workspace_id, key, forward_label, inverse_label, category, directed
) values (
  '53000000-0000-0000-0000-000000000001',
  '23000000-0000-0000-0000-000000000001',
  'enables', 'enables', 'enabled by', 'explanatory', true
);

insert into public.concept_relations (
  workspace_id, source_concept_id, relation_type_id, target_concept_id,
  review_status, created_by
) values
  ('23000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', '53000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000002', 'reviewed', '13000000-0000-0000-0000-000000000001'),
  ('23000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000002', '53000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000003', 'reviewed', '13000000-0000-0000-0000-000000000001');

select ok(
  (select search_document @@ plainto_tsquery('english', 'controller observation')
   from public.concepts
   where workspace_id = '23000000-0000-0000-0000-000000000001'
     and slug = 'feedback-control'),
  'generated full-text document indexes definition and synthesis'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000002', true);

select is(
  (select id::text from public.search_concepts_lexical(
    '23000000-0000-0000-0000-000000000001', 'Feedback Control'
  ) limit 1),
  '43000000-0000-0000-0000-000000000001',
  'lexical search finds a canonical title'
);
select ok(
  (select alias_match from public.search_concepts_lexical(
    '23000000-0000-0000-0000-000000000001', 'closed-loop regulator'
  ) limit 1),
  'lexical search explains an alias match'
);
select is(
  (select id::text from public.search_concepts_lexical(
    '23000000-0000-0000-0000-000000000001', 'uncertain retries'
  ) limit 1),
  '43000000-0000-0000-0000-000000000002',
  'full-text search finds synthesis language'
);
select is(
  (select count(*)::integer from public.search_concepts_lexical(
    '23000000-0000-0000-0000-000000000001', 'Idempotency',
    null, array['reviewed']::public.content_status[]
  )),
  0,
  'content-status filters exclude draft concepts'
);
select is(
  (select count(*)::integer from public.search_concepts_lexical(
    '23000000-0000-0000-0000-000000000002', 'Private Control'
  )),
  0,
  'RLS prevents search from leaking another workspace'
);

select throws_ok(
  $$select public.set_concept_embedding(
    '23000000-0000-0000-0000-000000000001',
    '43000000-0000-0000-0000-000000000001',
    public.m3_test_vector(1), 'fixture-v1'
  )$$,
  '42501',
  'owner or editor role required',
  'viewer cannot poison derived concept embeddings'
);

select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select public.set_concept_embedding('23000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', public.m3_test_vector(1), 'fixture-v1');
    select public.set_concept_embedding('23000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000002', public.m3_test_vector(2), 'fixture-v1');
    select public.set_concept_embedding('23000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000003', public.m3_test_vector(3), 'fixture-v1')$$,
  'owner can persist migration-dimension fixture embeddings'
);
select is(
  (select id::text from public.search_concepts_semantic(
    '23000000-0000-0000-0000-000000000001', public.m3_test_vector(2)
  ) limit 1),
  '43000000-0000-0000-0000-000000000002',
  'vector search ranks the nearest fixture embedding first'
);

select is(
  jsonb_array_length(public.get_concept_neighborhood(
    '23000000-0000-0000-0000-000000000001',
    '43000000-0000-0000-0000-000000000001', 1, 100, null
  )->'nodes'),
  2,
  'one-hop graph expansion remains local'
);
select is(
  jsonb_array_length(public.get_concept_neighborhood(
    '23000000-0000-0000-0000-000000000001',
    '43000000-0000-0000-0000-000000000001', 2, 100, null
  )->'nodes'),
  3,
  'two-hop graph expansion progressively reveals the next concept'
);
select ok(
  (public.get_concept_neighborhood(
    '23000000-0000-0000-0000-000000000001',
    '43000000-0000-0000-0000-000000000001', 2, 2, null
  )->>'truncated')::boolean,
  'graph query reports when its configured node cap truncates results'
);
select is(
  jsonb_array_length(public.get_concept_neighborhood(
    '23000000-0000-0000-0000-000000000001',
    '43000000-0000-0000-0000-000000000001', 2, 100,
    array['prerequisite_for']
  )->'nodes'),
  1,
  'relation filters are applied before neighborhood expansion'
);

select * from finish();
rollback;
