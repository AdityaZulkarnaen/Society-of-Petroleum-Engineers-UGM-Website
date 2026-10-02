import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { PageMotion } from "@/components/motion/page-motion";

import { CoreValues } from "./core-values";
import { CountUp } from "./count-up";
import { Leadership } from "./leadership";

/* The copy below follows the design; the Vision and Mission cards share the
   same placeholder text there, so replace it with the chapter's own. */

const STORY = [
  "Society of Petroleum Engineers (SPE) UGM Student Chapter is a non-profit, student-led organization established in November 2008 under SPE Indonesia and SPE Java Section. Bringing together students from diverse engineering and science disciplines at Universitas Gadjah Mada, we serve as a platform for technical development, professional growth, leadership, and industry engagement. Through collaboration, innovation, and continuous learning, we empower the next generation of energy professionals to create meaningful impact in the evolving energy sector.",
  "SPE UGM SC is composed of students from diverse academic backgrounds across the Faculty of Engineering and Faculty of Science at Universitas Gadjah Mada. This multidisciplinary composition creates an environment where students with different expertise, perspectives, and interests can collaborate towards common goals. The diversity of its members reflects the increasingly interconnected nature of the energy industry, where collaboration between disciplines is essential in addressing complex technical and societal challenges.",
];

const VISION =
  "To transform SPE UGM SC into a dynamic, future-ready energy community that empowers its members academically, professionally, and socially—bridging campus, industry, and society to create meaningful and sustainable impact.";

const MISSIONS = [
  "Build an inclusive, supportive, and growth-oriented environment that ensures every member receives structured mentorship, soft-skills training, and leadership opportunities",
  "Elevate Academic Excellence & Technical Competence with impactful programs: research labs, technical workshops, software mastery, and certification preparation",
  "Strengthen Communication, Branding & Public Engagement through a cohesive visual identity, data-driven content strategy, and educational outreach to broaden SPE UGM’s visibility on campus and beyond.",
  "Establish long-term partnerships with energy companies, research institutions, and professional bodies to create pipelines for internships, field trips, workshops, and career development.",
];

const METRICS = [
  { value: 542, label: "Active Members" },
  { value: 45, label: "Annual Programs" },
  { value: 9, label: "International Awards" },
  { value: 15, label: "Corporate Partners" },
];

const TITLE = "SPE UGM SC";

/* The photo opens the way the home hero does: a curtain of seven slats in
   the chapter's blue drops away, the centre slat first, while the photo
   settles behind it. Each slat's delay grows with its distance from the
   centre. */
const SLATS = [3, 2, 1, 0, 1, 2, 3].map((step) => 0.35 + step * 0.07);

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 0c.5 3.9 2.1 5.5 6 6-3.9.5-5.5 2.1-6 6-.5-3.9-2.1-5.5-6-6 3.9-.5 5.5-2.1 6-6Z"
          transform="translate(0 2)"
        />
      </svg>
      {children}
    </p>
  );
}

const sectionTitle =
  "mt-3 font-display text-[clamp(30px,calc(60*var(--k)),64px)] leading-[1.12] font-bold tracking-[-0.02em] text-ink";

/* Soft lavender glass with the design's violet glows in the lower corners. */
const glassCard =
  "rounded-[clamp(20px,calc(28*var(--k)),32px)] border border-white bg-[radial-gradient(55%_45%_at_100%_100%,rgb(78_78_255/0.28),transparent),radial-gradient(45%_40%_at_0%_100%,rgb(153_153_255/0.3),transparent),linear-gradient(160deg,#f7f7ff_0%,#eef0fd_100%)] shadow-[0_24px_60px_-34px_rgba(60,48,160,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]";

/**
 * The teardrop of light across the top of the Vision / Mission cards, after
 * Figma: linear #9999FF → #4E4EFF (60%) → #FFFFFF at 60% opacity, layer
 * blur 70 (an SVG standard deviation of about half that). Its thin tail
 * starts at the card's top-left corner and the round head runs off the
 * top-right edge; the Mission card mirrors it. Drawn in a 524 × 411 box, the
 * card's size in the design.
 */
