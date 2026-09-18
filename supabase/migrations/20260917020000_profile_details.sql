-- Profile details shown on the dashboard overview, and a per-division summary.

alter table public.profiles
  add column nim text,
  add column department text,          -- departemen / jurusan
  add column position text,            -- jabatan, e.g. 'Head', 'Vice Head', 'Staff'
  add column whatsapp text,
  add column contact_email text;       -- real email; the auth email is internal

comment on column public.profiles.contact_email is
  'Email shown to other members. Sign-in uses the internal auth email instead.';

-- Focus areas listed on the division card, e.g. {Media, Documentation}.
alter table public.divisions
  add column tags text[] not null default '{}';

-- Admins can only read their own profile, so the division card's member count
-- and head come from this security definer function, scoped to the caller's
-- own division and exposing nothing else.
create function public.my_division_summary()
returns table (member_count integer, head_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      select count(*)::integer
      from public.profiles p
      where p.division_id = me.division_id
    ),
    (
      select p.full_name
      from public.profiles p
      where p.division_id = me.division_id
        and p.role = 'super_admin'
      order by p.created_at
      limit 1
    )
  from public.profiles me
  where me.id = (select auth.uid())
    and me.division_id is not null;
$$;

revoke execute on function public.my_division_summary() from public, anon;
grant execute on function public.my_division_summary() to authenticated;
