/*
 * The light behind the bento: four blurred teardrop shapes, one per card in
 * the Figma file, each filled with a linear gradient
 * (#9999FF → #4E4EFF → #FFFFFF) at 60% and softened with a layer blur. They
 * sit behind all four cards as one layer, so a glow runs on into the next
 * card, but the gaps between cards stay clear.
 *
 * Coordinates are Figma units on the desktop grid, which is 1277 × 884:
 * two 434-tall rows, 16 apart, split 767 + 494 and mirrored below.
 */

type Point = readonly [number, number];

type Glow = {
  path: string;
  /** Gradient axis, from the 0% edge of the shape's box to its 100% edge. */
  from: Point;
  to: Point;
  stops: readonly [offset: number, color: string, opacity: number][];
};

export const GRID = { width: 1277, height: 884 };

export const CARD_RECTS = {
  career: [0, 0, 767, 434],
  tracker: [783, 0, 494, 434],
  education: [0, 450, 494, 434],
  community: [510, 450, 767, 434],
} as const;

export type CardName = keyof typeof CARD_RECTS;

const GLOWS: Glow[] = [
  /* career — tail from the left edge, head under the tracker card */
  {
    path: "M-15 452C250 480 600 470 800 440C880 430 945 390 940 340C935 280 880 235 830 235C650 250 250 430-15 452Z",
    from: [-15, 452],
    to: [517, -80],
    stops: [
      [0, "#9999FF", 1],
      [0.7, "#4E4EFF", 1],
      [1, "#FFFFFF", 1],
    ],
  },
  /* tracker — tail from the right edge, head at the card's bottom-left */
  {
    path: "M1314 405C1150 360 950 250 810 215C740 195 700 330 760 430C800 460 1000 400 1314 405Z",
    from: [964, 62],
    to: [1314, 412],
    stops: [
      [0, "#9999FF", 1],
      [0.47, "#4E4EFF", 1],
      [1, "#FFFFFF", 1],
    ],
  },
  /* education — tail from the top-left, head at the card's top-right */
  {
    path: "M-9 431C200 381 522 381 651 510C608 596 500 682 447 661C372 628 264 467-9 431Z",
    from: [362, 804],
    to: [-8, 433],
    stops: [
      [0, "#9999FF", 1],
      [0.6, "#4E4EFF", 1],
      [1, "#FFFFFF", 1],
    ],
  },
  /* community — tail from the right edge, head at the card's top-left */
  {
    path: "M1257 450C956 450 525 472 407 558C331 622 396 698 504 655C740 579 1064 482 1257 450Z",
    from: [311, 562],
    to: [840, 33],
    stops: [
      [0, "#9999FF", 0.3],
      [0.7, "#4E4EFF", 1],
      [1, "#FFFFFF", 1],
    ],
  },
];

/** Layer blur, as an SVG standard deviation in Figma units. The layer as a
    whole is dimmed to 70%, standing in for the cards' glass over it. */
const BLUR = 30;

/**
 * The glow layer, showing `viewBox` of the desktop grid. `id` keeps the
 * gradient and filter ids unique, since every card draws its own copy.
 */
export function Glows({
  id,
  viewBox,
  preserveAspectRatio,
  className,
}: {
  id: string;
  viewBox: readonly [number, number, number, number];
  preserveAspectRatio: "none" | "xMidYMid slice";
  className: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox.join(" ")}
      preserveAspectRatio={preserveAspectRatio}
      className={`pointer-events-none -z-10 opacity-70 ${className}`}
    >
      <defs>
        <filter
          id={`${id}-blur`}
          filterUnits="userSpaceOnUse"
          x={-400}
          y={-400}
          width={GRID.width + 800}
          height={GRID.height + 800}
        >
          <feGaussianBlur stdDeviation={BLUR} />
        </filter>
        {GLOWS.map((glow, i) => (
          <linearGradient
            key={i}
            id={`${id}-${i}`}
            gradientUnits="userSpaceOnUse"
            x1={glow.from[0]}
            y1={glow.from[1]}
            x2={glow.to[0]}
            y2={glow.to[1]}
          >
            {glow.stops.map(([offset, color, opacity]) => (
              <stop
                key={offset}
                offset={offset}
                stopColor={color}
                stopOpacity={opacity}
              />
            ))}
          </linearGradient>
        ))}
      </defs>
      <g filter={`url(#${id}-blur)`}>
        {GLOWS.map((glow, i) => (
          <path
            key={i}
            d={glow.path}
            fill={`url(#${id}-${i})`}
            fillOpacity={0.6}
          />
        ))}
      </g>
    </svg>
  );
}
