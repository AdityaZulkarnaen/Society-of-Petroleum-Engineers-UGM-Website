import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import {
  dummyAccounts,
  dummySuperAdminSummary,
} from "@/modules/admin/dummy/data";

import { getAccounts } from "../accounts/data";
import { getRekapProfileIds } from "../rekap/data";

export type SuperAdminSummary = {
  /** Pengurus accounts in the super admin's division. */
  totalAccounts: number | null;
  activeAccounts: number | null;
  /** Active pengurus with a rekap this period. */
  rekapFilled: number | null;
  /** A pengurus whose rekap still needs filling, for the quick action. */
  pendingRekap: { id: string; name: string } | null;
  divisionCount: number | null;
  /** Latest sign-in among the division's pengurus. */
  lastSignInAt: string | null;
};

/** Rekap counts over the division's active pengurus, and the first one
    (by name) still without a rekap this period. */
async function rekapProgress() {
  const [accounts, filled] = await Promise.all([
    getAccounts(),
    getRekapProfileIds(),
  ]);
  const active = accounts
    .filter((a) => a.isActive)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "id"));
  const pending = active.find((a) => !filled.has(a.id));
  return {
    rekapFilled: active.filter((a) => filled.has(a.id)).length,
    pendingRekap: pending ? { id: pending.id, name: pending.fullName } : null,
  };
}

export const getSuperAdminSummary = cache(
  async (): Promise<SuperAdminSummary> => {
    if (DUMMY_DATA) {
      const accounts = dummyAccounts.list();
      return {
        ...dummySuperAdminSummary,
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter((a) => a.isActive).length,
        ...(await rekapProgress()),
      };
    }

    const supabase = await createClient();
    const [{ data: rows }, { count: divisionCount }, rekap] = await Promise.all(
      [
        supabase.rpc("super_admin_summary"),
        supabase.from("divisions").select("id", { count: "exact", head: true }),
        rekapProgress(),
      ],
    );

    const row = (
      rows as
        | {
            total_accounts: number;
            active_accounts: number;
            last_sign_in_at: string | null;
          }[]
        | null
    )?.[0];

    return {
      totalAccounts: row?.total_accounts ?? null,
      activeAccounts: row?.active_accounts ?? null,
      ...rekap,
      divisionCount: divisionCount ?? null,
      lastSignInAt: row?.last_sign_in_at ?? null,
    };
  },
);
