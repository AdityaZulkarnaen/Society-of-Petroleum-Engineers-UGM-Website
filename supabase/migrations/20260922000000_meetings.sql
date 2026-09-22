-- Presensi rapat (meeting attendance).
--
-- A super admin creates a rapat for their own division ('divisi') or for the
-- whole organisation ('gabungan'), opens the presensi, and shows a QR code.
-- Pengurus scan it and a row lands in meeting_attendance, which the session
-- page watches over Realtime.
--
-- The QR carries a short-lived token signed in the Next.js server, never in
-- the database, so no row the browser can read holds a secret. Attendance is
-- therefore never inserted by the scanning account itself: record_attendance()
-- is granted to service_role only and runs after the server has checked both
-- the session and the token. Everything a super admin does goes through the
-- security definer functions below, which is why neither table has an insert,
-- update or delete policy.

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  -- 'divisi': only the organising division attends. 'gabungan': everyone.
  scope text not null check (scope in ('divisi', 'gabungan')),
  -- The organising division. Its super admins own the rapat either way.
  division_id uuid not null references public.divisions (id) on delete restrict,
  sequence smallint not null check (sequence > 0),   -- 'rapat ke-'
  scheduled_at timestamptz not null,
  location text check (char_length(location) <= 120),
  notes text check (char_length(notes) <= 1000),
  -- Scanning this many minutes after scheduled_at counts as 'terlambat'.
  late_after_minutes smallint not null default 15
    check (late_after_minutes between 0 and 240),
  opened_at timestamptz,        -- presensi is open while set and not closed
  closed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.meetings is
  'Rapat with a QR presensi. Numbered per division for scope divisi, and across the organisation for scope gabungan.';

-- 'Rapat ke-' is unique per division for a divisi rapat, and unique across the
-- organisation for a gabungan one.
create unique index meetings_division_sequence_idx
  on public.meetings (division_id, sequence)
  where scope = 'divisi';

create unique index meetings_gabungan_sequence_idx
  on public.meetings (sequence)
  where scope = 'gabungan';

create index meetings_scheduled_at_idx on public.meetings (scheduled_at desc);

create trigger meetings_touch_updated_at
  before update on public.meetings
  for each row execute function public.touch_updated_at();

create table public.meeting_attendance (
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null
    check (status in ('hadir', 'terlambat', 'izin', 'sakit', 'alpa')),
  -- 'qr': scanned. 'manual': set by a super admin. 'otomatis': marked absent
  -- when the presensi closed.
  method text not null default 'qr'
    check (method in ('qr', 'manual', 'otomatis')),
  note text check (char_length(note) <= 200),
  -- Who recorded it: the pengurus themselves for a scan, the super admin for a
  -- manual change.
  recorded_by uuid references public.profiles (id) on delete set null,
  checked_in_at timestamptz not null default now(),
  primary key (meeting_id, profile_id)
);

comment on table public.meeting_attendance is
  'One row per pengurus per rapat. Absent pengurus have no row until the presensi closes.';

-- Row Level Security --------------------------------------------------------

alter table public.meetings enable row level security;
alter table public.meeting_attendance enable row level security;

create policy "Admins can read the meetings they attend"
  on public.meetings
  for select
  to authenticated
  using (
    scope = 'gabungan'
    or division_id = (select public.current_division_id())
  );

create policy "Admins can read their own attendance"
  on public.meeting_attendance
  for select
  to authenticated
  using (profile_id = (select auth.uid()));

-- Also what the session page's Realtime subscription reads.
create policy "Super admins can read attendance of their meetings"
  on public.meeting_attendance
  for select
  to authenticated
  using (
    (select public.is_super_admin())
    and exists (
      select 1
      from public.meetings m
      where m.id = meeting_id
        and (
          m.scope = 'gabungan'
          or m.division_id = (select public.current_division_id())
        )
    )
  );

-- Reading -------------------------------------------------------------------

-- Who is expected at a rapat: the organising division for a divisi rapat,
-- every active account for a gabungan one. Super admins count as attendees;
-- they sit in their own division's rapat.
create function public.is_meeting_participant(p_meeting_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.meetings m
    join public.profiles p on p.id = p_profile_id and p.is_active
    where m.id = p_meeting_id
      and (m.scope = 'gabungan' or p.division_id = m.division_id)
  );
$$;

revoke execute on function public.is_meeting_participant(uuid, uuid) from public, anon;

