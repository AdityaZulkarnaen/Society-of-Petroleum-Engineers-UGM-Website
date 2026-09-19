"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  photo: { src: string; width: number; height: number };
};

/* Placeholder copy from the design — replace with each person's real name,
   role and words. Photos are cut-outs, bottom-aligned in the frame. */
const TESTIMONIALS: Testimonial[] = [
  {
    name: "Jhon Oliver",
    role: "Practitioner Lecturer",
    quote:
      "Ipsum vel nobis doloremque est aut non accusantium vero molestias. Et est minima dolorem eum modi atque sint nobis. Enim quod facere. Reiciendis necessitatibus ipsam non aspernatur voluptate id.",
    photo: { src: "/landing/testimonial/testi1.webp", width: 659, height: 682 },
  },
  {
    name: "Rafi Pratama",
    role: "Alumni, Reservoir Engineer",
    quote:
      "Quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur adipisci velit.",
    photo: { src: "/landing/testimonial/testi2.webp", width: 659, height: 690 },
  },
  {
    name: "Dimas Aryasatya",
    role: "Chapter Member",
    quote:
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam. Nisi ut aliquid ex ea commodi consequatur, quis autem vel eum iure reprehenderit qui in ea voluptate.",
    photo: { src: "/landing/testimonial/testi3.webp", width: 659, height: 664 },
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        d={direction === "left" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Testimonials: one person at a time, their photo over a blue glow with a
 * large quote mark that color-burns into both. Glow, photo and quote share a
 * stacking context on purpose — isolating any of them would leave the blend
 * nothing to burn into.
 */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const count = TESTIMONIALS.length;
  const current = TESTIMONIALS[index];

  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") go(-1);
    if (event.key === "ArrowRight") go(1);
  }

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      aria-roledescription="carousel"
      onKeyDown={onKeyDown}
      className="relative overflow-hidden px-6 pt-[clamp(1rem,calc(24*var(--k)),2.5rem)] md:px-10"
    >
      <header className="relative z-10 text-center">
        <p className="flex items-center justify-center gap-2 text-base text-curtain md:text-lg">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0c.5 3.9 2.1 5.5 6 6-3.9.5-5.5 2.1-6 6-.5-3.9-2.1-5.5-6-6 3.9-.5 5.5-2.1 6-6Z"
              transform="translate(0 2)"
            />
          </svg>
          Testimonials
        </p>
        <h2
          id="testimonials-title"
          className="mt-3 text-3xl leading-[1.15] font-bold tracking-[-0.02em] text-ink md:text-7xl"
        >
          What They Say About Us
        </h2>
      </header>

      <div className="relative mx-auto mt-[clamp(2rem,calc(56*var(--k)),4.5rem)] grid max-w-[1277px] grid-cols-1 lg:grid-cols-[1fr_minmax(0,min(560px,40vw))_1fr] lg:items-end">
        {/* the glow the photo stands in; it fades out before the section ends
            so the bottom edge doesn't cut it off (the mask only touches the
            glow, which stays in the quote's stacking context to burn into) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[4%] left-1/2 h-[125%] w-[min(1180px,135%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(78_78_255/0.9)_0%,rgb(100_100_255/0.6)_32%,rgb(153_153_255/0.28)_62%,rgb(153_153_255/0)_100%)] [mask-image:linear-gradient(to_bottom,black_45%,transparent_78%)] lg:top-[-6%] lg:w-[min(1180px,92%)]"
        />

        {/* who — right of the photo on desktop, above it on phones */}
        <div
          key={`who-${index}`}
          className="relative order-1 text-center motion-safe:animate-testimonial-in lg:order-3 lg:self-start lg:pt-[9%] lg:pl-2 lg:text-left"
        >
          <p className="font-display text-[clamp(28px,calc(52*var(--k)),60px)] leading-tight font-bold tracking-[-0.02em] text-ink">
            {current.name}
          </p>
          <p className="mt-2 text-base text-ink-soft md:text-lg">{current.role}</p>
        </div>

        {/* what they said */}
        <blockquote
          key={`quote-${index}`}
          className="relative order-2 mx-auto mt-6 max-w-[440px] text-center motion-safe:animate-testimonial-in lg:order-1 lg:mt-0 lg:mr-6 lg:ml-auto lg:self-start lg:pt-[7%] lg:text-right"
        >
          <span
            aria-hidden="true"
            className="block font-display text-6xl leading-[0.6] font-bold text-curtain lg:pr-3"
          >
            ”
          </span>
          <p className="mt-3 text-base leading-relaxed text-ink-soft md:text-lg">
            {current.quote}
          </p>
        </blockquote>

        {/* photo, with the quote mark burned in over its right side */}
        <div className="relative order-3 mx-auto mt-8 w-[min(420px,82%)] lg:order-2 lg:mt-0 lg:w-full">
          <div className="relative aspect-[659/700]">
            {TESTIMONIALS.map((t, i) => (
              <Image
                key={t.photo.src}
                src={t.photo.src}
                alt={i === index ? `Photo of ${t.name}` : ""}
                aria-hidden={i !== index}
                width={t.photo.width}
                height={t.photo.height}
                sizes="(min-width: 1024px) 560px, 82vw"
                className={`absolute bottom-0 left-0 h-auto w-full transition-opacity duration-500 ${
                  i === index ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
          <Image
            src="/landing/testimonial/left-quote.webp"
            alt=""
            width={414}
            height={366}
            sizes="(min-width: 1024px) 370px, 55vw"
            className="pointer-events-none absolute top-[34%] left-[58%] w-[66%] mix-blend-color-burn"
          />
        </div>

        {/* 01 / 03 */}
        <div className="relative order-4 flex items-center justify-center gap-4 py-6 lg:absolute lg:bottom-0 lg:left-0 lg:justify-start lg:py-8">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous testimonial"
            className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5"
          >
            <Arrow direction="left" />
          </button>
          <p aria-live="polite" className="flex items-baseline gap-1 font-display font-bold text-ink">
            <span className="sr-only">Testimonial </span>
            <span className="text-[clamp(36px,calc(56*var(--k)),64px)] leading-none">
              {pad(index + 1)}
            </span>
            <span className="text-sm">
              <span className="sr-only"> of </span>
              <span aria-hidden="true">/ </span>
              {pad(count)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next testimonial"
            className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5"
          >
            <Arrow direction="right" />
          </button>
        </div>
      </div>
    </section>
  );
}
