import "server-only";

import { createClient } from "@/lib/supabase/server";

import { requireAdmin } from "../auth/session";
import { DUMMY_DATA } from "../dummy";
import { dummyProker } from "../dummy/data";
import type { ProkerStatus } from "./status";

export type Proker = {
  id: string;
  name: string;
  division: string;
  /** The admin's own role in this work program. */
  role: string;
  status: ProkerStatus;
};

type Row = {
  role: string;
  proker: {
    id: string;
    name: string;
    status: ProkerStatus;
    starts_on: string | null;
    division: { name: string } | { name: string }[] | null;
  } | null;
};

const one = <T,>(value: T | T[] | null) =>
  Array.isArray(value) ? (value[0] ?? null) : value;

/** Proker the signed-in pengurus takes part in, most recent first. */
export async function getMyProker(): Promise<Proker[]> {
  if (DUMMY_DATA) return dummyProker;

  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("proker_members")
    .select("role, proker:proker(id, name, status, starts_on, division:divisions(name))")
    .eq("profile_id", admin.id);

  return ((data ?? []) as unknown as Row[])
    .flatMap(({ role, proker }) => (proker ? [{ role, proker }] : []))
    .sort((a, b) => (b.proker.starts_on ?? "").localeCompare(a.proker.starts_on ?? ""))
    .map(({ role, proker }) => ({
      id: proker.id,
      name: proker.name,
      division: one(proker.division)?.name ?? "—",
      role,
      status: proker.status,
    }));
}
