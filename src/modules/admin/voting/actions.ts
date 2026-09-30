"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { requireAdmin } from "../auth/session";
import { DUMMY_DATA } from "../dummy";
import { dummyVote, dummyVoting } from "../dummy/data";

export type VoteResult = { error?: string };

/* Raised by public.cast_vote(). */
const MESSAGES: Record<string, string> = {
  voting_closed: "The voting period is currently not open.",
  candidate_not_found: "Candidate not found. Please refresh this page.",
  not_eligible: "Your account is not registered as an eligible voter.",
};

export async function castVote(candidateId: string): Promise<VoteResult> {
  await requireAdmin();

  if (DUMMY_DATA) {
    if (!dummyVoting.get().candidates.some((c) => c.id === candidateId)) {
      return { error: MESSAGES.candidate_not_found };
    }
    if (!dummyVote.get()) {
      dummyVote.set({ candidateId, castAt: new Date().toISOString() });
    }
    revalidatePath("/admin/voting");
    return {};
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("cast_vote", {
    p_candidate_id: candidateId,
  });

  /* Already voted, e.g. from another tab: the refreshed page shows that vote. */
  if (error && error.message !== "already_voted") {
    return {
      error: MESSAGES[error.message] ?? "Failed to cast vote. Please try again.",
    };
  }

  revalidatePath("/admin/voting");
  return {};
}
