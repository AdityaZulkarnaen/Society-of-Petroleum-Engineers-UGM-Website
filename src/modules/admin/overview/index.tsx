import Link from "next/link";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

import { requireAdmin } from "../auth/session";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  Label,
  SectionHeading,
} from "../components/ui";
import { CURRENT_PERIOD } from "../constants";
import { periodProgress } from "./period";

const ROLE_LABEL = {
  super_admin: "Koordinator Divisi",
  admin: "Pengurus",
} as const;

function Field({ label, children }: { label: string; children: ReactNode }) {
  const empty = children == null || children === "" || children === false;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 truncate text-[15px] text-white">
        {empty ? <span className="text-[#5d6075]">—</span> : children}
      </dd>
    </div>
  );
}

function Stat({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <Card className="px-6 py-6">
      <Label>{label}</Label>
      <p className="mt-2.5 text-[30px] leading-none font-bold tracking-[-0.02em]">
        {value}
      </p>
      <p className="mt-3 text-[13px] text-[#6f7286]">{caption}</p>
    </Card>
  );
}

function DetailLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mt-6 border-t border-white/[0.06] pt-5">
      <Link
        href={href}
        className="text-[13px] text-[#4f8dff] transition-colors hover:text-[#7aa9ff]"
      >
        {children} →
      </Link>
    </div>
  );
}

export async function OverviewPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: summaryRows } = await supabase.rpc("my_division_summary");
  const summary = (
    summaryRows as { member_count: number; head_name: string | null }[] | null
  )?.[0];

  const period = periodProgress(CURRENT_PERIOD);
  const firstName = admin.fullName.split(" ")[0];
  const title = admin.position
    ? `${admin.position}${admin.division ? ` of ${admin.division.name}` : ""}`
    : ROLE_LABEL[admin.role];

  return (
    <div className="space-y-8">
      {/* greeting */}
      <header>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
            Halo, {firstName} <span aria-hidden="true">👋</span>
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{title}</Badge>
            {admin.department && <Badge>{admin.department}</Badge>}
          </div>
        </div>
        <p className="mt-3 text-[15px] text-[#8a8ea3]">
          Selamat datang di dashboard kepengurusan Periode {CURRENT_PERIOD.label}.
        </p>
      </header>

      {/* profile */}
      <Card className="flex flex-col gap-8 p-6 sm:p-8 md:flex-row">
        <div className="flex shrink-0 items-center gap-4 md:w-24 md:flex-col md:border-r md:border-white/[0.06] md:pr-8">
          <Avatar name={admin.fullName} size="lg" />
          <Label>Profil</Label>
        </div>

        <dl className="grid flex-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nama Lengkap">{admin.fullName}</Field>
          <Field label="NIM">{admin.nim}</Field>
          <Field label="Departemen / Jurusan">{admin.department}</Field>
          <Field label="Divisi di SPE">{admin.division?.name}</Field>
          <Field label="Jabatan">{admin.position}</Field>
          <Field label="Periode Kepengurusan">{CURRENT_PERIOD.label}</Field>
          <Field label="Email">
            {admin.contactEmail && (
              <a
                href={`mailto:${admin.contactEmail}`}
                className="text-[#4f8dff] hover:text-[#7aa9ff]"
              >
                {admin.contactEmail}
              </a>
            )}
          </Field>
          <Field label="WhatsApp">{admin.whatsapp}</Field>
        </dl>
      </Card>

      {/* stats — recorded once events, attendance and points are tracked */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Proker Terlibat" value="—" caption="Belum ada data proker" />
        <Stat label="Kehadiran Rapat" value="—" caption="Belum ada data rapat" />
        <Stat label="Poin Kontribusi" value="—" caption="Belum ada poin periode ini" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.08fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6 sm:p-7">
            <SectionHeading
              eyebrow="Keterlibatan Terbaru"
              title="Riwayat Acara & Proker"
            />
            <div className="mt-6">
              <EmptyState
                title="Belum ada keterlibatan"
                description="Acara dan proker yang kamu ikuti akan muncul di sini beserta statusnya."
              />
            </div>
            <DetailLink href="/admin/acara">
              Lihat detail lengkap di Acara/Proker
            </DetailLink>
          </Card>

          <Card className="p-6 sm:p-7">
            <SectionHeading
              eyebrow="Info Divisi"
              title={admin.division ? `Divisi ${admin.division.name}` : "Divisi"}
            />
            {admin.division ? (
              <>
                {admin.division.tags.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {admin.division.tags.map((tag) => (
                      <li
                        key={tag}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#c7c9d4]"
                      >
                        <span className="size-1.5 rounded-full bg-[#3b82f6]" />
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
                <dl className="mt-5 divide-y divide-white/[0.06] border-b border-white/[0.06] text-sm">
                  {[
                    [
                      "Total anggota divisi",
                      summary ? `${summary.member_count} orang` : "—",
                    ],
                    ["Proker aktif", "—"],
                    ["Kepala divisi", summary?.head_name || "—"],
                  ].map(([term, value]) => (
                    <div key={term} className="flex justify-between gap-4 py-3">
                      <dt className="text-[#8a8ea3]">{term}</dt>
                      <dd className="text-right text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Belum terdaftar di divisi"
                  description="Hubungi koordinator divisimu untuk menambahkan akunmu ke divisi."
                />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 sm:p-7">
            <SectionHeading
              eyebrow="Progres Periode"
              title={`Tahun Kepengurusan ${CURRENT_PERIOD.label}`}
            />
            <div className="mt-6 flex items-baseline justify-between text-[13px]">
              <span className="text-[#8a8ea3]">
                {period.percent}% dari periode berjalan
              </span>
              <span className="font-bold text-[#4f8dff]">{period.percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Progres periode kepengurusan"
              aria-valuenow={period.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
            >
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#4e4eff)]"
                style={{ width: `${period.percent}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5">
                <Label>Bulan Berjalan</Label>
                <p className="mt-1.5 text-lg font-bold">
                  {period.currentMonth} / {period.totalMonths}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5">
                <Label>Sisa Waktu</Label>
                <p className="mt-1.5 text-lg font-bold">
                  {period.remainingMonths > 0
                    ? `~${period.remainingMonths} bulan`
                    : `${period.remainingDays} hari`}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <SectionHeading eyebrow="Evaluasi Diri" title="Ringkasan Kompetensi" />
            <div className="mt-6">
              <EmptyState
                title="Belum ada evaluasi"
                description="Hasil evaluasi kompetensi periode ini akan tampil di sini setelah diisi."
              />
            </div>
            <DetailLink href="/admin/rekap-diri">
              Lihat detail lengkap di Rekap Diri
            </DetailLink>
          </Card>
        </div>
      </div>
    </div>
  );
}
