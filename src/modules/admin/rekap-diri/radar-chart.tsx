import { MAX_SCORE, type CompetencyResult } from "./data";

const WIDTH = 440;
const HEIGHT = 340;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const RADIUS = 120;
const LABEL_RADIUS = RADIUS + 30;

/** Point for axis `i` of `count`, clockwise from the top, at `r` from the centre. */
function point(i: number, count: number, r: number) {
  const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

const toPoints = (points: { x: number; y: number }[]) =>
  points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** A series is drawn only once every competency has a score. */
function series(scores: (number | null)[]) {
  if (scores.some((s) => s == null)) return null;
  return (scores as number[]).map((score, i) =>
    point(i, scores.length, (RADIUS * score) / MAX_SCORE),
  );
}

export function RadarChart({ competencies }: { competencies: CompetencyResult[] }) {
  const count = competencies.length;
  const initial = series(competencies.map((c) => c.initial));
  const current = series(competencies.map((c) => c.current));

  const rings = Array.from({ length: MAX_SCORE }, (_, i) =>
    toPoints(
      competencies.map((_, axis) =>
        point(axis, count, (RADIUS * (i + 1)) / MAX_SCORE),
      ),
    ),
  );

  const summary =
    current == null
      ? "Grafik kompetensi, belum ada penilaian."
      : "Grafik kompetensi: " +
        competencies
          .map((c) => `${c.name} ${c.initial ?? "—"} menjadi ${c.current}`)
          .join(", ");

  return (
    <div className="flex flex-1 flex-col">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#a3a6b8]">
        <li className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full bg-[#a3a6b8]" />
          Awal Periode
        </li>
        <li className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full bg-[#3b82f6]" />
          Saat Ini
        </li>
      </ul>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={summary}
          className="w-full max-w-[440px]"
        >
          <circle cx={CX} cy={CY} r={RADIUS} fill="rgb(255 255 255 / 0.02)" />

          {rings.map((ring, i) => (
            <polygon
              key={i}
              points={ring}
              fill="none"
              stroke={
                i === rings.length - 1
                  ? "rgb(255 255 255 / 0.14)"
                  : "rgb(255 255 255 / 0.07)"
              }
            />
          ))}
          {competencies.map((_, i) => {
            const end = point(i, count, RADIUS);
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={end.x}
                y2={end.y}
                stroke="rgb(255 255 255 / 0.07)"
              />
            );
          })}
          {Array.from({ length: MAX_SCORE }, (_, i) => (
            <text
              key={i}
              x={CX + 4}
              y={CY - (RADIUS * (i + 1)) / MAX_SCORE + 3}
              fontSize="9"
              fill="#4b4e63"
            >
              {i + 1}
            </text>
          ))}

          {initial && (
            <g>
              <polygon
                points={toPoints(initial)}
                fill="rgb(163 166 184 / 0.08)"
                stroke="#a3a6b8"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {initial.map(({ x, y }, i) => (
                <circle key={i} cx={x} cy={y} r="3.5" fill="#a3a6b8" />
              ))}
            </g>
          )}
          {current && (
            <g>
              <polygon
                points={toPoints(current)}
                fill="rgb(59 130 246 / 0.22)"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {current.map(({ x, y }, i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" />
              ))}
            </g>
          )}

          {competencies.map(({ name }, i) => {
            const { x, y } = point(i, count, LABEL_RADIUS);
            const side = x - CX;
            const anchor =
              Math.abs(side) < 1 ? "middle" : side > 0 ? "start" : "end";
            /* long names on the sides wrap to two lines */
            const lines =
              anchor !== "middle" && name.length > 12 ? name.split(" ") : [name];
            return (
              <text
                key={name}
                x={x}
                y={y - ((lines.length - 1) * 14) / 2}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="12"
                fill="#a3a6b8"
              >
                {lines.map((line, n) => (
                  <tspan key={line} x={x} dy={n === 0 ? 0 : 14}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}
        </svg>

        {current == null && (
          <p className="mt-2 max-w-xs text-center text-[13px] leading-relaxed text-[#6f7286]">
            Grafik akan terisi setelah HR mengisi evaluasi awal dan akhir periode.
          </p>
        )}
      </div>
    </div>
  );
}
