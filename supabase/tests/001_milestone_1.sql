begin;

select plan(20);

select is(
  (
    select count(*)::integer
    from pg_class
    where oid in (
      'public.profiles'::regclass,
      'public.workspaces'::regclass,
      'public.workspace_members'::regclass,
      'public.domains'::regclass,
      'public.concepts'::regclass,
      'public.concept_aliases'::regclass,
      'public.relation_types'::regclass,
      'public.concept_relations'::regclass,
      'public.concept_revisions'::regclass,
      'public.audit_events'::regclass
    ) and relrowsecurity
  ),
  10,
  'RLS is enabled on every Milestone 1 table'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@example.test', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'editor@example.test', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer@example.test', '', now(), now(), now());

insert into public.profiles (id, display_name) values
  ('10000000-0000-0000-0000-000000000001', 'Owner'),
  ('10000000-0000-0000-0000-000000000002', 'Editor'),
  ('10000000-0000-0000-0000-000000000003', 'Viewer');

insert into public.workspaces (id, name, slug, created_by) values
  ('20000000-0000-0000-0000-000000000001', 'First workspace', 'first-workspace', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Second workspace', 'second-workspace', '10000000-0000-0000-0000-000000000001');

insert into public.workspace_members (workspace_id, user_id, role) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'editor'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'viewer'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'owner');

insert into public.domains (
  id, workspace_id, slug, title, short_description, kind, created_by, updated_by
) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'root-a', 'Root A', 'A root domain', 'root', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'child-a', 'Child A', 'A child domain', 'core', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'private-root', 'Private Root', 'Other workspace', 'root', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');

insert into public.concepts (
  id, workspace_id, slug, canonical_name, canonical_domain_id, concept_kind, created_by, updated_by
) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'alpha', 'Alpha', '30000000-0000-0000-0000-000000000001', 'concept', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'beta', 'Beta', '30000000-0000-0000-0000-000000000001', 'concept', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');

insert into public.relation_types (
  id, workspace_id, key, forward_label, inverse_label, category, directed, "symmetric", acyclic
) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'prerequisite_for', 'prerequisite for', 'requires', 'learning', true, false, true),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'related_to', 'related to', 'related to', 'explanatory', false, true, false);

set local role anon;
select throws_ok(
  $$select count(*) from public.workspaces$$,
  '42501',
  'permission denied for table workspaces',
  'anonymous users cannot read workspaces'
);
select throws_ok(
  $$insert into public.domains (workspace_id, slug, title, short_description, kind, created_by, updated_by) values ('20000000-0000-0000-0000-000000000001', 'anon-write', 'Anon', 'Denied', 'core', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003')$$,
  '42501',
  'permission denied for table domains',
  'anonymous users cannot write domains'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select is((select count(*)::integer from public.domains), 2, 'viewer can read only their workspace domains');
select throws_ok(
  $$insert into public.domains (workspace_id, slug, title, short_description, kind, created_by, updated_by) values ('20000000-0000-0000-0000-000000000001', 'viewer-write', 'Viewer', 'Denied', 'core', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003')$$,
  '42501',
  'new row violates row-level security policy for table "domains"',
  'viewer cannot mutate domains'
);
select is((select count(*)::integer from public.domains where workspace_id = '20000000-0000-0000-0000-000000000002'), 0, 'viewer cannot read another workspace');
select throws_ok(
  $$select public.record_audit_event('20000000-0000-0000-0000-000000000001', 'test.viewer', 'domain', '30000000-0000-0000-0000-000000000001', 'Viewer should not write audit events')$$,
  '42501',
  'forbidden',
  'viewer cannot record audit events'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$insert into public.domains (workspace_id, slug, title, short_description, kind, created_by, updated_by) values ('20000000-0000-0000-0000-000000000001', 'editor-write', 'Editor', 'Allowed', 'core', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002')$$,
  'editor can create canonical content'
);
select throws_ok(
  $$insert into public.domains (workspace_id, slug, title, short_description, kind, created_by, updated_by) values ('20000000-0000-0000-0000-000000000001', 'spoofed-actor', 'Spoofed', 'Denied', 'core', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001')$$,
  '42501',
  'new row violates row-level security policy for table "domains"',
  'editors cannot spoof canonical creation actors'
);
select throws_ok(
  $$insert into public.relation_types (workspace_id, key, forward_label, inverse_label, category, directed) values ('20000000-0000-0000-0000-000000000001', 'editor_type', 'editor type', 'editor type inverse', 'explanatory', true)$$,
  '42501',
  'new row violates row-level security policy for table "relation_types"',
  'editor cannot create structural relation types'
);
select lives_ok(
  $$select public.record_audit_event('20000000-0000-0000-0000-000000000001', 'test.editor', 'domain', '30000000-0000-0000-0000-000000000001', 'Editor recorded a service audit event')$$,
  'editor can record an audit event through the service function'
);

reset role;
select lives_ok(
  $$update public.domains set parent_domain_id = '30000000-0000-0000-0000-000000000001' where id = '30000000-0000-0000-0000-000000000002'$$,
  'acyclic domain hierarchy is accepted'
);
select throws_ok(
  $$update public.domains set parent_domain_id = '30000000-0000-0000-0000-000000000002' where id = '30000000-0000-0000-0000-000000000001'$$,
  '23514',
  'domain parent cycle detected',
  'domain parent cycles are rejected'
);

insert into public.concept_relations (
  workspace_id, source_concept_id, relation_type_id, target_concept_id, created_by
) values (
  '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001'
);
select throws_ok(
  $$insert into public.concept_relations (workspace_id, source_concept_id, relation_type_id, target_concept_id, created_by) values ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001')$$,
  '23514',
  'acyclic relation cycle detected',
  'prerequisite cycles are rejected'
);

insert into public.concept_relations (
  workspace_id, source_concept_id, relation_type_id, target_concept_id, created_by
) values (
  '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001'
);
select is(
  (select source_concept_id from public.concept_relations where relation_type_id = '50000000-0000-0000-0000-000000000002'),
  '40000000-0000-0000-0000-000000000001'::uuid,
  'symmetric relations store the lower endpoint first'
);
select is(
  (select target_concept_id from public.concept_relations where relation_type_id = '50000000-0000-0000-0000-000000000002'),
  '40000000-0000-0000-0000-000000000002'::uuid,
  'symmetric relations store the higher endpoint second'
);

insert into public.concept_aliases (workspace_id, concept_id, alias, alias_normalized)
values ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Shared Term', 'ignored');
select throws_ok(
  $$insert into public.concept_aliases (workspace_id, concept_id, alias, alias_normalized) values ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', ' shared  term ', 'ignored')$$,
  '23505',
  'duplicate key value violates unique constraint "concept_aliases_unqualified_unique"',
  'unqualified normalized alias collisions are rejected'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select lives_ok(
  $$update public.workspaces set name = 'Owner renamed workspace' where id = '20000000-0000-0000-0000-000000000001'$$,
  'owner can update workspace settings'
);
select throws_ok(
  $$update public.domains set workspace_id = '20000000-0000-0000-0000-000000000002' where slug = 'editor-write'$$,
  '23514',
  'workspace_id is immutable',
  'canonical rows cannot be reassigned across workspaces'
);
select throws_ok(
  $$delete from public.workspace_members where workspace_id = '20000000-0000-0000-0000-000000000002' and user_id = '10000000-0000-0000-0000-000000000001'$$,
  '23514',
  'workspace must retain at least one owner',
  'the final workspace owner cannot be removed'
);

reset role;
select * from finish();
rollback;
