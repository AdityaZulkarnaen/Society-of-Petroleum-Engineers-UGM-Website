import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { DUMMY_DATA } from "../dummy";
import type { AttendanceStatus, MeetingScope } from "./status";

/** A rapat the signed-in pengurus is expected at, with their own status. */
export type MyMeeting = {
  id: string;
  title: string;
  scope: MeetingScope;
  /** The organising division. */
  division: string;
  sequence: number;
  /** ISO instant. */
  scheduledAt: string;
  location: string | null;
  lateAfterMinutes: number;
  openedAt: string | null;
  closedAt: string | null;
  /** Null while they haven't presented. */
  status: AttendanceStatus | null;
  checkedInAt: string | null;
};

type Row = {
  id: string;
  title: string;
  scope: MeetingScope;
  division_name: string;
  sequence: number;
  scheduled_at: string;
  location: string | null;
  late_after_minutes: number;
  opened_at: string | null;
  closed_at: string | null;
  status: AttendanceStatus | null;
  checked_in_at: string | null;
};

/** Rapat the pengurus is called to, newest first. */
export const getMyMeetings = cache(async (): Promise<MyMeeting[]> => {
  /* the sample-data preview has no rapat; the page shows its empty state */
  if (DUMMY_DATA) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_meetings");
  if (error) {
    console.error("getMyMeetings", error.message);
    return [];
  }

  return ((data ?? []) as Row[]).map((m) => ({
    id: m.id,
    title: m.title,
    scope: m.scope,
    division: m.division_name,
    sequence: m.sequence,
    scheduledAt: m.scheduled_at,
    location: m.location,
    lateAfterMinutes: m.late_after_minutes,
    openedAt: m.opened_at,
    closedAt: m.closed_at,
    status: m.status,
    checkedInAt: m.checked_in_at,
  }));
});
