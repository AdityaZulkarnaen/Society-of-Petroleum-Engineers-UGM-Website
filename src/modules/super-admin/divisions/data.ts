import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { dummyAccounts } from "@/modules/admin/dummy/data";
import {
  dummyDivisions,
  dummyManagedProker,
} from "@/modules/admin/dummy/proker";

import { DIVISIONS_TAG } from "../cache";

export type DivisionOverview = {
  id: string;
  name: string;
  /** The active pengurus with jabatan Head, if any. */
  headName: string | null;
  /** Active pengurus. */
  memberCount: number;
  /** Proker under way. */
  activeProker: number;
};

/* Sample heads and sizes for the divisions that have no dummy accounts. */
const DUMMY_OTHERS: Record<string, { headName: string; memberCount: number }> =
  {
    "Competency Development": {
      headName: "Nadia Putri Kusuma",
      memberCount: 12,
    },
    "Research & Education": { headName: "Laras Wulandari", memberCount: 11 },
    "Human Resource Development": {
      headName: "Intan Permatasari",
      memberCount: 10,
    },
    "External Affairs": { headName: "Rayi Kandhakiswara", memberCount: 12 },
    Finance: { headName: "Dimas Anggara", memberCount: 13 },
    Executive: { headName: "Putri Ayuningtyas", memberCount: 6 },
  };

function dummyOverview(): DivisionOverview[] {
  const accounts = dummyAccounts.list().filter((a) => a.isActive);
  const proker = dummyManagedProker.list();

  return dummyDivisions
    .map((d) => {
      const own = accounts.filter((a) => a.division === d.name);
      return {
        id: d.id,
        name: d.name,
        headName:
          own.find((a) => a.position === "Head")?.fullName ??
          DUMMY_OTHERS[d.name]?.headName ??
          null,
        memberCount: own.length || (DUMMY_OTHERS[d.name]?.memberCount ?? 0),
        activeProker: proker.filter(
          (p) => p.divisionId === d.id && p.status === "berlangsung",
        ).length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/**
 * `division_overview` is a security definer aggregate over every division, so
 * it returns the same rows for every super admin and may be cached between
 * requests under DIVISIONS_TAG, which the account and proker actions
 * invalidate. Nothing division-scoped is ever cached this way.
 *
 * The cached body runs outside the request, where cookies are off limits, so
 * it uses the secret-key client rather than the caller's. Only the caller
 * reaching this page — a super admin — decides whether it runs at all, and an
 * empty or failed read is not cached.
 */
class NoDivisions extends Error {}

const divisionOverviewRows = unstable_cache(
  async () => {
    const { data, error } = await createAdminClient().rpc("division_overview");
    if (error) throw new Error(error.message);
    /* thrown rather than returned so it is not cached: divisions seeded
       afterwards must show up without waiting for revalidation */
    if (!data?.length) throw new NoDivisions();
    return data;
  },
  ["division-overview"],
  { tags: [DIVISIONS_TAG], revalidate: 300 },
);

export const getDivisionOverview = cache(
  async (): Promise<DivisionOverview[]> => {
    if (DUMMY_DATA) return dummyOverview();

    await requireSuperAdmin();
    const data = await divisionOverviewRows().catch((error: unknown) => {
      if (error instanceof NoDivisions) return [];
      throw error;
    });
    return (
      (data as
        | {
            id: string;
            name: string;
            head_name: string | null;
            member_count: number;
            active_proker: number;
          }[]
        | null) ?? []
    ).map((d) => ({
      id: d.id,
      name: d.name,
      headName: d.head_name,
      memberCount: d.member_count,
      activeProker: d.active_proker,
    }));
  },
);
