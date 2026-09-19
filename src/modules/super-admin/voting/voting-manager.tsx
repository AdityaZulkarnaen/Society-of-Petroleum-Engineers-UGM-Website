"use client";

import { useState, useTransition } from "react";

import { Modal } from "@/modules/admin/components/modal";
import {
  Card,
  compactCardSurface,
  primaryButton,
  ProgressBar,
  SectionHeading,
} from "@/modules/admin/components/ui";
import { CandidatePhoto } from "@/modules/admin/voting/candidate-card";
import type { Candidate, Election } from "@/modules/admin/voting/data";
import { longDate } from "@/modules/admin/voting/format";

import { ConfirmDelete } from "../components/confirm-delete";
import { IconButton, icons } from "../components/table";

import {
  deleteCandidate,
  deleteElection,
  saveCandidate,
  saveElection,
  setVotingOpen,
} from "./actions";
import { CandidateForm } from "./candidate-form";
import { ElectionForm } from "./election-form";
import type { CandidateInput, ElectionInput } from "./fields";

type Dialog =
  | { type: "election" }
  | { type: "deleteElection" }
  | { type: "add" }
  | { type: "edit"; candidate: Candidate }
  | { type: "delete"; candidate: Candidate };

type Notice = { tone: "success" | "error"; text: string };

const LOCKED = "Kandidat tidak bisa ditambah atau dihapus setelah voting dibuka";

/* Solid fields inside the glass cards. */
const dateInput =
  "h-[42px] w-full rounded-lg border border-white/10 bg-[#0b0e1f]/70 px-3.5 text-sm text-white [color-scheme:dark] " +
  "focus-visible:border-[#4f8dff]/60 focus-visible:ring-4 focus-visible:ring-[#4f8dff]/15 focus-visible:outline-none " +
  "aria-invalid:border-[#f87171]/60 disabled:opacity-60";

const label = "mb-2 block text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase";

const percent = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

const formatPercent = (value: number) => `${value.toLocaleString("id-ID")}%`;

/* Pengaturan ---------------------------------------------------------------- */

