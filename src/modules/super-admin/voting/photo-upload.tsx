"use client";

import { useRef, useState, useTransition } from "react";

import { secondaryButton } from "@/modules/admin/components/ui";

import { uploadCandidatePhoto } from "./actions";
import { PHOTO_TYPES } from "./fields";

/* Displayed at most 200 × 276, so 480 × 660 leaves room for sharp screens. */
const MAX_WIDTH = 480;
const MAX_HEIGHT = 660;
const SOURCE_MAX_BYTES = 15 * 1024 * 1024;

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));

/** Shrinks a photo to WebP (JPEG where WebP can't be encoded). */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await toBlob(canvas, "image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg");
  if (!jpeg) throw new Error("encode failed");
  return jpeg;
}

/**
 * Foto kandidat: pick a file, it's resized and uploaded, and `onChange`
 * receives its URL. `onUploaded` reports every upload so unsaved ones can be
 * cleaned up.
 */
export function PhotoUpload({
  id,
  value,
  name,
  error,
  onChange,
  onUploaded,
}: {
  id: string;
  value: string | null;
  /** Used for the preview's alt text. */
  name: string;
  error?: string;
  onChange: (url: string | null) => void;
  onUploaded: (url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(file: File | undefined) {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setUploadError("Format foto harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > SOURCE_MAX_BYTES) {
      setUploadError("Ukuran foto maksimal 15 MB.");
      return;
    }

    setUploadError(null);
    startTransition(async () => {
      try {
        const blob = await resize(file);
        const data = new FormData();
        data.append("photo", new File([blob], "photo", { type: blob.type }));
        const result = await uploadCandidatePhoto(data);
        if (result.url) {
          onUploaded(result.url);
          onChange(result.url);
        } else {
          setUploadError(result.error ?? "Foto gagal diupload. Coba lagi.");
        }
      } catch {
        setUploadError("Foto tidak bisa dibaca. Coba file lain.");
      }
    });
  }

  const message = uploadError ?? error;

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative h-[62px] w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#1d2a5e_0%,#0d1230_100%)]">
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element -- a local preview of an arbitrary URL */
            <img src={value} alt={`Foto ${name || "kandidat"}`} className="size-full object-cover" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
              className="absolute inset-0 m-auto text-[#6f7286]"
            >
              <circle cx="10" cy="7" r="3.25" />
              <path d="M4 17c.9-2.9 3.1-4.5 6-4.5s5.1 1.6 6 4.5" strokeLinecap="round" />
            </svg>
          )}
          {pending && (
            <span className="absolute inset-0 grid place-items-center bg-black/50">
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={input}
            id={id}
            type="file"
            accept={PHOTO_TYPES.join(",")}
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
            aria-invalid={Boolean(message)}
            aria-describedby={message ? `${id}-error` : `${id}-hint`}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={pending}
            className={`${secondaryButton} h-10 gap-2 px-4`}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M8 10.5V2.75M4.75 6 8 2.75 11.25 6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2.75 10.5v1.75a1 1 0 0 0 1 1h8.5a1 1 0 0 0 1-1V10.5" strokeLinecap="round" />
            </svg>
            {pending ? "Mengupload…" : value ? "Ganti foto" : "Upload foto"}
          </button>
          {value && !pending && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="h-10 rounded-xl px-3 text-sm text-[#f87171]/90 transition-colors hover:bg-[#f87171]/10 hover:text-[#f87171]"
            >
              Hapus
            </button>
          )}
        </div>
      </div>
      {message ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-[#fca5a5]">
          {message}
        </p>
      ) : (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#6f7286]">
          JPG, PNG, atau WebP. Foto portrait paling pas; otomatis dikecilkan.
        </p>
      )}
    </div>
  );
}
