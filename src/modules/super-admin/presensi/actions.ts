"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import QRCode from "qrcode";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { mintScanToken } from "@/modules/admin/presensi/token";

import { getMeeting } from "./data";
import {
  isAttendanceStatus,
  NOTE_MAX,
  validateMeeting,
  type ActionResult,
  type MeetingInput,
} from "./fields";

/* Raised by the rapat functions in the database. */
const MESSAGES: Record<string, string> = {
  not_allowed:
    "Hanya super admin divisi penyelenggara yang bisa mengubah rapat ini.",
  sequence_taken:
    "Nomor rapat itu sudah dipakai. Ganti angka pada 'Rapat ke-'.",
  not_participant: "Pengurus itu tidak termasuk peserta rapat ini.",
  presensi_closed: "Presensi rapat ini sudah ditutup.",
  meeting_not_found: "Rapat tidak ditemukan. Muat ulang halaman ini.",
};

const failed = (message: string, fallback: string) => ({
  error: MESSAGES[message] ?? fallback,
});

const PREVIEW_ONLY = {
  error: "Presensi rapat butuh database; matikan mode data contoh dulu.",
};

function revalidate(id?: string) {
  revalidatePath("/super-admin/presensi");
  if (id) revalidatePath(`/super-admin/presensi/${id}`);
  revalidatePath("/admin/presensi");
}

/** Creates (id null) or updates a rapat of the super admin's division. */
export async function saveMeeting(
  id: string | null,
  input: MeetingInput,
): Promise<ActionResult> {
  await requireSuperAdmin();
  const { ok, errors, values } = validateMeeting(input);
  if (!ok) return { errors, error: "Periksa kembali isian yang ditandai." };
  if (DUMMY_DATA) return PREVIEW_ONLY;

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_meeting", {
    p_id: id,
    p_title: values.title,
    p_scope: values.scope,
    p_sequence: values.sequence,
    p_scheduled_at: values.scheduledAt,
    p_location: values.location,
    p_notes: values.notes,
    p_late_after_minutes: values.lateAfterMinutes,
  });
  if (error) {
    console.error("saveMeeting", error.message);
    const failure = failed(error.message, "Rapat gagal disimpan. Coba lagi.");
    /* the clash is on a field, so mark it */
    return error.message === "sequence_taken"
      ? { ...failure, errors: { sequence: "Nomor ini sudah dipakai." } }
      : failure;
  }
  revalidate(id ?? undefined);
  return {};
}

/**
 * Opens the presensi, or closes it. Closing writes 'alpa' for everyone who
 * never presented, so the rapat keeps a status for every peserta.
 */
export async function setMeetingOpen(
  id: string,
  open: boolean,
): Promise<ActionResult> {
  await requireSuperAdmin();
  if (DUMMY_DATA) return PREVIEW_ONLY;

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_meeting_open", {
    p_id: id,
    p_open: open,
  });
  if (error) {
    console.error("setMeetingOpen", error.message);
    return failed(
      error.message,
      open
        ? "Presensi gagal dibuka. Coba lagi."
        : "Presensi gagal ditutup. Coba lagi.",
    );
  }
  revalidate(id);
  return {};
}

/** Deletes a rapat with every presensi recorded in it. */
export async function deleteMeeting(id: string): Promise<ActionResult> {
  await requireSuperAdmin();
  if (DUMMY_DATA) return PREVIEW_ONLY;

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_meeting", { p_id: id });
  if (error) {
    console.error("deleteMeeting", error.message);
    return failed(error.message, "Rapat gagal dihapus. Coba lagi.");
  }
  revalidate(id);
  return {};
}

/**
 * The manual override on the live table: izin, sakit, alpa, or a correction of
 * a scan. A null status clears the row, back to 'belum presensi'.
 */
export async function setAttendance(
  meetingId: string,
  profileId: string,
  status: string | null,
  note = "",
): Promise<ActionResult> {
  await requireSuperAdmin();
  if (status !== null && !isAttendanceStatus(status)) {
    return { error: "Status presensi tidak dikenal." };
  }
  const trimmed = note.trim().slice(0, NOTE_MAX);
  if (DUMMY_DATA) return PREVIEW_ONLY;

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_attendance", {
    p_meeting_id: meetingId,
    p_profile_id: profileId,
    p_status: status,
    p_note: trimmed || null,
  });
  if (error) {
    console.error("setAttendance", error.message);
    return failed(error.message, "Status presensi gagal disimpan. Coba lagi.");
  }
  revalidate(meetingId);
  return {};
}

/** Absolute origin of this deployment, so a phone camera can open the link. */
async function origin() {
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host");
  const proto =
    store.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type ScanQr = {
  /** Inline SVG of the QR, ready to drop into the panel. */
  svg: string;
  /** Epoch ms after which the QR is replaced. */
  expiresAt: number;
};

/**
 * Mints the QR for the session page. The token inside it is valid for about a
 * minute, so the panel asks for a new one as each expires and a screenshot is
 * useless afterwards.
 */
export async function getScanQr(
  meetingId: string,
): Promise<{ qr?: ScanQr; error?: string }> {
  const admin = await requireSuperAdmin();
  if (DUMMY_DATA) return PREVIEW_ONLY;

  const meeting = await getMeeting(meetingId);
  if (!meeting) return { error: MESSAGES.meeting_not_found };
  if (meeting.divisionId !== admin.division?.id) {
    return { error: MESSAGES.not_allowed };
  }
  if (!meeting.openedAt || meeting.closedAt) {
    return { error: MESSAGES.presensi_closed };
  }

  const { token, expiresAt } = mintScanToken(meetingId);
  const url = `${await origin()}/admin/presensi/scan?t=${token}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#0b0e22", light: "#ffffff" },
  });

  return { qr: { svg, expiresAt } };
}
