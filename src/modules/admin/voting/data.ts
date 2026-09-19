import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Candidate = {
  id: string;
  number: number;
  fullName: string;
  nim: string | null;
  photoUrl: string | null;
  vision: string;
  programs: string[];
  achievements: string[];
  grandDesignUrl: string | null;
};

export type VotingPhase = "upcoming" | "open" | "closed";

export type Election = {
  id: string;
  title: string;
  termLabel: string;
  /** YYYY-MM-DD, Asia/Jakarta. */
  opensOn: string;
  /** YYYY-MM-DD, Asia/Jakarta, inclusive. */
  closesOn: string;
  phase: VotingPhase;
  /** Whole days left after today; 0 on the last day. Null unless open. */
  daysLeft: number | null;
  candidates: Candidate[];
  /** The signed-in admin's vote, if cast. */
  myVote: { candidateId: string; castAt: string } | null;
  turnout: { votes: number; eligible: number } | null;
};

const DAY = 24 * 60 * 60 * 1000;

/** Today's date in Jakarta, as YYYY-MM-DD. */
function jakartaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / DAY);

/** The election that opens latest, with the admin's own vote, or null. */
export async function getElection(): Promise<Election | null> {
  const supabase = await createClient();

  const { data: election } = await supabase
    .from("elections")
    .select("id, title, term_label, opens_on, closes_on")
    .order("opens_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!election) return null;

  const [{ data: candidates }, { data: vote }, { data: turnout }] =
    await Promise.all([
      supabase
        .from("election_candidates")
        .select(
          "id, number, full_name, nim, photo_url, vision, programs, achievements, grand_design_url",
        )
        .eq("election_id", election.id)
        .order("number"),
      /* RLS limits this to the admin's own row */
      supabase
        .from("election_votes")
        .select("candidate_id, created_at")
        .eq("election_id", election.id)
        .maybeSingle(),
      supabase.rpc("election_turnout", { p_election_id: election.id }),
    ]);

  const today = jakartaToday();
  const phase: VotingPhase =
    today < election.opens_on
      ? "upcoming"
      : today > election.closes_on
        ? "closed"
        : "open";

  const counts = (turnout as { votes: number; eligible: number }[] | null)?.[0];

  return {
    id: election.id,
    title: election.title,
    termLabel: election.term_label,
    opensOn: election.opens_on,
    closesOn: election.closes_on,
    phase,
    daysLeft: phase === "open" ? daysBetween(today, election.closes_on) : null,
    candidates: (candidates ?? []).map((c) => ({
      id: c.id,
      number: c.number,
      fullName: c.full_name,
      nim: c.nim,
      photoUrl: c.photo_url,
      vision: c.vision,
      programs: c.programs ?? [],
      achievements: c.achievements ?? [],
      grandDesignUrl: c.grand_design_url,
    })),
    myVote: vote
      ? { candidateId: vote.candidate_id, castAt: vote.created_at }
      : null,
    turnout: counts ?? null,
  };
}
