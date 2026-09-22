"use client";

import Link from "next/link";
import { useState } from "react";

import { Modal } from "@/modules/admin/components/modal";
import {
  Badge,
  compactCardSurface,
  primaryButton,
  ProgressBar,
  Stat,
} from "@/modules/admin/components/ui";
import { meetingTime } from "@/modules/admin/presensi/format";
import {
  MEETING_STATE,
  meetingState,
  ordinal,
  SCOPE,
  type MeetingScope,
  type MeetingState,
} from "@/modules/admin/presensi/status";

import { ConfirmDelete } from "../components/confirm-delete";
import { IconButton, icons } from "../components/table";

import { deleteMeeting, saveMeeting } from "./actions";
import { nextSequence, type ManagedMeeting, type MeetingInput } from "./fields";
import { MeetingForm } from "./meeting-form";

type Dialog =
  | { type: "create" }
  | { type: "edit"; meeting: ManagedMeeting }
  | { type: "delete"; meeting: ManagedMeeting };

type Notice = { tone: "success" | "error"; text: string };

const READ_ONLY = "Hanya divisi penyelenggara yang bisa mengubah rapat ini";

const STATES: MeetingState[] = ["draft", "open", "closed"];

const percent = (m: ManagedMeeting) =>
  m.expected === 0 ? 0 : Math.round((m.present / m.expected) * 100);

