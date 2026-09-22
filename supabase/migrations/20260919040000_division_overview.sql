-- Divisi page for super admins, and full division names.

-- Show divisions by their full names, as the dashboard designs do.
-- Keep in sync with scripts/divisions.mjs.
update public.divisions d
set name = v.name
from (
  values
    ('medcre', 'Media Creative'),
    ('hrd', 'Human Resource Development'),
    ('rne', 'Research & Education'),
    ('ea', 'External Affairs'),
    ('compdev', 'Competency Development'),
    ('finance', 'Finance'),
    ('executive', 'Executive')
) as v (slug, name)
where d.slug = v.slug;

-- One row per division: its head (the active pengurus with jabatan 'Head'),
-- active pengurus count and proker under way. Super admins can only read
-- their own division's profiles, hence security definer; only these
-- aggregates leave the function.
create function public.division_overview()
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
  where (select public.is_super_admin())
  order by d.name;
$$;

revoke execute on function public.division_overview() from public, anon;
grant execute on function public.division_overview() to authenticated;
