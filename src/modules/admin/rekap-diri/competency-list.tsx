import { Badge, type Tone } from "../components/ui";
import type { CompetencyResult, Rating } from "./data";

const RATING: Record<Rating, { label: string; tone: Tone }> = {
  sangat_baik: { label: "Sangat Baik", tone: "green" },
  baik: { label: "Baik", tone: "blue" },
  cukup: { label: "Cukup", tone: "neutral" },
  perlu_ditingkatkan: { label: "Perlu Ditingkatkan", tone: "amber" },
};

/**
 * Each competency with its HR rating. Rekap Diri shows the full rows;
 * `compact` is the overview's one-line version with bolder badges.
 */
export function CompetencyList({
  competencies,
  compact = false,
  className = "",
}: {
  competencies: CompetencyResult[];
  compact?: boolean;
  className?: string;
}) {
  const badge = compact ? "px-3 py-1.5 text-[13px] font-semibold" : undefined;

  return (
    <ul className={`${compact ? "space-y-3" : "space-y-2.5"} ${className}`}>
      {competencies.map(({ name, rating }) => (
        <li
          key={name}
          className={`flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 ${
            compact ? "min-h-[54px] py-2.5" : "py-3.5"
          }`}
        >
          <div className="min-w-0">
            <p
              className={`text-[15px] ${
                compact ? "text-[#e3e5ee]" : "font-medium text-white"
              }`}
            >
              {name}
            </p>
            {!compact && (
              <p className="mt-1 text-xs text-[#6f7286]">
                Evaluasi oleh HR / Kepala Divisi
              </p>
            )}
          </div>
          {rating ? (
            <Badge tone={RATING[rating].tone} className={badge}>
              {RATING[rating].label}
            </Badge>
          ) : (
            <Badge className={badge}>Belum dinilai</Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
