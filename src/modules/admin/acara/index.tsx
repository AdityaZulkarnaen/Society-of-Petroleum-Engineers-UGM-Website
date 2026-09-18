import Link from "next/link";

import { requireAdmin } from "../auth/session";
import {
  Badge,
  Card,
  EmptyState,
  SectionHeading,
  Stat,
  type Tone,
} from "../components/ui";
import { getMyProker, PROKER_STATUSES, type ProkerStatus } from "./data";

const STATUS: Record<ProkerStatus, { label: string; tone: Tone }> = {
  berlangsung: { label: "Berlangsung", tone: "amber" },
  selesai: { label: "Selesai", tone: "green" },
  direncanakan: { label: "Direncanakan", tone: "neutral" },
  rutin: { label: "Rutin", tone: "blue" },
};

const COLUMNS = "md:grid md:grid-cols-[1.6fr_0.95fr_1.35fr_1fr] md:items-center md:gap-6";

function FilterChips({ active }: { active: ProkerStatus | null }) {
  const chips = [
    { href: "/admin/acara", label: "Semua", on: active == null },
    ...PROKER_STATUSES.map((status) => ({
      href: `/admin/acara?status=${status}`,
      label: STATUS[status].label,
      on: active === status,
    })),
  ];

  return (
    <nav aria-label="Filter status proker">
      <ul className="flex flex-wrap gap-2">
        {chips.map(({ href, label, on }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={on ? "page" : undefined}
              className={`inline-flex h-8 items-center rounded-full border px-3.5 text-sm transition-colors ${
                on
                  ? "border-[#4f8dff]/20 bg-[#1b2a5c] font-medium text-white"
                  : "border-white/10 bg-white/[0.03] text-[#c7c9d4] hover:border-white/20 hover:text-white"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function parseStatus(value: string | string[] | undefined) {
  return PROKER_STATUSES.find((status) => status === value) ?? null;
}

export async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const [proker, params] = await Promise.all([getMyProker(), searchParams]);

  const filter = parseStatus(params.status);
  const shown = filter ? proker.filter((p) => p.status === filter) : proker;
  const count = (status: ProkerStatus) =>
    proker.filter((p) => p.status === status).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
          Acara &amp; Proker
        </h1>
        <p className="mt-3 text-[15px] text-[#8a8ea3]">
          Seluruh acara dan program kerja yang kamu ikuti selama periode
          kepengurusan.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Proker" value={proker.length} caption="terlibat langsung" />
        <Stat label="Sudah Selesai" value={count("selesai")} caption="proker tuntas" />
        <Stat label="Sedang Berjalan" value={count("berlangsung")} caption="proker aktif" />
        <Stat label="Direncanakan" value={count("direncanakan")} caption="proker mendatang" />
      </div>

      <FilterChips active={filter} />

      <Card className="p-6 sm:p-7">
        <SectionHeading
          eyebrow={`${shown.length} proker ditampilkan`}
          title="Daftar Program Kerja"
        />

        {shown.length > 0 ? (
          <div className="mt-6" role="table" aria-label="Daftar program kerja">
            <div
              role="row"
              className={`hidden px-3.5 pb-3 text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase ${COLUMNS}`}
            >
              <span role="columnheader">Nama Proker</span>
              <span role="columnheader">Divisi</span>
              <span role="columnheader">Peran Saya</span>
              <span role="columnheader">Status</span>
            </div>

            <div role="rowgroup" className="space-y-1.5">
              {shown.map((p) => (
                <div
                  key={p.id}
                  role="row"
                  className={`grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3 ${COLUMNS}`}
                >
                  <span role="cell" className="text-[15px] font-semibold text-white">
                    {p.name}
                  </span>
                  <span role="cell" className="col-start-1 text-[13px] text-[#8a8ea3]">
                    {p.division}
                  </span>
                  <span role="cell" className="col-start-1 text-[13px] text-[#c7c9d4]">
                    {p.role}
                  </span>
                  <span
                    role="cell"
                    className="col-start-2 row-span-3 row-start-1 self-center md:col-start-auto md:row-span-1 md:row-start-auto"
                  >
                    <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title={
                filter
                  ? `Tidak ada proker berstatus ${STATUS[filter].label.toLowerCase()}`
                  : "Belum ada keterlibatan"
              }
              description="Acara dan proker yang kamu ikuti akan muncul di sini beserta peran dan statusnya."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
