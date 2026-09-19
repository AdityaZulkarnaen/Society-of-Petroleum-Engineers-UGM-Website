"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import {
  dummyManagedProker,
  dummyPengurusOptions,
} from "@/modules/admin/dummy/proker";

import { validateProker, type ActionResult, type ProkerInput } from "./fields";

/* Raised by public.save_proker() / delete_proker(). */
const MESSAGES: Record<string, string> = {
  not_allowed: "Hanya divisi penyelenggara yang bisa mengubah proker ini.",
  invalid_member: "Ada pengurus yang tidak valid. Muat ulang halaman ini.",
};

function revalidate() {
  revalidatePath("/super-admin/acara");
  revalidatePath("/admin/acara");
  revalidatePath("/admin");
}

/** Creates (id null) or updates a proker of the caller's division. */
export async function saveProker(
  id: string | null,
  input: ProkerInput,
): Promise<ActionResult> {
  const me = await requireSuperAdmin();
  const { ok, errors, values } = validateProker(input);
  if (!ok) return { errors, error: "Periksa kembali isian yang ditandai." };

  if (DUMMY_DATA) {
    if (!me.division) return { error: MESSAGES.not_allowed };
    const names = new Map(dummyPengurusOptions().map((p) => [p.id, p.fullName]));
    const list = dummyManagedProker.list();
    const existing = id ? list.find((p) => p.id === id) : null;
    if (id && existing?.divisionId !== me.division.id) {
      return { error: MESSAGES.not_allowed };
    }
    const saved = {
      id: id ?? crypto.randomUUID(),
      name: values.name,
      description: values.description,
      divisionId: me.division.id,
      division: me.division.name,
      startsOn: values.startsOn,
      endsOn: values.endsOn,
      status: values.status,
      members: values.members.map((m) => ({
        ...m,
        name: names.get(m.profileId) ?? "Pengurus",
      })),
    };
    dummyManagedProker.save(
      id ? list.map((p) => (p.id === id ? saved : p)) : [saved, ...list],
    );
    revalidate();
    return {};
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_proker", {
    p_id: id,
    p_name: values.name,
    p_description: values.description,
    p_starts_on: values.startsOn,
    p_ends_on: values.endsOn,
    p_status: values.status,
    p_members: values.members.map((m) => ({ profile_id: m.profileId, role: m.role })),
  });
  if (error) {
    console.error("saveProker", error.message);
    return { error: MESSAGES[error.message] ?? "Proker gagal disimpan. Coba lagi." };
  }

  revalidate();
  return {};
}

export async function deleteProker(id: string): Promise<ActionResult> {
  const me = await requireSuperAdmin();

  if (DUMMY_DATA) {
    const list = dummyManagedProker.list();
    if (list.find((p) => p.id === id)?.divisionId !== me.division?.id) {
      return { error: MESSAGES.not_allowed };
    }
    dummyManagedProker.save(list.filter((p) => p.id !== id));
    revalidate();
    return {};
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_proker", { p_id: id });
  if (error) {
    console.error("deleteProker", error.message);
    return { error: MESSAGES[error.message] ?? "Proker gagal dihapus. Coba lagi." };
  }

  revalidate();
  return {};
}
