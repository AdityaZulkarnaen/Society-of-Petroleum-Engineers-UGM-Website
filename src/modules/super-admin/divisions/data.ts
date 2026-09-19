import "server-only";

import { createClient } from "@/lib/supabase/server";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { dummyAccounts } from "@/modules/admin/dummy/data";
import { dummyDivisions, dummyManagedProker } from "@/modules/admin/dummy/proker";

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
const DUMMY_OTHERS: Record<string, { headName: string; memberCount: number }> = {
  "Competency Development": { headName: "Nadia Putri Kusuma", memberCount: 12 },
  "Research & Education": { headName: "Laras Wulandari", memberCount: 11 },
  "Human Resource Development": { headName: "Intan Permatasari", memberCount: 10 },
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

export async function getDivisionOverview(): Promise<DivisionOverview[]> {
  if (DUMMY_DATA) return dummyOverview();

  const supabase = await createClient();
  const { data } = await supabase.rpc("division_overview");
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
}
