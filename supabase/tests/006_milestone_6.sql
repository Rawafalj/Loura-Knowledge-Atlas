begin;

select plan(12);

select is(
  (select count(*)::integer from pg_class where oid in (
    'public.ai_runs'::regclass,
    'public.change_proposals'::regclass,
    'public.change_proposal_items'::regclass
  ) and relrowsecurity),
  3,
  'RLS is enabled on every Milestone 6 workspace table'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('16000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm6-owner@example.test', '', now(), now(), now()),
  ('16000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm6-editor@example.test', '', now(), now(), now()),
  ('16000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm6-viewer@example.test', '', now(), now(), now());
insert into public.profiles (id, display_name) values
  ('16000000-0000-0000-0000-000000000001', 'M6 Owner'),
  ('16000000-0000-0000-0000-000000000002', 'M6 Editor'),
  ('16000000-0000-0000-0000-000000000003', 'M6 Viewer');
insert into public.workspaces (id, name, slug, created_by) values
  ('26000000-0000-0000-0000-000000000001', 'M6 First', 'm6-first', '16000000-0000-0000-0000-000000000001'),
  ('26000000-0000-0000-0000-000000000002', 'M6 Private', 'm6-private', '16000000-0000-0000-0000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role) values
  ('26000000-0000-0000-0000-000000000001', '16000000-0000-0000-0000-000000000001', 'owner'),
  ('26000000-0000-0000-0000-000000000001', '16000000-0000-0000-0000-000000000002', 'editor'),
  ('26000000-0000-0000-0000-000000000001', '16000000-0000-0000-0000-000000000003', 'viewer'),
  ('26000000-0000-0000-0000-000000000002', '16000000-0000-0000-0000-000000000001', 'owner');
insert into public.sources (
  id, workspace_id, origin, title, source_type, quality, sensitivity, external_ai_policy,
  rights_note, file_name, file_mime_type, file_size_bytes, file_checksum_sha256,
  storage_path, ingestion_status, added_by
) values (
  '36000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000000001',
  'file', 'M6 Source', 'paper', 'primary', 'internal', 'denied', 'Authored fixture.',
  'm6.md', 'text/markdown', 8, repeat('a', 64), '26000000-0000-0000-0000-000000000001/fixture',
  'completed', '16000000-0000-0000-0000-000000000001'
);
insert into public.source_versions (
  id, workspace_id, source_id, version_number, idempotency_key, file_checksum_sha256,
  parser_name, parser_version, parser_profile, processing_status, completed_at
) values (
  '46000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000000001',
  '36000000-0000-0000-0000-000000000001', 1, 'm6-fixture', repeat('a', 64),
  'fixture', '1', 'fixture', 'completed', now()
);
insert into public.source_segments (
  id, workspace_id, source_version_id, ordinal, stable_key, segment_type, text, token_count
) values (
  '56000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000000001',
  '46000000-0000-0000-0000-000000000001', 1, repeat('b', 32), 'paragraph',
  'A reviewable claim with stored evidence.', 7
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$insert into public.ai_runs (workspace_id, run_type, provider, model_id, prompt_version, idempotency_key)
    values ('26000000-0000-0000-0000-000000000001', 'extraction', 'mock', 'fixture', 'v1', 'viewer-run')$$,
  '42501', 'new row violates row-level security policy for table "ai_runs"',
  'viewer cannot create AI runs'
);
select is((select count(*)::integer from public.change_proposals), 0, 'viewer sees no proposals before creation');

select set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000001', true);
insert into public.ai_runs (id, workspace_id, run_type, provider, model_id, prompt_version, schema_version, idempotency_key, input_refs)
values ('66000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000000001', 'extraction', 'mock', 'fixture', 'prompt-v1', 'atlas-extract-v1', 'm6-run', '{"sourceVersionId":"46000000-0000-0000-0000-000000000001"}');
insert into public.change_proposals (id, workspace_id, source_version_id, ai_run_id, title, status, summary)
values ('76000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000000001', '46000000-0000-0000-0000-000000000001', '66000000-0000-0000-0000-000000000001', 'M6 review', 'ready_for_review', 'Fixture proposal');
select lives_ok(
  $$insert into public.change_proposal_items (id, workspace_id, proposal_id, item_type, proposed_payload, evidence_segment_ids)
    values ('86000000-0000-0000-0000-000000000001', '26000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'add_citation', '{"note":"supported"}', array['56000000-0000-0000-0000-000000000001']::uuid[])$$,
  'owner can create an evidence-bound citation proposal'
);
select lives_ok(
  $$insert into public.change_proposal_items (id, workspace_id, proposal_id, item_type, proposed_payload, evidence_segment_ids)
    values ('86000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'add_relation', '{"sourceConceptId":"96000000-0000-0000-0000-000000000001"}', array['56000000-0000-0000-0000-000000000001']::uuid[])$$,
  'owner can create a structural proposal item'
);
select throws_ok(
  $$insert into public.change_proposal_items (workspace_id, proposal_id, item_type, proposed_payload, evidence_segment_ids)
    values ('26000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'add_citation', '{"note":"bad"}', array['56000000-0000-0000-0000-000000000002']::uuid[])$$,
  '23503', 'proposal evidence segment does not belong to its source version',
  'unknown evidence IDs are rejected'
);
select is(
  (select count(*)::integer from public.change_proposal_items where proposal_id = '76000000-0000-0000-0000-000000000001'),
  2,
  'two valid proposal items remain'
);

select set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select public.review_change_proposal_item('26000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', '86000000-0000-0000-0000-000000000001', 'accept', null, null)$$,
  'editor can accept a citation-only proposal'
);
select throws_ok(
  $$select public.review_change_proposal_item('26000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', '86000000-0000-0000-0000-000000000002', 'accept', null, null)$$,
  '42501', 'owner approval is required for structural proposals',
  'editor cannot accept a structural proposal'
);
select is((select status::text from public.change_proposal_items where id = '86000000-0000-0000-0000-000000000001'), 'accepted', 'citation proposal is accepted');
select is((select count(*)::integer from public.audit_events where source_proposal_item_id = '86000000-0000-0000-0000-000000000001'), 1, 'proposal review is audited');

reset role;
select throws_ok(
  $$update public.change_proposal_items set proposed_payload = '{"changed":true}' where id = '86000000-0000-0000-0000-000000000001'$$,
  '23514', 'reviewed proposal items are immutable',
  'accepted proposal history cannot be rewritten'
);

select * from finish();
rollback;
