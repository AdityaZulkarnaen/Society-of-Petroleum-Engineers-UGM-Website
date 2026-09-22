import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSuperAdmin } from "@/modules/admin/auth/session";
import {
  Badge,
  compactCardSurface,
  Label,
  ProgressBar,
  Stat,
} from "@/modules/admin/components/ui";
import { meetingTime } from "@/modules/admin/presensi/format";
import {
  ATTENDANCE,
  MEETING_STATE,
  meetingState,
  ordinal,
  SCOPE,
} from "@/modules/admin/presensi/status";

import { AttendanceLive } from "./attendance-live";
import { getAttendance, getMeeting } from "./data";
import { QrPanel } from "./qr-panel";
import { SessionControls } from "./session-controls";

const backLink = (
  <Link
    href="/super-admin/presensi"
    className="inline-flex items-center gap-2 text-[13px] text-[#8a8ea3] transition-colors hover:text-white"
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M8 3 4 7l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    Semua rapat
  </Link>
);

/** One rapat: its QR, the controls, and the presensi as it comes in. */
export async function MeetingSessionPage({ id }: { id: string }) {
  const admin = await requireSuperAdmin();
  const meeting = await getMeeting(id);
  if (!meeting) notFound();

  const rows = await getAttendance(meeting.id);
  const state = meetingState(meeting.openedAt, meeting.closedAt);
  const canManage = meeting.divisionId === admin.division?.id;
  const present = rows.filter(
    (row) => row.status === "hadir" || row.status === "terlambat",
  ).length;
  const waiting = rows.filter((row) => row.status === null).length;
  const late = rows.filter((row) => row.status === "terlambat").length;
  const excused = rows.filter(
    (row) => row.status === "izin" || row.status === "sakit",
  ).length;
  const percent =
    rows.length === 0 ? 0 : Math.round((present / rows.length) * 100);

  return (
    <div className="space-y-6">
      {backLink}

      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={SCOPE[meeting.scope].tone}>
              {SCOPE[meeting.scope].label}
            </Badge>
            <Badge
              tone={MEETING_STATE[state].tone}
              className="px-2.5 py-1 text-xs font-semibold"
            >
              {MEETING_STATE[state].label}
            </Badge>
          </div>
          <h1 className="mt-3 text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]">
            {meeting.title}
          </h1>
          <p className="mt-2 text-sm text-[#8a8ea3]">
            {ordinal(meeting.sequence)} · {meeting.division} ·{" "}
            {meetingTime(meeting.scheduledAt)}
            {meeting.location ? ` · ${meeting.location}` : ""}
          </p>
        </div>
        {canManage && (
          <SessionControls
            meetingId={meeting.id}
            state={state}
            pending={waiting}
          />
        )}
      </header>

      {meeting.notes && (
        <section className={`${compactCardSurface} px-5 py-4`}>
          <Label>Agenda</Label>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-[#c7c9d4]">
            {meeting.notes}
          </p>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          surface={compactCardSurface}
          label="Sudah Presensi"
          value={`${present}/${rows.length}`}
          caption={`${percent}% dari peserta`}
        />
        <Stat
          surface={compactCardSurface}
          label={ATTENDANCE.terlambat.label}
          value={late}
          caption={`lewat ${meeting.lateAfterMinutes} menit`}
        />
        <Stat
          surface={compactCardSurface}
          label="Izin / Sakit"
          value={excused}
        />
        <Stat
          surface={compactCardSurface}
          label="Belum Presensi"
          value={waiting}
          caption={state === "closed" ? "tercatat alpa" : undefined}
        />
      </div>

      <ProgressBar percent={percent} label={`Kehadiran ${meeting.title}`} />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <QrPanel
          meetingId={meeting.id}
          title={meeting.title}
          sequence={meeting.sequence}
          isOpen={state === "open"}
          canManage={canManage}
        />
        <AttendanceLive
          meetingId={meeting.id}
          rows={rows}
          isOpen={state === "open"}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
