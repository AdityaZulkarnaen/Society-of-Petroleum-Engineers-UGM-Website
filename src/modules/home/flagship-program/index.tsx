import Image from "next/image";

const CONFERENCE_HIGHLIGHTS = [
  {
    title: "Keynote Speeches",
    description: "World-class speakers from leading energy companies and research institutions.",
  },
  {
    title: "Technical Paper Sessions",
    description: "60+ paper presentations covering reservoir, drilling, production, and sustainability.",
  },
  {
    title: "Exhibition Hall",
    description: "Cutting-edge technology showcased by 30+ energy industry exhibitors.",
  },
  {
    title: "Student Competition",
    description: "Inter-university paper competition with prizes totaling Rp 50 million.",
  },
];

const QUICK_FACTS = [
  { value: "Sep 18", label: "Conference Start" },
  { value: "356 Days", label: "Total Duration" },
  { value: "20+", label: "Countries" },
  { value: "60+", label: "Technical Papers" },
];

export function FlagshipProgram() {
  return (
    <section
      id="flagship-program"
      aria-labelledby="flagship-title"
      className="relative overflow-hidden bg-[#f2f8fe] px-4 py-16 sm:px-6 md:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-[1280px]">
        {/* ── Subtitle / Badge Header ───────────────────────────────── */}
        <header className="mb-10 text-center md:mb-8">
          <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
            <img src="/global/SVG-star.svg" width="14" height="14" aria-hidden="true" alt="" />
            Our Flagship Program
          </p>
        </header>

        <div className="flex flex-col gap-6 md:gap-4">
          {/* ── Top Hero Card: APECX ─────────────────────────────────── */}
          <div className="flagship-glass-card relative overflow-hidden rounded-[24px] border border-black/[0.08] px-6 py-14 sm:px-12 sm:py-20 md:py-24 text-center">
            {/* Ambient bottom purple/blue glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 w-[1300px] max-w-[160%] select-none"
            >
              <Image
                src="/landing/flagship-program/glow-apecx.svg"
                alt=""
                width={1504}
                height={345}
                className="h-auto w-full object-contain"
                priority
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="font-display text-6xl font-bold tracking-[-0.03em] text-[#2c2d3f] sm:text-7xl md:text-8xl lg:text-[116px] leading-[1]">
                APECX
              </h2>
              <p className="mt-3 text-sm text-[#2c2d3f]/70 sm:text-base md:mt-4 md:text-lg">
                Asia Pacific Energy Conference &amp; Exhibition
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-9">
                <a
                  href="#register"
                  className="inline-flex items-center gap-2 rounded-full bg-[#2c2d3f] px-5 py-3 text-sm font-semibold text-[#f2f8fe] shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-[#1a1b26] hover:shadow-md active:scale-95"
                >
                  <span>Register Now</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="shrink-0"
                  >
                    <path
                      d="M8.78571 3L13.5 8L8.78571 13M13.5 8H2.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a
                  href="#learn-more"
                  className="inline-flex items-center rounded-full border border-[#2c2d3f]/15 bg-white/70 px-5 py-3 text-sm font-semibold text-[#2c2d3f] shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow active:scale-95"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>

          {/* ── Bottom Cards: 2 Columns ──────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-4">
            {/* Card 1: Conference Program */}
            <div className="flagship-glass-card relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-black/[0.08] p-6 sm:p-8 md:p-10">
              {/* Corner ambient glow */}
              <div
                aria-hidden="true"
                className="-scale-x-100 pointer-events-none absolute -top-12 -right-12 w-[460px] max-w-[130%] select-none"
              >
                <Image
                  src="/landing/flagship-program/glow-conference.svg"
                  alt=""
                  width={778}
                  height={276}
                  className="h-auto w-full object-contain"
                />
              </div>

              <div className="relative z-10">
                <div className="text-center">
                  <h3 className="font-display text-xl font-bold tracking-tight text-[#2c2d3f] sm:text-2xl">
                    Conference Program
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-[480px] text-xs text-[#2c2d3f]/70 sm:text-sm">
                    End-to-end event planning and task coordination across all SPE UGM divisions.
                  </p>
                </div>

                <ul className="mt-8 flex flex-col gap-4 sm:gap-5">
                  {CONFERENCE_HIGHLIGHTS.map((item) => (
                    <li key={item.title} className="flex items-start gap-3.5">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-2 shrink-0 rounded-[3px] bg-[#4e4eff]"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#2c2d3f]">{item.title}</p>
                        <p className="mt-0.5 text-xs text-[#2c2d3f]/70 sm:text-[13px] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card 2: Quick Facts 2026 */}
            <div className="flagship-glass-card relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-black/[0.08] p-6 sm:p-8 md:p-10">
              {/* Corner ambient glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 -left-10 w-[440px] max-w-[130%] select-none"
              >
                <Image
                  src="/landing/flagship-program/glow-facts.svg"
                  alt=""
                  width={677}
                  height={254}
                  className="h-auto w-full object-contain"
                />
              </div>

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <p className="text-center text-[11px] font-semibold tracking-[1.32px] text-[#2c2d3f] uppercase">
                    Quick Facts 2026
                  </p>

                  <div className="mx-auto mt-8 grid max-w-[420px] grid-cols-2 gap-y-7 gap-x-10 sm:gap-y-8 sm:gap-x-16 text-center sm:text-left">
                    {QUICK_FACTS.map((fact) => (
                      <div key={fact.label} className="flex flex-col">
                        <span className="font-display text-2xl font-normal text-[#2c2d3f] sm:text-[28px] leading-none">
                          {fact.value}
                        </span>
                        <span className="mt-1 text-xs text-[#2c2d3f]/70">{fact.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Venue Details */}
                <div className="mt-10 border-t border-[#2c2d3f]/10 pt-5">
                  <p className="text-xs text-[#2c2d3f]/70">Venue</p>
                  <p className="mt-1 font-display text-sm font-medium text-[#2c2d3f] sm:text-base">
                    Sheraton Mustika Yogyakarta Resort &amp; Spa
                  </p>
                  <p className="mt-0.5 text-xs text-[#2c2d3f]/70 sm:text-[13px]">
                    Jl. Laksda Adisucipto, Yogyakarta
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
