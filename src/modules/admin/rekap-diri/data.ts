/* Shared rekap types and constants; safe to import from client components.
   The loaders live in ./load.ts. */

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

export const RATINGS: Rating[] = ["sangat_baik", "baik", "cukup", "perlu_ditingkatkan"];

/** A report with nothing recorded: every section shows its empty state. */
export function emptyReport(): SelfReport {
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
