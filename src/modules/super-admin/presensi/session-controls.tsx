"use client";

import { useState, useTransition } from "react";

import { Modal } from "@/modules/admin/components/modal";
import { ModalHeader } from "@/modules/admin/components/modal";
import { primaryButton, secondaryButton } from "@/modules/admin/components/ui";
import { type MeetingState } from "@/modules/admin/presensi/status";

import { setMeetingOpen } from "./actions";

/**
 * Buka / Tutup Presensi. Closing is confirmed, because it stamps everyone who
 * never presented as alpa and stops the QR working.
 */
export function SessionControls({
  meetingId,
  state,
  pending: waiting,
}: {
  meetingId: string;
  state: MeetingState;
  /** How many peserta still have no status. */
  pending: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const run = (open: boolean) =>
    startTransition(async () => {
      const result = await setMeetingOpen(meetingId, open);
      setError(result.error ?? null);
      if (!result.error) setConfirming(false);
    });

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2.5">
        {state !== "open" && (
          <button
            type="button"
            onClick={() => run(true)}
            aria-disabled={busy}
            className={`${primaryButton} gap-2 aria-disabled:cursor-wait aria-disabled:opacity-70`}
          >
            {busy
              ? "Membuka…"
              : state === "closed"
                ? "Buka Ulang Presensi"
                : "Buka Presensi"}
          </button>
        )}
        {state === "open" && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={secondaryButton}
          >
            Tutup Presensi
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-[#fca5a5]">
          {error}
        </p>
      )}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        busy={busy}
        labelledBy="close-presensi-title"
      >
        <div className="px-6 pt-7 pb-7 sm:px-8">
          <ModalHeader
            id="close-presensi-title"
            title="Tutup Presensi"
            onClose={() => setConfirming(false)}
            disabled={busy}
          />
          <p className="mt-6 text-sm leading-relaxed text-[#c7c9d4]">
            QR langsung berhenti berlaku.{" "}
            {waiting > 0 ? (
              <>
                <strong className="font-semibold text-white">{waiting}</strong>{" "}
                pengurus yang belum presensi akan tercatat{" "}
                <strong className="font-semibold text-white">Alpa</strong> — bisa
                kamu ubah lagi ke Izin atau Sakit dari tabel setelahnya.
              </>
            ) : (
              "Semua peserta sudah punya status presensi."
            )}
          </p>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-[13px] text-[#fca5a5]"
            >
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => setConfirming(false)}
              disabled={busy}
              className={secondaryButton}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => run(false)}
              aria-disabled={busy}
              className={`${primaryButton} aria-disabled:cursor-wait aria-disabled:opacity-70`}
            >
              {busy ? "Menutup…" : "Tutup Presensi"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
