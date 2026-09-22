"use client";

import { useCallback, useEffect, useState } from "react";

import { compactCardSurface, secondaryButton } from "@/modules/admin/components/ui";
import { ordinal } from "@/modules/admin/presensi/status";

import { getScanQr, type ScanQr } from "./actions";

/* The QR only ever holds a token that expires, so it is fetched from the
   server and replaced as each one runs out. */

function Countdown({ secondsLeft }: { secondsLeft: number }) {
  return (
    <p className="text-xs text-[#6f7286]" aria-live="off">
      QR berganti dalam{" "}
      <span className="font-semibold text-[#c7c9d4] tabular-nums">
        {secondsLeft}s
      </span>
    </p>
  );
}

/** The QR itself, on the white card a camera needs. */
function Code({ svg, size }: { svg: string; size: "panel" | "projector" }) {
  return (
    <div
      className={`rounded-2xl bg-white ${
        size === "projector" ? "p-6 sm:p-8" : "p-4"
      }`}
    >
      <div
        /* qrcode renders a self-contained SVG; it scales to the box */
        dangerouslySetInnerHTML={{ __html: svg }}
        className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      />
    </div>
  );
}

export function QrPanel({
  meetingId,
  title,
  sequence,
  /** Only an open presensi has a QR. */
  isOpen,
  canManage,
}: {
  meetingId: string;
  title: string;
  sequence: number;
  isOpen: boolean;
  canManage: boolean;
}) {
  const [qr, setQr] = useState<ScanQr | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [projector, setProjector] = useState(false);
  const live = isOpen && canManage;

  useEffect(() => {
    if (!live) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function load() {
      const result = await getScanQr(meetingId);
      if (!active) return;
      if (result.qr) {
        setQr(result.qr);
        setError(null);
        /* swap it the moment the token in it stops being accepted */
        timer = setTimeout(load, Math.max(1_000, result.qr.expiresAt - Date.now()));
      } else {
        setQr(null);
        setError(result.error ?? "QR gagal dibuat. Coba muat ulang halaman.");
        timer = setTimeout(load, 10_000);
      }
    }

    load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [meetingId, live]);

  /* one clock for the countdown, only while a QR is on screen */
  useEffect(() => {
    if (!live) return;
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(tick);
  }, [live]);

  const leave = useCallback(() => setProjector(false), []);

  useEffect(() => {
    if (!projector) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") leave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projector, leave]);

  /* a stale QR from an earlier session must never stay on screen */
  const code = live ? qr : null;
  const failure = live ? error : null;
  const secondsLeft = code
    ? Math.max(0, Math.ceil((code.expiresAt - now) / 1000))
    : 0;

  return (
    <section className={`${compactCardSurface} p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
            QR Presensi
          </p>
          <p className="mt-1.5 text-[13px] text-[#6f7286]">
            Tampilkan ke pengurus untuk di-scan.
          </p>
        </div>
        {code && (
          <button
            type="button"
            onClick={() => setProjector(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-[#c7c9d4] transition-colors hover:border-white/20 hover:text-white"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                d="M2.5 6V3.5a1 1 0 0 1 1-1H6M10 2.5h2.5a1 1 0 0 1 1 1V6M13.5 10v2.5a1 1 0 0 1-1 1H10M6 13.5H3.5a1 1 0 0 1-1-1V10"
                strokeLinecap="round"
              />
            </svg>
            Mode Proyektor
          </button>
        )}
      </div>

      <div className="mt-5">
        {!isOpen && (
          <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
            <p className="text-sm font-medium text-[#c7c9d4]">
              Presensi belum dibuka
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-[#6f7286]">
              QR muncul setelah presensi dibuka, dan berhenti berlaku begitu
              presensi ditutup.
            </p>
          </div>
        )}

        {isOpen && !canManage && (
          <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
            <p className="text-sm font-medium text-[#c7c9d4]">
              QR dipegang divisi penyelenggara
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-[#6f7286]">
              Kamu masih bisa memantau daftar presensi rapat gabungan ini.
            </p>
          </div>
        )}

        {live && !code && !failure && (
          <div
            role="status"
            className="grid aspect-square place-items-center rounded-2xl bg-white/[0.04]"
          >
            <span className="text-[13px] text-[#8a8ea3]">Menyiapkan QR…</span>
          </div>
        )}

        {failure && (
          <p
            role="alert"
            className="rounded-xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-[13px] text-[#fca5a5]"
          >
            {failure}
          </p>
        )}

        {code && (
          <div className="space-y-3.5">
            <Code svg={code.svg} size="panel" />
            <div className="flex items-center justify-between gap-3">
              <Countdown secondsLeft={secondsLeft} />
              <p className="text-xs text-[#6f7286]">
                Scan lewat kamera HP atau menu Presensi
              </p>
            </div>
          </div>
        )}
      </div>

      {projector && code && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#03040d] p-6">
          <div className="text-center">
            <p className="text-sm tracking-[0.08em] text-[#8a8ea3] uppercase">
              {ordinal(sequence)}
            </p>
            <h2 className="mt-1.5 text-2xl font-bold sm:text-3xl">{title}</h2>
          </div>
          <div className="w-[min(78vh,88vw)]">
            <Code svg={code.svg} size="projector" />
          </div>
          <div className="text-center">
            <Countdown secondsLeft={secondsLeft} />
            <button
              type="button"
              onClick={leave}
              className={`${secondaryButton} mt-4`}
            >
              Keluar (Esc)
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
