begin;

select plan(28);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('11000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm2-owner@example.test', '', now(), now(), now()),
  ('11000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm2-editor@example.test', '', now(), now(), now()),
  ('11000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm2-viewer@example.test', '', now(), now(), now());

insert into public.profiles (id, display_name) values
  ('11000000-0000-0000-0000-000000000001', 'Milestone 2 Owner'),
  ('11000000-0000-0000-0000-000000000002', 'Milestone 2 Editor'),
  ('11000000-0000-0000-0000-000000000003', 'Milestone 2 Viewer');

insert into public.workspaces (id, name, slug, created_by)
values ('21000000-0000-0000-0000-000000000001', 'Milestone 2', 'milestone-2', '11000000-0000-0000-0000-000000000001');

insert into public.workspace_members (workspace_id, user_id, role) values
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'owner'),
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000002', 'editor'),
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000003', 'viewer');

insert into public.domains (
  id, workspace_id, slug, title, short_description, kind, created_by, updated_by
) values (
  '31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001',
  'reasoning', 'Reasoning', 'How beliefs are formed', 'root',
  '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001'
);

insert into public.relation_types (
  id, workspace_id, key, forward_label, inverse_label, category, directed, "symmetric", acyclic
) values
  ('51000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'related_to', 'related to', 'related to', 'explanatory', false, true, false),
  ('51000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'prerequisite_for', 'prerequisite for', 'requires', 'learning', true, false, true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.create_atlas_concept(
    '21000000-0000-0000-0000-000000000001',
    '{"slug":"alpha","canonicalName":"Alpha","canonicalDomainId":"31000000-0000-0000-0000-000000000001","conciseDefinition":"First concept","synthesisMarkdown":"# Alpha","conceptKind":"concept","contentStatus":"reviewed","priority":"now","aliases":[{"value":"Shared Term","type":"synonym","languageCode":"en"}]}'::jsonb,
    'Created Alpha'
  )$$,
  'owner can create a canonical concept transactionally'
);
select is((select count(*)::integer from public.concepts where slug = 'alpha'), 1, 'concept row is created');
select is((select alias_normalized from public.concept_aliases where alias = 'Shared Term'), 'shared term', 'alias is normalized');
select is((select count(*)::integer from public.concept_revisions where concept_id = (select id from public.concepts where slug = 'alpha')), 1, 'first revision snapshot is created');
select is((select count(*)::integer from public.audit_events where event_type = 'concept.created' and object_id = (select id from public.concepts where slug = 'alpha')), 1, 'concept creation is audited');

select lives_ok(
  $$select public.create_atlas_concept(
    '21000000-0000-0000-0000-000000000001',
    '{"slug":"beta","canonicalName":"Beta","canonicalDomainId":"31000000-0000-0000-0000-000000000001","conciseDefinition":"Second concept","conceptKind":"concept","contentStatus":"draft","priority":"next","aliases":[]}'::jsonb,
    'Created Beta'
  )$$,
  'owner can create a second concept'
);

