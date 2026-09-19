-- Chair elections (Voting Ketua).
--
-- Every dashboard account is an active member and gets one vote per election.
-- Votes are cast only through cast_vote(), which checks the voting window;
-- there are no insert/update/delete policies, so a vote can't be changed or
-- withdrawn once recorded. Elections and candidates are managed by the
-- developers (Supabase dashboard or SQL) for now.

create table public.elections (
  id uuid primary key default gen_random_uuid(),
  title text not null,                 -- 'Pemilihan President SPE UGM SC 2027'
  term_label text not null,            -- the term being elected, '2026/2027'
  opens_on date not null,              -- first voting day, Asia/Jakarta
  closes_on date not null,             -- last voting day, inclusive
  created_at timestamptz not null default now(),
  check (closes_on >= opens_on)
);

comment on table public.elections is
  'Chair elections. The dashboard shows the one that opens latest.';

create table public.election_candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  number smallint not null check (number > 0),   -- ballot number
  full_name text not null,
  nim text,
  photo_url text,                      -- portrait, roughly 200 x 276
  vision text not null default '',
  programs text[] not null default '{}',         -- program unggulan
  achievements text[] not null default '{}',     -- pencapaian
  grand_design_url text,
  created_at timestamptz not null default now(),
  unique (election_id, number)
);

create table public.election_votes (
  election_id uuid not null references public.elections (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  candidate_id uuid not null references public.election_candidates (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (election_id, voter_id)            -- one vote per member
);

create index election_votes_candidate_id_idx on public.election_votes (candidate_id);

-- Row Level Security --------------------------------------------------------

alter table public.elections enable row level security;
alter table public.election_candidates enable row level security;
alter table public.election_votes enable row level security;

create policy "Admins can read elections"
  on public.elections
  for select
  to authenticated
  using (true);

create policy "Admins can read candidates"
  on public.election_candidates
  for select
  to authenticated
  using (true);

-- Ballots stay secret: each member sees only their own.
create policy "Admins can read their own vote"
  on public.election_votes
  for select
  to authenticated
  using (voter_id = (select auth.uid()));

-- Voting --------------------------------------------------------------------

create function public.cast_vote(p_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_election public.elections;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if not exists (select 1 from public.profiles where id = (select auth.uid())) then
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

revoke execute on function public.cast_vote(uuid) from public, anon;
grant execute on function public.cast_vote(uuid) to authenticated;

-- Turnout for the participation card, without exposing who voted for whom.
create function public.election_turnout(p_election_id uuid)
returns table (votes integer, eligible integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::integer from public.election_votes where election_id = p_election_id),
    (select count(*)::integer from public.profiles);
$$;

revoke execute on function public.election_turnout(uuid) from public, anon;
grant execute on function public.election_turnout(uuid) to authenticated;
