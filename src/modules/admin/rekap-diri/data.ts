import { DUMMY_DATA } from "../dummy";
import { dummySelfReport } from "../dummy/data";

/** The competencies HR scores, in the order the radar chart draws them
    (clockwise from the top). */
export const COMPETENCIES = [
  "Kepemimpinan",
  "Kerja Tim",
  "Tanggung Jawab",
  "Inisiatif",
  "Komunikasi",
  "Manajemen Waktu",
] as const;

export type Competency = (typeof COMPETENCIES)[number];

/** Scores run from 1 to 5. */
export const MAX_SCORE = 5;

export type Rating = "sangat_baik" | "baik" | "cukup" | "perlu_ditingkatkan";

/** Achieved out of target, or null when nothing is recorded yet. */
export type Tally = { done: number; total: number } | null;

export type CompetencyResult = {
  name: Competency;
  /** Score at the start of the period. */
  initial: number | null;
  /** Latest score. */
  current: number | null;
  rating: Rating | null;
};

export type SelfReport = {
  proker: Tally;
  workHours: Tally;
  attendance: Tally;
  points: Tally;
  competencies: CompetencyResult[];
  notes: {
    achievements: string | null;
    strengths: string | null;
    improvements: string | null;
  };
};

/**
 * The signed-in admin's report for the current period. Work programs, work
 * hours, attendance, points and HR evaluations aren't recorded yet, so every
 * section renders its empty state. Scope these queries to the admin once
 * their tables exist.
 */
export async function getSelfReport(): Promise<SelfReport> {
  if (DUMMY_DATA) return dummySelfReport;

  return {
    proker: null,
    workHours: null,
    attendance: null,
    points: null,
    competencies: COMPETENCIES.map((name) => ({
      name,
      initial: null,
      current: null,
      rating: null,
    })),
    notes: { achievements: null, strengths: null, improvements: null },
  };
}
