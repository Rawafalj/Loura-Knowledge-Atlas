begin;

select plan(25);

select is(
  (select count(*)::integer from pg_class where oid in (
    'public.learning_paths'::regclass,
    'public.learning_path_steps'::regclass,
    'public.user_mastery'::regclass,
    'public.mastery_evidence'::regclass,
    'public.learning_prerequisite_waivers'::regclass
  ) and relrowsecurity),
  5,
  'RLS is enabled on every Milestone 4 table'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm4-owner@example.test', '', now(), now(), now()),
  ('14000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm4-editor@example.test', '', now(), now(), now()),
  ('14000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm4-viewer@example.test', '', now(), now(), now());
insert into public.profiles (id, display_name) values
  ('14000000-0000-0000-0000-000000000001', 'M4 Owner'),
  ('14000000-0000-0000-0000-000000000002', 'M4 Editor'),
  ('14000000-0000-0000-0000-000000000003', 'M4 Viewer');
insert into public.workspaces (id, name, slug, created_by) values
  ('24000000-0000-0000-0000-000000000001', 'M4 First', 'm4-first', '14000000-0000-0000-0000-000000000001'),
  ('24000000-0000-0000-0000-000000000002', 'M4 Private', 'm4-private', '14000000-0000-0000-0000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role) values
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', 'owner'),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000002', 'editor'),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000003', 'viewer'),
  ('24000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000001', 'owner');
insert into public.domains (id, workspace_id, slug, title, short_description, kind, created_by, updated_by) values
  ('34000000-0000-0000-0000-000000000001', '24000000-0000-0000-0000-000000000001', 'learning', 'Learning', 'Learning domain', 'core', '14000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001'),
  ('34000000-0000-0000-0000-000000000002', '24000000-0000-0000-0000-000000000002', 'private', 'Private', 'Private domain', 'core', '14000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001');
insert into public.concepts (id, workspace_id, slug, canonical_name, canonical_domain_id, target_mastery, created_by, updated_by) values
  ('44000000-0000-0000-0000-000000000001', '24000000-0000-0000-0000-000000000001', 'foundation', 'Foundation', '34000000-0000-0000-0000-000000000001', 2, '14000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001'),
  ('44000000-0000-0000-0000-000000000002', '24000000-0000-0000-0000-000000000001', 'application', 'Application', '34000000-0000-0000-0000-000000000001', 2, '14000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001'),
  ('44000000-0000-0000-0000-000000000003', '24000000-0000-0000-0000-000000000002', 'private', 'Private', '34000000-0000-0000-0000-000000000002', 2, '14000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001');
insert into public.relation_types (id, workspace_id, key, forward_label, inverse_label, category, directed, acyclic) values
  ('54000000-0000-0000-0000-000000000001', '24000000-0000-0000-0000-000000000001', 'prerequisite_for', 'prerequisite for', 'requires', 'learning', true, true);
insert into public.concept_relations (workspace_id, source_concept_id, relation_type_id, target_concept_id, created_by) values
  ('24000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '54000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000001');
insert into public.learning_paths (id, workspace_id, slug, title, purpose_markdown, target_outcome_markdown, content_status, created_by, updated_by) values
  ('64000000-0000-0000-0000-000000000001', '24000000-0000-0000-0000-000000000001', 'fixture-route', 'Fixture route', 'Test prerequisite readiness.', 'Reach the target outcome.', 'reviewed', '14000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001');
insert into public.learning_path_steps (workspace_id, learning_path_id, concept_id, step_order, target_mastery) values
  ('24000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', 1, 2),
  ('24000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000002', 2, 2);

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000003', true);
select is((select count(*)::integer from public.learning_paths), 1, 'viewer reads canonical paths in their workspace');
select is((select count(*)::integer from public.learning_path_steps), 2, 'viewer reads canonical path steps');
select throws_ok(
  $$insert into public.learning_paths (workspace_id, slug, title, created_by, updated_by) values ('24000000-0000-0000-0000-000000000001', 'viewer-path', 'Denied', '14000000-0000-0000-0000-000000000003', '14000000-0000-0000-0000-000000000003')$$,
  '42501', 'new row violates row-level security policy for table "learning_paths"',
  'viewer cannot mutate canonical paths'
);
select lives_ok(
  $$select public.update_user_mastery('24000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', 1::smallint, 2::smallint, 'learning', 'explanation', 'Explained the boundary distinction.', null)$$,
  'viewer can update their own mastery with evidence'
);
select is((select current_level from public.user_mastery where concept_id = '44000000-0000-0000-0000-000000000001'), 1::smallint, 'mastery current level is saved');
select is((select count(*)::integer from public.mastery_evidence), 1, 'first mastery evidence is appended');
select lives_ok(
  $$select public.update_user_mastery('24000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', 2::smallint, 2::smallint, 'mastered', 'applied_analysis', 'Applied the boundary to an exception.', null)$$,
  'later mastery update succeeds'
);
select is((select count(*)::integer from public.mastery_evidence), 2, 'mastery history is preserved across updates');
select throws_ok(
  $$update public.mastery_evidence set note = 'rewritten' where concept_id = '44000000-0000-0000-0000-000000000001'$$,
  '42501', 'permission denied for table mastery_evidence',
  'learners cannot rewrite mastery evidence'
);
select throws_ok(
  $$update public.user_mastery set current_level = 5 where concept_id = '44000000-0000-0000-0000-000000000001'$$,
  '42501', 'permission denied for table user_mastery',
  'learners cannot bypass the mastery service'
);
select throws_ok(
  $$select public.update_user_mastery('24000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000002', 1::smallint, 2::smallint, 'applied', 'self_assessment', 'Too low.', null)$$,
  '22023', 'applied status requires level 2 or higher',
  'mastery status and level remain coherent'
);
select throws_ok(
  $$select public.update_user_mastery('24000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000002', 1::smallint, 2::smallint, 'learning', 'self_assessment', null, null)$$,
  '22023', 'mastery evidence requires a note or artifact URL',
  'mastery cannot change without evidence'
);
select throws_ok(
  $$select public.update_user_mastery('24000000-0000-0000-0000-000000000002', '44000000-0000-0000-0000-000000000003', 1::smallint, 2::smallint, 'learning', 'self_assessment', 'Cross workspace.', null)$$,
  '42501', 'workspace membership required',
  'viewer cannot write mastery in another workspace'
);
select lives_ok(
  $$select public.set_learning_prerequisite_waiver('24000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000002', '44000000-0000-0000-0000-000000000001', 'Equivalent work was reviewed.')$$,
  'viewer can record their own reasoned prerequisite waiver'
);
select is((select count(*)::integer from public.learning_prerequisite_waivers), 1, 'viewer reads their own waiver');
select throws_ok(
  $$select public.set_learning_prerequisite_waiver('24000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000002', 'No relation.')$$,
  'P0002', 'prerequisite relation not found',
  'waiver must reference a canonical prerequisite edge'
);
select throws_ok(
  $$select public.upsert_learning_path('24000000-0000-0000-0000-000000000001', '{"slug":"viewer-route","title":"Viewer route","purposeMarkdown":"A sufficient purpose.","targetOutcomeMarkdown":"A sufficient outcome.","contentStatus":"draft","steps":[{"conceptSlug":"foundation","stepOrder":1,"targetMastery":1}]}'::jsonb, null)$$,
  '42501', 'owner or editor role required',
  'viewer cannot use the canonical path service'
);

select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select public.upsert_learning_path('24000000-0000-0000-0000-000000000001', '{"slug":"editor-route","title":"Editor route","purposeMarkdown":"A sufficient purpose.","targetOutcomeMarkdown":"A sufficient outcome.","contentStatus":"draft","steps":[{"conceptSlug":"foundation","stepOrder":1,"targetMastery":1}]}'::jsonb, null)$$,
  'editor can create a canonical path transactionally'
);
select is((select count(*)::integer from public.learning_paths where slug = 'editor-route'), 1, 'editor path is persisted');

select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);
select is((select count(*)::integer from public.user_mastery), 0, 'another member cannot read the viewer mastery row');
select is((select count(*)::integer from public.mastery_evidence), 0, 'another member cannot read the viewer evidence history');
select is((select count(*)::integer from public.audit_events where event_type = 'mastery.updated'), 2, 'each mastery change creates an audit event');
select throws_ok(
  $$select public.upsert_learning_path('24000000-0000-0000-0000-000000000001', '{"slug":"fixture-route","title":"Fixture route","purposeMarkdown":"Test prerequisite readiness.","targetOutcomeMarkdown":"Reach the target outcome.","contentStatus":"reviewed","steps":[{"conceptSlug":"foundation","stepOrder":1,"targetMastery":2},{"conceptSlug":"missing","stepOrder":2,"targetMastery":2}]}'::jsonb, '64000000-0000-0000-0000-000000000001')$$,
  '23503', 'unknown path concept: missing',
  'invalid path replacement rolls back transactionally'
);
select is((select count(*)::integer from public.learning_path_steps where learning_path_id = '64000000-0000-0000-0000-000000000001'), 2, 'failed path update preserves the prior ordered steps');

select * from finish();
rollback;
