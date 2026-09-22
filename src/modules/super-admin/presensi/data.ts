import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import type {
  AttendanceStatus,
  MeetingScope,
} from "@/modules/admin/presensi/status";

import type { AttendanceRow, ManagedMeeting } from "./fields";

type OverviewRow = {
  id: string;
  title: string;
  scope: MeetingScope;
  division_id: string;
  division_name: string;
  sequence: number;
  scheduled_at: string;
  location: string | null;
  notes: string | null;
  late_after_minutes: number;
  opened_at: string | null;
  closed_at: string | null;
  expected: number;
  present: number;
};

/**
 * Every rapat this super admin may see — their own division's, plus every
 * rapat gabungan — newest first. `meeting_overview` is a security definer
 * aggregate, so it also carries the attendance counts.
 */
export const getMeetings = cache(async (): Promise<ManagedMeeting[]> => {
  /* the sample-data preview has no rapat; the page shows its empty state */
  if (DUMMY_DATA) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("meeting_overview");
  if (error) {
    console.error("getMeetings", error.message);
    return [];
  }

  return ((data ?? []) as OverviewRow[]).map((m) => ({
    id: m.id,
    title: m.title,
    scope: m.scope,
    divisionId: m.division_id,
    division: m.division_name,
    sequence: m.sequence,
    scheduledAt: m.scheduled_at,
    location: m.location,
    notes: m.notes,
    lateAfterMinutes: m.late_after_minutes,
    openedAt: m.opened_at,
    closedAt: m.closed_at,
    expected: m.expected,
    present: m.present,
  }));
});

type ListRow = {
  profile_id: string;
  full_name: string;
  division_name: string | null;
  position_name: string | null;
  status: AttendanceStatus | null;
  method: AttendanceRow["method"];
  note: string | null;
  checked_in_at: string | null;
};

/** Every expected attendee of one rapat, those who presented first. */
export async function getAttendance(
  meetingId: string,
): Promise<AttendanceRow[]> {
  if (DUMMY_DATA) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("meeting_attendance_list", {
    p_meeting_id: meetingId,
  });
  if (error) {
    console.error("getAttendance", error.message);
    return [];
  }

  return ((data ?? []) as ListRow[]).map((row) => ({
    profileId: row.profile_id,
    name: row.full_name,
    division: row.division_name,
    position: row.position_name,
    status: row.status,
    method: row.method,
    note: row.note,
    checkedInAt: row.checked_in_at,
  }));
}

/** The rapat behind /super-admin/presensi/[id], or null when out of reach. */
export async function getMeeting(id: string): Promise<ManagedMeeting | null> {
  const meetings = await getMeetings();
  return meetings.find((m) => m.id === id) ?? null;
}
