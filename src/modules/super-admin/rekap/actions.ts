"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { CURRENT_PERIOD } from "@/modules/admin/constants";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { dummyAccounts, dummyRekap } from "@/modules/admin/dummy/data";
import { COMPETENCIES } from "@/modules/admin/rekap-diri/data";

import { validateRekap, type RekapErrors, type RekapInput } from "./fields";

export type SaveResult = { error?: string; errors?: RekapErrors };

export async function saveRekap(
  profileId: string,
  input: RekapInput,
): Promise<SaveResult> {
  await requireSuperAdmin();
  const { ok, errors, values } = validateRekap(input);
  if (!ok) return { errors, error: "Periksa kembali isian yang ditandai." };

  if (DUMMY_DATA) {
    if (!dummyAccounts.list().some((a) => a.id === profileId)) {
      return { error: "Pengurus tidak ditemukan." };
    }
    const previous = dummyRekap.get(profileId);
    const byName = new Map(values.competencies.map((c) => [c.competency, c]));
    const tally = ({ done, target }: { done: number | null; target: number | null }) =>
      done != null && target != null ? { done, total: target } : null;

    dummyRekap.set(profileId, {
      proker: tally(values.stats.proker),
      workHours: null,
      attendance: tally(values.stats.attendance),
      points: tally(values.stats.points),
      competencies: COMPETENCIES.map((name) => {
        const c = byName.get(name);
        const before = previous?.competencies.find((p) => p.name === name);
        return {
          name,
          current: c?.score ?? null,
          initial: c ? (before?.initial ?? c.score) : null,
          rating: c?.rating ?? null,
        };
      }),
      notes: values.notes,
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.rpc("save_rekap", {
      p_profile_id: profileId,
      p_period: CURRENT_PERIOD.label,
      p_stats: {
        proker_done: values.stats.proker.done,
        proker_target: values.stats.proker.target,
        attendance_done: values.stats.attendance.done,
        attendance_target: values.stats.attendance.target,
        points_done: values.stats.points.done,
        points_target: values.stats.points.target,
      },
      p_notes: values.notes,
      p_competencies: values.competencies,
    });
    if (error) {
      console.error("saveRekap", error.message);
      return {
        error:
          error.message === "not_allowed"
            ? "Pengurus ini bukan anggota divisimu."
            : "Rekap gagal disimpan. Coba lagi.",
      };
    }
  }

  revalidatePath("/super-admin/rekap");
  revalidatePath("/super-admin");
  return {};
}
