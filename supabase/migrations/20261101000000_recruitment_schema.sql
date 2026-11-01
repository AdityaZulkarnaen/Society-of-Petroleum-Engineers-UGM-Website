-- B2A DESIGN ONLY / UNEXECUTED. See docs/staging/B2A-recruitment-design.md.
-- No catalogue, accounts, grants to people, applications, or fixtures inserted.
begin;

create table public.recruitment_periods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{3,60}$'),
  label text not null check (length(btrim(label)) between 1 and 120),
  config_version integer not null default 1 check (config_version > 0),
  approved_at timestamptz,
  approval_reference text,
  is_open boolean not null default false,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  batches text[] not null check (cardinality(batches) > 0 and array_position(batches, null) is null),
  created_at timestamptz not null default now(),
  check (closes_at > opens_at),
  check ((approved_at is null and approval_reference is null and not is_open)
    or (approved_at is not null and approval_reference is not null and length(btrim(approval_reference)) > 0))
);

-- Flattened catalogue: no dependency on legacy staff divisions or their slugs.
create table public.recruitment_options (
  period_id uuid not null references public.recruitment_periods(id) on delete restrict,
  main_code text not null check (main_code ~ '^[a-z0-9-]{1,60}$'),
  sub_code text not null check (sub_code ~ '^[a-z0-9-]{1,60}$'),
  main_label text not null check (length(btrim(main_label)) between 1 and 120),
  sub_label text not null check (length(btrim(sub_label)) between 1 and 120),
  assignment_state text not null check (assignment_state in ('required','optional','none','unconfirmed')),
  instructions text not null check (length(btrim(instructions)) between 1 and 10000),
  formats text[],
  max_bytes integer,
  primary key (period_id, main_code, sub_code),
  check ((assignment_state in ('required','optional')
    and formats is not null and cardinality(formats) > 0
    and array_position(formats, null) is null
    and formats <@ array['pdf','png','ppt','pptx']::text[]
    and max_bytes is not null and max_bytes between 1 and 3145728)
    or (assignment_state in ('none','unconfirmed') and formats is null and max_bytes is null))
);

create table public.recruitment_document_requirements (
  period_id uuid not null references public.recruitment_periods(id) on delete restrict,
  slot text not null check (slot in ('cv','idCard','commitment','followProof','storyProof')),
  required boolean not null default true,
  formats text[] not null check (cardinality(formats) > 0 and array_position(formats, null) is null
    and formats <@ array['pdf','png','ppt','pptx']::text[]),
  max_bytes integer not null check (max_bytes between 1 and 3145728),
  primary key (period_id, slot)
);

