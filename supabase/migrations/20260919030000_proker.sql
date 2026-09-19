-- Acara & proker (work programs).
--
-- Every proker is organised by one division, and its pengurus can come from
-- any division. All dashboard accounts can see the list; only a super admin of
-- the organising division can create, edit or delete it, through the
-- functions below. Pengurus see the proker they take part in on their own
-- Acara / Proker page.

create table public.proker (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 1000),
  division_id uuid not null references public.divisions (id) on delete restrict,
  starts_on date,
  ends_on date,
  status text not null default 'direncanakan'
    check (status in ('direncanakan', 'berlangsung', 'selesai', 'dibatalkan')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index proker_division_id_idx on public.proker (division_id);

create trigger proker_touch_updated_at
  before update on public.proker
  for each row execute function public.touch_updated_at();

create table public.proker_members (
  proker_id uuid not null references public.proker (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (char_length(role) between 1 and 60),  -- peran
  position smallint not null default 0,                           -- display order
  primary key (proker_id, profile_id)
);

create index proker_members_profile_id_idx on public.proker_members (profile_id);

-- Row Level Security --------------------------------------------------------

alter table public.proker enable row level security;
alter table public.proker_members enable row level security;

create policy "Admins can read proker"
  on public.proker
  for select
  to authenticated
  using (true);

create policy "Pengurus read their own roles; super admins every role"
  on public.proker_members
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_super_admin())
  );

-- Pengurus picker -----------------------------------------------------------

-- Super admins may only read their own division's profiles, but a proker can
-- involve pengurus from any division. This exposes just names and divisions.
create function public.list_pengurus()
returns table (id uuid, full_name text, division_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, d.name
  from public.profiles p
  left join public.divisions d on d.id = p.division_id
  where (select public.is_super_admin())
    and p.role = 'admin'
    and p.is_active
  order by d.name, p.full_name;
$$;

revoke execute on function public.list_pengurus() from public, anon;
grant execute on function public.list_pengurus() to authenticated;

-- Writing -------------------------------------------------------------------

-- Creates (p_id null) or updates a proker of the caller's division and
-- replaces its pengurus. p_members: [{profile_id, role}, ...] in display order.
-- Returns the proker id.
create function public.save_proker(
  p_id uuid,
  p_name text,
  p_description text,
  p_starts_on date,
  p_ends_on date,
  p_status text,
  p_members jsonb
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
    insert into public.proker (
      name, description, division_id, starts_on, ends_on, status, created_by
    )
    values (
      p_name, p_description, v_division, p_starts_on, p_ends_on, p_status,
      (select auth.uid())
    )
    returning id into v_id;
  else
    update public.proker
    set name = p_name,
        description = p_description,
        starts_on = p_starts_on,
        ends_on = p_ends_on,
        status = p_status
    where id = v_id
      and division_id = v_division;
    if not found then
      raise exception 'not_allowed';
    end if;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_members) m
    left join public.profiles p on p.id = (m ->> 'profile_id')::uuid
    where p.id is null or p.role <> 'admin'
  ) then
    raise exception 'invalid_member';
  end if;

  delete from public.proker_members where proker_id = v_id;
  insert into public.proker_members (proker_id, profile_id, role, position)
  select v_id, (m ->> 'profile_id')::uuid, m ->> 'role', (i - 1)::smallint
  from jsonb_array_elements(p_members) with ordinality as t (m, i);

  return v_id;
end;
$$;

revoke execute on function public.save_proker(uuid, text, text, date, date, text, jsonb) from public, anon;
grant execute on function public.save_proker(uuid, text, text, date, date, text, jsonb) to authenticated;

create function public.delete_proker(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.proker
  where id = p_id
    and public.is_super_admin()
    and division_id = public.current_division_id();
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

revoke execute on function public.delete_proker(uuid) from public, anon;
grant execute on function public.delete_proker(uuid) to authenticated;
