/* Shared by the rekap editor (client) and saveRekap (server). */

import {
  COMPETENCIES,
  type Competency,
} from "@/modules/admin/rekap-diri/data";

export const STATS = [
  { key: "proker", label: "Programs Completed" },
  { key: "attendance", label: "Meeting Attendance" },
  { key: "points", label: "Contribution Points" },
] as const;

export type StatKey = (typeof STATS)[number]["key"];

export const NOTES = [
  { key: "achievements", label: "Key Contributions & Achievements" },
  { key: "strengths", label: "Observed Strengths" },
  { key: "improvements", label: "Areas for Development" },
] as const;

export type NoteKey = (typeof NOTES)[number]["key"];

export const NOTE_MAX = 2000;

/** Form values as typed; numbers are validated on the way in. */
export type RekapInput = {
  stats: Record<StatKey, { done: string; target: string }>;
  /** Fixed array of 12 scores, indexed same as COMPETENCIES. */
  competencyScores: string[];
  notes: Record<NoteKey, string>;
};

/** Error messages keyed 'proker.done', 'competency.2', 'notes.strengths', ... */
export type RekapErrors = Record<string, string>;

export type RekapValues = {
  stats: Record<StatKey, { done: number | null; target: number | null }>;
  competencies: { competency: Competency; score: number }[];
  notes: Record<NoteKey, string | null>;
};

const WHOLE = /^\d{1,6}$/;

export function validateRekap(input: RekapInput) {
  const errors: RekapErrors = {};

  const stats = {} as RekapValues["stats"];
  for (const { key } of STATS) {
    const done = input.stats[key].done.trim();
    const target = input.stats[key].target.trim();
    if (done && !WHOLE.test(done)) errors[`${key}.done`] = "Whole number only.";
    if (target && (!WHOLE.test(target) || Number(target) === 0)) {
      errors[`${key}.target`] = "Must be greater than 0.";
    }
    if (done && !target) errors[`${key}.target`] = "Fill in target.";
    if (target && !done) errors[`${key}.done`] = "Fill in achieved value.";
    stats[key] = {
      done: done ? Number(done) : null,
      target: target ? Number(target) : null,
    };
  }

  const competencies: RekapValues["competencies"] = [];
  COMPETENCIES.forEach((name, i) => {
    const raw = (input.competencyScores[i] ?? "").trim();
    if (!raw) return; // empty = not scored yet, skip
    const value = Number(raw.replace(",", "."));
    if (isNaN(value) || value < 1 || value > 5) {
      errors[`competency.${i}`] = "Score must be 1–5.";
    }
    competencies.push({
      competency: name,
      score: value,
    });
  });

  const notes = {} as RekapValues["notes"];
  for (const { key } of NOTES) {
    const text = input.notes[key].trim();
    if (text.length > NOTE_MAX) errors[`notes.${key}`] = `Maximum ${NOTE_MAX} characters.`;
    notes[key] = text || null;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { stats, competencies, notes } satisfies RekapValues,
  };
}
