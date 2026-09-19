import type { Tone } from "../components/ui";

/* Proker statuses, shared by the pengurus and super admin pages. Keep in
   sync with the check on public.proker.status. */
export const PROKER_STATUSES = [
  "direncanakan",
  "berlangsung",
  "selesai",
  "dibatalkan",
] as const;

export type ProkerStatus = (typeof PROKER_STATUSES)[number];

export const STATUS: Record<ProkerStatus, { label: string; tone: Tone }> = {
  direncanakan: { label: "Direncanakan", tone: "neutral" },
  berlangsung: { label: "Berlangsung", tone: "amber" },
  selesai: { label: "Selesai", tone: "green" },
  dibatalkan: { label: "Dibatalkan", tone: "red" },
};
