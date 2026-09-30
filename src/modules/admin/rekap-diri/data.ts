/* Shared rekap types and constants; safe to import from client components.
   The loaders live in ./load.ts. */

/** The competencies HR scores, in the order the radar chart draws them
    (clockwise from the top). */
export const COMPETENCIES = [
  "Grit / Perseverance",
  "Empower Others",
  "Teamwork",
  "Caring",
  "Accountability",
  "Integrity",
  "Agility",
  "Innovation",
  "Communication",
  "Self Awareness",
  "Strive for Excellence",
  "Self Purpose",
] as const;

export type Competency = (typeof COMPETENCIES)[number];

/**
 * 6 broad categories displayed on the radar diagram, each calculated
 * as the average of 2 corresponding HRD assessment aspects:
 * - Leadership: (Grit / Perseverance + Empower Others) / 2
 * - Teamwork: (Teamwork + Caring) / 2
 * - Responsibility: (Accountability + Integrity) / 2
 * - Initiative: (Agility + Innovation) / 2
 * - Communication: (Communication + Self Awareness) / 2
 * - Time Management: (Strive for Excellence + Self Purpose) / 2
 */
export const RADAR_CATEGORIES = [
  {
    name: "Leadership",
    aspects: ["Grit / Perseverance", "Empower Others"] as const,
  },
  {
    name: "Teamwork",
    aspects: ["Teamwork", "Caring"] as const,
  },
  {
    name: "Responsibility",
    aspects: ["Accountability", "Integrity"] as const,
  },
  {
    name: "Initiative",
    aspects: ["Agility", "Innovation"] as const,
  },
  {
    name: "Communication",
    aspects: ["Communication", "Self Awareness"] as const,
  },
  {
    name: "Time Management",
    aspects: ["Strive for Excellence", "Self Purpose"] as const,
  },
] as const;

export type RadarCategory = (typeof RADAR_CATEGORIES)[number];
export type RadarCategoryName = RadarCategory["name"];

export type RadarCategoryResult = {
  name: RadarCategoryName;
  initial: number | null;
  current: number | null;
};

/**
 * Calculates the 6 radar category scores by averaging the 2 underlying HRD aspects.
 */
export function getRadarCategories(
  competencies: CompetencyResult[],
): RadarCategoryResult[] {
  const byName = new Map(competencies.map((c) => [c.name, c]));

  const calc = (
    aspects: readonly [Competency, Competency],
    field: "initial" | "current",
  ): number | null => {
    const s1 = byName.get(aspects[0])?.[field];
    const s2 = byName.get(aspects[1])?.[field];

    if (s1 != null && s2 != null) return (s1 + s2) / 2;
    if (s1 != null) return s1;
    if (s2 != null) return s2;
    return null;
  };

  return RADAR_CATEGORIES.map(({ name, aspects }) => ({
    name,
    initial: calc(aspects, "initial"),
    current: calc(aspects, "current"),
  }));
}

/** Scores run from 1 to 5 (decimals allowed). */
export const MAX_SCORE = 5;

/** Score interpretation based on average score. */
export type Kategori = "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor";

export function getKategori(rataRata: number): Kategori {
  if (rataRata >= 4.21) return "Excellent";
  if (rataRata >= 3.41) return "Good";
  if (rataRata >= 2.61) return "Fair";
  if (rataRata >= 1.81) return "Poor";
  return "Very Poor";
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
