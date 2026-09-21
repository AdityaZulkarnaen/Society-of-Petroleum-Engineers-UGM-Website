import Image from "next/image";
import Link from "next/link";

/* Placeholder people and photos from the design — swap in the cabinet's own
   portraits (cut-outs, bottom-aligned in their frame) and names. */
const LEADS = [
  {
    role: "President",
    name: "John Oliver Home",
    photo: { src: "/landing/testimonial/testi1.webp", width: 659, height: 682 },
  },
  {
    role: "Vice President",
    name: "Muhammad Zidan",
    photo: { src: "/landing/testimonial/testi2.webp", width: 659, height: 690 },
  },
];

const WELCOME_NOTE =
  "Welcome to SPE UGM Student Chapter! It is a privilege to welcome you to a community where students from diverse backgrounds come together to connect, learn, gain experience, and innovate in the energy sector. Through technical programs, industry exposure, competitions, collaborations, and organizational experiences, we strive to bridge the gap between academic learning and the realities of the energy industry. As the energy landscape continues to evolve, SPE UGM SC is committed to empowering its members to stay curious, embrace challenges, build meaningful connections, and grow into capable future energy professionals. Together, let us explore new possibilities, learn from one another, and turn our passion into meaningful impact for the future of energy.";

/**
 * The chapter's leadership: the president and vice president on their own
 * glass frames inside one outer card, the president's note below them, and
 * the way through to the rest of the cabinet. The card's foot is lit by the
 * same violet ellipse as the metrics card on this page.
 */
export function Leadership() {
  return (
    <section
      aria-labelledby="leadership-title"
      className="px-4 pb-[clamp(5rem,calc(120*var(--k)),9rem)]"
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
          The Pillars of SPE
        </p>
        <h2
          id="leadership-title"
          className="mt-3 font-display text-[clamp(30px,calc(60*var(--k)),64px)] leading-[1.12] font-bold tracking-[-0.02em] text-ink"
        >
          Leadership
        </h2>
      </header>

      <div className="relative isolate mx-auto mt-[clamp(1.5rem,calc(40*var(--k)),3rem)] w-[min(calc(1270*var(--kw)),100%)] overflow-hidden rounded-[clamp(20px,calc(28*var(--k)),32px)] border border-[#e4e6f5] bg-[linear-gradient(160deg,#fafbff_0%,#f4f5fd_100%)] px-4 pt-6 pb-10 shadow-[0_24px_60px_-34px_rgba(60,48,160,0.35)] sm:px-8 sm:pt-10 sm:pb-14">
        {/* the wash of light along the card's foot, as on the metrics card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[1%] top-[88%] -z-10 h-[60%] rounded-[50%] bg-[linear-gradient(90deg,#ffffff_0%,#4e4eff_40%,#9999ff_100%)] opacity-85 blur-[51px]"
        />

        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-[clamp(1rem,calc(36*var(--k)),2.25rem)]">
          {LEADS.map((lead) => (
            <li key={lead.role}>
              {/* A fixed 28:15 frame, the design's, so both portraits sit in
                  boxes of the same size whatever their own proportions are;
                  the cut-out stands on the frame's floor. */}
              <div className="flex aspect-22/15 items-end justify-center overflow-hidden rounded-[clamp(16px,calc(22*var(--k)),26px)] border border-white bg-[linear-gradient(180deg,#f4f5fd_0%,#eceefb_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <Image
                  src={lead.photo.src}
                  alt={`${lead.name}, ${lead.role} of SPE UGM Student Chapter`}
                  width={lead.photo.width}
                  height={lead.photo.height}
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="h-[88%] w-auto object-contain object-bottom"
                />
              </div>
              <p className="mt-4 text-center text-2xl font-bold tracking-[-0.01em] text-ink">
                {lead.role}
              </p>
              <p className="mt-1 text-center text-xl text-ink-soft">
                {lead.name}
              </p>
            </li>
          ))}
        </ul>

        <h3 className="mt-[clamp(1.75rem,calc(44*var(--k)),3rem)] text-center text-2xl font-bold tracking-[-0.01em] text-ink">
          President&rsquo;s Welcome Note
        </h3>
        <p className="mx-auto mt-3 max-w-[100%] text-center text-lg leading-relaxed text-ink-soft">
          {WELCOME_NOTE}
        </p>

        <div className="mt-[clamp(1.5rem,calc(36*var(--k)),2.5rem)] flex justify-center">
          <Link
            href="/#cabinet"
            className="rounded-full bg-white px-[clamp(1.25rem,calc(28*var(--k)),1.75rem)] py-[clamp(0.55rem,calc(13*var(--k)),0.8rem)] text-lg font-semibold text-ink shadow-[0_10px_24px_-14px_rgba(60,48,160,0.6)] transition-colors hover:bg-[#f2f3ff]"
          >
            Meet The Cabinet
          </Link>
        </div>
      </div>
    </section>
  );
}
