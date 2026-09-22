-- division_overview for the secret-key client.
--
-- The dashboard caches this aggregate between requests, and the cached body
-- runs outside the request, so it calls the function with the secret key. There
-- auth.uid() is null, is_super_admin() is false, and the old guard returned no
-- rows at all. Like record_attendance, it is now granted to service_role only:
-- the Next.js server checks the caller is a super admin before reaching it.
create or replace function public.division_overview()
returns table (
  id uuid,
  name text,
  head_name text,
  member_count integer,
  active_proker integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    d.id,
    d.name,
    (
      select p.full_name
      from public.profiles p
      where p.division_id = d.id
        and p.role = 'admin'
        and p.is_active
        and p.position = 'Head'
      order by p.created_at
      limit 1
    ),
    (
      select count(*)::integer
      from public.profiles p
      where p.division_id = d.id
        and p.role = 'admin'
        and p.is_active
    ),
    (
      select count(*)::integer
      from public.proker k
      where k.division_id = d.id
        and k.status = 'berlangsung'
    )
  from public.divisions d
  order by d.name;
$$;

revoke execute on function public.division_overview() from public, anon, authenticated;
grant execute on function public.division_overview() to service_role;
