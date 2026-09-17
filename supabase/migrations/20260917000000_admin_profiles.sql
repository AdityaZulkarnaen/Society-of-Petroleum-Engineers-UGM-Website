-- Admin dashboard accounts.
--
-- Supabase Auth (auth.users) holds the credentials; public.profiles decides
-- who may enter the dashboard and with which role. A signed-in user without a
-- profile row has no access.
--
-- Accounts are never created from the browser: super admins are seeded (see
-- scripts/seed-super-admins.mjs), and admin accounts will be created
-- by the super admin through the server using the secret key. That is why
-- there are no insert/update/delete policies below.

create type public.admin_role as enum ('super_admin', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9._]{3,32}$'),
  full_name text not null default '',
  role public.admin_role not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Dashboard accounts. Username is lowercase and can be used to sign in instead of the email.';

-- Only one super admin.
create unique index profiles_single_super_admin
  on public.profiles (role)
  where role = 'super_admin';

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Row Level Security --------------------------------------------------------

alter table public.profiles enable row level security;

-- security definer so the policy below can read profiles without recursing
-- into its own RLS check
create function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'super_admin'
  );
$$;

revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

create policy "Admins can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Super admin can read every profile"
  on public.profiles
  for select
  to authenticated
  using ((select public.is_super_admin()));
