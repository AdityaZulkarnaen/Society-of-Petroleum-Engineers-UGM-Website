import Image from "next/image";
import type { ReactNode } from "react";

import { CARD_RECTS, GRID, Glows, type CardName } from "./glows";

type Status = "Completed" | "In Progress";

const TRACKER: { name: string; status: Status }[] = [
  { name: "APECX 2026", status: "Completed" },
  { name: "SC Gathering", status: "Completed" },
  { name: "Company Visit To SLB CIB", status: "In Progress" },
];

/**
 * On desktop the card is not positioned, so its glow layer spans the whole
 * grid and the clip-path cuts out just this card's share of it — the glows
 * carry on from card to card, and the gaps stay clear. Stacked on smaller
 * screens, each card shows its own rectangle of the desktop layer instead.
 * The outline stands in for a border, which the glow would paint over.
 */
function Card({
  name,
  className = "",
  children,
}: {
  name: CardName;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={`isolate rounded-[20px] bg-[#f2f4fd] outline-1 -outline-offset-1 outline-white [clip-path:inset(0_round_20px)] max-lg:relative ${className}`}
    >
      <Glows
        id={`glow-${name}-lg`}
        viewBox={[0, 0, GRID.width, GRID.height]}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full max-lg:hidden"
      />
      <Glows
        id={`glow-${name}-sm`}
        viewBox={CARD_RECTS[name]}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full lg:hidden"
      />
      {children}
    </article>
  );
}

function SpeMark() {
  return (
    <Image
      src="/landing/what-we-do/emblem.webp"
      alt=""
      width={160}
      height={88}
      className="h-[72px] w-auto md:h-[88px]"
    />
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <ul className="mx-auto flex max-w-[420px] flex-wrap justify-center gap-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-[#e4e5f0] bg-white/80 px-3 py-1 text-xs text-ink-soft"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Copy({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="text-center">
      <h3 className="text-xl font-bold tracking-[-0.01em] text-ink md:text-[23px]">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-[560px] text-sm leading-relaxed text-ink-soft">
        {children}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span className="shrink-0 rounded-full border border-[#8b8bff] bg-[#eef0ff] px-2.5 py-0.5 text-[11px] font-medium text-[#4e4eff]">
      {status}
    </span>
  );
}

/**
 * What the chapter does, as a two-row bento: a wide card and a narrow one,
 * mirrored on the second row. Three column tracks let the wide cards span
 * two of them in either position.
 */
export function WhatWeDo() {
  return (
    <section
      id="what-we-do"
      aria-labelledby="what-we-do-title"
      className="px-6 pt-[clamp(1rem,calc(24*var(--k)),2.5rem)] pb-[clamp(5rem,calc(120*var(--k)),9rem)] md:px-10"
    >
      <header className="text-center">
        <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0c.5 3.9 2.1 5.5 6 6-3.9.5-5.5 2.1-6 6-.5-3.9-2.1-5.5-6-6 3.9-.5 5.5-2.1 6-6Z"
              transform="translate(0 2)"
            />
          </svg>
          What We Do
        </p>
        <h2
          id="what-we-do-title"
          className="mt-3 text-3xl md:text-7xl leading-[1.15] font-bold tracking-[-0.02em] text-ink"
        >
          Built for Every Future Engineer
        </h2>
      </header>

      <div className="mx-auto mt-[clamp(2rem,calc(48*var(--k)),3.5rem)] grid max-w-[1277px] gap-4 lg:relative lg:grid-cols-[1fr_0.52fr_1fr]">
        <Card name="career" className="flex flex-col items-center px-6 pt-12 pb-9 md:px-10 lg:col-span-2 lg:min-h-[434px]">
          <SpeMark />
          <div className="mt-auto w-full space-y-7 pt-10">
            <Tags
              items={[
                "Company Visit",
                "Research Groups",
                "Interview Prep",
                "SPE International",
                "Career Talk",
              ]}
            />
            <Copy title="Career-Oriented Development">
              Preparing students to carve their career paths and land dream roles
              in the energy sector through mentorship, career talks, and
              skill-building programs.
            </Copy>
          </div>
        </Card>

        <Card name="tracker" className="px-6 pt-10 pb-9 md:px-8 lg:min-h-[434px]">
          <Copy title="Event & Program Tracker">
            Real-time progress and milestones of our continuous learning
            programs, industry visits, and international events.
          </Copy>
          <p className="mt-9 text-[11px] font-medium tracking-[0.08em] text-[#9a9db0] uppercase">
            Program Execution Status
          </p>
          <ol className="mt-3 space-y-3">
            {TRACKER.map(({ name, status }, i) => (
              <li
                key={name}
                className="flex items-center gap-3 rounded-xl border border-[#e4e5f0] bg-white/70 px-3.5 py-3"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eceef6] text-[11px] font-semibold text-[#8a8ea3]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {name}
                </span>
                <StatusPill status={status} />
              </li>
            ))}
          </ol>
        </Card>

        <Card
          name="education"
          className="flex min-h-[320px] flex-col justify-end px-6 pb-9 md:px-10 lg:min-h-[434px]"
        >
          <Copy title="Education & Skill Enhancement">
            Boosting technical insights through short courses, writing series,
            and direct knowledge-sharing on energy issues.
          </Copy>
        </Card>

        <Card
          name="community"
          className="flex flex-col items-center px-6 pt-12 pb-9 md:px-10 lg:col-span-2 lg:min-h-[434px]"
        >
          <SpeMark />
          <div className="mt-auto w-full space-y-7 pt-10">
            <Tags
              items={[
                "Members Connect",
                "Industry Network",
                "Alumni Base",
                "SPE International",
                "Research Groups",
              ]}
            />
            <Copy title="Strategic Community Engagement">
              Bridging engineering & geophysics students with 20+ multinational
              oil & gas companies, alumni, and global chapters.
            </Copy>
          </div>
        </Card>
      </div>
    </section>
  );
}
