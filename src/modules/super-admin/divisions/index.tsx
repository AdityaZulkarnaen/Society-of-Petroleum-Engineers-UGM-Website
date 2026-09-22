import type { ReactNode } from "react";

import { requireSuperAdmin } from "@/modules/admin/auth/session";
import {
  Badge,
  Card,
  compactCardSurface,
  EmptyState,
} from "@/modules/admin/components/ui";
import { CURRENT_PERIOD } from "@/modules/admin/constants";

import { getDivisionOverview, type DivisionOverview } from "./data";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/9 px-3 py-3">
      <dt className="text-[10px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 truncate text-sm text-white">{children}</dd>
    </div>
  );
}

function DivisionCard({ division }: { division: DivisionOverview }) {
  const active = division.memberCount > 0;
  return (
    <Card surface={compactCardSurface} className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-[17px] font-bold tracking-[-0.01em] text-white">
          Divisi {division.name}
        </h2>
        <Badge tone={active ? "blue" : "neutral"} className="px-2.5 py-1 text-xs font-semibold">
          {active ? "Aktif" : "Belum ada anggota"}
        </Badge>
      </div>
      <dl className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <Fact label="Ketua Divisi">
          {division.headName ?? <span className="text-[#5d6075]">Belum ditentukan</span>}
        </Fact>
        <Fact label="Total Anggota">{division.memberCount} orang</Fact>
        <Fact label="Proker Aktif">{division.activeProker} proker</Fact>
      </dl>
    </Card>
  );
}

export async function DivisionsPage() {
  await requireSuperAdmin();
  const divisions = await getDivisionOverview();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">Divisi</h1>
        <p className="mt-2 text-sm text-[#8a8ea3]">
          Ringkasan struktur divisi aktif dalam periode kepengurusan {CURRENT_PERIOD.label}.
        </p>
      </header>

      {divisions.length > 0 ? (
        /* two columns once the content area (not the window) is wide enough */
        <div className="@container">
          <div className="grid gap-4 @4xl:grid-cols-2">
            {divisions.map((division) => (
              <DivisionCard key={division.id} division={division} />
            ))}
          </div>
        </div>
      ) : (
        <Card surface={compactCardSurface} className="p-6">
          <EmptyState
            title="Belum ada divisi"
            description="Divisi dibuat lewat skrip seed divisi (pnpm seed:divisions)."
          />
        </Card>
      )}
    </div>
  );
}
