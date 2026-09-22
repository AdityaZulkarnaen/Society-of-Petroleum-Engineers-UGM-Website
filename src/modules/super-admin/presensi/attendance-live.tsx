"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { getBrowserClient } from "@/lib/supabase/client";
import { Select } from "@/modules/admin/components/form";
import {
  Badge,
  compactCardSurface,
  initials,
} from "@/modules/admin/components/ui";
import { clock, sinceNow } from "@/modules/admin/presensi/format";
import {
  ATTENDANCE,
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
} from "@/modules/admin/presensi/status";

import { icons } from "../components/table";

import { setAttendance } from "./actions";
import type { AttendanceRow } from "./fields";

/* How long a fresh scan is highlighted in the table. */
const FRESH_MS = 20_000;

/* Realtime is the fast path; this keeps the table honest if the socket drops. */
const POLL_MS = 15_000;

const METHOD: Record<NonNullable<AttendanceRow["method"]>, string> = {
  qr: "Scan QR",
  manual: "Manual",
  otomatis: "Otomatis",
};

/** Keeps the page in step with the rows arriving from the pengurus' scans. */
function useLiveAttendance(meetingId: string, isOpen: boolean) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    /* a scan can land while the last refresh is still in flight, so coalesce */
    let pending: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (pending) return;
      pending = setTimeout(() => {
        pending = null;
        router.refresh();
      }, 250);
    };

    const channel = getBrowserClient()
      .channel(`presensi:${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_attendance",
          filter: `meeting_id=eq.${meetingId}`,
        },
        refresh,
      )
      .subscribe((status: string) => setConnected(status === "SUBSCRIBED"));

    const poll = setInterval(refresh, POLL_MS);

    return () => {
      if (pending) clearTimeout(pending);
      clearInterval(poll);
      setConnected(false);
      void channel.unsubscribe();
    };
  }, [meetingId, isOpen, router]);

  return connected;
}

function StatusCell({ row, now }: { row: AttendanceRow; now: number }) {
  if (!row.status) {
    return <span className="text-[13px] text-[#5d6075]">Belum presensi</span>;
  }
  const fresh =
    row.checkedInAt && now - new Date(row.checkedInAt).getTime() < FRESH_MS;

  return (
    <span className="flex items-center gap-2">
      <Badge
        tone={ATTENDANCE[row.status].tone}
        className="px-2.5 py-1 text-xs font-semibold"
      >
        {ATTENDANCE[row.status].label}
      </Badge>
      {fresh && (
        <span className="text-[11px] font-medium text-[#6ee7b7]">baru</span>
      )}
    </span>
  );
}

/** The manual override: a status per pengurus, and a note for izin or sakit. */
function RowActions({
  meetingId,
  row,
  onError,
}: {
  meetingId: string;
  row: AttendanceRow;
  onError: (message: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(row.note ?? "");
  const needsNote = row.status === "izin" || row.status === "sakit";

  const save = (status: string | null, withNote = note) =>
    startTransition(async () => {
      const result = await setAttendance(meetingId, row.profileId, status, withNote);
      onError(result.error ?? null);
    });

  return (
    <div className="space-y-2">
      <Select
        aria-label={`Status presensi ${row.name}`}
        value={row.status ?? ""}
        disabled={pending}
        onChange={(event) => save(event.target.value || null)}
      >
        <option value="">Belum presensi</option>
        {ATTENDANCE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ATTENDANCE[status].label}
          </option>
        ))}
      </Select>
      {needsNote && (
        <input
          aria-label={`Keterangan ${row.name}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => {
            if ((row.note ?? "") !== note) save(row.status, note);
          }}
          placeholder="Keterangan (opsional)"
          maxLength={200}
          className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-white placeholder:text-[#6f7286] focus-visible:border-[#4f8dff]/60 focus-visible:outline-none"
        />
      )}
    </div>
  );
}