-- Super admins may only read their own division's profiles, so the session
-- page's live table comes from here: every expected attendee with their
-- status, or nulls while they haven't presented.
create function public.meeting_attendance_list(p_meeting_id uuid)
returns table (
  profile_id uuid,
  full_name text,
  division_name text,
  -- 'position' is a reserved word for a function's output column, so the
  -- jabatan travels under a different name
  position_name text,
  status text,
  method text,
  note text,
  checked_in_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    coalesce(nullif(p.full_name, ''), p.username),
    d.name,
    p.position,
    a.status,
    a.method,
    a.note,
    a.checked_in_at
  from public.meetings m
  join public.profiles p
    on p.is_active
   and (m.scope = 'gabungan' or p.division_id = m.division_id)
  left join public.divisions d on d.id = p.division_id
  left join public.meeting_attendance a
    on a.meeting_id = m.id and a.profile_id = p.id
  where m.id = p_meeting_id
    and public.is_super_admin()
    and (m.scope = 'gabungan' or m.division_id = public.current_division_id())
  order by a.checked_in_at desc nulls last, d.name, p.full_name;
$$;

revoke execute on function public.meeting_attendance_list(uuid) from public, anon;
grant execute on function public.meeting_attendance_list(uuid) to authenticated;

-- The rapat a super admin can see, with how many of the expected attendees
-- have presented. One query instead of a count per row.
create function public.meeting_overview()
returns table (
  id uuid,
  title text,
  scope text,
  division_id uuid,
  division_name text,
  sequence smallint,
  scheduled_at timestamptz,
  location text,
  notes text,
  late_after_minutes smallint,
  opened_at timestamptz,
  closed_at timestamptz,
  expected integer,
  present integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id,
    m.title,
    m.scope,
    m.division_id,
    d.name,
    m.sequence,
    m.scheduled_at,
    m.location,
    m.notes,
    m.late_after_minutes,
    m.opened_at,
    m.closed_at,
    (
      select count(*)::integer
      from public.profiles p
      where p.is_active
        and (m.scope = 'gabungan' or p.division_id = m.division_id)
    ),
    (
      select count(*)::integer
      from public.meeting_attendance a
      where a.meeting_id = m.id
        and a.status in ('hadir', 'terlambat')
    )
  from public.meetings m
  join public.divisions d on d.id = m.division_id
  where public.is_super_admin()
    and (m.scope = 'gabungan' or m.division_id = public.current_division_id())
  order by m.scheduled_at desc;
$$;

revoke execute on function public.meeting_overview() from public, anon;
grant execute on function public.meeting_overview() to authenticated;

-- The pengurus' own presensi page: every rapat they are expected at, newest
-- first, with their own status.
create function public.my_meetings()
returns table (
  id uuid,
  title text,
  scope text,
  division_name text,
  sequence smallint,
  scheduled_at timestamptz,
  location text,
  late_after_minutes smallint,
  opened_at timestamptz,
  closed_at timestamptz,
  status text,
  checked_in_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id,
    m.title,
    m.scope,
    d.name,
    m.sequence,
    m.scheduled_at,
    m.location,
    m.late_after_minutes,
    m.opened_at,
    m.closed_at,
    a.status,
    a.checked_in_at
  from public.profiles me
  join public.meetings m
    on m.scope = 'gabungan' or m.division_id = me.division_id
  join public.divisions d on d.id = m.division_id
  left join public.meeting_attendance a
    on a.meeting_id = m.id and a.profile_id = me.id
  where me.id = (select auth.uid())
    and me.is_active
  order by m.scheduled_at desc;
$$;

revoke execute on function public.my_meetings() from public, anon;
grant execute on function public.my_meetings() to authenticated;

-- Writing -------------------------------------------------------------------

-- Creates (p_id null) or updates a rapat of the caller's division.
create function public.save_meeting(
  p_id uuid,
  p_title text,
  p_scope text,
  p_sequence smallint,
  p_scheduled_at timestamptz,
  p_location text,
  p_notes text,
  p_late_after_minutes smallint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_division uuid := public.current_division_id();
  v_id uuid := p_id;
begin
  if not public.is_super_admin() or v_division is null then
    raise exception 'not_allowed';
  end if;

  if v_id is null then
    insert into public.meetings (
      title, scope, division_id, sequence, scheduled_at, location, notes,
      late_after_minutes, created_by
    )
    values (
      p_title, p_scope, v_division, p_sequence, p_scheduled_at, p_location,
      p_notes, p_late_after_minutes, (select auth.uid())
    )
    returning id into v_id;
  else
    update public.meetings
    set title = p_title,
        scope = p_scope,
        sequence = p_sequence,
        scheduled_at = p_scheduled_at,
        location = p_location,
        notes = p_notes,
        late_after_minutes = p_late_after_minutes
    where id = v_id
      and division_id = v_division;
    if not found then
      raise exception 'not_allowed';
    end if;
  end if;

  return v_id;
exception
  when unique_violation then
    raise exception 'sequence_taken';
end;
$$;

revoke execute on function public.save_meeting(uuid, text, text, smallint, timestamptz, text, text, smallint) from public, anon;
grant execute on function public.save_meeting(uuid, text, text, smallint, timestamptz, text, text, smallint) to authenticated;

-- Opens or closes the presensi. Closing records everyone who never presented
-- as 'alpa', so a closed rapat holds a status for every expected attendee.
create function public.set_meeting_open(p_id uuid, p_open boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meeting public.meetings;
begin
  select * into v_meeting
  from public.meetings
  where id = p_id
    and public.is_super_admin()
    and division_id = public.current_division_id();
  if not found then
    raise exception 'not_allowed';
  end if;

  if p_open then
    update public.meetings
    set opened_at = coalesce(opened_at, now()), closed_at = null
    where id = p_id;
    return;
  end if;

  update public.meetings set closed_at = now() where id = p_id;

  insert into public.meeting_attendance (meeting_id, profile_id, status, method)
  select p_id, p.id, 'alpa', 'otomatis'
  from public.profiles p
  where p.is_active
    and (v_meeting.scope = 'gabungan' or p.division_id = v_meeting.division_id)
  on conflict (meeting_id, profile_id) do nothing;
end;
$$;

revoke execute on function public.set_meeting_open(uuid, boolean) from public, anon;
grant execute on function public.set_meeting_open(uuid, boolean) to authenticated;

create function public.delete_meeting(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.meetings
  where id = p_id
    and public.is_super_admin()
    and division_id = public.current_division_id();
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

revoke execute on function public.delete_meeting(uuid) from public, anon;
grant execute on function public.delete_meeting(uuid) to authenticated;

-- A scan. Called by the Next.js server with the secret key, only after it has
-- verified the signed-in account and the token from the QR, so it is never
-- granted to authenticated: an account cannot record its own presensi without
-- the token. Returns the stored status, and whether it was already there.
create function public.record_attendance(
  p_meeting_id uuid,
  p_profile_id uuid,
  p_method text default 'qr'
)
returns table (status text, checked_in_at timestamptz, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meeting public.meetings;
  v_status text;
  v_inserted boolean := false;
begin
  select * into v_meeting from public.meetings where id = p_meeting_id;
  if not found then
    raise exception 'meeting_not_found';
  end if;

  if v_meeting.opened_at is null or v_meeting.closed_at is not null then
    raise exception 'presensi_closed';
  end if;

  if not public.is_meeting_participant(p_meeting_id, p_profile_id) then
    raise exception 'not_participant';
  end if;

  v_status := case
    when now() > v_meeting.scheduled_at
         + make_interval(mins => v_meeting.late_after_minutes)
      then 'terlambat'
    else 'hadir'
  end;

  insert into public.meeting_attendance (
    meeting_id, profile_id, status, method, recorded_by
  )
  values (p_meeting_id, p_profile_id, v_status, p_method, p_profile_id)
  on conflict (meeting_id, profile_id) do nothing;

  v_inserted := found;

  return query
  select a.status, a.checked_in_at, not v_inserted
  from public.meeting_attendance a
  where a.meeting_id = p_meeting_id and a.profile_id = p_profile_id;
end;
$$;

revoke execute on function public.record_attendance(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.record_attendance(uuid, uuid, text) to service_role;

-- The super admin's manual override on the live table. A null status clears
-- the row, putting the pengurus back to 'belum presensi'.
create function public.set_attendance(
  p_meeting_id uuid,
  p_profile_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.meetings m
    where m.id = p_meeting_id
      and public.is_super_admin()
      and m.division_id = public.current_division_id()
  ) then
    raise exception 'not_allowed';
  end if;

  if not public.is_meeting_participant(p_meeting_id, p_profile_id) then
    raise exception 'not_participant';
  end if;

  if p_status is null then
    delete from public.meeting_attendance
    where meeting_id = p_meeting_id and profile_id = p_profile_id;
    return;
  end if;

  insert into public.meeting_attendance (
    meeting_id, profile_id, status, method, note, recorded_by
  )
  values (
    p_meeting_id, p_profile_id, p_status, 'manual', p_note, (select auth.uid())
  )
  on conflict (meeting_id, profile_id) do update
  set status = excluded.status,
      method = excluded.method,
      note = excluded.note,
      recorded_by = excluded.recorded_by,
      checked_in_at = now();
end;
$$;

revoke execute on function public.set_attendance(uuid, uuid, text, text) from public, anon;
grant execute on function public.set_attendance(uuid, uuid, text, text) to authenticated;

-- Realtime ------------------------------------------------------------------

-- The session page subscribes to attendance changes of one rapat. Realtime
-- applies the policies above, so a subscriber only receives rows they could
-- already read.
do $$
begin
  alter publication supabase_realtime add table public.meeting_attendance;
exception
  -- Realtime is a convenience here, not a requirement: the session page also
  -- polls. If this project has no supabase_realtime publication, already
  -- carries the table, or publishes all tables, leave it as it is.
  when others then null;
end;
$$;
