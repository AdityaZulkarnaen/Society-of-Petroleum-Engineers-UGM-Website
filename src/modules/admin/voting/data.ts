import "server-only";

import { createClient } from "@/lib/supabase/server";

import { DUMMY_DATA } from "../dummy";
import { dummyVote, dummyVoting } from "../dummy/data";

export type Candidate = {
  id: string;
  number: number;
  fullName: string;
  nim: string | null;
  /** Current role, e.g. 'Kepala Bidang Teknik'. */
  position: string | null;
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
  /** The super admin's Status Voting switch. */
  isOpen: boolean;
  /** Open only while the switch is on and today is within the dates. */
  phase: VotingPhase;
  /** Milliseconds until voting closes (midnight WIB after closesOn). Null unless open. */
  msLeft: number | null;
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

/** Where today falls in the voting window; a switched-off election that
    would be open counts as closed. */
function schedule(opensOn: string, closesOn: string, isOpen: boolean) {
  const today = jakartaToday();
  const inWindow: VotingPhase =
    today < opensOn ? "upcoming" : today > closesOn ? "closed" : "open";
  const phase: VotingPhase = inWindow === "open" && !isOpen ? "closed" : inWindow;
  return {
    phase,
    msLeft:
      phase === "open"
        ? Math.max(0, Date.parse(`${closesOn}T00:00:00+07:00`) + DAY - Date.now())
        : null,
  };
}

function getDummyElection(): Election | null {
  const { election: stored, candidates } = dummyVoting.get();
  if (!stored) return null;
  const { turnout, ...election } = stored;
  const myVote = dummyVote.get();
  return {
    ...election,
    ...schedule(election.opensOn, election.closesOn, election.isOpen),
    candidates: [...candidates].sort((a, b) => a.number - b.number),
    myVote,
    turnout: { ...turnout, votes: turnout.votes + (myVote ? 1 : 0) },
  };
}

/** The election that opens latest, with the admin's own vote, or null. */
export async function getElection(): Promise<Election | null> {
  if (DUMMY_DATA) return getDummyElection();

  const supabase = await createClient();

  const { data: election } = await supabase
    .from("elections")
    .select("id, title, term_label, opens_on, closes_on, is_open")
    .order("opens_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!election) return null;

  const [{ data: candidates }, { data: vote }, { data: turnout }] =
    await Promise.all([
      supabase
        .from("election_candidates")
        .select(
          "id, number, full_name, nim, position, photo_url, vision, programs, achievements, grand_design_url",
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

  const counts = (turnout as { votes: number; eligible: number }[] | null)?.[0];

  return {
    id: election.id,
    title: election.title,
    termLabel: election.term_label,
    opensOn: election.opens_on,
    closesOn: election.closes_on,
    isOpen: election.is_open,
    ...schedule(election.opens_on, election.closes_on, election.is_open),
    candidates: (candidates ?? []).map((c) => ({
      id: c.id,
      number: c.number,
      fullName: c.full_name,
      nim: c.nim,
      position: c.position,
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
