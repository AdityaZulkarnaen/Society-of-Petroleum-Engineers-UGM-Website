import "server-only";

import { createClient } from "@/lib/supabase/server";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { getElection, type Election } from "@/modules/admin/voting/data";

export type VotingAdmin = {
  election: Election | null;
  /** Candidates can only be added or removed before voting opens. */
  started: boolean;
  /** Live votes per candidate id; super admins only. */
  results: Record<string, number>;
};

/* Sample shares of the dummy turnout, by ballot number. */
const DUMMY_SHARES = [0.49, 0.36, 0.15];

export async function getVotingAdmin(): Promise<VotingAdmin> {
  const election = await getElection();
  if (!election) return { election: null, started: false, results: {} };

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
  const started = today >= election.opensOn || (election.turnout?.votes ?? 0) > 0;

  if (DUMMY_DATA) {
    const votes = election.turnout?.votes ?? 0;
    const shares = election.candidates.map((_, i) =>
      Math.round(votes * (DUMMY_SHARES[i] ?? 0)),
    );
    /* whatever rounding leaves over goes to the first candidate */
    if (shares.length) shares[0] += votes - shares.reduce((a, b) => a + b, 0);
    return {
      election,
      started,
      results: Object.fromEntries(election.candidates.map((c, i) => [c.id, shares[i]])),
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("election_results", {
    p_election_id: election.id,
  });
  const rows = (data as { candidate_id: string; votes: number }[] | null) ?? [];
  return {
    election,
    started,
    results: Object.fromEntries(rows.map((r) => [r.candidate_id, r.votes])),
  };
}
