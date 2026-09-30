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
  hadir: { label: "Present", tone: "green" },
  terlambat: { label: "Late", tone: "amber" },
  izin: { label: "Excused", tone: "blue" },
  sakit: { label: "Sick", tone: "blue" },
  alpa: { label: "Absent", tone: "red" },
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
    label: "Division Meeting",
    short: "Division",
    hint: "Only officers from the hosting division are invited.",
    tone: "neutral",
  },
  gabungan: {
    label: "Joint Meeting",
    short: "Joint",
    hint: "All active officers from all divisions are invited.",
    tone: "blue",
  },
};

/** Where a rapat is in its life: the presensi has to be opened, then closed. */
export type MeetingState = "draft" | "open" | "closed";

export const MEETING_STATE: Record<
  MeetingState,
  { label: string; tone: Tone }
> = {
  draft: { label: "Upcoming", tone: "neutral" },
  open: { label: "Attendance open", tone: "green" },
  closed: { label: "Completed", tone: "blue" },
};

export function meetingState(
  openedAt: string | null,
  closedAt: string | null,
): MeetingState {
  if (closedAt) return "closed";
  return openedAt ? "open" : "draft";
}

/** 'Meeting #3' — how the rapat is referred to in the UI. */
export const ordinal = (sequence: number) => `Meeting #${sequence}`;
