import Image from "next/image";

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
          <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0c.5 3.9 2.1 5.5 6 6-3.9.5-5.5 2.1-6 6-.5-3.9-2.1-5.5-6-6 3.9-.5 5.5-2.1 6-6Z"
                transform="translate(0 2)"
              />
            </svg>
            About us
          </p>
          <h1
            id="about-title"
            className="mt-2 font-display text-[clamp(48px,calc(128*var(--k)),150px)] leading-[1.05] font-bold tracking-[-0.03em] whitespace-nowrap text-ink max-md:text-[min(13vw,96px)]"
          >
            SPE UGM SC
          </h1>
        </header>

        {/* same width as the floating header, so the two line up */}
        <figure className="relative mx-auto mt-[clamp(1.5rem,calc(40*var(--k)),3rem)] w-[min(calc(1270*var(--kw)),100%)] overflow-hidden rounded-[clamp(18px,calc(28*var(--k)),32px)] shadow-[0_30px_60px_-30px_rgba(30,32,110,0.45)]">
          <Image
            src="/About/about.webp"
            alt="Members of the SPE UGM Student Chapter together on the campus steps"
            width={1280}
            height={452}
            priority
            sizes="(min-width: 1320px) 1270px, 100vw"
            className="aspect-[1280/452] w-full object-cover max-md:aspect-[4/3]"
          />
          {/* the design's navy wash along the bottom */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(20_22_70/0)_45%,rgb(24_26_90/0.45)_78%,rgb(30_32_120/0.75)_100%)]"
          />
        </figure>
      </section>
    </main>
  );
}
