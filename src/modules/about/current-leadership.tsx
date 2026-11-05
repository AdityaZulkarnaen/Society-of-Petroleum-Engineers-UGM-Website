import Link from "next/dist/client/link";
import Image from "next/image";

const CURRENT_LEADERS = [
  {
    name: "Ana Chadizara",
    role: "President",
    photo: { src: "/About/president-ara.webp", width: 648, height: 1054 },
  },
  {
    name: "Aulia Farizqki",
    role: "Vice President",
    photo: { src: "/About/vice-president-aul.webp", width: 662, height: 1112 },
  },
];

const WELCOME_NOTE =
  "Welcome to SPE UGM Student Chapter! It is a privilege to welcome you to a community where students from diverse backgrounds come together to connect, learn, gain experience, and innovate in the energy sector. Through technical programs, industry exposure, competitions, collaborations, and organizational experiences, we strive to bridge the gap between academic learning and the realities of the energy industry. As the energy landscape continues to evolve, SPE UGM SC is committed to empowering its members to stay curious, embrace challenges, build meaningful connections, and grow into capable future energy professionals. Together, let us explore new possibilities, learn from one another, and turn our passion into meaningful impact for the future of energy.";

export function CurrentLeadership() {
  return (
    <section
      aria-labelledby="current-leadership-title"
      className="px-4 pb-[clamp(5rem,calc(120*var(--k)),9rem)]"
    >
      <header data-motion="heading" className="text-center">
        <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path fill="currentColor" d="M8 0c.5 3.9 2.1 5.5 6 6-3.9.5-5.5 2.1-6 6-.5-3.9-2.1-5.5-6-6 3.9-.5 5.5-2.1 6-6Z" transform="translate(0 2)" />
          </svg>
          Leading the Chapter Today
        </p>
        <h2
          id="current-leadership-title"
          className="mt-3 font-display text-[clamp(30px,calc(60*var(--k)),64px)] leading-[1.12] font-bold tracking-[-0.02em] text-ink"
        >
          Current Leadership
        </h2>
      </header>

      <div
        data-motion="rise"
        className="relative isolate mx-auto mt-[clamp(1.5rem,calc(40*var(--k)),3rem)] w-[min(calc(1270*var(--kw)),100%)] overflow-hidden rounded-[clamp(20px,calc(28*var(--k)),32px)] border border-[#e4e6f5] bg-[linear-gradient(160deg,#fafbff_0%,#f4f5fd_100%)] px-4 pt-6 pb-10 shadow-[0_24px_60px_-34px_rgba(60,48,160,0.35)] sm:px-8 sm:pt-10 sm:pb-14"
      >
        <div aria-hidden="true" data-motion="glow" className="pointer-events-none absolute inset-x-[1%] top-[88%] -z-10 h-[60%] rounded-[50%] bg-[linear-gradient(90deg,#ffffff_0%,#4e4eff_40%,#9999ff_100%)] opacity-85 blur-[51px]" />
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-[clamp(1rem,calc(36*var(--k)),2.25rem)]">
          {CURRENT_LEADERS.map((leader) => (
            <li key={leader.role}>
              <div className="relative aspect-22/15 w-full overflow-hidden rounded-[clamp(16px,calc(22*var(--k)),26px)] border border-white bg-[linear-gradient(180deg,#f4f5fd_0%,#eceefb_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="absolute inset-x-0 -bottom-90 top-10 flex justify-center">
                  <Image
                    data-motion="figure"
                    src={leader.photo.src}
                    alt={`${leader.name}, current ${leader.role} of SPE UGM Student Chapter`}
                    width={leader.photo.width}
                    height={leader.photo.height}
                    sizes="(min-width: 640px) 45vw, 90vw"
                    className="h-full w-auto object-contain object-top"
                  />
                </div>
              </div>
              <p className="mt-4 text-center text-2xl font-bold tracking-[-0.01em] text-ink">{leader.role}</p>
              <p className="mt-1 text-center text-xl text-ink-soft">{leader.name}</p>
            </li>
          ))}
        </ul>
        <h3
          data-motion="rise"
          data-motion-y="16"
          className="mt-[clamp(1.75rem,calc(44*var(--k)),3rem)] text-center text-2xl font-bold tracking-[-0.01em] text-ink">
          President&rsquo;s Welcome Note
        </h3>
        <p
          data-motion="rise"
          data-motion-y="16"
          className="mx-auto mt-3 max-w-[100%] text-center text-lg leading-relaxed text-ink-soft"
        >
          {WELCOME_NOTE}
        </p>

        <div
          data-motion="rise"
          data-motion-y="16"
          className="mt-[clamp(1.5rem,calc(36*var(--k)),2.5rem)] flex justify-center"
        >
          <Link
            href="/coming-soon/cabinet"
            className="rounded-full bg-white px-[clamp(1.25rem,calc(28*var(--k)),1.75rem)] py-[clamp(0.55rem,calc(13*var(--k)),0.8rem)] text-lg font-semibold text-ink shadow-[0_10px_24px_-14px_rgba(60,48,160,0.6)] transition-colors hover:bg-[#f2f3ff]"
          >
            Meet The Cabinet
          </Link>
        </div>
      </div>
    </section>
  );
}
