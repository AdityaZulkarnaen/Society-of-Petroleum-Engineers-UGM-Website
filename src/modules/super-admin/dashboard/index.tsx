import Link from "next/link";
import type { ReactNode } from "react";

import { requireSuperAdmin } from "@/modules/admin/auth/session";
import {
  Card,
  compactCardSurface,
  SectionHeading,
  Stat,
} from "@/modules/admin/components/ui";
import { Suspense } from "react";

import {
  SkeletonCard,
  SkeletonStats,
} from "@/modules/admin/components/skeleton";
import { CURRENT_PERIOD } from "@/modules/admin/constants";
import { getElection } from "@/modules/admin/voting/data";
import { formatRange } from "@/modules/admin/voting/format";

import { getSuperAdminSummary } from "./data";

const jakartaDay = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);

/** 'Hari ini, 09:41', 'Kemarin, 18:02' or '7 Okt 2025, 09:41' (WIB). */
function formatLastLogin(timestamp: string | null) {
  if (!timestamp) return "Belum ada";
  const date = new Date(timestamp);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  })
    .format(date)
    .replace(".", ":");

  const day = jakartaDay(date);
  if (day === jakartaDay(new Date())) return `Hari ini, ${time}`;
  if (day === jakartaDay(new Date(Date.now() - 24 * 60 * 60 * 1000))) {
    return `Kemarin, ${time}`;
  }
  const calendar = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
  return `${calendar}, ${time}`;
}

const ACTION_TONES = {
  blue: "border-[#3b82f6]/25 bg-[#132250]/45 hover:border-[#3b82f6]/45 hover:bg-[#132250]/70 [&>svg]:text-[#4f8dff]",
  green:
    "border-[#34d399]/20 bg-[#0c2a2e]/50 hover:border-[#34d399]/40 hover:bg-[#0c2a2e]/80 [&>svg]:text-[#34d399]",
};

function QuickAction({
  href,
  tone = "blue",
  children,
}: {
  href: string;
  tone?: keyof typeof ACTION_TONES;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`group flex min-h-[46px] items-center justify-between gap-4 rounded-xl border px-4 py-2.5 text-[15px] text-white transition-colors ${ACTION_TONES[tone]}`}
      >
        <span className="min-w-0 truncate">{children}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
        >
          <path
            d="M2 7h10M8 3l4 4-4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </li>
  );
}

/**
 * The dashboard's header renders at once and each block streams in behind its
 * own skeleton, so a slow query no longer holds up the whole page. Both
 * blocks read the same two loaders; `cache()` makes that one query each.
 */
export async function SuperAdminDashboard() {
  await requireSuperAdmin();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
          Dashboard Admin
        </h1>
        <p className="mt-3 text-[15px] text-[#8a8ea3]">
          Selamat datang kembali. Kelola pengurus, rekap, dan voting dari sini.
        </p>
      </header>

      <Suspense fallback={<SkeletonStats />}>
        <StatsRow />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={4} />
          </div>
        }
      >
        <Panels />
      </Suspense>
    </div>
  );
}

async function StatsRow() {
  const [summary, election] = await Promise.all([
    getSuperAdminSummary(),
    getElection(),
  ]);

  const turnout = election?.turnout;
  const participation =
    turnout && turnout.eligible > 0
      ? Math.round((turnout.votes / turnout.eligible) * 100)
      : null;

  const dash = <span className="text-[#5d6075]">—</span>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        surface={compactCardSurface}
        label="Total Pengurus"
        value={summary.totalAccounts ?? dash}
        caption="akun terdaftar"
      />
      <Stat
        surface={compactCardSurface}
        label="Akun Aktif"
        value={summary.activeAccounts ?? dash}
        caption="dari total pengurus"
      />
      <Stat
        surface={compactCardSurface}
        label="Rekap Terisi"
        value={summary.rekapFilled ?? dash}
        caption={
          summary.rekapFilled != null && summary.activeAccounts != null
            ? `dari ${summary.activeAccounts} aktif`
            : "belum ada rekap"
        }
      />
      <Stat
        surface={compactCardSurface}
        label="Partisipasi Voting"
        value={participation != null ? `${participation}%` : dash}
        caption={
          turnout
            ? `${turnout.votes} dari ${turnout.eligible} pemilih`
            : "belum ada pemilihan"
        }
      />
    </div>
  );
}

async function Panels() {
  const [summary, election] = await Promise.all([
    getSuperAdminSummary(),
    getElection(),
  ]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card surface={compactCardSurface} className="p-6">
        <SectionHeading eyebrow="Akses Cepat" title="Tindakan Umum" />
        <ul className="mt-6 space-y-2">
          <QuickAction href="/super-admin/akun?tambah=1">
            Tambah pengurus baru
          </QuickAction>
          <QuickAction
            href={
              summary.pendingRekap
                ? `/super-admin/rekap?pengurus=${summary.pendingRekap.id}`
                : "/super-admin/rekap"
            }
          >
            {summary.pendingRekap
              ? `Edit rekap ${summary.pendingRekap.name}`
              : "Isi rekap pengurus"}
          </QuickAction>
          <QuickAction href="/super-admin/voting" tone="green">
            Kelola kandidat voting
          </QuickAction>
        </ul>
      </Card>

      <Card surface={compactCardSurface} className="p-6">
        <SectionHeading eyebrow="Status Sistem" title="Ringkasan Periode" />
        <dl className="mt-4 divide-y divide-white/[0.06] border-b border-white/[0.06] text-sm">
          {(
            [
              ["Periode aktif", CURRENT_PERIOD.label],
              [
                "Voting dibuka",
                election
                  ? formatRange(election.opensOn, election.closesOn)
                  : "Belum dijadwalkan",
              ],
              [
                "Total divisi aktif",
                summary.divisionCount != null
                  ? `${summary.divisionCount} divisi`
                  : "—",
              ],
              ["Admin terakhir login", formatLastLogin(summary.lastSignInAt)],
            ] as const
          ).map(([term, value]) => (
            <div key={term} className="flex justify-between gap-4 py-3">
              <dt className="text-[#8a8ea3]">{term}</dt>
              <dd className="text-right text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
