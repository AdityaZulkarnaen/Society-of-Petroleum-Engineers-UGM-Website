import "server-only";

import { createClient } from "@/lib/supabase/server";

import { DUMMY_DATA } from "../dummy";
import { dummyDivisionSummary } from "../dummy/data";

export type DivisionSummary = {
  memberCount: number;
  headName: string | null;
  /** Null until work programs are recorded. */
  activeProker: number | null;
};

/** Member count and head of the signed-in admin's division. */
export async function getDivisionSummary(): Promise<DivisionSummary | null> {
  if (DUMMY_DATA) return dummyDivisionSummary;

  const supabase = await createClient();
  const { data } = await supabase.rpc("my_division_summary");
  const row = (
    data as { member_count: number; head_name: string | null }[] | null
  )?.[0];
  if (!row) return null;

  return { memberCount: row.member_count, headName: row.head_name, activeProker: null };
}
