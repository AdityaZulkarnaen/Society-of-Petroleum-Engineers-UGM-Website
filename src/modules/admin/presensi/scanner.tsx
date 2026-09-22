"use client";

import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Modal, ModalHeader } from "../components/modal";
import { primaryButton, secondaryButton } from "../components/ui";
import { checkIn, type CheckInResult } from "./actions";
import { CheckInResultCard } from "./result";

/**
 * Reads the QR from the camera. A phone camera app can open the link in the QR
 * directly, so this is the in-app path: useful on a laptop, or when the camera
 * app can't open links.
 */

/** The QR carries a link; a bare token is accepted too. */
function tokenFrom(text: string) {
  try {
    return new URL(text).searchParams.get("t");
  } catch {
    return text.includes(".") ? text.trim() : null;
  }
}

const PERMISSION_DENIED =
  "Akses kamera ditolak. Izinkan kamera di pengaturan browser, atau scan QR-nya lewat aplikasi kamera HP.";
const NO_CAMERA =
  "Kamera tidak tersedia di perangkat ini. Scan QR-nya lewat aplikasi kamera HP.";

export function ScanButton({ label = "Scan QR Presensi" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${primaryButton} gap-2`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M2.5 5.5V3.25a.75.75 0 0 1 .75-.75H5.5M10.5 2.5h2.25a.75.75 0 0 1 .75.75V5.5M13.5 10.5v2.25a.75.75 0 0 1-.75.75H10.5M5.5 13.5H3.25a.75.75 0 0 1-.75-.75V10.5" strokeLinecap="round" />
          <path d="M2.5 8h11" strokeLinecap="round" />
        </svg>
        {label}
      </button>
      <ScannerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ScannerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [saving, setSaving] = useState(false);

  /* one flag for the frame loop and the teardown, so a decode stops both */
  const scanning = useRef(false);

  const submit = useCallback(
    async (token: string) => {
      setSaving(true);
      const outcome = await checkIn(token);
      setSaving(false);
      setResult(outcome);
      /* the pengurus' own list shows the new status */
      if (outcome.ok) router.refresh();
    },
    [router],
  );

  useEffect(() => {
    if (!open || result) return;

    const video = videoRef.current;
    if (!video) return;

    let stream: MediaStream | null = null;
    let frame = 0;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    scanning.current = true;

    const read = () => {
      if (!scanning.current) return;
      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, {
          inversionAttempts: "dontInvert",
        });
        const token = code ? tokenFrom(code.data) : null;
        if (token) {
          scanning.current = false;
          void submit(token);
          return;
        }
      }
      frame = requestAnimationFrame(read);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!scanning.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        frame = requestAnimationFrame(read);
      } catch (cause) {
        const name = cause instanceof Error ? cause.name : "";
        setError(
          name === "NotAllowedError" || name === "SecurityError"
            ? PERMISSION_DENIED
            : NO_CAMERA,
        );
      }
    })();

    return () => {
      scanning.current = false;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [open, result, submit]);

  function close() {
    setResult(null);
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      busy={saving}
      labelledBy="scan-presensi-title"
      className="max-w-[460px]"
    >
      <div className="px-6 pt-7 pb-7">
        <ModalHeader
          id="scan-presensi-title"
          title="Scan QR Presensi"
          onClose={close}
          disabled={saving}
        />

        {!result && (
          <>
            <div className="relative mt-6 aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                className="size-full object-cover"
              />
              {!error && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70"
                />
              )}
              {error && (
                <p
                  role="alert"
                  className="absolute inset-0 grid place-items-center px-6 text-center text-[13px] leading-relaxed text-[#fca5a5]"
                >
                  {error}
                </p>
              )}
            </div>
            <p className="mt-4 text-center text-[13px] text-[#8a8ea3]">
              {saving
                ? "Menyimpan presensi…"
                : error
                  ? "Kamu tetap bisa scan QR-nya lewat aplikasi kamera HP."
                  : "Arahkan kamera ke QR di layar rapat."}
            </p>
          </>
        )}

        {result && (
          <div className="mt-7">
            <CheckInResultCard result={result} />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          {result && !result.ok && (
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className={secondaryButton}
            >
              Coba Lagi
            </button>
          )}
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className={result ? primaryButton : secondaryButton}
          >
            {result ? "Selesai" : "Batal"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
