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
          {division.name} Division
        </h2>
        <Badge tone={active ? "blue" : "neutral"} className="px-2.5 py-1 text-xs font-semibold">
          {active ? "Active" : "No members yet"}
        </Badge>
      </div>
      <dl className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <Fact label="Division Head">
          {division.headName ?? <span className="text-[#5d6075]">Not assigned</span>}
        </Fact>
        <Fact label="Total Members">
          {division.memberCount} {division.memberCount === 1 ? "member" : "members"}
        </Fact>
        <Fact label="Active Programs">
          {division.activeProker} {division.activeProker === 1 ? "program" : "programs"}
        </Fact>
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
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">Divisions</h1>
        <p className="mt-2 text-sm text-[#8a8ea3]">
          Overview of active division structures for the {CURRENT_PERIOD.label} leadership term.
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
            title="No divisions yet"
            description="Divisions are created via the division seed script (pnpm seed:divisions)."
          />
        </Card>
      )}
    </div>
  );
}
