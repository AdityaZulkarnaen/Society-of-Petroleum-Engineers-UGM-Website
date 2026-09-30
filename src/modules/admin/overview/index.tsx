import Link from "next/link";
import type { ReactNode } from "react";

import { STATUS } from "../acara/status";
import { getMyProker } from "../acara/data";
import { requireAdmin } from "../auth/session";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  Label,
  ProgressBar,
  SectionHeading,
  Stat,
} from "../components/ui";
import { CURRENT_PERIOD } from "../constants";
import { CompetencyList } from "../rekap-diri/competency-list";
import type { Tally } from "../rekap-diri/data";
import { getSelfReport } from "../rekap-diri/load";
import { getDivisionSummary } from "./data";
import { periodProgress } from "./period";

const ROLE_LABEL = {
  super_admin: "Division Coordinator",
  admin: "Officer",
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

const percentOf = (tally: NonNullable<Tally>) =>
  tally.total > 0 ? Math.round(Math.min(1, tally.done / tally.total) * 100) : 0;

/** Rows share the Acara/Proker table's look, condensed. */
function RecentProker({
  proker,
}: {
  proker: Awaited<ReturnType<typeof getMyProker>>;
}) {
  return (
    <ul className="mt-6 space-y-2">
      {proker.slice(0, 4).map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-white">{p.name}</p>
            <p className="mt-1 truncate text-xs text-[#6f7286]">{p.role}</p>
          </div>
          <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
        </li>
      ))}
    </ul>
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
  const [summary, proker, report] = await Promise.all([
    getDivisionSummary(),
    getMyProker(),
    getSelfReport(),
  ]);
  const { attendance, points } = report;
  const done = proker.filter((p) => p.status === "selesai").length;
  const ongoing = proker.filter((p) => p.status === "berlangsung").length;
  const rated = report.competencies.some((c) => c.current != null);

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
            Hello, {firstName} <span aria-hidden="true">👋</span>
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{title}</Badge>
            {admin.department && <Badge>{admin.department}</Badge>}
          </div>
        </div>
        <p className="mt-3 text-[15px] text-[#8a8ea3]">
          Welcome to the officer dashboard for Period {CURRENT_PERIOD.label}.
        </p>
      </header>

      {/* profile */}
      <Card className="flex flex-col gap-8 p-6 sm:p-8 md:flex-row">
        <div className="flex shrink-0 items-center gap-4 md:w-24 md:flex-col md:border-r md:border-white/[0.06] md:pr-8">
          <Avatar name={admin.fullName} size="lg" />
          <Label>Profile</Label>
        </div>

        <dl className="grid flex-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full Name">{admin.fullName}</Field>
          <Field label="Student ID (NIM)">{admin.nim}</Field>
          <Field label="Department / Major">{admin.department}</Field>
          <Field label="Division in SPE">{admin.division?.name}</Field>
          <Field label="Position">{admin.position}</Field>
          <Field label="Term Period">{CURRENT_PERIOD.label}</Field>
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

      <div className="grid gap-4 sm:grid-cols-3">
        {proker.length > 0 ? (
          <Stat
            label="Involved Programs"
            value={proker.length}
            caption={`${done} completed · ${ongoing} in progress`}
          />
        ) : (
          <Stat label="Involved Programs" value="—" caption="No program data yet" />
        )}
        {attendance ? (
          <Stat
            label="Meeting Attendance"
            value={`${percentOf(attendance)}%`}
            caption={`${attendance.done} of ${attendance.total} meetings`}
          />
        ) : (
          <Stat label="Meeting Attendance" value="—" caption="No meeting data yet" />
        )}
        {points ? (
          <Stat
            label="Contribution Points"
            value={points.done}
            caption={`out of ${points.total} target points`}
          />
        ) : (
          <Stat label="Contribution Points" value="—" caption="No points this period" />
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.08fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6 sm:p-7">
            <SectionHeading
              eyebrow="Recent Activity"
              title="Events & Programs History"
            />
            {proker.length > 0 ? (
              <RecentProker proker={proker} />
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="No activity recorded"
                  description="Events and work programs you participate in will appear here along with their status."
                />
              </div>
            )}
            <DetailLink href="/admin/acara">
              View full details in Events & Programs
            </DetailLink>
          </Card>

          <Card className="p-6 sm:p-7">
            <SectionHeading
              eyebrow="Division Info"
              title={admin.division ? `${admin.division.name} Division` : "Division"}
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
                      "Total division members",
                      summary ? `${summary.memberCount} members` : "—",
                    ],
                    [
                      "Active programs",
                      summary?.activeProker != null
                        ? `${summary.activeProker} programs`
                        : "—",
                    ],
                    ["Head of division", summary?.headName || "—"],
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
                  title="Not assigned to a division"
                  description="Contact your division coordinator to assign your account to a division."
                />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 sm:p-7">
            <SectionHeading
              eyebrow="Term Progress"
              title={`Academic Year ${CURRENT_PERIOD.label}`}
            />
            <div className="mt-6 flex items-baseline justify-between text-[13px]">
              <span className="text-[#8a8ea3]">
                {period.percent}% of term elapsed
              </span>
              <span className="font-bold text-[#4f8dff]">{period.percent}%</span>
            </div>
            <ProgressBar
              percent={period.percent}
              label="Term progress"
              className="mt-2.5"
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5">
                <Label>Current Month</Label>
                <p className="mt-1.5 text-lg font-bold">
                  {period.currentMonth} / {period.totalMonths}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5">
                <Label>Time Remaining</Label>
                <p className="mt-1.5 text-lg font-bold">
                  {period.remainingMonths > 0
                    ? `~${period.remainingMonths} months`
                    : `${period.remainingDays} days`}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <SectionHeading eyebrow="Self Evaluation" title="Competency Summary" />
            {rated ? (
              <CompetencyList competencies={report.competencies} compact className="mt-6" />
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="No evaluation recorded"
                  description="Your competency evaluation results for this period will appear here once submitted."
                />
              </div>
            )}
            <DetailLink href="/admin/rekap-diri">
              View full details in Self Report
            </DetailLink>
          </Card>
        </div>
      </div>
    </div>
  );
}
