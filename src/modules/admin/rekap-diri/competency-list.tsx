import type { Tone } from "../components/ui";
import { Badge } from "../components/ui";
import { getKategori, MAX_SCORE, type CompetencyResult, type Kategori } from "./data";

const KATEGORI_TONE: Record<Kategori, Tone> = {
  "Sangat Baik": "green",
  "Baik": "blue",
  "Cukup": "neutral",
  "Kurang": "amber",
  "Sangat Kurang": "amber",
};

function ScoreBar({ score }: { score: number | null }) {
  const percent = score != null ? (score / MAX_SCORE) * 100 : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
      {score != null && (
        <div
          className="h-full rounded-full bg-[#4f8dff] transition-all"
          style={{ width: `${percent}%` }}
        />
      )}
    </div>
  );
}

/**
 * Shows all 12 competencies with their scores.
 * `compact` is the overview's one-line version.
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
  const scored = competencies.filter((c) => c.current != null);
  const total = scored.reduce((sum, c) => sum + (c.current ?? 0), 0);
  const rataRata = scored.length > 0 ? total / scored.length : null;
  const kategori = rataRata != null ? getKategori(rataRata) : null;

  return (
    <div className={className}>
      <ul className={`${compact ? "space-y-3" : "space-y-2.5"}`}>
        {competencies.map(({ name, current }, i) => (
          <li
            key={name}
            className={`flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 ${
              compact ? "min-h-[54px] py-2.5" : "py-3.5"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={`text-[15px] ${
                    compact ? "text-[#e3e5ee]" : "font-medium text-white"
                  }`}
                >
                  <span className="mr-2 text-xs text-[#6f7286]">{i + 1}.</span>
                  {name}
                </p>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[#c7c9d4]">
                  {current != null ? current.toFixed(1) : "—"}
                  <span className="text-[#6f7286]"> / {MAX_SCORE}</span>
                </span>
              </div>
              {!compact && <ScoreBar score={current} />}
            </div>
          </li>
        ))}
      </ul>

      {/* Rekapitulasi */}
      <div className="mt-4 space-y-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#a3a6b8]">Total</span>
          <span className="text-lg font-bold tabular-nums text-white">
            {scored.length > 0
              ? `${total.toFixed(1)} / ${competencies.length * MAX_SCORE}`
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#a3a6b8]">Rata-rata</span>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tabular-nums text-white">
              {rataRata != null ? `${rataRata.toFixed(2)} / ${MAX_SCORE}` : "—"}
            </span>
            {kategori && (
              <Badge tone={KATEGORI_TONE[kategori]}>{kategori}</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
