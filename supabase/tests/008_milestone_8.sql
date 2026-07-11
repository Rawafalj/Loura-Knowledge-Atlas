begin;
select plan(20);

select is((select count(*)::int from pg_class where oid in ('public.loura_applications'::regclass, 'public.concept_applications'::regclass) and relrowsecurity), 2, 'RLS enabled on application tables');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
 ('18000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','m8-owner@example.test','',now(),now(),now()),
 ('18000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','m8-viewer@example.test','',now(),now(),now()),
 ('18000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','m8-outsider@example.test','',now(),now(),now());
insert into public.profiles (id, display_name) values
 ('18000000-0000-0000-0000-000000000001','M8 Owner'), ('18000000-0000-0000-0000-000000000002','M8 Viewer'), ('18000000-0000-0000-0000-000000000003','M8 Outsider');
insert into public.workspaces (id, name, slug, created_by) values
 ('28000000-0000-0000-0000-000000000001','M8 Workspace','m8-workspace','18000000-0000-0000-0000-000000000001'),
 ('28000000-0000-0000-0000-000000000002','M8 Other','m8-other','18000000-0000-0000-0000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role) values
 ('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001','owner'),
 ('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000002','viewer'),
 ('28000000-0000-0000-0000-000000000002','18000000-0000-0000-0000-000000000001','owner');
insert into public.domains (id, workspace_id, slug, title, short_description, kind, created_by, updated_by)
 values ('38000000-0000-0000-0000-000000000001','28000000-0000-0000-0000-000000000001','m8-domain','M8 Domain','Application tests','core','18000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001');
insert into public.concepts (id, workspace_id, slug, canonical_name, canonical_domain_id, created_by, updated_by)
 values ('48000000-0000-0000-0000-000000000001','28000000-0000-0000-0000-000000000001','m8-concept','M8 Concept','38000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub','18000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.create_loura_application('28000000-0000-0000-0000-000000000001','decision','Retry policy','Choose a retry policy',null,'proposed',null,'connector','https://example.test/decision')$$, 'owner can create an application');
select is((select count(*)::int from public.loura_applications where workspace_id='28000000-0000-0000-0000-000000000001'), 1, 'application was persisted');
select throws_ok($$select public.create_loura_application('28000000-0000-0000-0000-000000000001','decision','Bad','Description',null,'proposed','18000000-0000-0000-0000-000000000003')$$, '23503', 'application owner must be a workspace member', 'owner must belong to workspace');
select lives_ok($$select public.link_concept_application('28000000-0000-0000-0000-000000000001','48000000-0000-0000-0000-000000000001',(select id from public.loura_applications limit 1),'Retry policy affects connector failure handling')$$, 'owner can link a concept');
select is((select count(*)::int from public.concept_applications), 1, 'concept link persisted');
select throws_ok($$select public.link_concept_application('28000000-0000-0000-0000-000000000001','48000000-0000-0000-0000-000000000001',(select id from public.loura_applications limit 1),'no')$$, '23514', 'new row for relation "concept_applications" violates check constraint "concept_applications_relevance_check"', 'relevance note is required');
select lives_ok($$select public.update_loura_application('28000000-0000-0000-0000-000000000001',(select id from public.loura_applications limit 1),null,'Retry policy v2',null,null,'active',null,null,null)$$, 'owner can update an application');
select is((select status::text from public.loura_applications limit 1), 'active', 'application status updated');
select lives_ok($$select public.archive_loura_application('28000000-0000-0000-0000-000000000001',(select id from public.loura_applications limit 1))$$, 'owner can archive an application');
select is((select status::text from public.loura_applications limit 1), 'archived', 'application is archived');
select isnt((select archived_at from public.loura_applications limit 1), null, 'archive timestamp is recorded');
select is((select count(*)::int from public.concept_applications), 1, 'archiving retains concept link');
select is((select count(*)::int from public.concepts where id='48000000-0000-0000-0000-000000000001' and deleted_at is null), 1, 'archiving does not alter canonical concept');
select throws_ok($$select public.update_loura_application('28000000-0000-0000-0000-000000000001',(select id from public.loura_applications limit 1),null,'Attempt',null,null,null,null,null,null)$$, '22023', 'archived applications are immutable', 'archived application cannot be edited');
select set_config('request.jwt.claim.sub','18000000-0000-0000-0000-000000000002',true);
select is((select count(*)::int from public.loura_applications), 1, 'viewer can read applications');
select throws_ok($$select public.create_loura_application('28000000-0000-0000-0000-000000000001','artifact','Viewer','No')$$, '42501', 'owner or editor role required', 'viewer cannot create applications');
select throws_ok($$insert into public.concept_applications (workspace_id,concept_id,application_id,relevance_note,created_by) values ('28000000-0000-0000-0000-000000000001','48000000-0000-0000-0000-000000000001',(select id from public.loura_applications limit 1),'Viewer link','18000000-0000-0000-0000-000000000002')$$, '42501', 'new row violates row-level security policy for table "concept_applications"', 'viewer cannot link concepts');
select set_config('request.jwt.claim.sub','18000000-0000-0000-0000-000000000001',true);
select throws_ok($$insert into public.loura_applications (workspace_id,application_type,title,description_markdown,created_by,external_url) values ('28000000-0000-0000-0000-000000000001','artifact','Unsafe','Description','18000000-0000-0000-0000-000000000001','javascript:alert(1)')$$, '23514', 'new row for relation "loura_applications" violates check constraint "loura_applications_external_url_check"', 'external URLs are restricted to http(s)');
select is((select count(*)::int from public.audit_events where event_type like 'loura_application.%' or event_type like 'concept_application.%'), 4, 'application changes create audit events');

reset role;
select * from finish();
rollback;
