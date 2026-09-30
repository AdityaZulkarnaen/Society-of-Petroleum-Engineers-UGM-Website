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

const LOCKED = "Candidates cannot be added or deleted after voting opens";

/* Solid fields inside the glass cards. */
const dateInput =
  "h-[42px] w-full rounded-lg border border-white/10 bg-[#0b0e1f]/70 px-3.5 text-sm text-white [color-scheme:dark] " +
  "focus-visible:border-[#4f8dff]/60 focus-visible:ring-4 focus-visible:ring-[#4f8dff]/15 focus-visible:outline-none " +
  "aria-invalid:border-[#f87171]/60 disabled:opacity-60";

const label = "mb-2 block text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase";

const percent = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

const formatPercent = (value: number) => `${value.toLocaleString("en-US")}%`;

/* Settings ------------------------------------------------------------------ */

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
      setDateError("End date must be after start date.");
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
      else onNotice({ tone: "success", text: "Voting period updated." });
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
              text: election.isOpen ? "Voting closed." : "Voting reopened.",
            },
      );
    });
  }

  /* what the switch means today */
  const hint = !election.isOpen
    ? "Voting closed. Officers cannot cast votes until the status is reopened."
    : election.phase === "upcoming"
      ? `Voting will open automatically on ${longDate(election.opensOn)}.`
      : election.phase === "closed"
        ? "Voting period has ended."
        : `Officers can cast votes until ${longDate(election.closesOn)}.`;

  return (
    <Card surface={compactCardSurface} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading eyebrow="Settings" title="Voting Period & Status" />
        <div className="flex gap-0.5">
          <IconButton label="Edit election title and period" onClick={onEdit}>
            {icons.edit}
          </IconButton>
          <IconButton label="Delete election" onClick={onDelete} danger>
            {icons.trash}
          </IconButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor="voting-opens" className={label}>
            Start Date
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
            End Date
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
            Voting Status
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
            {election.isOpen ? "Voting Open" : "Voting Closed"}
          </button>
        </div>
      </div>

      <p
        id="voting-dates-error"
        aria-live="polite"
        className={`mt-3 text-xs ${dateError ? "text-[#fca5a5]" : "text-[#6f7286]"}`}
      >
        {dateError ?? (saving ? "Saving…" : hint)}
      </p>
      <p className="mt-1 text-xs text-[#5d6075]">
        {election.title} · term {election.termLabel}
      </p>
    </Card>
  );
}

/* Live Voting Results ------------------------------------------------------- */

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
        <SectionHeading eyebrow="Admin Only" title="Live Voting Results" />
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
                    <span className="text-lg font-bold text-white">{votes}</span>{" "}
                    {votes === 1 ? "vote" : "votes"} · {formatPercent(share)}
                  </p>
                </div>
                <ProgressBar
                  percent={share}
                  label={`Votes for ${candidate.fullName}`}
                  className="mt-2.5"
                />
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-[#6f7286]">No candidates yet.</p>
      )}

      <div className="mt-7 flex flex-wrap items-baseline justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0b0e1f]/50 px-4 py-3.5">
        <span className="text-sm text-[#a3a6b8]">Total votes cast</span>
        <span className="text-xs text-[#8a8ea3]">
          <span className="text-lg font-bold text-white">{cast}</span> of {eligible} eligible
          voters ({formatPercent(percent(cast, eligible))})
        </span>
      </div>
      <p className="mt-4 text-center text-xs text-[#5d6075]">
        ↑ This view is visible only to administrators. The officer voting page only
        displays overall participation turnout, without individual candidate breakdowns.
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
        text: election ? "Election updated." : "Election created successfully.",
      });
    }
    return result;
  }

  function submitCandidate(existing: Candidate | null) {
    return async (input: CandidateInput) => {
      if (!election) return { error: "Create an election first." };
      const result = await saveCandidate(election.id, existing?.id ?? null, input);
      if (!result.error && !result.errors) {
        close();
        setNotice({
          tone: "success",
          text: existing
            ? `Data for ${input.fullName.trim()} updated.`
            : `${input.fullName.trim()} added as candidate.`,
        });
      }
      return result;
    };
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
          Voting Management
        </h1>
        <p className="mt-2 text-sm text-[#8a8ea3]">
          Manage periods, candidates, and monitor election results.
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
              aria-label="Dismiss notification"
              className="opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </p>
        )}
      </div>

      {!election ? (
        <Card surface={compactCardSurface} className="px-6 py-14 text-center">
          <p className="text-base font-semibold">No election yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#8a8ea3]">
            Create an election by specifying the elected term and voting dates,
            then add the candidates.
          </p>
          <button
            type="button"
            onClick={() => setDialog({ type: "election" })}
            className={`${primaryButton} mt-6`}
          >
            Create Election
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
              <SectionHeading
                eyebrow={`${candidates.length} ${candidates.length === 1 ? "candidate" : "candidates"}`}
                title="Candidates List"
              />
              <button
                type="button"
                onClick={() => setDialog({ type: "add" })}
                disabled={started}
                title={started ? LOCKED : undefined}
                className={`${primaryButton} gap-2`}
              >
                {icons.plus}
                Add Candidate
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
                      <th scope="col" className="w-[72px] py-3.5 pr-2 pl-4 font-medium">Photo</th>
                      <th scope="col" className="w-[28%] px-3 py-3.5 font-medium">Name</th>
                      <th scope="col" className="px-3 py-3.5 font-medium">Vision</th>
                      <th scope="col" className="w-[96px] py-3.5 pr-4 pl-3 font-medium">Actions</th>
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
                            <span className="sr-only">Candidate {candidate.number}: </span>
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
                              label={started ? LOCKED : `Delete ${candidate.fullName}`}
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
                            ? "Voting has opened without candidates. Adjust the start date to add candidates."
                            : "No candidates yet. Add candidates using the Add Candidate button."}
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
            title="Delete Candidate"
            onConfirm={() => deleteCandidate(dialog.candidate.id)}
            onClose={close}
            onPendingChange={setBusy}
            onDeleted={() => {
              setNotice({
                tone: "success",
                text: `${dialog.candidate.fullName} removed from candidate list.`,
              });
              close();
            }}
          >
            Candidate{" "}
            <strong className="font-semibold text-white">{dialog.candidate.fullName}</strong>{" "}
            will be deleted and subsequent candidate numbers will shift up. This action
            cannot be undone.
          </ConfirmDelete>
        )}
        {dialog?.type === "deleteElection" && election && (
          <ConfirmDelete
            titleId="delete-voting-title"
            title="Delete Election"
            onConfirm={() => deleteElection(election.id)}
            onClose={close}
            onPendingChange={setBusy}
            onDeleted={() => {
              setNotice({ tone: "success", text: `${election.title} deleted.` });
              close();
            }}
          >
            <strong className="font-semibold text-white">{election.title}</strong> will be
            permanently deleted along with {candidates.length} candidate{candidates.length === 1 ? "" : "s"}
            {cast > 0 ? ` and ${cast} vote${cast === 1 ? "" : "s"} already cast` : ""}. This action cannot
            be undone.
          </ConfirmDelete>
        )}
      </Modal>
    </div>
  );
}
