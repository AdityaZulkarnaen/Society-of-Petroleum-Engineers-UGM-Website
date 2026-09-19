-- Managing the chair election from the super admin dashboard (Voting).
--
-- Any super admin can set up the election and its candidates. Candidates can
-- be added or removed only before voting opens, so no ballot ever points at a
-- candidate who disappears; their details can still be corrected later.
-- Per-candidate results are only released once voting has closed.

alter table public.election_candidates
  add column position text check (char_length(position) <= 80);  -- jabatan saat ini

comment on column public.election_candidates.position is
  'The candidate''s current role, e.g. ''Kepala Bidang Teknik''.';

-- Elections ------------------------------------------------------------------

-- Creates (p_id null) or updates an election. Returns its id.
create function public.save_election(
  p_id uuid,
  p_title text,
  p_term_label text,
  p_opens_on date,
  p_closes_on date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_id;
begin
  if not public.is_super_admin() then
    raise exception 'not_allowed';
  end if;

  if v_id is null then
    insert into public.elections (title, term_label, opens_on, closes_on)
    values (p_title, p_term_label, p_opens_on, p_closes_on)
    returning id into v_id;
  else
    update public.elections
    set title = p_title,
        term_label = p_term_label,
        opens_on = p_opens_on,
        closes_on = p_closes_on
    where id = v_id;
    if not found then
      raise exception 'not_found';
    end if;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.save_election(uuid, text, text, date, date) from public, anon;
grant execute on function public.save_election(uuid, text, text, date, date) to authenticated;

-- Candidates -----------------------------------------------------------------

create function public.voting_started(p_election_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone 'Asia/Jakarta')::date >= e.opens_on
      or exists (select 1 from public.election_votes v where v.election_id = e.id)
  from public.elections e
  where e.id = p_election_id;
$$;

revoke execute on function public.voting_started(uuid) from public, anon;
grant execute on function public.voting_started(uuid) to authenticated;

-- Creates (p_id null, ballot number = next free) or updates a candidate.
create function public.save_candidate(
  p_id uuid,
  p_election_id uuid,
  p_full_name text,
  p_nim text,
  p_position text,
  p_photo_url text,
  p_vision text,
  p_programs text[],
  p_achievements text[],
  p_grand_design_url text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_id;
begin
  if not public.is_super_admin() then
    raise exception 'not_allowed';
  end if;

  if v_id is null then
    if public.voting_started(p_election_id) then
      raise exception 'voting_started';
    end if;

    insert into public.election_candidates (
      election_id, number, full_name, nim, position, photo_url, vision,
      programs, achievements, grand_design_url
    )
    values (
      p_election_id,
      coalesce((
        select max(number) + 1
        from public.election_candidates
        where election_id = p_election_id
      ), 1),
      p_full_name, p_nim, p_position, p_photo_url, coalesce(p_vision, ''),
      coalesce(p_programs, '{}'), coalesce(p_achievements, '{}'), p_grand_design_url
    )
    returning id into v_id;
  else
    update public.election_candidates
    set full_name = p_full_name,
        nim = p_nim,
        position = p_position,
        photo_url = p_photo_url,
        vision = coalesce(p_vision, ''),
        programs = coalesce(p_programs, '{}'),
        achievements = coalesce(p_achievements, '{}'),
        grand_design_url = p_grand_design_url
    where id = v_id
      and election_id = p_election_id;
    if not found then
      raise exception 'not_found';
    end if;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.save_candidate(uuid, uuid, text, text, text, text, text, text[], text[], text) from public, anon;
grant execute on function public.save_candidate(uuid, uuid, text, text, text, text, text, text[], text[], text) to authenticated;

-- Removes a candidate before voting opens and closes the gap in the ballot
-- numbers.
create function public.delete_candidate(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.election_candidates;
begin
  if not public.is_super_admin() then
    raise exception 'not_allowed';
  end if;

  select * into v_candidate from public.election_candidates where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
  if public.voting_started(v_candidate.election_id) then
    raise exception 'voting_started';
  end if;

  delete from public.election_candidates where id = p_id;

  -- shift in two steps, through numbers no ballot uses, so the
  -- (election_id, number) unique key never clashes and number stays > 0
  update public.election_candidates
  set number = number + 10000
  where election_id = v_candidate.election_id
    and number > v_candidate.number;
  update public.election_candidates
  set number = number - 10001
  where election_id = v_candidate.election_id
    and number > 10000;
end;
$$;

revoke execute on function public.delete_candidate(uuid) from public, anon;
grant execute on function public.delete_candidate(uuid) to authenticated;

-- Results --------------------------------------------------------------------

-- Votes per candidate, for super admins, once the election has closed.
create function public.election_results(p_election_id uuid)
returns table (candidate_id uuid, votes integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, count(v.voter_id)::integer
  from public.election_candidates c
  join public.elections e on e.id = c.election_id
  left join public.election_votes v on v.candidate_id = c.id
  where c.election_id = p_election_id
    and (select public.is_super_admin())
    and (now() at time zone 'Asia/Jakarta')::date > e.closes_on
  group by c.id;
$$;

revoke execute on function public.election_results(uuid) from public, anon;
grant execute on function public.election_results(uuid) to authenticated;
