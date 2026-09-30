/* Migration: Update evaluasi kompetensi to 12 new competency aspects */

begin;

/* ============================================================================
   1. Drop the old CHECK on competency
   ============================================================================ */

alter table public.rekap_competencies
  drop constraint if exists rekap_competencies_competency_check;

/* ============================================================================
   2. Migrate existing competency data to new names
   ============================================================================ */

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

/* ============================================================================
   3. Add the new CHECK constraint (12 values in exact HRD form order)
   ============================================================================ */

alter table public.rekap_competencies
  add constraint rekap_competencies_competency_check
  check (competency in (
    'Grit / Perseverance',
    'Empower Others',
    'Teamwork',
    'Caring',
    'Accountability',
    'Integrity',
    'Agility',
    'Innovation',
    'Communication',
    'Self Awareness',
    'Strive for Excellence',
    'Self Purpose'
  ));

/* Add sort_order column to guarantee exact HRD form order in queries */
alter table public.rekap_competencies
  add column if not exists sort_order integer not null default 1;

update public.rekap_competencies set sort_order = case competency
  when 'Grit / Perseverance'    then 1
  when 'Empower Others'         then 2
  when 'Teamwork'               then 3
  when 'Caring'                 then 4
  when 'Accountability'         then 5
  when 'Integrity'              then 6
  when 'Agility'                then 7
  when 'Innovation'             then 8
  when 'Communication'          then 9
  when 'Self Awareness'         then 10
  when 'Strive for Excellence'  then 11
  when 'Self Purpose'           then 12
  else 1
end;

/* ============================================================================
   4. Change score columns to allow free decimals (1.00–5.00)
   ============================================================================ */

/* Drop old score CHECK constraints */
alter table public.rekap_competencies
  drop constraint if exists rekap_competencies_score_check;

/* Widen score column: numeric(2,1) -> numeric(3,2) to allow e.g. 4.25 */
alter table public.rekap_competencies
  alter column score type numeric(3, 2);

alter table public.rekap_competencies
  alter column initial_score type numeric(3, 2);

/* Re-add simpler range constraint (no half-step restriction) */
alter table public.rekap_competencies
  add constraint rekap_competencies_score_check
  check (score >= 1 and score <= 5);

alter table public.rekap_competencies
  add constraint rekap_competencies_initial_score_check
  check (initial_score >= 1 and initial_score <= 5);

/* ============================================================================
   5. Drop the rating column
   ============================================================================ */

alter table public.rekap_competencies
  drop column if exists rating;

/* ============================================================================
   6. Recreate save_rekap() without rating and with sort_order
   ============================================================================ */

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

  /* Remove competencies not in the new list */
  delete from public.rekap_competencies c
  where c.profile_id = p_profile_id
    and c.period = p_period
    and c.competency not in (
      select item ->> 'competency' from jsonb_array_elements(p_competencies) item
    );

  /* Upsert competencies: initial_score is set only on first insert */
  insert into public.rekap_competencies (
    profile_id, period, competency, score, initial_score, sort_order
  )
  select
    p_profile_id, p_period,
    item ->> 'competency',
    (item ->> 'score')::numeric,
    (item ->> 'score')::numeric,
    case item ->> 'competency'
      when 'Grit / Perseverance'    then 1
      when 'Empower Others'         then 2
      when 'Teamwork'               then 3
      when 'Caring'                 then 4
      when 'Accountability'         then 5
      when 'Integrity'              then 6
      when 'Agility'                then 7
      when 'Innovation'             then 8
      when 'Communication'          then 9
      when 'Self Awareness'         then 10
      when 'Strive for Excellence'  then 11
      when 'Self Purpose'           then 12
      else 1
    end
  from jsonb_array_elements(p_competencies) item
  on conflict (profile_id, period, competency) do update set
    score = excluded.score,
    sort_order = excluded.sort_order;
end;
$$;

commit;