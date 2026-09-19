/* Shared by the voting dialogs (client) and their Server Functions. */

import { NIM_HINT, NIM_PATTERN } from "../accounts/fields";

/** What the Tambah / Edit Kandidat form sends. */
export type CandidateInput = {
  fullName: string;
  nim: string;
  position: string;
  photoUrl: string;
  vision: string;
  grandDesignUrl: string;
  programs: string[];
  achievements: string[];
};

/** What the Pengaturan Pemilihan form sends. */
export type ElectionInput = {
  title: string;
  termLabel: string;
  opensOn: string;
  closesOn: string;
};

/** Keyed by field; list items as 'programs.1', 'achievements.0'. */
export type FormErrors = Record<string, string>;

export type ActionResult = { error?: string; errors?: FormErrors };

export const VISION_MAX = 1000;

/* Photos are resized in the browser before upload; these bound the result. */
export const PHOTO_TYPES = ["image/webp", "image/jpeg", "image/png"];
export const PHOTO_MAX_BYTES = 1024 * 1024;
export const POINT_MAX = 200;
export const POINTS_MAX = 10;

const URL_PATTERN = /^https?:\/\/\S+$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TERM = /^\d{4}\/\d{4}$/;

const result = <T,>(errors: FormErrors, values: T) => ({
  ok: Object.keys(errors).length === 0,
  errors,
  values,
});

export function validateCandidate(input: CandidateInput) {
  const errors: FormErrors = {};
  const fullName = input.fullName.trim();
  const nim = input.nim.trim().toUpperCase();
  const position = input.position.trim();
  const photoUrl = input.photoUrl.trim();
  const vision = input.vision.trim();
  const grandDesignUrl = input.grandDesignUrl.trim();

  if (fullName.length < 2 || fullName.length > 100) errors.fullName = "Isi nama kandidat.";
  if (nim && !NIM_PATTERN.test(nim)) errors.nim = NIM_HINT;
  if (position.length > 80) errors.position = "Maksimal 80 karakter.";
  /* an uploaded photo's URL (data: only in the dummy preview) */
  if (photoUrl && !URL_PATTERN.test(photoUrl) && !photoUrl.startsWith("data:image/")) {
    errors.photoUrl = "Foto tidak valid. Upload ulang fotonya.";
  }
  if (vision.length > VISION_MAX) errors.vision = `Maksimal ${VISION_MAX} karakter.`;
  if (grandDesignUrl && !URL_PATTERN.test(grandDesignUrl)) {
    errors.grandDesignUrl = "URL harus diawali https://";
  }

  /* blank points are dropped */
  const points = (key: "programs" | "achievements") => {
    const list = input[key].map((p) => p.trim());
    list.forEach((p, i) => {
      if (p.length > POINT_MAX) errors[`${key}.${i}`] = `Maksimal ${POINT_MAX} karakter.`;
    });
    const kept = list.filter(Boolean);
    if (kept.length > POINTS_MAX) errors[key] = `Maksimal ${POINTS_MAX} poin.`;
    return kept;
  };

  return result(errors, {
    fullName,
    nim: nim || null,
    position: position || null,
    photoUrl: photoUrl || null,
    vision,
    grandDesignUrl: grandDesignUrl || null,
    programs: points("programs"),
    achievements: points("achievements"),
  });
}

export function validateElection(input: ElectionInput) {
  const errors: FormErrors = {};
  const title = input.title.trim();
  const termLabel = input.termLabel.trim();
  const opensOn = input.opensOn.trim();
  const closesOn = input.closesOn.trim();

  if (title.length < 4 || title.length > 120) errors.title = "Isi judul pemilihan.";
  if (!TERM.test(termLabel)) errors.termLabel = "Format periode: 2026/2027.";
  if (!DATE.test(opensOn)) errors.opensOn = "Pilih tanggal dibuka.";
  if (!DATE.test(closesOn)) errors.closesOn = "Pilih tanggal ditutup.";
  else if (DATE.test(opensOn) && closesOn < opensOn) {
    errors.closesOn = "Tanggal ditutup harus setelah tanggal dibuka.";
  }

  return result(errors, { title, termLabel, opensOn, closesOn });
}
