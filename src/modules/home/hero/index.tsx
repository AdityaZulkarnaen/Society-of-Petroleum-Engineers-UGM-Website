import Image from "next/image";

import { pillGhost, pillSolid } from "@/components/ui/button-styles";

import { Curtain } from "./curtain";
import { HeroTiles } from "./hero-tiles";

/* Sponsor marks are sized optically, not uniformly: each source file has its
   own padding and wordmark weight. Two of the three were exported at partial
   opacity, so an SVG gamma filter on alpha brings them back to solid ink. */
const SPONSORS = [
  {
    src: "/landing/hero/sponsor3.webp",
    alt: "Kemenkes RS Sardjito",
    width: 497,
    height: 159,
    className:
      "h-[clamp(22px,calc(50*var(--k)),62px)] [filter:url(#solidify-soft)]",
  },
  {
    src: "/landing/hero/sponsor2.webp",
    alt: "OPT",
    width: 419,
    height: 159,
    className: "h-[clamp(24px,calc(54*var(--k)),66px)]",
  },
  {
    src: "/landing/hero/sponsor1.webp",
    alt: "Pertamina Drilling Services Indonesia",
    width: 594,
    height: 181,
    className:
      "h-[clamp(26px,calc(59*var(--k)),72px)] [filter:url(#solidify-hard)]",
  },
];

const mascot = "pointer-events-none absolute z-[2] h-auto select-none";

export function Hero() {
  return (
    <section
      id="home"
      data-nav-float
      className="relative isolate z-[1] min-h-(--hero-h) overflow-x-clip tall:flex tall:flex-col"
    >
      {/* Restores full opacity on the two sponsor files that were exported
          semi-transparent. */}
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        className="absolute"
        focusable="false"
      >
        <filter id="solidify-soft" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="gamma" amplitude="1" exponent="0.55" offset="0" />
          </feComponentTransfer>
        </filter>
        <filter id="solidify-hard" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="gamma" amplitude="1" exponent="0.2" offset="0" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* near-white ground; the lavender comes from the lit tiles above it */}
      <div
        className="absolute inset-0 z-0 bg-[linear-gradient(180deg,#f6f5fd_0%,#f0effe_20%,#ffffff_55%,#ffffff_100%)]"
        aria-hidden="true"
      />
      <HeroTiles />

      {/* On tall viewports the copy centres in the room the curtain leaves
          (clearing the mascots' heads) instead of hanging from the top. */}
      <div className="relative z-[2] flex flex-col items-center px-6 pt-[max(calc(302*var(--k)),calc(var(--nav-h)+3.5rem))] text-center tall:flex-auto tall:justify-center tall:pt-[calc(var(--nav-h)+1.5rem)] tall:pb-[calc(var(--stage)_-_var(--mascot-line)_+_6.6*var(--m)_+_0.75rem)]">
        <h1 className="font-display text-[clamp(30px,calc(80*var(--k)),96px)] leading-[1.277] font-bold tracking-[-0.02em] text-ink">
          Engineering
          <br />
          the future of energy
        </h1>

        <p className="mt-[calc(6*var(--k))] max-w-[min(calc(760*var(--k)),90vw)] text-[clamp(14px,calc(18*var(--k)),23px)] leading-[1.778] text-ink-soft">
          The SPE UGM Student Chapter is a vibrant community of engineering
          students from all disciplines at Universitas Gadjah Mada, dedicated to
          advancing Indonesia&rsquo;s energy industry through research, training,
          and global collaboration.
        </p>

        <div className="mt-[max(calc(31*var(--k)),1.1rem)] flex flex-wrap items-center justify-center gap-[calc(12*var(--k))]">
          <a href="#about" className={pillSolid}>
            Explore SPE UGM
          </a>
          <a href="#join" className={pillGhost}>
            Join Us Now
          </a>
        </div>

        {/* <ul
          className="mt-[max(calc(155.5*var(--k)),2.25rem)] flex flex-wrap items-center justify-center gap-[clamp(1rem,calc(88*var(--k)),6rem)]"
          aria-label="Partners and sponsors"
        >
          {SPONSORS.map((sponsor) => (
            <li key={sponsor.src} className="flex items-center">
              <Image
                src={sponsor.src}
                alt={sponsor.alt}
                width={sponsor.width}
                height={sponsor.height}
                className={`w-auto ${sponsor.className}`}
              />
            </li>
          ))}
        </ul> */}
      </div>

      {/* Both figures are pinned so the lower cut in their artwork lands
          on the --mascot-line panel edge (--p2 on desktop), and the higher
          cut one step above it — nudged down and
          outwards a touch so the cuts sit under the curtain rather than
          exactly on its edge, where rounding could expose them.
          female — source 1531x1656, visible from x85, cuts at y1450.5 /
          y1633, step at x372.5; pulled left to touch the screen edge */}
      <Image
        src="/landing/hero/mascot-female.webp"
        alt=""
        width={1531}
        height={1656}
        priority
        sizes="(max-width: 767px) 90vw, 40vw"
        className={`${mascot} max-md:bottom-[calc(100%_-_var(--mascot-line)_-_10px)] md:top-[calc(100svh_-_7.29*var(--m-female))] left-[calc(-0.5058*var(--m-female))] w-[calc(8.389*var(--m-female))] md:pt-8 xl:pt-0`}
      />
      {/* male — source 1375x1522, visible to x1375, cuts at y1320.5 /
          y1520, step at x990.5 */}
      <Image
        src="/landing/hero/mascot-male.webp"
        alt=""
        width={1375}
        height={1522}
        priority
        sizes="(max-width: 767px) 75vw, 34vw"
        className={`${mascot} -right-5 max-md:bottom-[calc(100%_-_var(--mascot-line)_-_10px)] md:top-[calc(100svh_-_6.8922*var(--m-male)*1522/1375)] w-[calc(6.8922*var(--m-male))] md:pt-24`}
      />

      <Curtain />
    </section>
  );
}
