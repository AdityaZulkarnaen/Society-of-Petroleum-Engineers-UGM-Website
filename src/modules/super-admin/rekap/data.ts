import "server-only";

import { createClient } from "@/lib/supabase/server";
import { CURRENT_PERIOD } from "@/modules/admin/constants";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { dummyRekap } from "@/modules/admin/dummy/data";
import type { SelfReport } from "@/modules/admin/rekap-diri/data";
import { loadRekap } from "@/modules/admin/rekap-diri/load";

/** Pengurus of the super admin's division with a rekap this period. */
export async function getRekapProfileIds(): Promise<Set<string>> {
  if (DUMMY_DATA) return new Set(dummyRekap.ids());

  /* RLS limits this to the super admin's division */
  const supabase = await createClient();
  const { data } = await supabase
    .from("rekap")
    .select("profile_id")
    .eq("period", CURRENT_PERIOD.label);
  return new Set((data ?? []).map((row) => row.profile_id));
}

/** A pengurus' rekap for the current period, or null if none is saved. */
export async function getRekap(profileId: string): Promise<SelfReport | null> {
  if (DUMMY_DATA) return dummyRekap.get(profileId);
  return loadRekap(profileId, CURRENT_PERIOD.label);
}
