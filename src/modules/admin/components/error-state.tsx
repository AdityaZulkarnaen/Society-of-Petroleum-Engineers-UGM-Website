"use client";

import { useEffect } from "react";

import { primaryButton, secondaryButton } from "./ui";

/**
 * What a dashboard segment shows when its data fails to load: the page keeps
 * its shell and navigation, and the failed part offers a retry. The message
 * itself is never shown — it can carry database detail — but it is logged.
 */
export function ErrorState({
  error,
  reset,
  home,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  home: string;
}) {
  useEffect(() => {
    console.error("dashboard segment failed:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[520px] py-16 text-center">
      <h1 className="text-xl font-bold text-white">Gagal memuat halaman</h1>
      <p className="mt-2.5 text-sm leading-relaxed text-[#8a8ea3]">
        Data tidak berhasil diambil. Periksa koneksi internet lalu coba lagi.
        {error.digest ? (
          <>
            {" "}
            Kode: <span className="text-[#c7c9d4]">{error.digest}</span>
          </>
        ) : null}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={primaryButton}>
          Coba lagi
        </button>
        <a href={home} className={secondaryButton}>
          Kembali ke dashboard
        </a>
      </div>
    </div>
  );
}
