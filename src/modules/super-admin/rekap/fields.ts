/* Shared by the rekap editor (client) and saveRekap (server). */

import {
  COMPETENCIES,
  type Competency,
} from "@/modules/admin/rekap-diri/data";

export const STATS = [
  { key: "proker", label: "Proker Diselesaikan" },
  { key: "attendance", label: "Kehadiran Rapat" },
  { key: "points", label: "Poin Kontribusi" },
] as const;

export type StatKey = (typeof STATS)[number]["key"];

export const NOTES = [
  { key: "achievements", label: "Kontribusi & Pencapaian Utama" },
  { key: "strengths", label: "Kekuatan yang Diobservasi" },
  { key: "improvements", label: "Area yang Perlu Dikembangkan" },
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
    if (done && !WHOLE.test(done)) errors[`${key}.done`] = "Angka bulat.";
    if (target && (!WHOLE.test(target) || Number(target) === 0)) {
      errors[`${key}.target`] = "Angka lebih dari 0.";
    }
    if (done && !target) errors[`${key}.target`] = "Isi target.";
    if (target && !done) errors[`${key}.done`] = "Isi capaian.";
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
      errors[`competency.${i}`] = "Skor harus 1–5.";
    }
    competencies.push({
      competency: name,
      score: value,
    });
  });

  const notes = {} as RekapValues["notes"];
  for (const { key } of NOTES) {
    const text = input.notes[key].trim();
    if (text.length > NOTE_MAX) errors[`notes.${key}`] = `Maksimal ${NOTE_MAX} karakter.`;
    notes[key] = text || null;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { stats, competencies, notes } satisfies RekapValues,
  };
}