export function MeetingManager({
  meetings,
  myDivision,
}: {
  meetings: ManagedMeeting[];
  /** The super admin's own division: the only one they can organise for. */
  myDivision: { id: string; name: string } | null;
}) {
  const [stateFilter, setStateFilter] = useState<MeetingState | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<MeetingScope | "all">("all");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const state = (m: ManagedMeeting) => meetingState(m.openedAt, m.closedAt);
  const shown = meetings.filter(
    (m) =>
      (stateFilter === "all" || state(m) === stateFilter) &&
      (scopeFilter === "all" || m.scope === scopeFilter),
  );

  const open = meetings.filter((m) => state(m) === "open").length;
  const closed = meetings.filter((m) => state(m) === "closed");
  const average =
    closed.length === 0
      ? null
      : Math.round(
          closed.reduce((sum, m) => sum + percent(m), 0) / closed.length,
        );

  const close = () => setDialog(null);
  const canEdit = (m: ManagedMeeting) => m.divisionId === myDivision?.id;
  const sequences = {
    divisi: nextSequence(meetings, "divisi", myDivision?.id ?? null),
    gabungan: nextSequence(meetings, "gabungan", myDivision?.id ?? null),
  };

  function submit(existing: ManagedMeeting | null) {
    return async (input: MeetingInput) => {
      const result = await saveMeeting(existing?.id ?? null, input);
      if (!result.error && !result.errors) {
        close();
        /* a new rapat redirects to its session page, so this is an edit */
        setNotice({
          tone: "success",
          text: `${input.title.trim()} diperbarui.`,
        });
      }
      return result;
    };
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
            Presensi Rapat
          </h1>
          <p className="mt-2 text-sm text-[#8a8ea3]">
            Buat rapat, buka presensi, lalu tampilkan QR-nya. Pengurus scan dan
            namanya masuk ke tabel secara langsung.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ type: "create" })}
          disabled={!myDivision}
          className={`${primaryButton} gap-2`}
        >
          {icons.plus}
          Buat Rapat
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          surface={compactCardSurface}
          label="Total Rapat"
          value={meetings.length}
        />
        <Stat
          surface={compactCardSurface}
          label="Presensi Dibuka"
          value={open}
          caption={open > 0 ? "sedang berlangsung" : undefined}
        />
        <Stat
          surface={compactCardSurface}
          label="Rapat Gabungan"
          value={meetings.filter((m) => m.scope === "gabungan").length}
        />
        <Stat
          surface={compactCardSurface}
          label="Rata-rata Kehadiran"
          value={average === null ? "—" : `${average}%`}
          caption={
            closed.length > 0 ? `dari ${closed.length} rapat selesai` : undefined
          }
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter status rapat"
          className="flex flex-wrap gap-2"
        >
          {(["all", ...STATES] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={stateFilter === key}
              onClick={() => setStateFilter(key)}
              className={`inline-flex h-9 items-center rounded-full border px-3.5 text-sm transition-colors ${
                stateFilter === key
                  ? "border-[#4f8dff]/20 bg-[#1b2a5c] font-medium text-white"
                  : "border-white/10 bg-white/[0.03] text-[#a3a6b8] hover:border-white/20 hover:text-white"
              }`}
            >
              {key === "all" ? "Semua" : MEETING_STATE[key].label}
            </button>
          ))}
        </div>
        <div
          role="group"
          aria-label="Filter jenis rapat"
          className="flex flex-wrap gap-2"
        >
          {(["all", "divisi", "gabungan"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={scopeFilter === key}
              onClick={() => setScopeFilter(key)}
              className={`inline-flex h-9 items-center rounded-full border px-3.5 text-sm transition-colors ${
                scopeFilter === key
                  ? "border-[#4f8dff]/20 bg-[#1b2a5c] font-medium text-white"
                  : "border-white/10 bg-white/[0.03] text-[#a3a6b8] hover:border-white/20 hover:text-white"
              }`}
            >
              {key === "all" ? "Semua jenis" : SCOPE[key].short}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : undefined}
            className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5 text-[13px] ${
              notice.tone === "error"
                ? "border-[#f87171]/25 bg-[#f87171]/10 text-[#fca5a5]"
                : "border-[#34d399]/25 bg-[#34d399]/[0.08] text-[#6ee7b7]"
            }`}
          >
            {notice.text}
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Tutup pemberitahuan"
              className="opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </p>
        )}
      </div>

      <div className={`overflow-hidden ${compactCardSurface}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
                <th scope="col" className="w-[30%] py-4 pr-3 pl-[18px] font-medium">
                  Rapat
                </th>
                <th scope="col" className="px-3 py-4 font-medium">
                  Jenis
                </th>
                <th scope="col" className="px-3 py-4 font-medium">
                  Jadwal
                </th>
                <th scope="col" className="px-3 py-4 font-medium">
                  Kehadiran
                </th>
                <th scope="col" className="px-3 py-4 font-medium">
                  Status
                </th>
                <th scope="col" className="py-4 pr-[18px] pl-3 font-medium">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => {
                const current = state(m);
                return (
                  <tr
                    key={m.id}
                    className="border-b border-white/[0.06] transition-colors last:border-b-0 hover:bg-white/[0.02]"
                  >
                    <td className="max-w-0 py-5 pr-3 pl-[18px]">
                      <Link
                        href={`/super-admin/presensi/${m.id}`}
                        className="block truncate text-sm font-semibold text-white hover:text-[#8ab4ff]"
                      >
                        {m.title}
                      </Link>
                      <p className="mt-1 truncate text-xs text-[#6f7286]">
                        {ordinal(m.sequence)} · {m.division}
                        {m.location ? ` · ${m.location}` : ""}
                      </p>
                    </td>
                    <td className="px-3">
                      <Badge tone={SCOPE[m.scope].tone}>
                        {SCOPE[m.scope].short}
                      </Badge>
                    </td>
                    <td className="px-3 whitespace-nowrap text-[#c7c9d4]">
                      {meetingTime(m.scheduledAt)}
                    </td>
                    <td className="w-[150px] px-3">
                      <p className="text-[#c7c9d4]">
                        <span className="font-semibold text-white">
                          {m.present}
                        </span>
                        <span className="text-[#6f7286]"> / {m.expected}</span>
                      </p>
                      <ProgressBar
                        percent={percent(m)}
                        label={`Kehadiran ${m.title}`}
                        className="mt-2"
                      />
                    </td>
                    <td className="px-3">
                      <Badge
                        tone={MEETING_STATE[current].tone}
                        className="px-2.5 py-1 text-xs font-semibold"
                      >
                        {MEETING_STATE[current].label}
                      </Badge>
                    </td>
                    <td className="py-2 pr-[18px] pl-3">
                      <div className="flex items-center gap-0.5">
                        <Link
                          href={`/super-admin/presensi/${m.id}`}
                          className="mr-1 inline-flex h-8 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-[#c7c9d4] transition-colors hover:border-white/20 hover:text-white"
                        >
                          {current === "open" ? "Lihat QR" : "Kelola"}
                        </Link>
                        <IconButton
                          label={canEdit(m) ? `Edit ${m.title}` : READ_ONLY}
                          onClick={() => setDialog({ type: "edit", meeting: m })}
                          disabled={!canEdit(m)}
                        >
                          {icons.edit}
                        </IconButton>
                        <IconButton
                          label={canEdit(m) ? `Hapus ${m.title}` : READ_ONLY}
                          onClick={() =>
                            setDialog({ type: "delete", meeting: m })
                          }
                          disabled={!canEdit(m)}
                          danger
                        >
                          {icons.trash}
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-[#c7c9d4]">
                      {meetings.length === 0
                        ? "Belum ada rapat"
                        : "Tidak ada rapat yang cocok"}
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#6f7286]">
                      {meetings.length === 0
                        ? "Buat rapat pertama lewat tombol Buat Rapat, lalu buka presensinya saat rapat dimulai."
                        : "Coba filter status atau jenis rapat yang lain."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={dialog?.type === "create" || dialog?.type === "edit"}
        onClose={close}
        busy={busy}
        labelledBy={
          dialog?.type === "edit" ? "edit-meeting-title" : "new-meeting-title"
        }
        className="max-w-[680px]"
      >
        {dialog?.type === "create" && (
          <MeetingForm
            division={myDivision?.name ?? null}
            sequences={sequences}
            onSubmit={submit(null)}
            onClose={close}
            onPendingChange={setBusy}
          />
        )}
        {dialog?.type === "edit" && (
          <MeetingForm
            key={dialog.meeting.id}
            meeting={dialog.meeting}
            division={dialog.meeting.division}
            sequences={sequences}
            onSubmit={submit(dialog.meeting)}
            onClose={close}
            onPendingChange={setBusy}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.type === "delete"}
        onClose={close}
        busy={busy}
        labelledBy="delete-meeting-title"
      >
        {dialog?.type === "delete" && (
          <ConfirmDelete
            titleId="delete-meeting-title"
            title="Hapus Rapat"
            onConfirm={() => deleteMeeting(dialog.meeting.id)}
            onClose={close}
            onPendingChange={setBusy}
            onDeleted={() => {
              setNotice({
                tone: "success",
                text: `Rapat ${dialog.meeting.title} dihapus.`,
              });
              close();
            }}
          >
            Rapat{" "}
            <strong className="font-semibold text-white">
              {dialog.meeting.title}
            </strong>{" "}
            beserta seluruh data presensinya akan dihapus permanen. Tindakan ini
            tidak dapat diurungkan.
          </ConfirmDelete>
        )}
      </Modal>
    </div>
  );
}
