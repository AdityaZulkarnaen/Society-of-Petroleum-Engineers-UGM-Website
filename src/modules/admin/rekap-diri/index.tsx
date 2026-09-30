import { requireAdmin } from "../auth/session";
import { Card, Label, ProgressBar, SectionHeading } from "../components/ui";
import { CompetencyList } from "./competency-list";
import type { Tally } from "./data";
import { getSelfReport } from "./load";
import { RadarChart } from "./radar-chart";

function TallyCard({ label, tally }: { label: string; tally: Tally }) {
  const percent =
    tally && tally.total > 0
      ? Math.round(Math.min(1, tally.done / tally.total) * 100)
      : null;

  return (
    <Card className="px-6 py-6 sm:px-7">
      <div className="flex items-baseline justify-between gap-4">
        <Label>{label}</Label>
        <p className="text-xl font-bold tracking-[-0.01em] whitespace-nowrap">
          {tally ? (
            `${tally.done} / ${tally.total}`
          ) : (
            <span className="text-[#5d6075]">—</span>
          )}
        </p>
      </div>
      <ProgressBar percent={percent} label={label} className="mt-4" />
      <p className="mt-2.5 text-right text-[13px] font-bold text-[#4f8dff]">
        {percent == null ? (
          <span className="font-normal text-[#6f7286]">No data yet</span>
        ) : (
          `${percent}%`
        )}
      </p>
    </Card>
  );
}

const NOTES = [
  {
    key: "achievements",
    title: "Key Contributions & Achievements",
    color: "text-[#4f8dff]",
  },
  { key: "strengths", title: "Observed Strengths", color: "text-[#4ade80]" },
  {
    key: "improvements",
    title: "Areas for Development",
    color: "text-[#fbbf24]",
  },
] as const;

export async function SelfReportPage() {
  await requireAdmin();
  const report = await getSelfReport();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
          Self Report
        </h1>
        <p className="mt-3 text-[15px] text-[#8a8ea3]">
          Comprehensive summary of accomplishments, competencies, and self-reflection throughout the term.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <TallyCard label="Programs Completed" tally={report.proker} />
        <TallyCard label="Work Hours Recorded" tally={report.workHours} />
        <TallyCard label="Meeting Attendance" tally={report.attendance} />
        <TallyCard label="Contribution Points" tally={report.points} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col p-6 sm:p-7">
          <SectionHeading
            eyebrow="Growth Trend"
            title="Competency Growth"
          />
          <div className="mt-5 flex flex-1 flex-col">
            <RadarChart competencies={report.competencies} />
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <SectionHeading eyebrow="HR / Head Evaluation" title="Competency Details" />
          <CompetencyList competencies={report.competencies} className="mt-5" />
        </Card>
      </div>

      <Card className="p-6 sm:p-7">
        <SectionHeading eyebrow="Evaluator Summary" title="HR Notes & Summary" />
        <div className="mt-5 space-y-4">
          {NOTES.map(({ key, title, color }) => {
            const note = report.notes[key];
            return (
              <section
                key={key}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-5"
              >
                <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    note ? "text-[#c7c9d4]" : "text-[#6f7286]"
                  }`}
                >
                  {note ?? "No notes from HR recorded for this period yet."}
                </p>
              </section>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
