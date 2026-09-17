import { ScrollRevealText } from "./scroll-reveal-text";

const MISSION =
  "We are a generation \nof future energy leaders, uniting diverse engineering disciplines to pioneer sustainable solutions through research, global synergy, and technical excellence.";

/**
 * Picks up where the hero's curtain comes to rest: the section opens on the
 * same blue, so the fabric reads as one surface, then fades back to the page
 * ground at the bottom.
 */
export function About() {
  return (
    <section
      id="about"
      aria-label="About SPE UGM"
      className="relative -mt-px bg-[linear-gradient(to_bottom,var(--color-curtain)_0%,var(--color-curtain)_50%,#8c8cff_78%,var(--color-ground)_100%)] px-6 pt-[clamp(3.5rem,calc(110*var(--k)),9rem)] pb-[clamp(12rem,calc(340*var(--k)),26rem)]"
    >
      <ScrollRevealText
        text={MISSION}
        className="mx-auto max-w-[85%] text-center font-display text-4xl md:text-7xl leading-[1.18] font-bold tracking-[-0.02em] whitespace-pre-line text-white"
      />
    </section>
  );
}
