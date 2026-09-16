import Image from "next/image";

import { Curtain, HeroSeams } from "@/components/curtain";
import { SiteHeader } from "@/components/site-header";

const SPONSORS = [
  {
    src: "/landing/hero/sponsor3.webp",
    alt: "Kemenkes RS Sardjito",
    width: 497,
    height: 159,
    className: "sponsor-sardjito",
  },
  {
    src: "/landing/hero/sponsor2.webp",
    alt: "OPT",
    width: 419,
    height: 159,
    className: "sponsor-opt",
  },
  {
    src: "/landing/hero/sponsor1.webp",
    alt: "Pertamina Drilling Services Indonesia",
    width: 594,
    height: 181,
    className: "sponsor-pertamina",
  },
];

export function Hero() {
  return (
    <section id="home" className="hero">
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

      <div className="hero-backdrop" aria-hidden="true" />
      <HeroSeams />

      <SiteHeader />

      <div className="hero-copy relative z-[2] flex flex-col items-center px-6 text-center">
        <h1 className="hero-title">
          Engineering
          <br />
          the future of energy
        </h1>

        <p className="hero-lede">
          The SPE UGM Student Chapter is a vibrant community of engineering
          students from all disciplines at Universitas Gadjah Mada, dedicated to
          advancing Indonesia&rsquo;s energy industry through research, training,
          and global collaboration.
        </p>

        <div className="hero-actions flex flex-wrap items-center justify-center">
          <a href="#about" className="btn-pill btn-pill--solid">
            Explore SPE UGM
          </a>
          <a href="#join" className="btn-pill btn-pill--ghost">
            Join Us Now
          </a>
        </div>

        <ul
          className="hero-sponsors flex flex-wrap items-center justify-center"
          aria-label="Partners and sponsors"
        >
          {SPONSORS.map((sponsor) => (
            <li key={sponsor.src} className="flex items-center">
              <Image
                src={sponsor.src}
                alt={sponsor.alt}
                width={sponsor.width}
                height={sponsor.height}
                className={sponsor.className}
              />
            </li>
          ))}
        </ul>
      </div>

      <Image
        src="/landing/hero/mascot-female.webp"
        alt=""
        width={1531}
        height={1656}
        priority
        sizes="(max-width: 767px) 50vw, 40vw"
        className="mascot mascot--f"
      />
      <Image
        src="/landing/hero/mascot-male.webp"
        alt=""
        width={1375}
        height={1522}
        priority
        sizes="(max-width: 767px) 45vw, 34vw"
        className="mascot mascot--m"
      />

      <Curtain />
    </section>
  );
}
