import type { CSSProperties } from "react";

/**
 * The hero floor is split into seven panels. The three middle ones are one
 * pitch wide and centred on the page; each edge panel is exactly as wide as
 * the step cut into the mascot beside it (`--edge-l` / `--edge-r`), so the
 * mascots can sit flush against the screen edges. Each panel rests at its own
 * height — `--p0` (centre, only its tip shows) out to `--p3` (edges, highest)
 * — and the mascot artwork is cut to meet the `--p2` and `--p3` edges exactly.
 */
const PANELS = ["--p3", "--p2", "--p1", "--p0", "--p1", "--p2", "--p3"];
const LEFTS = [
  "0%",
  "var(--edge-l)",
  "25%",
  "41.6667%",
  "58.3333%",
  "75%",
  "calc(100% - var(--edge-r))",
];
const WIDTHS = [
  "var(--edge-l)",
  "calc(25% - var(--edge-l))",
  "16.6667%",
  "16.6667%",
  "16.6667%",
  "calc(25% - var(--edge-r))",
  "var(--edge-r)",
];

const SLATS = PANELS.map((panel, i) => ({
  panel,
  left: LEFTS[i],
  width: WIDTHS[i],
  /* centre panel leads, the edges follow */
  delay: Math.abs(i - 3) * 0.07,
}));

/**
 * The curtain itself: it covers the hero on first paint and opens downwards,
 * panel by panel, settling along the floor.
 */
export function Curtain() {
  return (
    <div className="curtain" aria-hidden="true">
      {SLATS.map((slat) => (
        <div
          key={slat.left}
          className="slat"
          style={{ left: slat.left, width: slat.width }}
        >
          <div
            className="fabric"
            style={
              {
                "--panel-top": `var(${slat.panel})`,
                "--delay": `${slat.delay}s`,
              } as CSSProperties
            }
          >
            <span className="fabric-glow" />
          </div>
        </div>
      ))}
    </div>
  );
}
