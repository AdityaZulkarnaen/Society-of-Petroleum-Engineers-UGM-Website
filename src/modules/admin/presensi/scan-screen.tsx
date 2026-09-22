"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Card, primaryButton, secondaryButton } from "../components/ui";
import { checkIn, type CheckInResult } from "./actions";
import { CheckInResultCard } from "./result";

/**
 * Where the QR's link lands: the token is recorded as soon as the page opens,
 * so a pengurus only has to point their camera app at the QR and tap the
 * notification.
 */
export function ScanScreen({ token }: { token: string | null }) {
  const [result, setResult] = useState<CheckInResult | null>(
    token
      ? null
      : {
          ok: false,
          error:
            "Tautan presensi tidak lengkap. Scan ulang QR di layar rapat.",
        },
  );
  /* one attempt per token: React may run the effect twice in development */
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!token || sent.current === token) return;
    sent.current = token;
    let active = true;
    checkIn(token).then((outcome) => {
      if (active) setResult(outcome);
    });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="mx-auto max-w-[420px] space-y-6">
      <h1 className="text-center text-[22px] font-bold tracking-[-0.02em]">
        Presensi Rapat
      </h1>

      <Card className="px-6 py-9">
        {result ? (
          <CheckInResultCard result={result} />
        ) : (
          <p role="status" className="text-center text-sm text-[#8a8ea3]">
            Menyimpan presensi…
          </p>
        )}
      </Card>

      <div className="flex justify-center gap-3">
        <Link href="/admin/presensi" className={primaryButton}>
          Lihat Presensi Saya
        </Link>
        {result && !result.ok && (
          <Link href="/admin/presensi" className={secondaryButton}>
            Scan Ulang
          </Link>
        )}
      </div>
    </div>
  );
}
