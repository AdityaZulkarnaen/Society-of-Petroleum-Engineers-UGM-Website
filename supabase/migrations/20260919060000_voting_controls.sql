-- Manajemen Voting: an open/closed switch, deleting an election, and live
-- results for super admins.

-- The 'Status Voting' switch. Voting is open only while this is on and today
-- is within opens_on..closes_on; switching it off closes voting at once.
alter table public.elections
  add column is_open boolean not null default true;

create or replace function public.cast_vote(p_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_election public.elections;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if not exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and is_active
  ) then
    raise exception 'not_eligible';
  end if;

  select e.* into v_election
  from public.election_candidates c
  join public.elections e on e.id = c.election_id
  where c.id = p_candidate_id;

  if not found then
    raise exception 'candidate_not_found';
  end if;

  if not v_election.is_open
     or v_today not between v_election.opens_on and v_election.closes_on then
    raise exception 'voting_closed';
  end if;

  insert into public.election_votes (election_id, voter_id, candidate_id)
  values (v_election.id, (select auth.uid()), p_candidate_id);
exception
  when unique_violation then
    raise exception 'already_voted';
end;
$$;

create function public.set_election_open(p_id uuid, p_open boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'not_allowed';
  end if;
  update public.elections set is_open = p_open where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

revoke execute on function public.set_election_open(uuid, boolean) from public, anon;
grant execute on function public.set_election_open(uuid, boolean) to authenticated;

-- Deletes an election with its candidates and every vote cast in it.
create function public.delete_election(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'not_allowed';
  end if;
  delete from public.elections where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

revoke execute on function public.delete_election(uuid) from public, anon;
grant execute on function public.delete_election(uuid) to authenticated;

-- Live results for super admins ('Hasil Voting Live'); pengurus still only
-- see overall turnout.
create or replace function public.election_results(p_election_id uuid)
returns table (candidate_id uuid, votes integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, count(v.voter_id)::integer
  from public.election_candidates c
  left join public.election_votes v on v.candidate_id = c.id
  where c.election_id = p_election_id
    and (select public.is_super_admin())
  group by c.id;
$$;