function PeriodSettings({
  election,
  onEdit,
  onDelete,
  onNotice,
}: {
  election: Election;
  onEdit: () => void;
  onDelete: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [opensOn, setOpensOn] = useState(election.opensOn);
  const [closesOn, setClosesOn] = useState(election.closesOn);
  const [dateError, setDateError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [switching, startSwitching] = useTransition();

  /* dates save as soon as both make sense */
  function changeDate(field: "opensOn" | "closesOn", value: string) {
    const next = { opensOn, closesOn, [field]: value };
    if (field === "opensOn") setOpensOn(value);
    else setClosesOn(value);

    if (!next.opensOn || !next.closesOn) return;
    if (next.closesOn < next.opensOn) {
      setDateError("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }
    setDateError(null);
    startSaving(async () => {
      const result = await saveElection(election.id, {
        title: election.title,
        termLabel: election.termLabel,
        ...next,
      });
      if (result.error) setDateError(result.errors?.closesOn ?? result.error);
      else onNotice({ tone: "success", text: "Periode voting diperbarui." });
    });
  }

  function toggle() {
    startSwitching(async () => {
      const result = await setVotingOpen(election.id, !election.isOpen);
      onNotice(
        result.error
          ? { tone: "error", text: result.error }
          : {
              tone: "success",
              text: election.isOpen ? "Voting ditutup." : "Voting dibuka kembali.",
            },
      );
    });
  }

  /* what the switch means today */
  const hint = !election.isOpen
    ? "Voting ditutup. Pengurus tidak bisa memberikan suara sampai status dibuka lagi."
    : election.phase === "upcoming"
      ? `Voting akan terbuka otomatis pada ${longDate(election.opensOn)}.`
      : election.phase === "closed"
        ? "Periode voting sudah berakhir."
        : `Pengurus bisa memberikan suara sampai ${longDate(election.closesOn)}.`;

  return (
    <Card surface={compactCardSurface} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading eyebrow="Pengaturan" title="Periode & Status Voting" />
        <div className="flex gap-0.5">
          <IconButton label="Ubah judul dan periode pemilihan" onClick={onEdit}>
            {icons.edit}
          </IconButton>
          <IconButton label="Hapus pemilihan" onClick={onDelete} danger>
            {icons.trash}
          </IconButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor="voting-opens" className={label}>
            Tanggal Mulai
          </label>
          <input
            id="voting-opens"
            type="date"
            value={opensOn}
            onChange={(e) => changeDate("opensOn", e.target.value)}
            disabled={saving}
            className={dateInput}
          />
        </div>
        <div>
          <label htmlFor="voting-closes" className={label}>
            Tanggal Selesai
          </label>
          <input
            id="voting-closes"
            type="date"
            value={closesOn}
            min={opensOn}
            onChange={(e) => changeDate("closesOn", e.target.value)}
            disabled={saving}
            aria-invalid={Boolean(dateError)}
            aria-describedby={dateError ? "voting-dates-error" : undefined}
            className={dateInput}
          />
        </div>
        <div>
          <p id="voting-status-label" className={label}>
            Status Voting
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={election.isOpen}
            aria-labelledby="voting-status-label"
            onClick={toggle}
            disabled={switching}
            className={`flex h-[42px] min-w-[170px] items-center gap-3 rounded-lg border px-4 text-sm font-medium transition-colors disabled:opacity-60 ${
              election.isOpen
                ? "border-[#34d399]/20 bg-[#0c2a2e]/70 text-[#4ade80]"
                : "border-white/10 bg-[#0b0e1f]/70 text-[#a3a6b8]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                election.isOpen ? "bg-[#22c55e]" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left] ${
                  election.isOpen ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
            {election.isOpen ? "Voting Dibuka" : "Voting Ditutup"}
          </button>
        </div>
      </div>

      <p
        id="voting-dates-error"
        aria-live="polite"
        className={`mt-3 text-xs ${dateError ? "text-[#fca5a5]" : "text-[#6f7286]"}`}
      >
        {dateError ?? (saving ? "Menyimpan…" : hint)}
      </p>
      <p className="mt-1 text-xs text-[#5d6075]">
        {election.title} · periode {election.termLabel}
      </p>
    </Card>
  );
}

/* Hasil Voting Live ---------------------------------------------------------- */

function LiveResults({
  election,
  results,
}: {
  election: Election;
  results: Record<string, number>;
}) {
  const cast = Object.values(results).reduce((a, b) => a + b, 0);
  const eligible = election.turnout?.eligible ?? 0;
  const ranked = [...election.candidates]
    .map((c) => ({ candidate: c, votes: results[c.id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.candidate.number - b.candidate.number);

  return (
    <Card surface={compactCardSurface} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading eyebrow="Khusus Admin" title="Hasil Voting Live" />
        <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 text-[11px] font-bold tracking-[0.08em] text-[#fbbf24] uppercase">
          Internal Only
        </span>
      </div>

      {ranked.length > 0 ? (
        <ol className="mt-7 space-y-5">
          {ranked.map(({ candidate, votes }, i) => {
            const share = percent(votes, cast);
            return (
              <li key={candidate.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid h-5 min-w-6 shrink-0 place-items-center rounded-full px-1 text-[10px] font-bold ${
                        i === 0
                          ? "bg-[#1b2a5c] text-[#6aa5ff] ring-1 ring-[#3b82f6]/50"
                          : "bg-white/[0.07] text-[#a3a6b8] ring-1 ring-white/10"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <span className="truncate text-[15px] font-medium text-white">
                      {candidate.fullName}
                    </span>
                  </p>
                  <p className="shrink-0 text-xs text-[#8a8ea3]">
                    <span className="text-lg font-bold text-white">{votes}</span> suara ·{" "}
                    {formatPercent(share)}
                  </p>
                </div>
                <ProgressBar
                  percent={share}
                  label={`Perolehan ${candidate.fullName}`}
                  className="mt-2.5"
                />
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-[#6f7286]">Belum ada kandidat.</p>
      )}

      <div className="mt-7 flex flex-wrap items-baseline justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0b0e1f]/50 px-4 py-3.5">
        <span className="text-sm text-[#a3a6b8]">Total suara masuk</span>
        <span className="text-xs text-[#8a8ea3]">
          <span className="text-lg font-bold text-white">{cast}</span> dari {eligible} pemilih
          aktif ({formatPercent(percent(cast, eligible))})
        </span>
      </div>
      <p className="mt-4 text-center text-xs text-[#5d6075]">
        ↑ Tampilan ini hanya terlihat oleh admin. Halaman voting pengurus hanya
        menampilkan jumlah partisipasi umum, tanpa rincian per kandidat.
      </p>
    </Card>
  );
}

/* The page ------------------------------------------------------------------- */

export function VotingManager({
  election,
  started,
  results,
  defaultTerm,
}: {
  election: Election | null;
  started: boolean;
  results: Record<string, number>;
  /** Suggested term for a new election. */
  defaultTerm: string;
}) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const close = () => setDialog(null);
  const candidates = election?.candidates ?? [];
  const cast = Object.values(results).reduce((a, b) => a + b, 0);

  async function submitElection(input: ElectionInput) {
    const result = await saveElection(election?.id ?? null, input);
    if (!result.error && !result.errors) {
      close();
      setNotice({
        tone: "success",
        text: election ? "Pemilihan diperbarui." : "Pemilihan berhasil dibuat.",
      });
    }
    return result;
  }

  function submitCandidate(existing: Candidate | null) {
    return async (input: CandidateInput) => {
      if (!election) return { error: "Buat pemilihan terlebih dahulu." };
      const result = await saveCandidate(election.id, existing?.id ?? null, input);
      if (!result.error && !result.errors) {
        close();
        setNotice({
          tone: "success",
          text: existing
            ? `Data ${input.fullName.trim()} diperbarui.`
            : `${input.fullName.trim()} ditambahkan sebagai kandidat.`,
        });
      }
      return result;
    };
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
          Manajemen Voting
        </h1>
        <p className="mt-2 text-sm text-[#8a8ea3]">
          Atur periode, kandidat, dan pantau hasil pemilihan Ketua Umum.
        </p>
      </header>

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

      {!election ? (
        <Card surface={compactCardSurface} className="px-6 py-14 text-center">
          <p className="text-base font-semibold">Belum ada pemilihan</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#8a8ea3]">
            Buat pemilihan dengan menentukan periode yang dipilih dan tanggal
            voting, lalu tambahkan kandidatnya.
          </p>
          <button
            type="button"
            onClick={() => setDialog({ type: "election" })}
            className={`${primaryButton} mt-6`}
          >
            Buat Pemilihan
          </button>
        </Card>
      ) : (
        <>
          <PeriodSettings
            key={`${election.id}-${election.opensOn}-${election.closesOn}`}
            election={election}
            onEdit={() => setDialog({ type: "election" })}
            onDelete={() => setDialog({ type: "deleteElection" })}
            onNotice={setNotice}
          />

          <Card surface={compactCardSurface} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionHeading eyebrow={`${candidates.length} kandidat`} title="Daftar Kandidat" />
              <button
                type="button"
                onClick={() => setDialog({ type: "add" })}
                disabled={started}
                title={started ? LOCKED : undefined}
                className={`${primaryButton} gap-2`}
              >
                {icons.plus}
                Tambah Kandidat
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
                      <th scope="col" className="w-[72px] py-3.5 pr-2 pl-4 font-medium">Foto</th>
                      <th scope="col" className="w-[28%] px-3 py-3.5 font-medium">Nama</th>
                      <th scope="col" className="px-3 py-3.5 font-medium">Visi</th>
                      <th scope="col" className="w-[96px] py-3.5 pr-4 pl-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate) => (
                      <tr
                        key={candidate.id}
                        className="border-b border-white/[0.06] last:border-b-0"
                      >
                        <td className="py-3 pr-2 pl-4">
                          <CandidatePhoto
                            candidate={candidate}
                            sizes="40px"
                            className="h-[52px] w-10 rounded-md border-[#34d399]/30 text-xs"
                          />
                        </td>
                        <td className="px-3">
                          <p className="text-sm font-semibold text-white">
                            <span className="sr-only">Kandidat {candidate.number}: </span>
                            {candidate.fullName}
                          </p>
                          {candidate.nim && (
                            <p className="mt-1 text-xs text-[#6f7286]">{candidate.nim}</p>
                          )}
                        </td>
                        <td className="max-w-0 px-3">
                          <p className="line-clamp-2 leading-relaxed text-[#a3a6b8]">
                            {candidate.vision || <span className="text-[#5d6075]">—</span>}
                          </p>
                        </td>
                        <td className="py-2 pr-4 pl-3">
                          <div className="flex gap-0.5">
                            <IconButton
                              label={`Edit ${candidate.fullName}`}
                              onClick={() => setDialog({ type: "edit", candidate })}
                            >
                              {icons.edit}
                            </IconButton>
                            <IconButton
                              label={started ? LOCKED : `Hapus ${candidate.fullName}`}
                              onClick={() => setDialog({ type: "delete", candidate })}
                              disabled={started}
                              danger
                            >
                              {icons.trash}
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {candidates.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-[13px] text-[#6f7286]">
                          {started
                            ? "Voting sudah dibuka tanpa kandidat. Mundurkan tanggal mulai untuk menambahkan kandidat."
                            : "Belum ada kandidat. Tambahkan lewat tombol Tambah Kandidat."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <LiveResults election={election} results={results} />
        </>
      )}

      <Modal
        open={dialog?.type === "election"}
        onClose={close}
        busy={busy}
        labelledBy="election-dialog-title"
        className="max-w-[600px]"
      >
        {dialog?.type === "election" && (
          <ElectionForm
            election={election ?? undefined}
            defaultTerm={defaultTerm}
            onSubmit={submitElection}
            onClose={close}
            onPendingChange={setBusy}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.type === "add" || dialog?.type === "edit"}
        onClose={close}
        busy={busy}
        labelledBy={dialog?.type === "edit" ? "edit-candidate-title" : "new-candidate-title"}
        className="max-w-[760px]"
      >
        {dialog?.type === "add" && (
          <CandidateForm
            onSubmit={submitCandidate(null)}
            onClose={close}
            onPendingChange={setBusy}
          />
        )}
        {dialog?.type === "edit" && (
          <CandidateForm
            key={dialog.candidate.id}
            candidate={dialog.candidate}
            onSubmit={submitCandidate(dialog.candidate)}
            onClose={close}
            onPendingChange={setBusy}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.type === "delete" || dialog?.type === "deleteElection"}
        onClose={close}
        busy={busy}
        labelledBy="delete-voting-title"
      >
        {dialog?.type === "delete" && (
          <ConfirmDelete
            titleId="delete-voting-title"
            title="Hapus Kandidat"
            onConfirm={() => deleteCandidate(dialog.candidate.id)}
            onClose={close}
            onPendingChange={setBusy}
            onDeleted={() => {
              setNotice({
                tone: "success",
                text: `${dialog.candidate.fullName} dihapus dari daftar kandidat.`,
              });
              close();
            }}
          >
            Kandidat{" "}
            <strong className="font-semibold text-white">{dialog.candidate.fullName}</strong>{" "}
            akan dihapus dan nomor urut kandidat setelahnya maju satu. Tindakan ini
            tidak dapat diurungkan.
          </ConfirmDelete>
        )}
        {dialog?.type === "deleteElection" && election && (
          <ConfirmDelete
            titleId="delete-voting-title"
            title="Hapus Pemilihan"
            onConfirm={() => deleteElection(election.id)}
            onClose={close}
            onPendingChange={setBusy}
            onDeleted={() => {
              setNotice({ tone: "success", text: `${election.title} dihapus.` });
              close();
            }}
          >
            <strong className="font-semibold text-white">{election.title}</strong> akan
            dihapus permanen beserta {candidates.length} kandidat
            {cast > 0 ? ` dan ${cast} suara yang sudah masuk` : ""}. Tindakan ini tidak
            dapat diurungkan.
          </ConfirmDelete>
        )}
      </Modal>
    </div>
  );
}
