/* Shared rekap types and constants; safe to import from client components.
   The loaders live in ./load.ts. */

/** The competencies HR scores, in the order the radar chart draws them
    (clockwise from the top). */
export const COMPETENCIES = [
  "Grit / Perseverance",
  "Agility",
  "Strive for Excellence",
  "Innovation",
  "Caring",
  "Empower Others",
  "Teamwork",
  "Communication",
  "Self Awareness",
  "Self Purpose",
  "Integrity",
  "Accountability",
] as const;

export type Competency = (typeof COMPETENCIES)[number];

/** Scores run from 1 to 5 (decimals allowed). */
export const MAX_SCORE = 5;

/** Interpretasi nilai berdasarkan rata-rata skor. */
export type Kategori = "Sangat Baik" | "Baik" | "Cukup" | "Kurang" | "Sangat Kurang";

export function getKategori(rataRata: number): Kategori {
  if (rataRata >= 4.21) return "Sangat Baik";
  if (rataRata >= 3.41) return "Baik";
  if (rataRata >= 2.61) return "Cukup";
  if (rataRata >= 1.81) return "Kurang";
  return "Sangat Kurang";
}

/** Achieved out of target, or null when nothing is recorded yet. */
export type Tally = { done: number; total: number } | null;

export type CompetencyResult = {
  name: Competency;
  /** Score at the start of the period. */
  initial: number | null;
  /** Latest score (1-5, decimals allowed). */
  current: number | null;
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
    })),
    notes: { achievements: null, strengths: null, improvements: null },
  };
}
