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

/* The stepped edge where the panels come to rest, as polygon points. */
const EDGE = PANELS.flatMap((panel, i) => [
  `${LEFTS[i]} var(${panel})`,
  `${LEFTS[i + 1] ?? "100%"} var(${panel})`,
]).join(", ");
const CURTAIN_SHAPE = `polygon(${EDGE}, 100% 100%, 0 100%)`;
const ABOVE_SHAPE = `polygon(0 0, ${EDGE}, 100% 0)`;

/**
 * The curtain itself: it covers the hero on first paint and opens downwards,
 * panel by panel, settling along the floor. It sits above every hero layer
 * because it reveals all of them.
 */
export function Curtain() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-40 max-md:top-0 -bottom-[calc(0*var(--u))] z-10"
      aria-hidden="true"
    >
      {SLATS.map((slat) => (
        /* each slat runs 1px past its right and bottom edges so fractional
           panel widths never open a hairline seam onto the hero behind */
        <div
          key={slat.left}
          className="absolute top-0 -bottom-px overflow-hidden"
          style={{ left: slat.left, width: `calc(${slat.width} + 1px)` }}
        >
          <div
            className="absolute inset-x-0 top-(--panel-top) -bottom-(--travel) animate-curtain-drop bg-curtain shadow-[0_calc(-0.05*var(--u))_calc(0.22*var(--u))_rgba(78,78,255,0.22)] motion-reduce:animate-none"
            style={
              {
                "--panel-top": `var(${slat.panel})`,
                "--delay": `${slat.delay}s`,
              } as CSSProperties
            }
          />
        </div>
      ))}

      {/* Edge glow, laid over the whole curtain once it has settled. The
          room above the curtain is filled with light and blurred, then
          clipped back to the curtain's shape — so the glow wraps each step
          and carries across panels instead of stopping at every seam. It
          hangs below the hero too, so the fade finishes in the next section
          rather than being cut at the centre panel's shallow tip. */}
      <div
        className="absolute inset-x-0 top-0 -bottom-[calc(1.6*var(--u))] animate-glow-in motion-reduce:animate-none"
        style={{ clipPath: CURTAIN_SHAPE }}
      >
        <div className="absolute inset-y-0 -inset-x-(--u) blur-[calc(0.5*var(--u))]">
          <div
            className="absolute inset-y-0 inset-x-(--u) bg-[#eef1ff]"
            style={{ clipPath: ABOVE_SHAPE }}
          />
          {/* light beyond the screen edges, so the glow doesn't thin out
              at the far sides */}
          <div className="absolute top-0 left-0 h-(--p3) w-(--u) bg-[#eef1ff]" />
          <div className="absolute top-0 right-0 h-(--p3) w-(--u) bg-[#eef1ff]" />
        </div>
      </div>
    </div>
  );
}
