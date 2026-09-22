"use client";

import { Badge } from "../components/ui";
import { clock } from "./format";
import { ATTENDANCE, ordinal, SCOPE } from "./status";
import type { CheckInResult } from "./actions";

/* Shared by the in-app scanner and the page a phone camera opens. */

const check = (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const cross = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
  </svg>
);

/** The outcome of a scan: what was recorded, or why it wasn't. */
export function CheckInResultCard({ result }: { result: CheckInResult }) {
  if (!result.ok) {
    return (
      <div role="alert" className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]">
          {cross}
        </span>
        <p className="mt-4 text-base font-semibold text-white">
          Presensi belum tercatat
        </p>
        <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-[#a3a6b8]">
          {result.error}
        </p>
      </div>
    );
  }

  const status = ATTENDANCE[result.status];

  return (
    <div role="status" className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full border border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]">
        {check}
      </span>
      <p className="mt-4 text-base font-semibold text-white">
        {result.duplicate ? "Kamu sudah presensi" : "Presensi tercatat"}
      </p>
      <p className="mt-1.5 text-[13px] text-[#a3a6b8]">
        {result.meeting.title} · {ordinal(result.meeting.sequence)} ·{" "}
        {SCOPE[result.meeting.scope].short}
      </p>
      <div className="mt-4 flex items-center justify-center gap-2.5">
        <Badge tone={status.tone} className="px-3 py-1.5 text-[13px] font-semibold">
          {status.label}
        </Badge>
        <span className="text-[13px] text-[#8a8ea3]">
          pukul {clock(result.checkedInAt)} WIB
        </span>
      </div>
    </div>
  );
}
