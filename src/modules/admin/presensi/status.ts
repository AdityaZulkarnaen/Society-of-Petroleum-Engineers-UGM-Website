import type { Tone } from "../components/ui";

/* Presensi rapat vocabulary, shared by the pengurus and super admin pages.
   Keep in sync with the checks on public.meetings and
   public.meeting_attendance. */

export const ATTENDANCE_STATUSES = [
  "hadir",
  "terlambat",
  "izin",
  "sakit",
  "alpa",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE: Record<
  AttendanceStatus,
  { label: string; tone: Tone }
> = {
  hadir: { label: "Hadir", tone: "green" },
  terlambat: { label: "Terlambat", tone: "amber" },
  izin: { label: "Izin", tone: "blue" },
  sakit: { label: "Sakit", tone: "blue" },
  alpa: { label: "Alpa", tone: "red" },
};

/** Counts towards attendance in the summaries. */
export const PRESENT: AttendanceStatus[] = ["hadir", "terlambat"];

export const MEETING_SCOPES = ["divisi", "gabungan"] as const;

export type MeetingScope = (typeof MEETING_SCOPES)[number];

export const SCOPE: Record<
  MeetingScope,
  { label: string; short: string; hint: string; tone: Tone }
> = {
  divisi: {
    label: "Rapat Divisi",
    short: "Divisi",
    hint: "Hanya pengurus divisi penyelenggara yang dipanggil.",
    tone: "neutral",
  },
  gabungan: {
    label: "Rapat Gabungan",
    short: "Gabungan",
    hint: "Seluruh pengurus aktif dari semua divisi dipanggil.",
    tone: "blue",
  },
};

/** Where a rapat is in its life: the presensi has to be opened, then closed. */
export type MeetingState = "draft" | "open" | "closed";

export const MEETING_STATE: Record<
  MeetingState,
  { label: string; tone: Tone }
> = {
  draft: { label: "Belum dibuka", tone: "neutral" },
  open: { label: "Presensi dibuka", tone: "green" },
  closed: { label: "Selesai", tone: "blue" },
};

export function meetingState(
  openedAt: string | null,
  closedAt: string | null,
): MeetingState {
  if (closedAt) return "closed";
  return openedAt ? "open" : "draft";
}

/** 'Rapat ke-3' — how the rapat is referred to in the UI. */
export const ordinal = (sequence: number) => `Rapat ke-${sequence}`;
