import type { CSSProperties } from "react";

/**
 * The hero floor is split into seven panels: two half-pitch panels at the
 * edges and five full-pitch panels between them, so the middle panel is
 * centred on the page. Each panel rests at its own height — `--p0` (centre,
 * only its tip shows) out to `--p3` (edges, highest) — and the mascot artwork
 * is cut to meet the `--p2` and `--p3` edges exactly.
 */
const HALF = 100 / 12; // 8.3333%
const PITCH = 100 / 6; // 16.6667%
const PANELS = ["--p3", "--p2", "--p1", "--p0", "--p1", "--p2", "--p3"];

const SLATS = PANELS.map((panel, i) => ({
  panel,
  left: i === 0 ? 0 : HALF + (i - 1) * PITCH,
  width: i === 0 || i === PANELS.length - 1 ? HALF : PITCH,
  /* centre panel leads, the edges follow */
  delay: Math.abs(i - 3) * 0.07,
}));

/** Panel seams, visible where the lavender bloom sits behind them. */
export function HeroSeams() {
  return (
    <div className="hero-seams" aria-hidden="true">
      {SLATS.slice(1).map((slat) => (
        <span
          key={slat.left}
          className="hero-seam"
          style={{ left: `${slat.left}%` }}
        />
      ))}
    </div>
  );
}

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
          style={{ left: `${slat.left}%`, width: `${slat.width}%` }}
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
