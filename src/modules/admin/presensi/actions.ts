"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { getAdmin } from "../auth/session";
import { DUMMY_DATA } from "../dummy";
import type { AttendanceStatus, MeetingScope } from "./status";
import { readScanToken } from "./token";

export type CheckInResult =
  | {
      ok: true;
      status: AttendanceStatus;
      checkedInAt: string;
      /** The QR was scanned again after the presensi was already recorded. */
      duplicate: boolean;
      meeting: { title: string; scope: MeetingScope; sequence: number };
    }
  | { ok: false; error: string };

/* Raised by record_attendance(). */
const MESSAGES: Record<string, string> = {
  presensi_closed:
    "Attendance for this meeting is either not open yet or has already closed. Contact your division super admin.",
  not_participant: "You are not a participant in this meeting.",
  meeting_not_found: "Meeting not found. Please scan the latest QR code from the meeting screen.",
};

const EXPIRED =
  "QR code has expired. Point your camera at the latest QR code on the meeting screen.";

/**
 * Records the signed-in account's presensi from a scanned QR.
 *
 * The token is checked here, in the server, and only then is the row written
 * with the secret key: `record_attendance` is not granted to signed-in
 * accounts, so nobody can mark themselves present without having scanned.
 */
export async function checkIn(token: string): Promise<CheckInResult> {
  const admin = await getAdmin();
  if (!admin) {
    return { ok: false, error: "Your session has expired. Please sign in again and rescan." };
  }
  /* Super admins are peserta too, but they hold the QR: they set their own
     status from the live table instead of scanning their own screen. */
  if (admin.role !== "admin") {
    return {
      ok: false,
      error:
        "Super admin accounts record their attendance directly from the meeting attendance table.",
    };
  }
  if (DUMMY_DATA) {
    return {
      ok: false,
      error: "Meeting attendance requires a database; disable sample data mode first.",
    };
  }

  const meetingId = readScanToken(token);
  if (!meetingId) return { ok: false, error: EXPIRED };

  /* RLS only shows rapat the account is called to */
  const supabase = await createClient();
  const { data: meeting } = await supabase
    .from("meetings")
    .select("title, scope, sequence")
    .eq("id", meetingId)
    .maybeSingle();
  if (!meeting) return { ok: false, error: MESSAGES.not_participant };

  const { data, error } = await createAdminClient().rpc("record_attendance", {
    p_meeting_id: meetingId,
    p_profile_id: admin.id,
    p_method: "qr",
  });
  if (error) {
    console.error("checkIn", error.message);
    return {
      ok: false,
      error: MESSAGES[error.message] ?? "Failed to save attendance. Please try again.",
    };
  }

  const row = (
    data as
      | { status: AttendanceStatus; checked_in_at: string; duplicate: boolean }[]
      | null
  )?.[0];
  if (!row) return { ok: false, error: "Failed to save attendance. Please try again." };

  revalidatePath("/admin/presensi");
  revalidatePath(`/super-admin/presensi/${meetingId}`);

  return {
    ok: true,
    status: row.status,
    checkedInAt: row.checked_in_at,
    duplicate: row.duplicate,
    meeting: {
      title: meeting.title,
      scope: meeting.scope as MeetingScope,
      sequence: meeting.sequence,
    },
  };
}