create table public.recruitment_access (
  period_id uuid not null references public.recruitment_periods(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  can_review boolean not null default false,
  can_export boolean not null default false,
  revoked_at timestamptz,
  granted_at timestamptz not null default now(),
  grant_reference text not null check (length(btrim(grant_reference)) between 1 and 500),
  primary key (period_id, profile_id),
  check (not can_export or can_review)
);
create index recruitment_access_profile_idx on public.recruitment_access(profile_id, period_id);

-- No auth.users/profile FK: applicants are not staff accounts.
-- The server issues a high-entropy capability cookie and stores only its hash.
create table public.recruitment_applications (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.recruitment_periods(id) on delete restrict,
  capability_hash text not null unique check (capability_hash ~ '^[0-9a-f]{64}$'),
  capability_expires_at timestamptz not null,
  idempotency_key uuid not null unique,
  full_name text not null check (length(btrim(full_name)) between 1 and 150),
  nim text not null check (length(btrim(nim)) between 1 and 150 and nim = lower(btrim(nim))),
  birth_place text not null check (length(btrim(birth_place)) between 1 and 150),
  birth_date date not null,
  email text not null check (length(email) <= 254 and email = lower(btrim(email))
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{8,25}$'
    and length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 8),
  major text not null check (length(btrim(major)) between 1 and 150),
  batch text not null,
  status text not null default 'uploading'
    check (status in ('uploading','submitted','under_review','accepted','rejected','withdrawn')),
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  review_note text check (length(review_note) <= 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, period_id),
  unique (period_id, nim),
  unique (period_id, email),
  check ((status = 'uploading' and submitted_at is null)
    or (status <> 'uploading' and submitted_at is not null))
);
create index recruitment_applications_queue_idx
  on public.recruitment_applications(period_id, status, submitted_at, id);

create table public.recruitment_preferences (
  application_id uuid not null,
  period_id uuid not null,
  rank smallint not null check (rank in (1,2)),
  main_code text not null,
  sub_code text not null,
  motivation text not null check (length(btrim(motivation)) between 1 and 3000),
  primary key (application_id, rank),
  foreign key (application_id, period_id)
    references public.recruitment_applications(id, period_id) on delete restrict,
  foreign key (period_id, main_code, sub_code)
    references public.recruitment_options(period_id, main_code, sub_code) on delete restrict
);
create index recruitment_preferences_option_idx
  on public.recruitment_preferences(period_id, main_code, sub_code);

create table public.recruitment_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  period_id uuid not null,
  slot text not null check (slot in ('cv','idCard','commitment','followProof','storyProof','assignment1','assignment2')),
  bucket_id text not null default 'recruitment-documents' check (bucket_id = 'recruitment-documents'),
  object_name text not null unique,
  format text not null check (format in ('pdf','png','ppt','pptx')),
  byte_size integer not null check (byte_size between 1 and 3145728),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (application_id, slot),
  foreign key (application_id, period_id)
    references public.recruitment_applications(id, period_id) on delete restrict,
  -- Opaque path, no applicant name/email/NIM or user-provided path components.
  check (object_name = period_id::text || '/' || application_id::text || '/' || id::text || '.' || format)
);
create index recruitment_documents_period_idx on public.recruitment_documents(period_id, application_id);

-- Approval locks catalogue and requirement rows; serialize edits with approval.
create function public.recruitment_config_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare p uuid; approved timestamptz;
begin
  if tg_op = 'UPDATE' and new.period_id <> old.period_id then
    raise exception 'configuration_reparent_forbidden';
  end if;
  if tg_op = 'DELETE' then p := old.period_id; else p := new.period_id; end if;
  select approved_at into approved from public.recruitment_periods where id = p for update;
  if approved is not null then raise exception 'approved_configuration_immutable'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger recruitment_options_guard before insert or update or delete on public.recruitment_options
  for each row execute function public.recruitment_config_guard();
create trigger recruitment_requirements_guard before insert or update or delete on public.recruitment_document_requirements
  for each row execute function public.recruitment_config_guard();

create function public.recruitment_period_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.approved_at is not null then raise exception 'approved_period_immutable'; end if;
    return old;
  end if;
  if tg_op = 'INSERT' and new.approved_at is not null then
    raise exception 'create_draft_then_approve';
  end if;
  if tg_op = 'UPDATE' and old.approved_at is not null then
    if (to_jsonb(new) - 'is_open') is distinct from (to_jsonb(old) - 'is_open') then
      raise exception 'approved_period_immutable';
    end if;
  end if;
  if tg_op = 'UPDATE' and old.approved_at is null and new.approved_at is not null then
    if not exists (select 1 from public.recruitment_options where period_id = new.id)
      or exists (select 1 from public.recruitment_options where period_id = new.id and assignment_state = 'unconfirmed')
      or (select count(*) from public.recruitment_document_requirements where period_id = new.id) <> 5 then
      raise exception 'configuration_not_ready';
    end if;
    if exists (select 1 from public.recruitment_options where period_id = new.id
      group by main_code having count(distinct main_label) <> 1) then
      raise exception 'inconsistent_main_division_label';
    end if;
  end if;
  return new;
end;
$$;
create trigger recruitment_period_guard before insert or update or delete on public.recruitment_periods
  for each row execute function public.recruitment_period_guard();

-- Child writes take the application lock, preventing finalize/edit races.
create function public.recruitment_child_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare app uuid; state text;
begin
  if tg_op = 'UPDATE' and (new.application_id <> old.application_id or new.period_id <> old.period_id) then
    raise exception 'application_reparent_forbidden';
  end if;
  if tg_op = 'DELETE' then app := old.application_id; else app := new.application_id; end if;
  select status into state from public.recruitment_applications where id = app for update;
  if state is distinct from 'uploading' then raise exception 'application_content_locked'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger recruitment_preferences_guard before insert or update or delete on public.recruitment_preferences
  for each row execute function public.recruitment_child_guard();
