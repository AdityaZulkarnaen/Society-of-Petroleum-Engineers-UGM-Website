-- Migration: Update evaluasi kompetensi to 12 new competency aspects
-- Changes:
--   1. Update competency CHECK constraint to accept 12 new values
--   2. Change score from half-step (0.5) to free decimal (1.00–5.00)
--   3. Drop the required `rating` column (now auto-calculated in frontend)
--   4. Update save_rekap() function accordingly
--   5. Migrate existing data to the closest new competency names

begin;

-- ============================================================================
-- 1. Migrate existing competency data to new names
-- ============================================================================

update public.rekap_competencies set competency = case competency
  when 'Kepemimpinan'    then 'Grit / Perseverance'
  when 'Kerja Tim'       then 'Teamwork'
  when 'Tanggung Jawab'  then 'Accountability'
  when 'Inisiatif'       then 'Innovation'
  when 'Komunikasi'      then 'Communication'
  when 'Manajemen Waktu' then 'Self Awareness'
end
where competency in (
  'Kepemimpinan', 'Kerja Tim', 'Tanggung Jawab',
  'Inisiatif', 'Komunikasi', 'Manajemen Waktu'
);

-- ============================================================================
-- 2. Drop the old CHECK on competency and add the new one (12 values)
-- ============================================================================

alter table public.rekap_competencies
  drop constraint if exists rekap_competencies_competency_check;

alter table public.rekap_competencies
  add constraint rekap_competencies_competency_check
  check (competency in (
    'Grit / Perseverance',
    'Agility',
    'Strive for Excellence',
    'Innovation',
    'Caring',
    'Empower Others',
    'Teamwork',
    'Communication',
    'Self Awareness',
    'Self Purpose',
    'Integrity',
    'Accountability'
  ));

-- ============================================================================
-- 3. Change score columns to allow free decimals (1.00–5.00)
--    Old: numeric(2,1) with half-step constraint
--    New: numeric(3,2) with 1–5 range only
-- ============================================================================

-- Drop old score CHECK constraints
alter table public.rekap_competencies
  drop constraint if exists rekap_competencies_score_check;

-- Widen score column: numeric(2,1) -> numeric(3,2) to allow e.g. 4.25
alter table public.rekap_competencies
  alter column score type numeric(3, 2);

alter table public.rekap_competencies
  alter column initial_score type numeric(3, 2);

-- Re-add simpler range constraint (no half-step restriction)
alter table public.rekap_competencies
  add constraint rekap_competencies_score_check
  check (score >= 1 and score <= 5);

alter table public.rekap_competencies
  add constraint rekap_competencies_initial_score_check
  check (initial_score >= 1 and initial_score <= 5);

-- ============================================================================
-- 4. Drop the `rating` column (auto-calculated in frontend now)
-- ============================================================================

alter table public.rekap_competencies
  drop column if exists rating;

-- ============================================================================
-- 5. Recreate save_rekap() without the rating column
-- ============================================================================

create or replace function public.save_rekap(
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

  -- Remove competencies not in the new list
  delete from public.rekap_competencies c
  where c.profile_id = p_profile_id
    and c.period = p_period
    and c.competency not in (
      select item ->> 'competency' from jsonb_array_elements(p_competencies) item
    );

  -- Upsert competencies: initial_score is set only on first insert
  insert into public.rekap_competencies (
    profile_id, period, competency, score, initial_score
  )
  select
    p_profile_id, p_period,
    item ->> 'competency',
    (item ->> 'score')::numeric,
    (item ->> 'score')::numeric
  from jsonb_array_elements(p_competencies) item
  on conflict (profile_id, period, competency) do update set
    score = excluded.score;
end;
$$;

commit;