function TopGlow({ id, mirrored = false }: { id: string; mirrored?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      data-motion="glow"
      data-glow="sweep"
      viewBox="0 0 524 411"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 top-0 h-[411px] w-full ${
        mirrored ? "-scale-x-100" : ""
      }`}
    >
      <defs>
        <linearGradient
          id={`${id}-fill`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="10"
          x2="740"
          y2="-50"
        >
          <stop offset="0" stopColor="#9999FF" />
          <stop offset="0.6" stopColor="#4E4EFF" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="35" />
        </filter>
      </defs>
      <path
        d="M-6 4C110 -2 300 -46 430 -52C540 -56 590 20 548 92C505 160 390 138 300 96C200 52 90 22 -6 4Z"
        fill={`url(#${id}-fill)`}
        fillOpacity="0.6"
        filter={`url(#${id}-blur)`}
      />
    </svg>
  );
}

/* The metrics card: plain light glass, lit only by the ellipse at its foot. */
const metricsCard =
  "rounded-[clamp(20px,calc(28*var(--k)),32px)] border border-white bg-[linear-gradient(160deg,#f8f8ff_0%,#f1f2fd_100%)] shadow-[0_24px_60px_-34px_rgba(60,48,160,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]";

function VisionCard() {
  return (
    <article
      data-motion="rise"
      data-sheen
      className={`${glassCard} relative isolate overflow-hidden px-6 pt-10 pb-9 sm:px-9 [&>*:not(svg)]:relative`}
    >
      <TopGlow id="glow-our-vision" />
      <Image
        src="/global/logo.webp"
        alt=""
        width={169}
        height={147}
        className="mx-auto h-11 w-auto"
      />
      <h3 className="mt-4 bg-[linear-gradient(90deg,#3b3bd6_0%,#4e4eff_55%,#7c7cff_100%)] bg-clip-text text-center font-display text-[clamp(34px,calc(56*var(--k)),60px)] leading-tight font-bold tracking-[-0.02em] text-black">
        Our Vision
      </h3>
      <p className="mt-8 text-left text-sm leading-relaxed text-ink-soft sm:text-[15px]">
        {VISION}
      </p>
    </article>
  );
}

function MissionCard() {
  return (
    <article
      data-motion="rise"
      data-sheen
      className={`${glassCard} relative isolate overflow-hidden px-6 pt-10 pb-9 sm:px-9 [&>*:not(svg)]:relative`}
    >
      <TopGlow id="glow-our-mission" mirrored />
      <Image
        src="/global/logo.webp"
        alt=""
        width={169}
        height={147}
        className="mx-auto h-11 w-auto"
      />
      <h3 className="mt-4 bg-[linear-gradient(90deg,#3b3bd6_0%,#4e4eff_55%,#7c7cff_100%)] bg-clip-text text-center font-display text-[clamp(34px,calc(56*var(--k)),60px)] leading-tight font-bold tracking-[-0.02em] text-black">
        Our Mission
      </h3>
      <ul
        data-motion="stagger"
        data-motion-y="16"
        data-motion-delay="0.3"
        className="mt-8 space-y-4"
      >
        {MISSIONS.map((mission, index) => (
          <li key={index} className="flex items-start gap-3">
            <span
              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-curtain"
              aria-hidden="true"
            />
            <p className="text-left text-xs leading-relaxed text-ink-soft sm:text-[13px] md:text-sm">
              {mission}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}

/**
 * The About page's opening: title over the chapter's group photo. It carries
 * `data-nav-float`, so the header floats over it like it does over the home
 * hero and docks once it has scrolled past.
 */
export function AboutPage() {
  return (
    <main className="bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,#eceefd_0%,var(--color-ground)_70%)]">
      <section
        data-nav-float
        aria-labelledby="about-title"
        className="px-4 pt-[calc(3svh+var(--nav-h)+clamp(2.5rem,calc(64*var(--k)),5.5rem))] pb-[clamp(3rem,calc(80*var(--k)),6rem)]"
      >
        <header className="text-center">
          <p className="flex animate-fade-rise items-center justify-center gap-2 text-base text-curtain [--delay:0.05s] motion-reduce:animate-none md:text-lg">
            <img src="/global/SVG-star.svg" width="14" height="14" aria-hidden="true" alt="" />
            Inspired To Impact
          </p>
          {/* each letter rises out of one shared mask, left to right */}
          <h1
            id="about-title"
            className="mt-2 font-display text-[clamp(48px,calc(128*var(--k)),150px)] leading-[1.05] font-bold tracking-[-0.03em] whitespace-nowrap text-ink max-md:text-[min(13vw,96px)]"
          >
            <span className="sr-only">{TITLE}</span>
            <span aria-hidden="true" className="block overflow-clip pb-[0.08em] -mb-[0.08em]">
              {Array.from(TITLE, (char, i) =>
                char === " " ? (
                  " "
                ) : (
                  <span
                    key={i}
                    className="inline-block animate-line-rise motion-reduce:animate-none"
                    style={{ "--delay": `${0.12 + i * 0.045}s` } as CSSProperties}
                  >
                    {char}
                  </span>
                ),
              )}
            </span>
          </h1>
        </header>

        {/* same width as the floating header, so the two line up */}
        <figure className="relative mx-auto mt-0 w-[min(calc(1270*var(--kw)),100%)] overflow-hidden rounded-[clamp(18px,calc(28*var(--k)),32px)]">
          <Image
            src="/About/about.webp"
            alt="Members of the SPE UGM Student Chapter together on the campus steps"
            width={1280}
            height={452}
            priority
            sizes="(min-width: 1320px) 1270px, 100vw"
            className="w-full animate-photo-settle [--delay:0.35s] motion-reduce:animate-none"
          />
          {/* each slat runs 1px into its neighbour so no seam shows, and
              comes to rest far enough below the frame that its edge glow
              no longer reaches the photo */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex">
            {SLATS.map((delay, i) => (
              <span
                key={i}
                className="-mr-px h-full flex-1 translate-y-[calc(100%+3rem)] animate-slat-drop bg-curtain shadow-[0_-10px_28px_rgba(78,78,255,0.25)] motion-reduce:animate-none"
                style={{ "--delay": `${delay}s` } as CSSProperties}
              />
            ))}
          </div>
          {/* the design's navy wash along the bottom */}
          {/* <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(20_22_70/0)_45%,rgb(24_26_90/0.45)_78%,rgb(30_32_120/0.75)_100%)]"
          /> */}
        </figure>
      </section>

      <section
        aria-labelledby="story-title"
        className="px-6 pb-[clamp(3rem,calc(72*var(--k)),5.5rem)] md:px-10"
      >
        <header data-motion="heading" className="text-center">
          <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
            <img src="/global/SVG-star.svg" width="14" height="14" aria-hidden="true" alt="" />
            SPE UGM SC
          </p>
          <h2 id="story-title" className={sectionTitle}>
            Who We Are &amp; What We Stand For
          </h2>
        </header>
        <div
          data-motion="stagger"
          data-motion-y="24"
          className="mx-auto mt-6 max-w-[1100px] space-y-5 text-center text-[15px] leading-relaxed text-ink-soft md:text-base">
          {STORY.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section
        aria-label="Vision and mission"
        className="px-4 pb-[clamp(5rem,calc(120*var(--k)),9rem)]"
      >
        <div className="mx-auto grid w-[min(calc(1270*var(--kw)),100%)] gap-4 md:grid-cols-2 md:gap-5">
          <VisionCard />
          <MissionCard />
        </div>
      </section>


      <section
        aria-labelledby="metrics-title"
        className="px-4 pb-[clamp(5rem,calc(120*var(--k)),9rem)]"
      >
        <header data-motion="heading" className="text-center">
          <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
            <img src="/global/SVG-star.svg" width="14" height="14" aria-hidden="true" alt="" />
            Key Metrics
          </p>
          <h2 id="metrics-title" className={sectionTitle}>
            How We Measure Success
          </h2>
        </header>
        <div
          data-motion="rise"
          className={`${metricsCard} relative isolate mx-auto mt-[clamp(1.5rem,calc(40*var(--k)),3rem)] w-[min(calc(1270*var(--kw)),100%)] overflow-hidden`}
        >
          {/* After Figma: an ellipse nearly the card's width whose top sits at
              ~85% of its height, linear #FFFFFF → #4E4EFF (40%) → #9999FF,
              layer blur 102.7 (≈ 51px in CSS). */}
          <div
            aria-hidden="true"
            data-motion="glow"
            className="pointer-events-none absolute inset-x-[1%] top-[85%] -z-10 h-[32%] rounded-[50%] bg-[linear-gradient(90deg,#ffffff_0%,#4e4eff_40%,#9999ff_100%)] opacity-55 blur-[51px]"
          />
          <dl
            data-motion="stagger"
            data-motion-y="0"
            data-motion-delay="0.2"
            className="grid grid-cols-1 px-6 py-4 sm:grid-cols-2 sm:px-10 sm:py-8"
          >
            {METRICS.map((metric, i) => (
              <div
                key={metric.label}
                className={[
                  "flex flex-col-reverse items-center py-8 text-center sm:py-12",
                  /* the cross between the four cells */
                  i > 0 ? "max-sm:border-t" : "",
                  i % 2 === 0 ? "sm:border-r" : "",
                  i >= 2 ? "sm:border-t" : "",
                  "border-[#d9dcf3]",
                ].join(" ")}
              >
                <dt className="mt-2 text-lg font-semibold text-ink md:text-2xl">
                  {metric.label}
                </dt>
                <dd className="font-display text-[clamp(56px,calc(120*var(--k)),132px)] leading-none font-bold tracking-[-0.03em] text-ink">
                  <CountUp value={metric.value} suffix="+" />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <CoreValues />

      <Leadership />
      <PageMotion />
    </main>
  );
}
