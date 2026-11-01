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
  ('10000000-0000-0000-0000-000000000001', 'b2a.reviewer', 'admin', true),
  ('10000000-0000-0000-0000-000000000002', 'b2a.inactive', 'admin', false),
  ('10000000-0000-0000-0000-000000000003', 'b2a.unassigned', 'super_admin', true);

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
insert into public.recruitment_document_requirements (period_id, slot, formats, max_bytes)
select '20000000-0000-0000-0000-000000000001'::uuid, slot, array['pdf'], 3145728
from unnest(array['cv','idCard','commitment','followProof','storyProof']) slot;
update public.recruitment_periods set approved_at=now(), approval_reference='TEST ONLY', is_open=true
where code='b2a-synthetic';
select pg_temp.expect_error($s$update public.recruitment_options set instructions='Mutation'$s$, 'approved_configuration_immutable');
select pg_temp.expect_error($s$update public.recruitment_periods set batches=array['2025'] where code='b2a-synthetic'$s$, 'approved_period_immutable');

insert into public.recruitment_access (period_id, profile_id, can_review, grant_reference)
select '20000000-0000-0000-0000-000000000001', id, true, 'SYNTHETIC TEST ONLY'
from public.profiles where username in ('b2a.reviewer','b2a.inactive');
insert into public.recruitment_applications
  (id, period_id, capability_hash, capability_expires_at, idempotency_key,
   full_name, nim, birth_place, birth_date, email, phone, major, batch)
values ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
  repeat('a',64), now()+interval '1 hour', '40000000-0000-0000-0000-000000000001',
  'Synthetic Applicant', 'test-001', 'Synthetic', date '2006-01-01', 'applicant@example.invalid',
  '0000000000','Synthetic','2026');
select pg_temp.expect_error($s$update public.recruitment_applications set status='submitted'$s$, 'two_preferences_required');
insert into public.recruitment_preferences (application_id, period_id, rank, main_code, sub_code, motivation)
select '30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001', r,
  'example','no-task','Synthetic motivation' from generate_series(1,2) r;
select pg_temp.expect_error($s$update public.recruitment_applications set status='submitted'$s$, 'supporting_documents_not_met');

-- Live RLS checks, including stale JWT after deactivation and no super-admin shortcut.
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if not public.recruitment_allowed('20000000-0000-0000-0000-000000000001','review') then raise exception 'review grant missing'; end if;
  if public.recruitment_allowed('20000000-0000-0000-0000-000000000002','review') then raise exception 'cross period access'; end if;
  if exists(select id from public.recruitment_applications) then raise exception 'uploading application leaked'; end if;
end $$;
select pg_temp.expect_error($s$select * from public.recruitment_applications$s$, 'permission denied');
select pg_temp.expect_error($s$select * from public.recruitment_export('20000000-0000-0000-0000-000000000001')$s$, 'not_allowed');
select pg_temp.expect_error($s$update public.recruitment_access set can_export=true$s$, 'permission denied');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
  if public.recruitment_allowed('20000000-0000-0000-0000-000000000001','review') then raise exception 'inactive staff allowed'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
do $$ begin
  if public.recruitment_allowed('20000000-0000-0000-0000-000000000001','review') then raise exception 'legacy super admin allowed'; end if;
end $$;
reset role;
update public.recruitment_access set revoked_at=now()
where profile_id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if public.recruitment_allowed('20000000-0000-0000-0000-000000000001','review') then raise exception 'revoked grant retained access'; end if;
end $$;
reset role;
update public.recruitment_access set revoked_at=null
where profile_id='10000000-0000-0000-0000-000000000001';
-- Same still-valid JWT identity, changed live database flag.
update public.profiles set is_active=false where username='b2a.reviewer';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if public.recruitment_allowed('20000000-0000-0000-0000-000000000001','review') then raise exception 'stale JWT retained access'; end if;
end $$;
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
