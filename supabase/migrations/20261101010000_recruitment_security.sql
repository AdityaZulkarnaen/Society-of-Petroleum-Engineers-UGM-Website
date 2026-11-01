-- B2A DESIGN ONLY / UNEXECUTED. No privileged people are provisioned.
begin;

-- Current database identity, role and activity; no legacy helper or access grants.
create function public.recruitment_allowed(p_period uuid, p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_permission in ('review','export','documents') and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
      and p.role = 'super_admin' and p.is_active
  ) and exists (select 1 from public.recruitment_periods where id = p_period);
$$;
revoke all on function public.recruitment_allowed(uuid, text) from public, anon, authenticated;
grant execute on function public.recruitment_allowed(uuid, text) to authenticated;

-- Explicit privilege reset defeats project-specific default table grants.
do $$
declare t text;
begin
  foreach t in array array['recruitment_periods','recruitment_options',
    'recruitment_document_requirements','recruitment_applications',
    'recruitment_preferences','recruitment_documents','recruitment_audit'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    if t <> 'recruitment_audit' then
      execute format('grant select, insert, update, delete on table public.%I to service_role', t);
    else
      execute format('revoke all on table public.%I from service_role', t);
    end if;
  end loop;
end;
$$;

-- Public configuration is approved configuration ONLY, served as data, no PII.
grant select (id, code, label, config_version, approved_at, is_open, opens_at, closes_at, batches)
  on public.recruitment_periods to anon, authenticated;
grant select on public.recruitment_options, public.recruitment_document_requirements to anon, authenticated;
create policy recruitment_periods_published on public.recruitment_periods
  for select to anon, authenticated using (approved_at is not null);
create policy recruitment_options_published on public.recruitment_options
  for select to anon, authenticated using (exists (
    select 1 from public.recruitment_periods p where p.id = period_id and p.approved_at is not null));
create policy recruitment_requirements_published on public.recruitment_document_requirements
  for select to anon, authenticated using (exists (
    select 1 from public.recruitment_periods p where p.id = period_id and p.approved_at is not null));

-- Request hashes and idempotency keys are NOT staff-readable.
grant select (id, period_id, full_name, nim, birth_place, birth_date, email,
  phone, major, batch, status, submitted_at, reviewed_by, reviewed_at,
  review_note, created_at, updated_at) on public.recruitment_applications to authenticated;
grant select on public.recruitment_preferences, public.recruitment_documents to authenticated;
create policy recruitment_applications_review on public.recruitment_applications
  for select to authenticated using (status <> 'uploading' and public.recruitment_allowed(period_id, 'review'));
create policy recruitment_preferences_review on public.recruitment_preferences
  for select to authenticated using (public.recruitment_allowed(period_id, 'review') and exists (
    select 1 from public.recruitment_applications a where a.id = application_id and a.status <> 'uploading'));
create policy recruitment_documents_review on public.recruitment_documents
  for select to authenticated using (public.recruitment_allowed(period_id, 'review') and exists (
    select 1 from public.recruitment_applications a where a.id = application_id and a.status <> 'uploading'));
-- Narrow user-JWT RPC: staff cannot change applicant PII, access or catalogue.
create function public.recruitment_review(p_application uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.recruitment_applications;
begin
  select * into a from public.recruitment_applications where id = p_application for update;
  if not found or not public.recruitment_allowed(a.period_id, 'review') then
    raise exception 'not_allowed';
  end if;
  if p_status is null or p_status not in ('under_review','accepted','rejected') then
    raise exception 'review_status_invalid';
  end if;
  if not ((a.status = 'submitted' and p_status = 'under_review')
    or (a.status = 'under_review' and p_status in ('accepted','rejected'))) then
    raise exception 'review_transition_invalid';
  end if;
  update public.recruitment_applications set status = p_status,
    reviewed_by = (select auth.uid()), reviewed_at = clock_timestamp(), review_note = p_note
    where id = a.id;
end;
$$;
revoke all on function public.recruitment_review(uuid, text, text) from public, anon, authenticated;
grant execute on function public.recruitment_review(uuid, text, text) to authenticated;

-- Bounded export primitive; transport, CSV escaping, audit and rate limit are server work.
-- Omits request keys, file paths, hashes and internal review notes.
create function public.recruitment_export(p_period uuid, p_after uuid default null, p_limit integer default 100)
returns table (application jsonb) language plpgsql security definer set search_path = '' as $$
begin
  if not public.recruitment_allowed(p_period, 'export') then raise exception 'not_allowed'; end if;
  if p_limit is null or p_limit not between 1 and 500 then raise exception 'export_limit_invalid'; end if;
  insert into public.recruitment_audit(period_id, actor_id, event, request_id)
    values (p_period, (select auth.uid()), 'csv_export', gen_random_uuid());
  return query select jsonb_build_object(
    'id', a.id, 'period_id', a.period_id, 'full_name', a.full_name, 'nim', a.nim,
    'birth_place', a.birth_place, 'birth_date', a.birth_date, 'email', a.email,
    'phone', a.phone, 'major', a.major, 'batch', a.batch, 'status', a.status,
    'submitted_at', a.submitted_at,
    'preferences', (select jsonb_agg(jsonb_build_object('rank', r.rank,
      'main_code', r.main_code, 'sub_code', r.sub_code, 'motivation', r.motivation) order by r.rank)
      from public.recruitment_preferences r where r.application_id = a.id)
  ) from public.recruitment_applications a where a.period_id = p_period
    and a.status <> 'uploading' and (p_after is null or a.id > p_after)
    order by a.id limit p_limit;
end;
$$;
revoke all on function public.recruitment_export(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.recruitment_export(uuid, uuid, integer) to authenticated;

-- Finalization is server-only, row-locked, retry-safe and returns only a receipt ID.
-- Server must recompute canonical request hash; caller-provided hashes are not trusted.
create function public.recruitment_finalize(p_application uuid, p_key uuid, p_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare a public.recruitment_applications;
begin
  select * into a from public.recruitment_applications where id = p_application for update;
  if not found or p_key is distinct from a.idempotency_key or p_hash is distinct from a.request_hash then
    raise exception 'submission_conflict';
  end if;
  -- Uniqueness applies to every status, including rejected and withdrawn.
  if a.nim <> lower(btrim(a.nim)) or exists (select 1 from public.recruitment_applications other
    where other.period_id=a.period_id and other.nim=a.nim and other.id<>a.id) then
    raise exception 'submission_conflict';
  end if;
  if a.status = 'uploading' then
    update public.recruitment_applications set status='submitted' where id=a.id;
  end if;
  return a.id;
end;
$$;
revoke all on function public.recruitment_finalize(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.recruitment_finalize(uuid, uuid, text) to service_role;

create function public.recruitment_write_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'uploading' and new.status = 'submitted' then
    insert into public.recruitment_audit(period_id, application_id, event, request_id, previous_status, resulting_status)
      values(new.period_id,new.id,'submission',new.idempotency_key,old.status,new.status);
  elsif new.status is distinct from old.status and new.status in ('under_review','accepted','rejected') then
    if not public.recruitment_allowed(new.period_id,'review') then raise exception 'not_allowed'; end if;
    insert into public.recruitment_audit(period_id, application_id, actor_id, event, request_id, previous_status, resulting_status)
      values(new.period_id,new.id,(select auth.uid()),'review',gen_random_uuid(),old.status,new.status);
  end if;
  return new;
end;
$$;
revoke all on function public.recruitment_write_audit() from public, anon, authenticated;
create trigger recruitment_write_audit after update on public.recruitment_applications
  for each row execute function public.recruitment_write_audit();

-- Server invokes with VERIFIED caller JWT before streaming this exact object.
-- Event records authorization, not proof that the client received the bytes.
create function public.recruitment_document_access(p_document uuid)
returns table(bucket_id text, object_name text)
language plpgsql security definer set search_path = '' as $$
declare d public.recruitment_documents;
begin
  select * into d from public.recruitment_documents where id=p_document;
  if not found or not public.recruitment_allowed(d.period_id,'documents') or not exists (
    select 1 from public.recruitment_applications a where a.id=d.application_id and a.status<>'uploading'
  ) then raise exception 'not_allowed'; end if;
  insert into public.recruitment_audit(period_id,application_id,document_id,actor_id,event,request_id)
    values(d.period_id,d.application_id,d.id,(select auth.uid()),'document_download_authorized',gen_random_uuid());
  return query select d.bucket_id,d.object_name;
end;
$$;
revoke all on function public.recruitment_document_access(uuid) from public, anon, authenticated;
grant execute on function public.recruitment_document_access(uuid) to authenticated;

-- Trigger functions are not public API/RPCs; remove default PUBLIC execute.
revoke all on function public.recruitment_config_guard() from public, anon, authenticated;
revoke all on function public.recruitment_period_guard() from public, anon, authenticated;
revoke all on function public.recruitment_child_guard() from public, anon, authenticated;
revoke all on function public.recruitment_application_guard() from public, anon, authenticated;

-- Fail on an existing bucket instead of silently inheriting unsafe settings.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recruitment-documents', 'recruitment-documents', false, 3145728,
  array['application/pdf','image/png','application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation']);

-- Restrictive fences also deny future broad permissive Storage policies.
-- Other buckets/legacy voting policies are untouched. Service role bypasses RLS.
create policy recruitment_no_direct_objects on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'recruitment-documents')
  with check (bucket_id <> 'recruitment-documents');
create policy recruitment_no_direct_bucket on storage.buckets as restrictive
  for all to anon, authenticated
  using (id <> 'recruitment-documents')
  with check (id <> 'recruitment-documents');

commit;
