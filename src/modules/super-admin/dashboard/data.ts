import "server-only";

import { createClient } from "@/lib/supabase/server";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { dummySuperAdminSummary } from "@/modules/admin/dummy/data";

export type SuperAdminSummary = {
  /** Pengurus accounts in the super admin's division. */
  totalAccounts: number | null;
  activeAccounts: number | null;
  /** Rekap filled in this period; null until rekap is recorded. */
  rekapFilled: number | null;
  /** A pengurus whose rekap still needs filling, for the quick action. */
  pendingRekap: { id: string; name: string } | null;
  divisionCount: number | null;
  /** Latest sign-in among the division's pengurus. */
  lastSignInAt: string | null;
};

export async function getSuperAdminSummary(): Promise<SuperAdminSummary> {
  if (DUMMY_DATA) return dummySuperAdminSummary;

  const supabase = await createClient();
  const [{ data: rows }, { count: divisionCount }] = await Promise.all([
    supabase.rpc("super_admin_summary"),
    supabase.from("divisions").select("id", { count: "exact", head: true }),
  ]);

  const row = (
    rows as
      | {
          total_accounts: number;
          active_accounts: number;
          last_sign_in_at: string | null;
        }[]
      | null
  )?.[0];

  /* Rekap isn't recorded yet. Fill these in once its table exists. */
  return {
    totalAccounts: row?.total_accounts ?? null,
    activeAccounts: row?.active_accounts ?? null,
    rekapFilled: null,
    pendingRekap: null,
    divisionCount: divisionCount ?? null,
    lastSignInAt: row?.last_sign_in_at ?? null,
  };
}
