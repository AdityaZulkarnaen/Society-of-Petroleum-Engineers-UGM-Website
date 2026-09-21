import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ProkerStatus } from "@/modules/admin/acara/status";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import {
  dummyDivisions,
  dummyManagedProker,
  dummyPengurusOptions,
} from "@/modules/admin/dummy/proker";

import type { Division, ManagedProker, PengurusOption } from "./fields";

type Row = {
  id: string;
  name: string;
  description: string | null;
  division_id: string;
  starts_on: string | null;
  ends_on: string | null;
  status: ProkerStatus;
  division: { name: string } | { name: string }[] | null;
  members: {
    profile_id: string;
    role: string;
    position: number;
    profile: { full_name: string } | { full_name: string }[] | null;
  }[];
};

const one = <T>(value: T | T[] | null) =>
  Array.isArray(value) ? (value[0] ?? null) : value;

/** Every proker, newest start date first. */
export const getAllProker = cache(async (): Promise<ManagedProker[]> => {
  if (DUMMY_DATA) {
    return [...dummyManagedProker.list()].sort((a, b) =>
      (b.startsOn ?? "").localeCompare(a.startsOn ?? ""),
    );
  }

  /* Super admins read every member row, but only their own division's
     profiles; list_pengurus() fills in the other names. */
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("proker")
      .select(
        "id, name, description, division_id, starts_on, ends_on, status, division:divisions(name), members:proker_members(profile_id, role, position, profile:profiles(full_name))",
      )
      .order("starts_on", { ascending: false, nullsFirst: true }),
    getPengurusOptions(),
  ]);
  const nameById = new Map(names.map((p) => [p.id, p.fullName]));

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    divisionId: row.division_id,
    division: one(row.division)?.name ?? "—",
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    status: row.status,
    members: [...row.members]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        profileId: m.profile_id,
        name:
          one(m.profile)?.full_name ?? nameById.get(m.profile_id) ?? "Pengurus",
        role: m.role,
      })),
  }));
});

/** Active pengurus of every division, for the Pengurus Terlibat picker. */
export async function getPengurusOptions(): Promise<PengurusOption[]> {
  if (DUMMY_DATA) return dummyPengurusOptions();

  const supabase = await createClient();
  const { data } = await supabase.rpc("list_pengurus");
  return (
    (data as
      | { id: string; full_name: string; division_name: string | null }[]
      | null) ?? []
  ).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    division: p.division_name,
  }));
}

export async function getDivisions(): Promise<Division[]> {
  if (DUMMY_DATA) return dummyDivisions;

  const supabase = await createClient();
  const { data } = await supabase
    .from("divisions")
    .select("id, name")
    .order("name");
  return data ?? [];
}
