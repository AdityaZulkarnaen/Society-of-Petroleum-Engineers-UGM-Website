import "server-only";

import { createClient } from "@/lib/supabase/server";

import { requireAdmin } from "../auth/session";
import { CURRENT_PERIOD } from "../constants";
import { DUMMY_DATA } from "../dummy";
import { dummySelfReport } from "../dummy/data";
import {
  COMPETENCIES,
  emptyReport,
  type Rating,
  type SelfReport,
  type Tally,
} from "./data";

const tally = (done: number | null, total: number | null): Tally =>
  done != null && total != null ? { done, total } : null;

/**
 * One pengurus' rekap for a period, or null if none has been saved. RLS lets
 * pengurus read their own and super admins their division's.
 */
export async function loadRekap(
  profileId: string,
  period: string,
): Promise<SelfReport | null> {
  const supabase = await createClient();
  const [{ data: rekap }, { data: competencies }] = await Promise.all([
    supabase
      .from("rekap")
      .select(
        "proker_done, proker_target, attendance_done, attendance_target, points_done, points_target, achievements, strengths, improvements",
      )
      .eq("profile_id", profileId)
      .eq("period", period)
      .maybeSingle(),
    supabase
      .from("rekap_competencies")
      .select("competency, score, initial_score, rating")
      .eq("profile_id", profileId)
      .eq("period", period),
  ]);
  if (!rekap) return null;

  const byName = new Map((competencies ?? []).map((c) => [c.competency, c]));
  return {
    proker: tally(rekap.proker_done, rekap.proker_target),
    /* not part of the rekap form */
    workHours: null,
    attendance: tally(rekap.attendance_done, rekap.attendance_target),
    points: tally(rekap.points_done, rekap.points_target),
    competencies: COMPETENCIES.map((name) => {
      const c = byName.get(name);
      return {
        name,
        initial: c ? Number(c.initial_score) : null,
        current: c ? Number(c.score) : null,
        rating: (c?.rating as Rating | undefined) ?? null,
      };
    }),
    notes: {
      achievements: rekap.achievements,
      strengths: rekap.strengths,
      improvements: rekap.improvements,
    },
  };
}

/** The signed-in pengurus' rekap for the current period. */
export async function getSelfReport(): Promise<SelfReport> {
  if (DUMMY_DATA) return dummySelfReport;

  const admin = await requireAdmin();
  return (await loadRekap(admin.id, CURRENT_PERIOD.label)) ?? emptyReport();
}
