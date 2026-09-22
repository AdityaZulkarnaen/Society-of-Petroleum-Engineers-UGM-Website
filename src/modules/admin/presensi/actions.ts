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
    "Presensi rapat ini belum dibuka atau sudah ditutup. Hubungi super admin divisimu.",
  not_participant: "Kamu bukan peserta rapat ini.",
  meeting_not_found: "Rapat tidak ditemukan. Minta QR terbaru dari layar rapat.",
};

const EXPIRED =
  "QR sudah kedaluwarsa. Arahkan kamera ke QR terbaru di layar rapat.";

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
    return { ok: false, error: "Sesi kamu habis. Masuk lagi lalu scan ulang." };
  }
  /* Super admins are peserta too, but they hold the QR: they set their own
     status from the live table instead of scanning their own screen. */
  if (admin.role !== "admin") {
    return {
      ok: false,
      error:
        "Akun super admin mencatat kehadirannya sendiri lewat tabel presensi rapat.",
    };
  }
  if (DUMMY_DATA) {
    return {
      ok: false,
      error: "Presensi rapat butuh database; matikan mode data contoh dulu.",
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
      error: MESSAGES[error.message] ?? "Presensi gagal disimpan. Coba lagi.",
    };
  }

  const row = (
    data as
      | { status: AttendanceStatus; checked_in_at: string; duplicate: boolean }[]
      | null
  )?.[0];
  if (!row) return { ok: false, error: "Presensi gagal disimpan. Coba lagi." };

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
