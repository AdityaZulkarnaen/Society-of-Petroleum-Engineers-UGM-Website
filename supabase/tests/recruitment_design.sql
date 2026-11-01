-- UNEXECUTED B2A integration tests. OWNER connection to DISPOSABLE LOCAL Supabase only.
-- Requires all 17 migrations; never run against a remote project or real users.
-- No extension dependency. Everything, including synthetic accounts, is rolled back.
begin;

create function pg_temp.expect_error(statement text, expected_message text)
returns void language plpgsql as $$
declare caught boolean := false;
begin
  begin execute statement;
  exception when others then
    if position(expected_message in sqlerrm) = 0 then raise; end if;
    caught := true;
  end;
  if not caught then raise exception 'Expected error: %', expected_message; end if;
end;
$$;

-- Fake identities, not organization accounts; no login passwords or outbound email.
insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'b2a-reviewer@example.invalid'),
  ('10000000-0000-0000-0000-000000000002', 'b2a-inactive@example.invalid'),
  ('10000000-0000-0000-0000-000000000003', 'b2a-unassigned@example.invalid');
insert into public.profiles (id, username, role, is_active) values
  ('10000000-0000-0000-0000-000000000001', 'b2a.reviewer', 'super_admin', true),
  ('10000000-0000-0000-0000-000000000002', 'b2a.inactive', 'super_admin', false),
  ('10000000-0000-0000-0000-000000000003', 'b2a.unassigned', 'admin', true);

insert into public.recruitment_periods (id, code, label, opens_at, closes_at, batches) values
  ('20000000-0000-0000-0000-000000000001', 'b2a-synthetic', 'Synthetic test only', now()-interval '1 day', now()+interval '1 day', array['2026']),
  ('20000000-0000-0000-0000-000000000002', 'b2a-draft', 'Not approved', now()-interval '1 day', now()+interval '1 day', array['2026']);
insert into public.recruitment_options
  (period_id, main_code, sub_code, main_label, sub_label, assignment_state, instructions)
values ('20000000-0000-0000-0000-000000000001','example','no-task','Example','No task','unconfirmed','Synthetic only');
select pg_temp.expect_error($s$update public.recruitment_periods
  set approved_at=now(), approval_reference='TEST ONLY'
  where code='b2a-synthetic'$s$, 'configuration_not_ready');
update public.recruitment_options set assignment_state='none';
insert into public.recruitment_options(period_id,main_code,sub_code,main_label,sub_label,assignment_state,instructions)
values('20000000-0000-0000-0000-000000000001','example','other','Example','Other','none','Synthetic only');
insert into public.recruitment_document_requirements (period_id, slot, formats, max_bytes)
select '20000000-0000-0000-0000-000000000001'::uuid, slot, array['pdf'], 3145728
from unnest(array['cv','idCard','commitment','followProof','storyProof']) slot;
update public.recruitment_periods set approved_at=now(), approval_reference='TEST ONLY', is_open=true
where code='b2a-synthetic';
select pg_temp.expect_error($s$update public.recruitment_options set instructions='Mutation'$s$, 'approved_configuration_immutable');
select pg_temp.expect_error($s$update public.recruitment_periods set batches=array['2025'] where code='b2a-synthetic'$s$, 'approved_period_immutable');

insert into public.recruitment_applications
  (id, period_id, request_hash, idempotency_key,
   full_name, nim, birth_place, birth_date, email, phone, major, batch)
values ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
  repeat('a',64), '40000000-0000-0000-0000-000000000001',
  'Synthetic Applicant', 'test-001', 'Synthetic', date '2006-01-01', 'applicant@example.invalid',
  '0000000000','Synthetic','2026');
select pg_temp.expect_error($s$update public.recruitment_applications set status='submitted'$s$, 'two_preferences_required');
select pg_temp.expect_error($s$update public.recruitment_applications set request_hash=repeat('f',64)$s$, 'application_identity_immutable');
-- Email is not an identity key; a different NIM can share an email.
insert into public.recruitment_applications(id,period_id,request_hash,idempotency_key,full_name,nim,birth_place,birth_date,email,phone,major,batch)
values('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',repeat('d',64),gen_random_uuid(),
  'Other Synthetic','test-002','Synthetic','2006-01-01','applicant@example.invalid','0000000000','Synthetic','2026');
delete from public.recruitment_applications where id='30000000-0000-0000-0000-000000000002';
insert into public.recruitment_preferences (application_id, period_id, rank, main_code, sub_code, motivation)
select '30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001', r,
  'example',case when r=1 then 'no-task' else 'other' end,'Synthetic motivation' from generate_series(1,2) r;
select pg_temp.expect_error($s$update public.recruitment_preferences set sub_code='no-task' where rank=2; set constraints all immediate$s$, 'duplicate key');
select pg_temp.expect_error($s$update public.recruitment_applications set status='submitted'$s$, 'supporting_documents_not_met');

-- Live role/activity checks, including stale JWT after deactivation.
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if not public.recruitment_allowed('20000000-0000-0000-0000-000000000001','review') then raise exception 'review grant missing'; end if;
  if not public.recruitment_allowed('20000000-0000-0000-0000-000000000002','review') then raise exception 'super admin must cover all periods'; end if;
  if exists(select id from public.recruitment_applications) then raise exception 'uploading application leaked'; end if;
