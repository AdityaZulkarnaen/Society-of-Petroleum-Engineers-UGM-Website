/* Shared by the rekap editor (client) and saveRekap (server). */

import {
  COMPETENCIES,
  RATINGS,
  type Competency,
  type Rating,
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
  competencies: { competency: string; score: string; rating: string }[];
  notes: Record<NoteKey, string>;
};

/** Error messages keyed 'proker.done', 'competency.2.score', 'notes.strengths', ... */
export type RekapErrors = Record<string, string>;

export type RekapValues = {
  stats: Record<StatKey, { done: number | null; target: number | null }>;
  competencies: { competency: Competency; score: number; rating: Rating }[];
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

  const seen = new Set<string>();
  const competencies: RekapValues["competencies"] = [];
  input.competencies.forEach(({ competency, score, rating }, i) => {
    if (!COMPETENCIES.includes(competency as Competency)) {
      errors[`competency.${i}.competency`] = "Pilih kompetensi.";
    } else if (seen.has(competency)) {
      errors[`competency.${i}.competency`] = "Kompetensi sudah dipilih.";
    }
    seen.add(competency);

    const value = Number(score.replace(",", "."));
    if (!score.trim() || !(value >= 1 && value <= 5) || (value * 2) % 1 !== 0) {
      errors[`competency.${i}.score`] = "1–5, kelipatan 0,5.";
    }
    if (!RATINGS.includes(rating as Rating)) {
      errors[`competency.${i}.rating`] = "Pilih level.";
    }
    competencies.push({
      competency: competency as Competency,
      score: value,
      rating: rating as Rating,
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
