import "server-only";

import { createClient } from "@/lib/supabase/server";

import { getAdmin } from "../auth/session";
import { DUMMY_DATA } from "../dummy";
import { dummyDivisionSummary } from "../dummy/data";

export type DivisionSummary = {
  memberCount: number;
  headName: string | null;
  /** The division's proker that are under way. */
  activeProker: number | null;
};

/** Member count and head of the signed-in admin's division. */
export async function getDivisionSummary(): Promise<DivisionSummary | null> {
  if (DUMMY_DATA) return dummyDivisionSummary;

  const [admin, supabase] = await Promise.all([getAdmin(), createClient()]);
  if (!admin?.division) return null;

  const [{ data }, { count: activeProker }] = await Promise.all([
    supabase.rpc("my_division_summary"),
    supabase
      .from("proker")
      .select("id", { count: "exact", head: true })
      .eq("division_id", admin.division.id)
      .eq("status", "berlangsung"),
  ]);
  const row = (
    data as { member_count: number; head_name: string | null }[] | null
  )?.[0];
  if (!row) return null;

  return {
    memberCount: row.member_count,
    headName: row.head_name,
    activeProker: activeProker ?? null,
  };
}
