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
  direncanakan: { label: "Planned", tone: "neutral" },
  berlangsung: { label: "In Progress", tone: "amber" },
  selesai: { label: "Completed", tone: "green" },
  dibatalkan: { label: "Cancelled", tone: "red" },
};