end $$;
select pg_temp.expect_error($s$select * from public.recruitment_applications$s$, 'permission denied');
select * from public.recruitment_export('20000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($s$update public.recruitment_applications set status='accepted'$s$, 'permission denied');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
  if public.recruitment_allowed('20000000-0000-0000-0000-000000000001','review') then raise exception 'inactive staff allowed'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
do $$ begin
  if public.recruitment_allowed('20000000-0000-0000-0000-000000000001','review') then raise exception 'ordinary admin allowed'; end if;
end $$;
reset role;
-- Same still-valid JWT identity, changed live database flag.
update public.profiles set is_active=false where username='b2a.reviewer';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if public.recruitment_allowed('20000000-0000-0000-0000-000000000001','review') then raise exception 'stale JWT retained access'; end if;
end $$;
reset role;

-- Successful finalize against synthetic Storage metadata only; NOT a Storage API test.
insert into public.recruitment_documents(id,application_id,period_id,slot,object_name,format,byte_size,sha256,verified_at)
select ('50000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid,
 '30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',slot,
 '20000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000001/50000000-0000-0000-0000-' || lpad(n::text,12,'0') || '.pdf',
 'pdf',10,repeat('b',64),now()
from unnest(array['cv','idCard','commitment','followProof','storyProof']) with ordinality as f(slot,n);
insert into storage.objects(bucket_id,name) select bucket_id,object_name from public.recruitment_documents;
select public.recruitment_finalize('30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',repeat('a',64));
select public.recruitment_finalize('30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',repeat('a',64));
select pg_temp.expect_error($s$select public.recruitment_finalize('30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',repeat('c',64))$s$,'submission_conflict');
select pg_temp.expect_error($s$update public.recruitment_applications set email='changed@example.invalid'$s$,'application_content_locked');
select pg_temp.expect_error($s$insert into public.recruitment_applications(period_id,request_hash,idempotency_key,full_name,nim,birth_place,birth_date,email,phone,major,batch)
values('20000000-0000-0000-0000-000000000001',repeat('c',64),gen_random_uuid(),'Other','test-001','Synthetic','2006-01-01','different@example.invalid','0000000000','Synthetic','2026')$s$,'duplicate key');
update public.profiles set is_active=true where username='b2a.reviewer';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select public.recruitment_review('30000000-0000-0000-0000-000000000001','under_review');
select public.recruitment_review('30000000-0000-0000-0000-000000000001','rejected');
select * from public.recruitment_export('20000000-0000-0000-0000-000000000001');
select * from public.recruitment_document_access('50000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($s$select * from public.recruitment_audit$s$,'permission denied');
select pg_temp.expect_error($s$select public.recruitment_finalize('30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',repeat('a',64))$s$,'permission denied');
reset role;
do $$ begin
 if (select count(*) from public.recruitment_audit where event='submission') <> 1 then raise exception 'submission retry duplicated audit'; end if;
 if (select count(*) from public.recruitment_audit where event='review') <> 2 then raise exception 'review audit missing'; end if;
 if not exists(select 1 from public.recruitment_audit where event='review' and resulting_status='rejected') then raise exception 'review decision not audited'; end if;
 if (select count(*) from public.recruitment_audit where event='csv_export') <> 2 then raise exception 'export audit missing'; end if;
 if not exists(select 1 from public.recruitment_audit where event='document_download_authorized') then raise exception 'download authorization audit missing'; end if;
end $$;
-- A terminal state cannot free the NIM. Email changes do not bypass uniqueness.
select pg_temp.expect_error($s$insert into public.recruitment_applications(period_id,request_hash,idempotency_key,full_name,nim,birth_place,birth_date,email,phone,major,batch)
values('20000000-0000-0000-0000-000000000001',repeat('c',64),gen_random_uuid(),'Other','test-001','Synthetic','2006-01-01','new@example.invalid','0000000000','Synthetic','2026')$s$,'duplicate key');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select pg_temp.expect_error($s$select * from public.recruitment_export('20000000-0000-0000-0000-000000000001')$s$,'not_allowed');
select pg_temp.expect_error($s$select * from public.recruitment_document_access('50000000-0000-0000-0000-000000000001')$s$,'not_allowed');
do $$ begin
 if exists(select id from public.recruitment_applications) then raise exception 'inactive data access'; end if;
end $$;
reset role;

-- Ordinary admin and a demoted super-admin cannot read finalized data or use RPCs.
update public.profiles set role='admin' where username='b2a.reviewer';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
 if exists(select id from public.recruitment_applications) then raise exception 'demoted profile retained data'; end if;
end $$;
select pg_temp.expect_error($s$select * from public.recruitment_export('20000000-0000-0000-0000-000000000001')$s$,'not_allowed');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select pg_temp.expect_error($s$select public.recruitment_review('30000000-0000-0000-0000-000000000001','under_review')$s$,'not_allowed');
select pg_temp.expect_error($s$select * from public.recruitment_document_access('50000000-0000-0000-0000-000000000001')$s$,'not_allowed');
reset role;
set local role service_role;
select pg_temp.expect_error($s$delete from public.recruitment_audit$s$,'permission denied');
reset role;

set local role anon;
do $$ begin
  if (select count(*) from public.recruitment_periods) <> 1 then raise exception 'draft catalogue leaked'; end if;
  if exists(select id from storage.buckets where id='recruitment-documents') then raise exception 'bucket metadata leaked'; end if;
end $$;
select pg_temp.expect_error($s$select id from public.recruitment_applications$s$, 'permission denied');
reset role;

do $$ begin
  if not exists(select 1 from storage.buckets where id='recruitment-documents' and not public and file_size_limit=3145728) then
    raise exception 'private bucket configuration missing';
  end if;
end $$;
rollback;
