import { requireAdmin } from "../auth/session";
import {
  Badge,
  Card,
  EmptyState,
  Label,
  SectionHeading,
  Stat,
} from "../components/ui";
import { getMyMeetings, type MyMeeting } from "./data";
import { meetingTime } from "./format";
import { ScanButton } from "./scanner";
import {
  ATTENDANCE,
  meetingState,
  ordinal,
  PRESENT,
  SCOPE,
} from "./status";

/* Column widths of the history table: rapat / jenis / jadwal / status. */
const COLUMNS =
  "md:grid md:grid-cols-[34fr_16fr_28fr_22fr] md:items-center md:gap-x-6";

function StatusBadge({ meeting }: { meeting: MyMeeting }) {
  if (meeting.status) {
    const status = ATTENDANCE[meeting.status];
    return <Badge tone={status.tone}>{status.label}</Badge>;
  }
  const state = meetingState(meeting.openedAt, meeting.closedAt);
  return (
    <Badge tone={state === "open" ? "amber" : "neutral"}>
      {state === "open" ? "Menunggu scan" : "Belum presensi"}
    </Badge>
  );
}

/** The rapat whose presensi is open: the one thing to act on. */
function OpenMeetingCard({ meeting }: { meeting: MyMeeting }) {
  const done = Boolean(meeting.status);

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13px] font-medium text-[#6ee7b7]">
            <span
              aria-hidden="true"
              className="size-1.5 animate-pulse rounded-full bg-[#34d399]"
            />
            Presensi sedang dibuka
          </p>
          <h2 className="mt-2.5 text-xl font-bold tracking-[-0.01em]">
            {meeting.title}
          </h2>
          <p className="mt-2 text-[13px] text-[#8a8ea3]">
            {ordinal(meeting.sequence)} · {SCOPE[meeting.scope].label} ·{" "}
            {meetingTime(meeting.scheduledAt)}
            {meeting.location ? ` · ${meeting.location}` : ""}
          </p>
        </div>
        {done ? (
          <div className="text-right">
            <Label>Status kamu</Label>
            <div className="mt-2">
              <StatusBadge meeting={meeting} />
            </div>
          </div>
        ) : (
          <ScanButton />
        )}
      </div>

      {!done && (
        <p className="mt-5 text-[13px] leading-relaxed text-[#6f7286]">
          Scan QR yang ditampilkan di layar rapat — lewat tombol di atas, atau
          langsung dari aplikasi kamera HP. QR berganti setiap setengah menit,
          jadi pastikan kamu mengarahkan kamera ke layar yang aktif.
        </p>
      )}
    </Card>
  );
}

export async function PresensiPage() {
  await requireAdmin();
  const meetings = await getMyMeetings();

  const open = meetings.find((m) => m.openedAt && !m.closedAt) ?? null;
  const history = meetings.filter((m) => m.id !== open?.id);
  const recorded = meetings.filter((m) => m.status !== null);
  const present = recorded.filter((m) => m.status && PRESENT.includes(m.status));
  const count = (status: keyof typeof ATTENDANCE) =>
    meetings.filter((m) => m.status === status).length;
  const rate =
    recorded.length === 0
      ? null
      : Math.round((present.length / recorded.length) * 100);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
            Presensi Rapat
          </h1>
          <p className="mt-3 text-[15px] text-[#8a8ea3]">
            Scan QR saat rapat dimulai. Riwayat presensimu tersimpan di sini.
          </p>
        </div>
        {!open && <ScanButton />}
      </header>

      {open && <OpenMeetingCard meeting={open} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Rapat Diikuti"
          value={meetings.length}
          caption="dipanggil untukmu"
        />
        <Stat
          label="Tingkat Kehadiran"
          value={rate === null ? "—" : `${rate}%`}
          caption={
            recorded.length > 0
              ? `${present.length} dari ${recorded.length} rapat`
              : "belum ada catatan"
          }
        />
        <Stat
          label={ATTENDANCE.terlambat.label}
          value={count("terlambat")}
          caption="scan lewat batas"
        />
        <Stat
          label={ATTENDANCE.alpa.label}
          value={count("alpa")}
          caption="tanpa keterangan"
        />
      </div>

      <Card className="p-6 sm:p-7">
        <SectionHeading
          eyebrow={`${history.length} rapat tercatat`}
          title="Riwayat Presensi"
        />

        {history.length > 0 ? (
          <div className="mt-6" role="table" aria-label="Riwayat presensi rapat">
            <div
              role="row"
              className={`hidden px-[15px] pb-3 text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase ${COLUMNS}`}
            >
              <span role="columnheader">Rapat</span>
              <span role="columnheader">Jenis</span>
              <span role="columnheader">Jadwal</span>
              <span role="columnheader">Status</span>
            </div>

            <div role="rowgroup" className="space-y-1.5">
              {history.map((meeting) => (
                <div
                  key={meeting.id}
                  role="row"
                  className={`grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3 md:min-h-[50px] md:py-2.5 ${COLUMNS}`}
                >
                  <span role="cell" className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-white">
                      {meeting.title}
                    </span>
                    <span className="block truncate text-xs text-[#6f7286]">
                      {ordinal(meeting.sequence)} · {meeting.division}
                    </span>
                  </span>
                  <span
                    role="cell"
                    className="col-start-1 text-[13px] text-[#8a8ea3] md:col-start-auto"
                  >
                    {SCOPE[meeting.scope].short}
                  </span>
                  <span
                    role="cell"
                    className="col-start-1 text-[13px] text-[#c7c9d4] md:col-start-auto"
                  >
                    {meetingTime(meeting.scheduledAt)}
                  </span>
                  <span
                    role="cell"
                    className="col-start-2 row-span-3 row-start-1 self-center md:col-start-auto md:row-span-1 md:row-start-auto"
                  >
                    <StatusBadge meeting={meeting} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title={open ? "Baru rapat ini" : "Belum ada rapat"}
              description="Rapat divisi maupun rapat gabungan yang memanggilmu akan muncul di sini beserta status presensinya."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
