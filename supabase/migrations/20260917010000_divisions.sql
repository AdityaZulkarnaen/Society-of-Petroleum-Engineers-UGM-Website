-- Divisions.
--
-- Each division's coordinator gets a super admin account (provisioned by the
-- developers, see scripts/seed-super-admins.mjs). A super admin manages the
-- admin accounts of their own division only, so there can be many super
-- admins — one or more per division.

-- Many super admins now, one per division coordinator.
drop index if exists public.profiles_single_super_admin;

create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.divisions is
  'Organisation divisions. Every dashboard account belongs to one.';

-- Nullable only so this migration applies over existing rows; the app always
-- sets it, and an account without a division sees nothing but itself.
alter table public.profiles
  add column division_id uuid references public.divisions (id) on delete restrict;

create index profiles_division_id_idx on public.profiles (division_id);

-- Row Level Security --------------------------------------------------------

alter table public.divisions enable row level security;

create policy "Admins can read divisions"
  on public.divisions
  for select
  to authenticated
  using (true);

-- security definer so policies on profiles can look up the caller's own
-- profile without recursing into those same policies
create function public.current_division_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select division_id
  from public.profiles
  where id = (select auth.uid());
$$;

revoke execute on function public.current_division_id() from public, anon;
grant execute on function public.current_division_id() to authenticated;

-- A super admin no longer sees every account — only their own division's.
drop policy if exists "Super admin can read every profile" on public.profiles;

create policy "Super admins can read profiles in their division"
  on public.profiles
  for select
  to authenticated
  using (
    (select public.is_super_admin())
    and division_id = (select public.current_division_id())
  );
