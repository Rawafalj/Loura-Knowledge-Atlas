begin;

select plan(27);

select is(
  (select count(*)::integer from pg_class where oid in (
    'public.sources'::regclass,
    'public.source_versions'::regclass,
    'public.source_segments'::regclass,
    'public.ingestion_jobs'::regclass
  ) and relrowsecurity),
  4,
  'RLS is enabled on every Milestone 5 workspace table'
);
select is(
  (select count(*)::integer from storage.buckets where id in ('source-files', 'source-derived') and not public),
  2,
  'original and derived storage buckets are private'
);
select ok(to_regclass('pgmq.q_source_ingest') is not null, 'durable source_ingest queue exists');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('15000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm5-owner@example.test', '', now(), now(), now()),
  ('15000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm5-editor@example.test', '', now(), now(), now()),
  ('15000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm5-viewer@example.test', '', now(), now(), now());
insert into public.profiles (id, display_name) values
  ('15000000-0000-0000-0000-000000000001', 'M5 Owner'),
  ('15000000-0000-0000-0000-000000000002', 'M5 Editor'),
  ('15000000-0000-0000-0000-000000000003', 'M5 Viewer');
insert into public.workspaces (id, name, slug, created_by) values
  ('25000000-0000-0000-0000-000000000001', 'M5 First', 'm5-first', '15000000-0000-0000-0000-000000000001'),
  ('25000000-0000-0000-0000-000000000002', 'M5 Private', 'm5-private', '15000000-0000-0000-0000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role) values
  ('25000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000001', 'owner'),
  ('25000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000002', 'editor'),
  ('25000000-0000-0000-0000-000000000001', '15000000-0000-0000-0000-000000000003', 'viewer'),
  ('25000000-0000-0000-0000-000000000002', '15000000-0000-0000-0000-000000000001', 'owner');
insert into public.sources (
  id, workspace_id, origin, title, source_type, quality, sensitivity,
  external_ai_policy, rights_note, file_name, file_mime_type, file_size_bytes,
  file_checksum_sha256, storage_path, ingestion_status, added_by
) values
  (
    '35000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000001',
    'file', 'Source fixture', 'paper', 'primary', 'internal', 'denied', 'Authored test fixture.',
    'fixture.md', 'text/markdown', 12,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '25000000-0000-0000-0000-000000000001/35000000-0000-0000-0000-000000000001/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/fixture.md',
    'pending', '15000000-0000-0000-0000-000000000001'
  ),
  (
    '35000000-0000-0000-0000-000000000002', '25000000-0000-0000-0000-000000000002',
    'file', 'Private source', 'paper', 'unknown', 'confidential', 'denied', 'Private test fixture.',
    'private.md', 'text/markdown', 8,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '25000000-0000-0000-0000-000000000002/35000000-0000-0000-0000-000000000002/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/private.md',
    'pending', '15000000-0000-0000-0000-000000000001'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000003', true);
select is((select count(*)::integer from public.sources), 1, 'viewer reads workspace sources');
select is((select count(*)::integer from public.sources where id = '35000000-0000-0000-0000-000000000002'), 0, 'cross-workspace sources remain hidden');
select throws_ok(
  $$select public.create_file_source('25000000-0000-0000-0000-000000000001', 'viewer.md', 'text/markdown', 8, 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', '{"title":"Denied","sourceType":"note","quality":"unknown","sensitivity":"internal","externalAiPolicy":"denied","rightsNote":"Test fixture","authors":[],"tags":[]}'::jsonb)$$,
  '42501', 'owner or editor role required',
  'viewer cannot create a source through the service'
);
select throws_ok(
  $$insert into public.sources (workspace_id, origin, title, source_type, rights_note, file_name, file_mime_type, file_size_bytes, file_checksum_sha256, storage_path, added_by) values ('25000000-0000-0000-0000-000000000001', 'file', 'Denied', 'note', 'Test fixture', 'denied.md', 'text/markdown', 4, 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 'denied', '15000000-0000-0000-0000-000000000003')$$,
  '42501', 'permission denied for table sources',
  'viewer cannot bypass the source service'
);

select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select public.create_file_source('25000000-0000-0000-0000-000000000001', 'editor.md', 'text/markdown', 14, 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', '{"title":"Editor source","sourceType":"note","quality":"practitioner","sensitivity":"internal","externalAiPolicy":"denied","rightsNote":"Authored test fixture","authors":[{"name":"Fixture Author"}],"tags":["fixture"]}'::jsonb)$$,
  'editor can create a private file source transactionally'
);
select throws_ok(
  $$select public.create_file_source('25000000-0000-0000-0000-000000000001', 'duplicate.md', 'text/markdown', 14, 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', '{"title":"Duplicate","sourceType":"note","quality":"unknown","sensitivity":"internal","externalAiPolicy":"denied","rightsNote":"Authored test fixture","authors":[],"tags":[]}'::jsonb)$$,
  '23505', 'duplicate source checksum',
  'duplicate checksums are rejected within a workspace'
);
select is((select count(*)::integer from public.audit_events where event_type = 'source.created'), 1, 'source creation is audited');
select lives_ok(
  $$select public.enqueue_source_ingestion('25000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-000000000001', 'default-v1', 'deterministic-v1')$$,
  'editor can enqueue deterministic ingestion'
);
select is((select count(*)::integer from public.ingestion_jobs), 1, 'one durable job record is created');
reset role;
select is((select count(*)::integer from pgmq.q_source_ingest), 1, 'one durable queue message is created');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select public.enqueue_source_ingestion('25000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-000000000001', 'default-v1', 'deterministic-v1')$$,
  'repeating enqueue with the same idempotency key is safe'
);
select is((select count(*)::integer from public.ingestion_jobs), 1, 'idempotent enqueue does not duplicate the job');
select throws_ok(
  $$update public.ingestion_jobs set status = 'completed'$$,
  '42501', 'permission denied for table ingestion_jobs',
  'authenticated curators cannot mutate worker job state directly'
);
select throws_ok(
  $$select public.enqueue_source_ingestion('25000000-0000-0000-0000-000000000002', '35000000-0000-0000-0000-000000000002', 'default-v1', 'deterministic-v1')$$,
  '42501', 'owner or editor role required',
  'editor cannot enqueue another workspace source'
);

reset role;
insert into public.source_versions (
  id, workspace_id, source_id, version_number, idempotency_key, file_checksum_sha256,
  parser_name, parser_version, parser_profile
) values (
  '45000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000001',
  '35000000-0000-0000-0000-000000000001', 1,
  '35000000-0000-0000-0000-000000000001:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:default-v1:deterministic-v1',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'docling', '2.110.0', 'default-v1'
);
insert into public.source_segments (
  id, workspace_id, source_version_id, ordinal, stable_key, segment_type,
  heading_path, text, token_count, page_start, page_end, provenance
) values (
  '55000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000001',
  '45000000-0000-0000-0000-000000000001', 1,
  'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 'paragraph', ARRAY['Reliability'],
  'Idempotency makes a repeated retry safe after uncertain execution.', 11, 2, 2,
  '{"docling":[{"page_no":2}]}'::jsonb
);
update public.source_versions set processing_status = 'completed', completed_at = now()
where id = '45000000-0000-0000-0000-000000000001';
update public.sources set latest_source_version_id = '45000000-0000-0000-0000-000000000001', ingestion_status = 'completed'
where id = '35000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000003', true);
select is((select count(*)::integer from public.source_versions), 1, 'viewer reads completed source versions');
select is((select count(*)::integer from public.source_segments), 1, 'viewer reads immutable source segments');
select throws_ok(
  $$update public.source_segments set text = 'Rewritten evidence' where id = '55000000-0000-0000-0000-000000000001'$$,
  '42501', 'permission denied for table source_segments',
  'viewer cannot rewrite source segments'
);
select is(
  (select count(*)::integer from public.search_source_segments_lexical('25000000-0000-0000-0000-000000000001', 'uncertain execution', null, null, 10)),
  1,
  'completed source segments participate in lexical source search'
);

reset role;
select throws_ok(
  $$update public.source_segments set text = 'Rewritten evidence' where id = '55000000-0000-0000-0000-000000000001'$$,
  '23514', 'segments of completed source versions are immutable',
  'database prevents service-level mutation of completed segments'
);
select throws_ok(
  $$update public.source_versions set parser_version = 'changed' where id = '45000000-0000-0000-0000-000000000001'$$,
  '23514', 'completed source versions are immutable',
  'database prevents mutation of completed source versions'
);
select throws_ok(
  $$update public.sources set latest_source_version_id = '45000000-0000-0000-0000-000000000001' where id = '35000000-0000-0000-0000-000000000002'$$,
  '23514', 'latest source version must be a completed version of this source',
  'latest version must belong to the same source and workspace'
);
update public.ingestion_jobs set status = 'failed', error_code = 'TEST', error_message_sanitized = 'Fixture failure.';

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select public.retry_ingestion_job('25000000-0000-0000-0000-000000000001', (select id from public.ingestion_jobs limit 1))$$,
  'failed ingestion can be retried safely'
);
select is((select status::text from public.ingestion_jobs limit 1), 'queued', 'retry returns the same job to queued state');
reset role;
select is((select count(*)::integer from pgmq.q_source_ingest), 2, 'retry creates one new durable delivery message');

select * from finish();
rollback;
