/* Shared by the rapat dialogs (client) and their Server Functions. */

import { fromJakartaInput } from "@/modules/admin/presensi/format";
import {
  ATTENDANCE_STATUSES,
  MEETING_SCOPES,
  type AttendanceStatus,
  type MeetingScope,
} from "@/modules/admin/presensi/status";

/** What the Tambah / Edit Rapat form sends. Raw input strings. */
export type MeetingInput = {
  title: string;
  scope: MeetingScope;
  /** 'Rapat ke-', as typed. */
  sequence: string;
  /** A `datetime-local` value, read as Asia/Jakarta wall-clock time. */
  scheduledAt: string;
  location: string;
  notes: string;
  lateAfterMinutes: string;
};

/** A rapat as the super admin pages show it. */
export type ManagedMeeting = {
  id: string;
  title: string;
  scope: MeetingScope;
  divisionId: string;
  division: string;
  sequence: number;
  /** ISO instant. */
  scheduledAt: string;
  location: string | null;
  notes: string | null;
  lateAfterMinutes: number;
  openedAt: string | null;
  closedAt: string | null;
  /** Pengurus expected at this rapat. */
  expected: number;
  /** Of those, the ones marked hadir or terlambat. */
  present: number;
};

/** One expected attendee on the live table. */
export type AttendanceRow = {
  profileId: string;
  name: string;
  division: string | null;
  position: string | null;
  /** Null while they haven't presented yet. */
  status: AttendanceStatus | null;
  method: "qr" | "manual" | "otomatis" | null;
  note: string | null;
  checkedInAt: string | null;
};

export type FormErrors = Record<string, string>;

export type ActionResult = { error?: string; errors?: FormErrors };

export const TITLE_MAX = 120;
export const NOTES_MAX = 1000;
export const LOCATION_MAX = 120;
export const NOTE_MAX = 200;
export const LATE_MAX = 240;
export const SEQUENCE_MAX = 999;

const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function validateMeeting(input: MeetingInput) {
  const errors: FormErrors = {};
  const title = input.title.trim();
  const location = input.location.trim();
  const notes = input.notes.trim();
  const sequence = Number(input.sequence);
  const lateAfterMinutes = Number(input.lateAfterMinutes);

  if (title.length < 2 || title.length > TITLE_MAX) {
    errors.title = "Isi nama rapat.";
  }
  if (!MEETING_SCOPES.includes(input.scope)) {
    errors.scope = "Pilih jenis rapat.";
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > SEQUENCE_MAX) {
    errors.sequence = `Rapat ke- harus angka 1–${SEQUENCE_MAX}.`;
  }
  if (!DATETIME.test(input.scheduledAt)) {
    errors.scheduledAt = "Pilih tanggal dan jam rapat.";
  }
  if (location.length > LOCATION_MAX) {
    errors.location = `Maksimal ${LOCATION_MAX} karakter.`;
  }
  if (notes.length > NOTES_MAX) errors.notes = `Maksimal ${NOTES_MAX} karakter.`;
  if (
    !Number.isInteger(lateAfterMinutes) ||
    lateAfterMinutes < 0 ||
    lateAfterMinutes > LATE_MAX
  ) {
    errors.lateAfterMinutes = `Toleransi harus 0–${LATE_MAX} menit.`;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      title,
      scope: input.scope,
      sequence,
      /* the input is Jakarta wall-clock time; the column is an instant */
      scheduledAt: DATETIME.test(input.scheduledAt)
        ? fromJakartaInput(input.scheduledAt)
        : "",
      location: location || null,
      notes: notes || null,
      lateAfterMinutes,
    },
  };
}

/** 'Rapat ke-' the next rapat of this scope gets. */
export function nextSequence(
  meetings: ManagedMeeting[],
  scope: MeetingScope,
  myDivisionId: string | null,
) {
  const own = meetings.filter(
    (m) =>
      m.scope === scope &&
      (scope === "gabungan" || m.divisionId === myDivisionId),
  );
  return Math.max(0, ...own.map((m) => m.sequence)) + 1;
}

export const isAttendanceStatus = (value: unknown): value is AttendanceStatus =>
  ATTENDANCE_STATUSES.includes(value as AttendanceStatus);
