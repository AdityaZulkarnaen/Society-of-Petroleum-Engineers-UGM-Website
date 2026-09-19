"use client";

import { useRef, useState, useTransition } from "react";

import { Card } from "../components/ui";
import { castVote } from "./actions";
import {
  CandidateCard,
  CandidateSummary,
  primaryButton,
} from "./candidate-card";
import type { Candidate } from "./data";

function Radio({ id, checked, onSelect }: {
  id: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <span className="pointer-events-auto relative grid size-6 shrink-0 place-items-center">
      <input
        type="radio"
        name="candidate"
        id={id}
        checked={checked}
        onChange={onSelect}
        className="peer absolute inset-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-white/30 transition-colors checked:border-[#4f8dff] hover:border-white/50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#4f8dff]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none size-3 scale-0 rounded-full bg-[#4f8dff] shadow-[0_0_10px_rgba(79,141,255,0.8)] transition-transform duration-150 peer-checked:scale-100"
      />
    </span>
  );
}

/** Pick a candidate, confirm in a dialog, and cast the vote. */
export function Ballot({ candidates }: { candidates: Candidate[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);

  const selected = candidates.find((c) => c.id === selectedId) ?? null;

  function confirm() {
    setError(null);
    dialog.current?.showModal();
  }

  function close() {
    if (!pending) dialog.current?.close();
  }

  function submit() {
    if (!selected || pending) return;
    startTransition(async () => {
      const result = await castVote(selected.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      /* the page re-renders as the receipt, which sits at the top */
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <>
      <fieldset className="space-y-6">
        <legend className="sr-only">Pilih satu kandidat</legend>
        {candidates.map((candidate) => {
          const id = `vote-${candidate.id}`;
          return (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              selected={candidate.id === selectedId}
              className={
                candidate.id === selectedId ? "" : "hover:bg-white/[0.015]"
              }
              control={
                <Radio
                  id={id}
                  checked={candidate.id === selectedId}
                  onSelect={() => setSelectedId(candidate.id)}
                />
              }
              overlay={
                <label
                  htmlFor={id}
                  aria-hidden="true"
                  className="absolute inset-0 cursor-pointer rounded-[20px]"
                />
              }
            />
          );
        })}
      </fieldset>

      <div className="sticky bottom-4 z-10 rounded-[20px] bg-[#080b1c]/80 backdrop-blur-md">
        <Card className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p aria-live="polite" className="text-sm text-[#8a8ea3]">
            {selected ? (
              <>
                Pilihanmu:{" "}
                <span className="font-semibold text-white">
                  {selected.fullName}
                </span>
                . Periksa sekali lagi sebelum mengirim.
              </>
            ) : (
              "Pilih salah satu kandidat di atas untuk melanjutkan."
            )}
          </p>
          <button
            type="button"
            disabled={!selected}
            onClick={confirm}
            className={`${primaryButton} h-12 shrink-0`}
          >
            Kirim Suara →
          </button>
        </Card>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-note"
        onCancel={(e) => pending && e.preventDefault()}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto w-[calc(100%-32px)] max-w-[540px] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#151a38_0%,#0b0e22_100%)] p-0 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] transition-[opacity,scale,display,overlay] transition-discrete duration-200 backdrop:bg-[#03040d]/75 backdrop:backdrop-blur-sm starting:open:scale-95 starting:open:opacity-0"
      >
        {selected && (
          <div className="px-6 pt-8 pb-6 text-center sm:px-9">
            <p className="text-xs tracking-[0.1em] text-[#8a8ea3] uppercase">
              Konfirmasi Pilihan
            </p>
            <h2 id="confirm-title" className="mt-3 text-[22px] font-bold tracking-[-0.01em]">
              Yakin memilih kandidat ini?
            </h2>
            <p id="confirm-note" className="mt-2 text-sm text-[#8a8ea3]">
              Suara tidak dapat diubah setelah dikonfirmasi.
            </p>

            <CandidateSummary
              candidate={selected}
              className="mt-7 border-[#4f8dff]/20 bg-[#0f1c42]/60"
            />

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-left text-[13px] text-[#fca5a5]"
              >
                {error}
              </p>
            )}

            <div className="mt-7 grid grid-cols-[1fr_1.9fr] gap-3">
              <button
                type="button"
                autoFocus
                onClick={close}
                disabled={pending}
                className="h-12 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-[#c7c9d4] transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submit}
                aria-disabled={pending}
                aria-busy={pending}
                className={`${primaryButton} h-12 px-4 aria-disabled:cursor-wait aria-disabled:opacity-70`}
              >
                {pending ? "Mengirim suara…" : "Ya, Kirim Suara Saya"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
