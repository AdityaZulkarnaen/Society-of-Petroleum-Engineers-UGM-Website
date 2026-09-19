-- Rekap pengurus: each pengurus' contribution stats, competency evaluation
-- and HR notes per management period. Written by their division's super admin
-- (Rekap Pengurus), read by the pengurus themselves (Rekap Diri).

create table public.rekap (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  period text not null check (period ~ '^\d{4}/\d{4}$'),
  proker_done integer check (proker_done >= 0),
  proker_target integer check (proker_target > 0),
  attendance_done integer check (attendance_done >= 0),
  attendance_target integer check (attendance_target > 0),
  points_done integer check (points_done >= 0),
  points_target integer check (points_target > 0),
  achievements text,                   -- kontribusi & pencapaian utama
  strengths text,                      -- kekuatan yang diobservasi
  improvements text,                   -- area yang perlu dikembangkan
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  primary key (profile_id, period)
);

create table public.rekap_competencies (
  profile_id uuid not null,
  period text not null,
  competency text not null check (competency in (
    'Kepemimpinan', 'Kerja Tim', 'Tanggung Jawab',
    'Inisiatif', 'Komunikasi', 'Manajemen Waktu'
  )),
  -- 1 to 5 in half steps
  score numeric(2, 1) not null check (score between 1 and 5 and score * 2 = trunc(score * 2)),
  -- the first score recorded this period, for the radar chart's 'Awal Periode'
  initial_score numeric(2, 1) not null,
  rating text not null check (rating in ('sangat_baik', 'baik', 'cukup', 'perlu_ditingkatkan')),
  primary key (profile_id, period, competency),
  foreign key (profile_id, period)
    references public.rekap (profile_id, period) on delete cascade
);

-- Row Level Security --------------------------------------------------------

alter table public.rekap enable row level security;
alter table public.rekap_competencies enable row level security;

-- security definer so the policies can check the profile's division without
-- running into the profiles policies
create function public.manages_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin() and exists (
    select 1
    from public.profiles
    where id = p_profile_id
      and role = 'admin'
      and division_id = public.current_division_id()
  );
$$;

revoke execute on function public.manages_profile(uuid) from public, anon;
grant execute on function public.manages_profile(uuid) to authenticated;

create policy "Pengurus read their own rekap; super admins their division's"
  on public.rekap
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.manages_profile(profile_id))
  );

create policy "Pengurus read their own competencies; super admins their division's"
  on public.rekap_competencies
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.manages_profile(profile_id))
  );

-- Saving --------------------------------------------------------------------

-- Saves one pengurus' whole rekap for a period in one transaction.
--   p_stats        {proker_done, proker_target, attendance_done, ...}
--   p_notes        {achievements, strengths, improvements}
--   p_competencies [{competency, score, rating}, ...] — the full list; rows
--                  left out are removed
create function public.save_rekap(
  p_profile_id uuid,
  p_period text,
  p_stats jsonb,
  p_notes jsonb,
  p_competencies jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.manages_profile(p_profile_id) then
    raise exception 'not_allowed';
  end if;

  insert into public.rekap as r (
    profile_id, period,
    proker_done, proker_target, attendance_done, attendance_target,
    points_done, points_target,
    achievements, strengths, improvements,
    updated_by
  )
  values (
    p_profile_id, p_period,
    (p_stats ->> 'proker_done')::integer, (p_stats ->> 'proker_target')::integer,
    (p_stats ->> 'attendance_done')::integer, (p_stats ->> 'attendance_target')::integer,
    (p_stats ->> 'points_done')::integer, (p_stats ->> 'points_target')::integer,
    p_notes ->> 'achievements', p_notes ->> 'strengths', p_notes ->> 'improvements',
    (select auth.uid())
  )
  on conflict (profile_id, period) do update set
    proker_done = excluded.proker_done,
    proker_target = excluded.proker_target,
    attendance_done = excluded.attendance_done,
    attendance_target = excluded.attendance_target,
    points_done = excluded.points_done,
    points_target = excluded.points_target,
    achievements = excluded.achievements,
    strengths = excluded.strengths,
    improvements = excluded.improvements,
    updated_at = now(),
    updated_by = excluded.updated_by;

  delete from public.rekap_competencies c
  where c.profile_id = p_profile_id
    and c.period = p_period
    and c.competency not in (
      select item ->> 'competency' from jsonb_array_elements(p_competencies) item
    );

  -- a new competency starts its 'Awal Periode' at this score; later saves
  -- only move the current score
  insert into public.rekap_competencies (
    profile_id, period, competency, score, initial_score, rating
  )
  select
    p_profile_id, p_period,
    item ->> 'competency',
    (item ->> 'score')::numeric,
    (item ->> 'score')::numeric,
    item ->> 'rating'
  from jsonb_array_elements(p_competencies) item
  on conflict (profile_id, period, competency) do update set
    score = excluded.score,
    rating = excluded.rating;
end;
$$;

revoke execute on function public.save_rekap(uuid, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_rekap(uuid, text, jsonb, jsonb, jsonb) to authenticated;