export function AttendanceLive({
  meetingId,
  rows,
  isOpen,
  canManage,
}: {
  meetingId: string;
  rows: AttendanceRow[];
  /** The presensi is open, so rows are still arriving. */
  isOpen: boolean;
  /** Only the organising division may correct a status. */
  canManage: boolean;
}) {
  const connected = useLiveAttendance(meetingId, isOpen);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AttendanceStatus | "all" | "pending">(
    "all",
  );
  const [error, setError] = useState<string | null>(null);
  /* only for the 'baru' flag and the relative times */
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isOpen) return;
    const tick = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(tick);
  }, [isOpen]);

  const needle = query.trim().toLowerCase();
  const shown = rows.filter((row) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" ? row.status === null : row.status === filter);
    return (
      matchesFilter &&
      (needle === "" ||
        row.name.toLowerCase().includes(needle) ||
        (row.division ?? "").toLowerCase().includes(needle))
    );
  });

  const count = (status: AttendanceStatus) =>
    rows.filter((row) => row.status === status).length;
  const pending = rows.filter((row) => row.status === null).length;

  const chips = [
    { key: "all" as const, label: `Semua (${rows.length})` },
    ...ATTENDANCE_STATUSES.filter((status) => count(status) > 0).map(
      (status) => ({
        key: status,
        label: `${ATTENDANCE[status].label} (${count(status)})`,
      }),
    ),
    ...(pending > 0
      ? [{ key: "pending" as const, label: `Belum presensi (${pending})` }]
      : []),
  ];

  return (
    <section className={`overflow-hidden ${compactCardSurface}`}>
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[15px] font-bold tracking-[-0.01em]">
              Daftar Presensi
            </h2>
            {isOpen && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/25 bg-[#34d399]/[0.08] px-2.5 py-1 text-[11px] font-medium text-[#6ee7b7]">
                <span
                  className={`size-1.5 rounded-full bg-[#34d399] ${
                    connected ? "animate-pulse" : "opacity-50"
                  }`}
                  aria-hidden="true"
                />
                {connected ? "Live" : "Menyambung…"}
              </span>
            )}
          </div>
          <label className="relative w-full sm:w-64">
            <span className="sr-only">Cari nama pengurus</span>
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#8a8ea3]">
              {icons.search}
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau divisi…"
              className="h-9 w-full rounded-lg border border-white/[0.12] bg-[#0d1024] pr-3.5 pl-10 text-sm text-white placeholder:text-[#6f7286] focus-visible:border-[#4f8dff]/60 focus-visible:ring-4 focus-visible:ring-[#4f8dff]/15 focus-visible:outline-none"
            />
          </label>
        </div>

        <div
          role="group"
          aria-label="Filter status presensi"
          className="flex flex-wrap gap-2"
        >
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              aria-pressed={filter === chip.key}
              onClick={() => setFilter(chip.key)}
              className={`inline-flex h-8 items-center rounded-full border px-3 text-xs transition-colors ${
                filter === chip.key
                  ? "border-[#4f8dff]/20 bg-[#1b2a5c] font-medium text-white"
                  : "border-white/10 bg-white/[0.03] text-[#a3a6b8] hover:border-white/20 hover:text-white"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {`${rows.filter((row) => row.status !== null).length} dari ${rows.length} pengurus sudah presensi`}
      </div>

      {error && (
        <p
          role="alert"
          className="border-b border-white/[0.06] bg-[#f87171]/10 px-5 py-3 text-[13px] text-[#fca5a5]"
        >
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
              <th scope="col" className="py-4 pr-3 pl-[18px] font-medium">
                Pengurus
              </th>
              <th scope="col" className="px-3 py-4 font-medium">
                Status
              </th>
              <th scope="col" className="px-3 py-4 font-medium">
                Waktu
              </th>
              <th scope="col" className="px-3 py-4 font-medium">
                Cara
              </th>
              {canManage && (
                <th
                  scope="col"
                  className="w-[180px] py-4 pr-[18px] pl-3 font-medium"
                >
                  Ubah Status
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr
                key={row.profileId}
                className="border-b border-white/[0.06] transition-colors last:border-b-0 hover:bg-white/[0.02]"
              >
                <td className="py-3.5 pr-3 pl-[18px]">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-full border border-[#4f6bff]/40 bg-[radial-gradient(circle_at_30%_25%,#2d3a8c_0%,#1a2160_100%)] text-[12px] font-bold text-white"
                    >
                      {initials(row.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">
                        {row.name}
                      </span>
                      <span className="block truncate text-xs text-[#6f7286]">
                        {[row.division, row.position]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-3">
                  <StatusCell row={row} now={now} />
                  {row.note && (
                    <p className="mt-1 text-xs text-[#6f7286]">{row.note}</p>
                  )}
                </td>
                <td className="px-3 whitespace-nowrap text-[#c7c9d4]">
                  {row.checkedInAt ? (
                    <>
                      <span className="block">{clock(row.checkedInAt)}</span>
                      <span className="block text-xs text-[#6f7286]">
                        {sinceNow(row.checkedInAt, now)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[#5d6075]">—</span>
                  )}
                </td>
                <td className="px-3 whitespace-nowrap text-[#8a8ea3]">
                  {row.method ? METHOD[row.method] : "—"}
                </td>
                {canManage && (
                  <td className="py-2.5 pr-[18px] pl-3">
                    <RowActions
                      meetingId={meetingId}
                      row={row}
                      onError={setError}
                    />
                  </td>
                )}
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="px-6 py-12 text-center"
                >
                  <p className="text-sm font-medium text-[#c7c9d4]">
                    {rows.length === 0
                      ? "Belum ada peserta"
                      : "Tidak ada yang cocok"}
                  </p>
                  <p className="mt-1.5 text-[13px] text-[#6f7286]">
                    {rows.length === 0
                      ? "Peserta rapat diambil dari pengurus aktif sesuai jenis rapatnya."
                      : "Coba kata kunci atau filter status yang lain."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
