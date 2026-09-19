"use client";

import { useState } from "react";

import {
  PROKER_STATUSES,
  STATUS,
  type ProkerStatus,
} from "@/modules/admin/acara/status";
import { Modal } from "@/modules/admin/components/modal";
import { Badge, primaryButton, Stat } from "@/modules/admin/components/ui";

import { ConfirmDelete } from "../components/confirm-delete";
import { IconButton, icons } from "../components/table";

import { deleteProker, saveProker } from "./actions";
import type {
  Division,
  ManagedProker,
  PengurusOption,
  ProkerInput,
} from "./fields";
import { ProkerForm } from "./proker-form";

type Dialog =
  | { type: "create" }
  | { type: "edit"; proker: ManagedProker }
  | { type: "delete"; proker: ManagedProker };

type Notice = { tone: "success" | "error"; text: string };

const firstName = (name: string) => name.split(" ")[0];

const READ_ONLY = "Hanya divisi penyelenggara yang bisa mengubah proker ini";

function Members({ members }: { members: ManagedProker["members"] }) {
  if (members.length === 0) return <span className="text-[#5d6075]">—</span>;
  const more = members.length - 2;
  return (
    <div className="space-y-1">
      <ul className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2.5 gap-y-1">
        {members.slice(0, 2).map((m) => (
          <li key={m.profileId} className="contents">
            <span className="text-[13px] text-white" title={m.name}>
              {firstName(m.name)}
            </span>
            <span aria-hidden="true" className="size-1 rounded-full bg-[#c7c9d4]" />
            <span className="truncate text-[11px] text-[#6f7286]">{m.role}</span>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p
          className="text-xs text-[#8a8ea3]"
          title={members
            .slice(2)
            .map((m) => `${m.name} (${m.role})`)
            .join(", ")}
        >
          +{more} lainnya
        </p>
      )}
    </div>
  );
}

export function ProkerManager({
  proker,
  divisions,
  pengurus,
  myDivision,
}: {
  proker: ManagedProker[];
  divisions: Division[];
  pengurus: PengurusOption[];
  /** The super admin's own division, the only one they can edit. */
  myDivision: Division | null;
}) {
  const [filter, setFilter] = useState<ProkerStatus | "all">("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const count = (status: ProkerStatus) => proker.filter((p) => p.status === status).length;
  const summary = (["berlangsung", "direncanakan", "selesai", "dibatalkan"] as const)
    .filter((s) => s !== "dibatalkan" || count(s) > 0)
    .map((s) => `${count(s)} ${STATUS[s].label.toLowerCase()}`)
    .join(" · ");

  const shown = proker.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      (divisionFilter === "all" || p.divisionId === divisionFilter),
  );

  const close = () => setDialog(null);
  const canEdit = (p: ManagedProker) => p.divisionId === myDivision?.id;

  function submit(existing: ManagedProker | null) {
    return async (input: ProkerInput) => {
      const result = await saveProker(existing?.id ?? null, input);
      if (!result.error && !result.errors) {
        close();
        setNotice({
          tone: "success",
          text: existing
            ? `Proker ${input.name.trim()} diperbarui.`
            : `Proker ${input.name.trim()} berhasil dibuat.`,
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
            Acara &amp; Proker
          </h1>
          <p className="mt-2 text-sm text-[#8a8ea3]">{summary}</p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ type: "create" })}
          disabled={!myDivision}
          className={`${primaryButton} gap-2`}
        >
          {icons.plus}
          Tambah Proker
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Proker" value={proker.length} />
        <Stat label="Berlangsung" value={count("berlangsung")} />
        <Stat label="Direncanakan" value={count("direncanakan")} />
        <Stat label="Selesai" value={count("selesai")} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter status proker" className="flex flex-wrap gap-2">
          {(["all", ...PROKER_STATUSES] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`inline-flex h-9 items-center rounded-full border px-3.5 text-sm transition-colors ${
                filter === key
                  ? "border-[#4f8dff]/20 bg-[#1b2a5c] font-medium text-white"
                  : "border-white/10 bg-white/[0.03] text-[#a3a6b8] hover:border-white/20 hover:text-white"
              }`}
            >
              {key === "all" ? "Semua" : STATUS[key].label}
            </button>
          ))}
        </div>
        <label className="relative sm:w-48">
          <span className="sr-only">Filter divisi</span>
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="h-9 w-full appearance-none rounded-lg border border-white/[0.12] bg-[#0d1024] pr-9 pl-3.5 text-sm text-white focus-visible:border-[#4f8dff]/60 focus-visible:ring-4 focus-visible:ring-[#4f8dff]/15 focus-visible:outline-none [&>option]:bg-[#151a38]"
          >
            <option value="all">Semua divisi</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[#8a8ea3]">
            <path d="m3 4.5 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
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

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.015]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
                <th scope="col" className="w-[30%] py-4 pr-3 pl-[18px] font-medium">Nama Proker</th>
                <th scope="col" className="px-3 py-4 font-medium">Divisi</th>
                <th scope="col" className="px-3 py-4 font-medium">Pengurus Terlibat</th>
                <th scope="col" className="px-3 py-4 font-medium">Periode</th>
                <th scope="col" className="px-3 py-4 font-medium">Status</th>
                <th scope="col" className="py-4 pr-[18px] pl-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-white/[0.06] transition-colors last:border-b-0 hover:bg-white/[0.02]"
                >
                  <td className="max-w-0 py-5 pr-3 pl-[18px]">
                    <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                    {p.description && (
                      <p className="mt-1 truncate text-xs text-[#6f7286]" title={p.description}>
                        {p.description}
                      </p>
                    )}
                  </td>
                  <td className="px-3 whitespace-nowrap text-[#c7c9d4]">{p.division}</td>
                  <td className="px-3 py-4">
                    <Members members={p.members} />
                  </td>
                  <td className="px-3 text-xs leading-relaxed whitespace-nowrap text-[#8a8ea3]">
                    {p.startsOn || p.endsOn ? (
                      <>
                        <span className="block">{p.startsOn ?? "—"}</span>
                        <span className="block">{p.endsOn ?? "—"}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3">
                    <Badge tone={STATUS[p.status].tone} className="px-2.5 py-1 text-xs font-semibold">
                      {STATUS[p.status].label}
                    </Badge>
                  </td>
                  <td className="py-2 pr-[18px] pl-3">
                    <div className="flex gap-0.5">
                      <IconButton
                        label={canEdit(p) ? `Edit ${p.name}` : READ_ONLY}
                        onClick={() => setDialog({ type: "edit", proker: p })}
                        disabled={!canEdit(p)}
                      >
                        {icons.edit}
                      </IconButton>
                      <IconButton
                        label={canEdit(p) ? `Hapus ${p.name}` : READ_ONLY}
                        onClick={() => setDialog({ type: "delete", proker: p })}
                        disabled={!canEdit(p)}
                        danger
                      >
                        {icons.trash}
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-[#c7c9d4]">
                      {proker.length === 0 ? "Belum ada proker" : "Tidak ada proker yang cocok"}
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#6f7286]">
                      {proker.length === 0
                        ? "Tambahkan proker pertama lewat tombol Tambah Proker."
                        : "Coba filter status atau divisi lain."}
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
        labelledBy={dialog?.type === "edit" ? "edit-proker-title" : "new-proker-title"}
        className="max-w-[760px]"
      >
        {dialog?.type === "create" && (
          <ProkerForm
            division={myDivision?.name ?? null}
            pengurus={pengurus}
            onSubmit={submit(null)}
            onClose={close}
            onPendingChange={setBusy}
          />
        )}
        {dialog?.type === "edit" && (
          <ProkerForm
            key={dialog.proker.id}
            proker={dialog.proker}
            division={dialog.proker.division}
            pengurus={pengurus}
            onSubmit={submit(dialog.proker)}
            onClose={close}
            onPendingChange={setBusy}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.type === "delete"}
        onClose={close}
        busy={busy}
        labelledBy="delete-proker-title"
      >
        {dialog?.type === "delete" && (
          <ConfirmDelete
            titleId="delete-proker-title"
            title="Hapus Proker"
            onConfirm={() => deleteProker(dialog.proker.id)}
            onClose={close}
            onPendingChange={setBusy}
            onDeleted={() => {
              setNotice({ tone: "success", text: `Proker ${dialog.proker.name} dihapus.` });
              close();
            }}
          >
            Proker <strong className="font-semibold text-white">{dialog.proker.name}</strong>{" "}
            beserta daftar pengurusnya akan dihapus permanen. Tindakan ini tidak dapat
            diurungkan.
          </ConfirmDelete>
        )}
      </Modal>
    </div>
  );
}
