-- Super admin dashboard.
--
-- Super admins are the division accounts (spemedcre, spehrd, ...). They get
-- their own dashboard at /super-admin and create the pengurus (role 'admin')
-- accounts of their division. Only pengurus take part in the chair election.

-- Deactivated accounts keep their history but can no longer sign in.
alter table public.profiles
  add column is_active boolean not null default true;

-- Counts for the super admin's own division, plus the latest pengurus sign-in
-- (auth.users isn't readable from the client, hence security definer).
create function public.super_admin_summary()
returns table (
  total_accounts integer,
  active_accounts integer,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*)::integer,
    count(*) filter (where p.is_active)::integer,
    max(u.last_sign_in_at)
  from public.profiles p
  join auth.users u on u.id = p.id
  where (select public.is_super_admin())
    and p.role = 'admin'
    and p.division_id = (select public.current_division_id());
$$;

revoke execute on function public.super_admin_summary() from public, anon;
grant execute on function public.super_admin_summary() to authenticated;

-- Voting: only active pengurus vote, and only they count towards turnout.

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

  if v_today not between v_election.opens_on and v_election.closes_on then
    raise exception 'voting_closed';
  end if;

  insert into public.election_votes (election_id, voter_id, candidate_id)
  values (v_election.id, (select auth.uid()), p_candidate_id);
exception
  when unique_violation then
    raise exception 'already_voted';
end;
$$;

create or replace function public.election_turnout(p_election_id uuid)
returns table (votes integer, eligible integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::integer from public.election_votes where election_id = p_election_id),
    (select count(*)::integer from public.profiles where role = 'admin' and is_active);
$$;