select lives_ok(
  $$select public.update_atlas_concept(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'alpha'),
    (select updated_at from public.concepts where slug = 'alpha'),
    '{"canonicalName":"Alpha revised","canonicalDomainId":"31000000-0000-0000-0000-000000000001","conciseDefinition":"Revised definition","synthesisMarkdown":"# Revised Alpha","conceptKind":"concept","contentStatus":"reviewed","priority":"now","aliases":[{"value":"Shared Term","type":"synonym","languageCode":"en"},{"value":"A","type":"abbreviation","languageCode":"en"}]}'::jsonb,
    'Improved Alpha synthesis'
  )$$,
  'owner can update concept, aliases, revision, and audit atomically'
);
select is((select canonical_name from public.concepts where slug = 'alpha'), 'Alpha revised', 'concept fields are updated');
select is((select count(*)::integer from public.concept_revisions where concept_id = (select id from public.concepts where slug = 'alpha')), 2, 'material edit creates the next revision');
select throws_ok(
  $$select public.update_atlas_concept(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'alpha'),
    '2000-01-01T00:00:00Z'::timestamptz,
    '{"canonicalName":"Stale Alpha","canonicalDomainId":"31000000-0000-0000-0000-000000000001","conceptKind":"concept","contentStatus":"draft","priority":"later","aliases":[]}'::jsonb,
    'Stale update'
  )$$,
  '40001',
  'concept changed since editor opened',
  'stale concept edit is rejected'
);
select throws_ok(
  $$select public.update_atlas_concept(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'beta'),
    (select updated_at from public.concepts where slug = 'beta'),
    '{"canonicalName":"Beta collision","canonicalDomainId":"31000000-0000-0000-0000-000000000001","conceptKind":"concept","contentStatus":"draft","priority":"next","aliases":[{"value":" shared  term ","type":"synonym","languageCode":"en"}]}'::jsonb,
    'Attempt alias collision'
  )$$,
  '23505',
  'duplicate key value violates unique constraint "concept_aliases_unqualified_unique"',
  'alias collision rolls back the complete concept edit'
);
select is((select canonical_name from public.concepts where slug = 'beta'), 'Beta', 'failed alias replacement rolls back concept fields');

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select public.create_atlas_concept(
    '21000000-0000-0000-0000-000000000001',
    '{"slug":"editor-draft","canonicalName":"Editor Draft","canonicalDomainId":"31000000-0000-0000-0000-000000000001","conceptKind":"concept","contentStatus":"reviewed","priority":"later","aliases":[]}'::jsonb,
    'Editor requested review'
  )$$,
  'editor can create concept content'
);
select is((select content_status::text from public.concepts where slug = 'editor-draft'), 'draft', 'editor cannot self-publish reviewed content');

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select public.create_atlas_concept(
    '21000000-0000-0000-0000-000000000001',
    '{"slug":"viewer-write","canonicalName":"Viewer Write","canonicalDomainId":"31000000-0000-0000-0000-000000000001","contentStatus":"draft","aliases":[]}'::jsonb,
    'Viewer write'
  )$$,
  '42501',
  'forbidden',
  'viewer cannot create canonical content'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select public.create_atlas_relation(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'beta'),
    '51000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'alpha'),
    'Symmetric relation fixture',
    'reviewed'
  )$$,
  'owner can create a reviewed relation'
);
select is(
  (select source_concept_id::text from public.concept_relations where relation_type_id = '51000000-0000-0000-0000-000000000001'),
  (select least(alpha.id::text, beta.id::text) from public.concepts alpha cross join public.concepts beta where alpha.slug = 'alpha' and beta.slug = 'beta'),
  'symmetric relation endpoints are normalized by the authoring service'
);
select throws_ok(
  $$select public.create_atlas_relation(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'alpha'),
    '51000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'beta'),
    '',
    'draft'
  )$$,
  '23505',
  'duplicate key value violates unique constraint "concept_relations_active_unique"',
  'reverse symmetric duplicate is rejected'
);
select lives_ok(
  $$select public.create_atlas_relation(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'alpha'),
    '51000000-0000-0000-0000-000000000002',
    (select id from public.concepts where slug = 'beta'),
    '',
    'reviewed'
  )$$,
  'prerequisite edge is created'
);
select throws_ok(
  $$select public.create_atlas_relation(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'beta'),
    '51000000-0000-0000-0000-000000000002',
    (select id from public.concepts where slug = 'alpha'),
    '',
    'reviewed'
  )$$,
  '23514',
  'acyclic relation cycle detected',
  'prerequisite cycle remains rejected through the authoring service'
);
select lives_ok(
  $$select public.update_atlas_relation(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concept_relations where relation_type_id = '51000000-0000-0000-0000-000000000001'),
    (select updated_at from public.concept_relations where relation_type_id = '51000000-0000-0000-0000-000000000001'),
    (select id from public.concepts where slug = 'alpha'),
    '51000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'beta'),
    'Updated qualification',
    'reviewed'
  )$$,
  'relation can be edited transactionally'
);
select is((select count(*)::integer from public.audit_events where event_type = 'concept_relation.updated'), 1, 'relation update is audited');
select lives_ok(
  $$select public.remove_atlas_relation(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concept_relations where relation_type_id = '51000000-0000-0000-0000-000000000001'),
    (select updated_at from public.concept_relations where relation_type_id = '51000000-0000-0000-0000-000000000001')
  )$$,
  'relation can be soft-removed'
);
select is((select count(*)::integer from public.concept_relations where relation_type_id = '51000000-0000-0000-0000-000000000001' and deleted_at is null), 0, 'removed relation is no longer active');

select lives_ok(
  $$select public.update_atlas_concept(
    '21000000-0000-0000-0000-000000000001',
    (select id from public.concepts where slug = 'alpha'),
    (select updated_at from public.concepts where slug = 'alpha'),
    '{"canonicalName":"Alpha revised","canonicalDomainId":"31000000-0000-0000-0000-000000000001","conciseDefinition":"Deprecated definition","conceptKind":"concept","contentStatus":"deprecated","priority":"reference","replacementConceptId":null,"aliases":[{"value":"Shared Term","type":"synonym","languageCode":"en"}]}'::jsonb,
    'Deprecated Alpha after review'
  )$$,
  'owner can deprecate without destructive deletion'
);
select is((select content_status::text from public.concepts where slug = 'alpha'), 'deprecated', 'concept is visibly deprecated');
select is((select count(*)::integer from public.concept_revisions where concept_id = (select id from public.concepts where slug = 'alpha')), 3, 'deprecation creates another revision snapshot');
select is((select count(*)::integer from public.audit_events where event_type = 'concept.deprecated' and object_id = (select id from public.concepts where slug = 'alpha')), 1, 'deprecation is audited');

reset role;
select * from finish();
rollback;
