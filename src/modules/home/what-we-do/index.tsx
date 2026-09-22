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
      className={`flagship-glass-card isolate rounded-[24px] border border-black/[0.08] outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] max-lg:relative ${className}`}
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
          <img src="/global/SVG-star.svg" width="14" height="14" aria-hidden="true" alt="" />
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
        <article className="flagship-glass-card relative isolate flex flex-col items-center rounded-[24px] border border-black/[0.08] px-6 pt-12 pb-9 outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] overflow-hidden md:px-10 lg:col-span-2 lg:min-h-[434px]">
          {/* Purple gradient ellipse - bottom right */}
          <div className="pointer-events-none absolute -bottom-12 -right-12 w-[600px] opacity-70">
            <Image
              src="/landing/what-we-do/Ellipse 1479.svg"
              alt=""
              width={956}
              height={376}
              className="h-auto w-full"
            />
          </div>
          
          <SpeMark />
          <div className="relative z-10 mt-auto w-full space-y-7 pt-10">
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
        </article>

        <article className="flagship-glass-card relative isolate rounded-[24px] border border-black/[0.08] px-6 pt-10 pb-9 outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] overflow-hidden md:px-8 lg:min-h-[434px]">
          {/* Purple gradient ellipse - bottom left */}
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-[500px] opacity-70">
            <Image
              src="/landing/what-we-do/Ellipse 1480.svg"
              alt=""
              width={956}
              height={376}
              className="h-auto w-full"
            />
          </div>
          
          <div className="relative z-10">
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
          </div>
        </article>

        <article className="flagship-glass-card relative isolate flex flex-col rounded-[24px] border border-black/[0.08] px-6 pt-8 pb-9 outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] overflow-hidden md:px-8 lg:min-h-[421px]">
          {/* Purple gradient ellipse - top right */}
          <div className="pointer-events-none absolute -top-24 -right-32 w-[660px] opacity-70">
            <Image
              src="/landing/what-we-do/Ellipse 1478.svg"
              alt=""
              width={956}
              height={376}
              className="h-auto w-full"
            />
          </div>
          
          <div className="relative z-10">
            <Copy title="Technical Skill Enhancement">
              Seamlessly bridge students, industry professionals
            </Copy>
            
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-start rounded-xl border border-[#e4e5f0] bg-white/70 p-4">
                <div className="grid size-12 place-items-center rounded-xl bg-[#eceef6]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6d5ae0]">
                    <rect x="3" y="3" width="7" height="18" rx="1"/>
                    <rect x="14" y="8" width="7" height="13" rx="1"/>
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium leading-snug text-ink">
                  Data Analytic for Energy
                </p>
              </div>
              
              <div className="flex flex-col items-start rounded-xl border border-[#e4e5f0] bg-white/70 p-4">
                <div className="grid size-12 place-items-center rounded-xl bg-[#eceef6]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6d5ae0]">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium leading-snug text-ink">
                  Renewable Energy System
                </p>
              </div>
              
              <div className="flex flex-col items-start rounded-xl border border-[#e4e5f0] bg-white/70 p-4">
                <div className="grid size-12 place-items-center rounded-xl bg-[#eceef6]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6d5ae0]">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 3v4M8 3v4M2 11h20"/>
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium leading-snug text-ink">
                  Development Training
                </p>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 shrink-0 rounded-full bg-[#6d5ae0]"/>
                <p className="text-sm text-ink-soft">
                  World-class speakers from leading energy companies
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 shrink-0 rounded-full bg-[#6d5ae0]"/>
                <p className="text-sm text-ink-soft">
                  Hands-on technical workshops and certifications
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="flagship-glass-card relative isolate flex flex-col rounded-[24px] border border-black/[0.08] px-6 pt-8 pb-9 outline outline-2 -outline-offset-1 outline-ink/10 [clip-path:inset(0_round_24px)] overflow-hidden md:px-8 lg:col-span-2 lg:min-h-[421px]">
          {/* Purple gradient ellipse - top left */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-[950px] opacity-70">
            <Image
              src="/landing/what-we-do/Ellipse 1481.svg"
              alt=""
              width={956}
              height={376}
              className="h-auto w-full"
            />
          </div>
          
          <div className="relative z-10">
            <Copy title="Networking & Community">
              Seamlessly bridge students, industry professionals
            </Copy>
            
            <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-base font-semibold text-ink">Connect & Engage</h4>
                <ul className="mt-4 space-y-3">
                  {[
                    { name: "SPE ITB SC", logo: "/landing/what-we-do/spe-itb.webp" },
                    { name: "SPE UPNVY SC", logo: "/landing/what-we-do/spe-upnvy.webp" },
                    { name: "SPE ITS SC", logo: "/landing/what-we-do/spe-its.webp" },
                    { name: "SPE UI SC", logo: "/landing/what-we-do/spe-ui.webp" },
                    { name: "SPE Trisakti SC", logo: "/landing/what-we-do/spe-trisakti.webp" },
                  ].map((chapter) => (
                    <li key={chapter.name} className="flex items-center gap-3 rounded-lg border border-[#e4e5f0] bg-white/70 px-3 py-2.5">
                      <div className="grid size-6 shrink-0 place-items-center overflow-hidden rounded">
                        <Image
                          src={chapter.logo}
                          alt={chapter.name}
                          width={24}
                          height={24}
                          className="size-full object-contain"
                        />
                      </div>
                      <span className="text-sm text-ink">{chapter.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#f8f9fd] to-[#eef0ff] p-6">
                <svg width="200" height="120" viewBox="0 0 200 120" fill="none" className="opacity-60">
                  <ellipse cx="100" cy="60" rx="60" ry="35" fill="#6d5ae0" fillOpacity="0.1"/>
                  <path d="M80 50 L85 55 L90 45 L95 60 L100 50 L105 65 L110 55 L115 60 L120 50" stroke="#6d5ae0" strokeWidth="2" fill="none"/>
                  <circle cx="100" cy="55" r="3" fill="#6d5ae0"/>
                </svg>
                <p className="mt-4 text-center text-xs text-ink-soft">
                  Connected across Indonesia
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <a
                href="https://www.spe.org/en/chapters/list/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#6d5ae0] bg-white/80 px-5 py-2.5 text-sm font-medium text-[#6d5ae0] transition-all hover:bg-[#6d5ae0] hover:text-white"
              >
                Find an SPE Chapter
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 12l4-4-4-4"/>
                </svg>
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
