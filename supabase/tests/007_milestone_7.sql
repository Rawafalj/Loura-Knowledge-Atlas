begin;

select plan(16);

select is(
  (select count(*)::integer from pg_class where oid in (
    'public.ask_threads'::regclass,
    'public.ask_messages'::regclass
  ) and relrowsecurity),
  2,
  'RLS is enabled on every Milestone 7 workspace table'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('17000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm7-owner@example.test', '', now(), now(), now()),
  ('17000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm7-viewer@example.test', '', now(), now(), now());
insert into public.profiles (id, display_name) values
  ('17000000-0000-0000-0000-000000000001', 'M7 Owner'),
  ('17000000-0000-0000-0000-000000000002', 'M7 Viewer');
insert into public.workspaces (id, name, slug, created_by) values
  ('27000000-0000-0000-0000-000000000001', 'M7 Workspace', 'm7-workspace', '17000000-0000-0000-0000-000000000001'),
  ('27000000-0000-0000-0000-000000000002', 'M7 Other', 'm7-other', '17000000-0000-0000-0000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role) values
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000001', 'owner'),
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000002', 'viewer'),
  ('27000000-0000-0000-0000-000000000002', '17000000-0000-0000-0000-000000000001', 'owner');

insert into public.ai_runs (
  id, workspace_id, run_type, provider, model_id, prompt_version, idempotency_key
) values (
  '67000000-0000-0000-0000-000000000001', '27000000-0000-0000-0000-000000000002',
  'ask', 'mock', 'fixture', 'ask-v1', 'm7-other-run'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$insert into public.ask_threads (id, workspace_id, user_id, title, scope)
    values ('77000000-0000-0000-0000-000000000001', '27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000001', 'M7 thread', '{"status":"reviewed"}')$$,
  'owner can save a private thread'
);
select lives_ok(
  $$insert into public.ask_messages (id, workspace_id, thread_id, role, content_markdown)
    values ('87000000-0000-0000-0000-000000000001', '27000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000001', 'user', 'What is the reviewed route?')$$,
  'owner can save a user message'
);
select lives_ok(
  $$insert into public.ask_messages (id, workspace_id, thread_id, role, content_markdown, answer_status, retrieved_concept_ids, cited_segment_ids)
    values ('87000000-0000-0000-0000-000000000002', '27000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000001', 'assistant', 'The reviewed route is grounded.', 'complete', '{}', '{}')$$,
  'owner can save a cited assistant answer'
);
select throws_ok(
  $$insert into public.ask_messages (workspace_id, thread_id, role, content_markdown, cited_segment_ids)
    values ('27000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000001', 'assistant', 'Fabricated citation', array['98000000-0000-0000-0000-000000000001']::uuid[])$$,
  '23503', 'Ask citation must reference a completed source segment in this workspace',
  'assistant citations must reference completed stored segments'
);
select throws_ok(
  $$insert into public.ask_messages (workspace_id, thread_id, role, content_markdown, ai_run_id)
    values ('27000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000001', 'assistant', 'Cross-workspace run', '67000000-0000-0000-0000-000000000001')$$,
  '23503', 'insert or update on table "ask_messages" violates foreign key constraint "ask_messages_ai_run_workspace_fk"',
  'AI run references cannot cross workspaces'
);
select throws_ok(
  $$insert into public.ask_messages (workspace_id, thread_id, role, content_markdown)
    values ('27000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000001', 'user', '   ')$$,
  '23514', 'new row for relation "ask_messages" violates check constraint "ask_messages_content_check"',
  'empty messages are rejected'
);
select throws_ok(
  $$insert into public.ask_threads (workspace_id, user_id, title)
    values ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000002', 'spoofed')$$,
  '42501', 'new row violates row-level security policy for table "ask_threads"',
  'a user cannot create a thread for another user'
);
select throws_ok(
  $$update public.ask_threads set user_id = '17000000-0000-0000-0000-000000000002' where id = '77000000-0000-0000-0000-000000000001'$$,
  '23514', 'ask thread ownership is immutable',
  'ownership trigger prevents transferring a private thread'
);

select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.ask_threads), 0, 'workspace members cannot read another user private threads');
select throws_ok(
  $$insert into public.ask_messages (workspace_id, thread_id, role, content_markdown)
    values ('27000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000001', 'user', 'snooping')$$,
  '42501', 'new row violates row-level security policy for table "ask_messages"',
  'workspace members cannot append to another user thread'
);
select lives_ok(
  $$insert into public.ask_threads (id, workspace_id, user_id, title)
    values ('77000000-0000-0000-0000-000000000002', '27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000002', 'Viewer thread')$$,
  'a member can create their own private thread'
);

select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$delete from public.ask_threads where id = '77000000-0000-0000-0000-000000000001'$$,
  'owner can delete a thread for retention'
);
select is((select count(*)::integer from public.ask_messages where thread_id = '77000000-0000-0000-0000-000000000001'), 0, 'deleting a thread cascades its messages');
select is((select count(*)::integer from public.ask_threads where id = '77000000-0000-0000-0000-000000000002'), 0, 'private thread remains hidden from another user');
select is((select count(*)::integer from public.ask_threads where workspace_id = '27000000-0000-0000-0000-000000000002'), 0, 'no cross-workspace thread leakage');

reset role;
select * from finish();
rollback;
