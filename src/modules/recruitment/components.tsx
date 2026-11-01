import Link from "next/link";
import type { ReactNode } from "react";

import { MOCK_NOTICE, recruitmentConfig, statusLabels } from "./config";

export const primaryButton = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-iris px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5947c7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-iris disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton = "inline-flex min-h-12 items-center justify-center rounded-full border border-[#dcddea] bg-white px-6 py-3 text-sm font-semibold text-ink-deep hover:bg-ground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-iris";
export const inputStyle = "min-h-12 w-full rounded-xl border border-[#d7dbe5] bg-white px-4 py-3 text-base text-ink-deep outline-none transition-colors focus:border-iris focus:ring-2 focus:ring-iris/20 aria-invalid:border-red-600 aria-invalid:ring-red-600/15";

export function MockNotice() {
  return <aside aria-label="Informasi simulasi" className="rounded-2xl border border-iris/20 bg-[#f2efff] px-5 py-4 text-sm leading-relaxed text-[#4a398c]">
    <p className="font-semibold">{MOCK_NOTICE}</p>
    <p className="mt-1">Preview frontend, bukan pendaftaran resmi. Gunakan data dan dokumen contoh. Isian hilang saat halaman dimuat ulang.</p>
  </aside>;
}

export function RecruitmentFrame({ children }: { children: ReactNode }) {
  return <main lang="id" className="min-h-svh bg-[#fbfbfe] px-5 pt-32 pb-20 text-ink sm:px-8 md:pt-40">
    <div className="mx-auto max-w-6xl">{children}</div>
  </main>;
}

export function StatusBadge() {
  return <span className="inline-flex items-center gap-2 rounded-full border border-iris/20 bg-white px-3.5 py-2 text-xs font-semibold text-iris">
    <span aria-hidden="true" className="size-2 rounded-full bg-current" />{statusLabels[recruitmentConfig.status]}
  </span>;
}

export function ApplicationEntry() {
  if (recruitmentConfig.status === "open") return <Link href="/join/apply" className={primaryButton}>Apply Now <span aria-hidden="true">↗</span></Link>;
  return <p className="rounded-xl border border-[#dcddea] bg-white p-4 text-sm text-ink-soft">{recruitmentConfig.status === "closed" ? "Form simulasi sedang ditutup." : "Form belum tersedia. Informasi resmi menunggu konfirmasi."}</p>;
}