create trigger recruitment_documents_guard before insert or update or delete on public.recruitment_documents
  for each row execute function public.recruitment_child_guard();

create function public.recruitment_application_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.recruitment_periods;
begin
  if tg_op = 'INSERT' and new.status <> 'uploading' then raise exception 'initial_status_invalid'; end if;
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.period_id <> old.period_id then raise exception 'application_identity_immutable'; end if;
    if old.status <> 'uploading' and
      (to_jsonb(new) - array['status','reviewed_by','reviewed_at','review_note','updated_at'])
        is distinct from
      (to_jsonb(old) - array['status','reviewed_by','reviewed_at','review_note','updated_at']) then
      raise exception 'application_content_locked';
    end if;
    if new.status <> old.status and not (
      (old.status = 'uploading' and new.status = 'submitted') or
      (old.status = 'submitted' and new.status in ('under_review','withdrawn')) or
      (old.status = 'under_review' and new.status in ('accepted','rejected','withdrawn'))
    ) then raise exception 'status_transition_invalid'; end if;
  end if;
  if tg_op = 'INSERT' or old.status = 'uploading' then
    if new.capability_expires_at <= clock_timestamp() then raise exception 'application_session_expired'; end if;
    select * into p from public.recruitment_periods where id = new.period_id for share;
    if p.approved_at is null or not p.is_open or clock_timestamp() < p.opens_at or clock_timestamp() >= p.closes_at then
      raise exception 'recruitment_not_open';
    end if;
    if not (new.batch = any(p.batches)) or new.birth_date > (clock_timestamp() at time zone 'Asia/Jakarta')::date then
      raise exception 'personal_information_invalid';
    end if;
  end if;
  if tg_op = 'UPDATE' and old.status = 'uploading' and new.status = 'submitted' then
    if (select count(*) from public.recruitment_preferences where application_id = new.id) <> 2 then
      raise exception 'two_preferences_required';
    end if;
    if exists (
      select 1 from public.recruitment_preferences r
      join public.recruitment_options o using (period_id, main_code, sub_code)
      left join public.recruitment_documents d on d.application_id = r.application_id
        and d.slot = 'assignment' || r.rank::text
      where r.application_id = new.id and (
        o.assignment_state = 'unconfirmed' or
        (o.assignment_state = 'required' and d.id is null) or
        (o.assignment_state = 'none' and d.id is not null) or
        (d.id is not null and (not (d.format = any(o.formats)) or d.byte_size > o.max_bytes))
      )
    ) then raise exception 'assignment_requirements_not_met'; end if;
    if exists (
      select 1 from public.recruitment_document_requirements r
      left join public.recruitment_documents d on d.application_id = new.id and d.slot = r.slot
      where r.period_id = new.period_id and (
        (r.required and d.id is null) or
        (d.id is not null and (not (d.format = any(r.formats)) or d.byte_size > r.max_bytes))
      )
    ) then raise exception 'supporting_documents_not_met'; end if;
    if exists (select 1 from public.recruitment_documents d where d.application_id = new.id
      and not exists (select 1 from storage.objects s where s.bucket_id = d.bucket_id and s.name = d.object_name)) then
      raise exception 'storage_object_missing';
    end if;
    new.submitted_at := clock_timestamp();
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger recruitment_application_guard before insert or update on public.recruitment_applications
  for each row execute function public.recruitment_application_guard();

-- Close default-grant exposure before this file commits, even if the next
-- security migration fails. API roles have no access until explicit grants.
do $$
declare t text;
begin
  foreach t in array array['recruitment_periods','recruitment_options',
    'recruitment_document_requirements','recruitment_access','recruitment_applications',
    'recruitment_preferences','recruitment_documents'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
  end loop;
end;
$$;
revoke all on function public.recruitment_config_guard() from public, anon, authenticated;
revoke all on function public.recruitment_period_guard() from public, anon, authenticated;
revoke all on function public.recruitment_child_guard() from public, anon, authenticated;
revoke all on function public.recruitment_application_guard() from public, anon, authenticated;

commit;
