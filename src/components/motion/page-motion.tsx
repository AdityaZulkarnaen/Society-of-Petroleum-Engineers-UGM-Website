"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/* expo.out is the GSAP twin of the curtain's cubic-bezier(0.16, 1, 0.3, 1) */
const EASE = "expo.out";
const START = "top 88%";

/**
 * Anything already on screen when this runs is left as the server painted
 * it: hiding it now would only make it blink. Entrances are for what is
 * still below the fold.
 */
const settled = (el: Element) =>
  el.getBoundingClientRect().top < window.innerHeight * 0.8;

const pending = (selector: string) =>
  gsap.utils.toArray<HTMLElement>(selector).filter((el) => !settled(el));

const once = (trigger: Element, start = START) => ({
  trigger,
  start,
  once: true,
});

/**
 * Section headers — `data-motion="heading"` on the wrapper. The star beside
 * the eyebrow turns into place, and the title's lines rise out of their own
 * masks. The split is undone as soon as the lines land, so the heading goes
 * back to reflowing like plain text.
 */
function headings(reduce: boolean) {
  for (const el of pending('[data-motion="heading"]')) {
    if (reduce) {
      gsap.from(el, { opacity: 0, duration: 0.6, scrollTrigger: once(el) });
      continue;
    }

    const title = el.querySelector<HTMLElement>("h1, h2");
    const eyebrow = el.firstElementChild === title ? null : el.firstElementChild;
    const star = eyebrow?.querySelector("img, svg");

    if (eyebrow) {
      gsap.from(eyebrow, {
        opacity: 0,
        y: 12,
        duration: 0.8,
        ease: EASE,
        scrollTrigger: once(el),
      });
    }
    if (star) {
      gsap.from(star, {
        rotate: -135,
        scale: 0.2,
        duration: 1.1,
        ease: EASE,
        scrollTrigger: once(el),
      });
    }
    if (title) {
      SplitText.create(title, {
        type: "lines",
        mask: "lines",
        linesClass: "motion-line",
        autoSplit: true,
        onSplit: (split) =>
          gsap.from(split.lines, {
            yPercent: 115,
            duration: 1.1,
            stagger: 0.09,
            delay: eyebrow ? 0.08 : 0,
            ease: EASE,
            scrollTrigger: once(el),
            onComplete: () => split.revert(),
          }),
      });
    }
  }
}

/**
 * Cards and list items — `data-motion="rise"` on an element, or
 * `data-motion="stagger"` on a list to rise its children. Whatever scrolls
 * in together is released together, siblings one after another, so a row
 * of cards reads left to right while a list inside one card doesn't hold
 * back the card beside it. `data-motion-y` sets the travel (0 for a fade
 * alone) and `data-motion-delay` holds items back behind their card.
 */
function rises(reduce: boolean) {
  const items = pending('[data-motion="rise"], [data-motion="stagger"] > *');
  if (!items.length) return;

  const source = (el: HTMLElement) =>
    el.dataset.motion ? el : (el.parentElement ?? el);
  const travel = (el: HTMLElement) =>
    reduce ? 0 : Number(source(el).dataset.motionY ?? 36);
  const hold = (el: HTMLElement) => Number(source(el).dataset.motionDelay ?? 0);

  gsap.set(items, { opacity: 0, y: (_, el: HTMLElement) => travel(el) });
  ScrollTrigger.batch(items, {
    start: START,
    once: true,
    onEnter: (batch) => {
      const turn = new Map<Element | null, number>();
      const delays = (batch as HTMLElement[]).map((el) => {
        const n = turn.get(el.parentElement) ?? 0;
        turn.set(el.parentElement, n + 1);
        return hold(el) + Math.min(n * 0.08, 0.4);
      });
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: reduce ? 0.6 : 1,
        ease: reduce ? "power1.out" : EASE,
        delay: (i) => delays[i],
        clearProps: "opacity,transform",
      });
    },
  });
}

/**
 * The violet light in each card — `data-motion="glow"` — comes on once the
 * card is in view, after the card itself has landed. `data-glow="sweep"`
 * instead lets the light run in along its own tail, through a feathered
 * mask (see globals.css), for the teardrop glows that have a direction.
 */
function glows(reduce: boolean) {
  for (const el of gsap.utils.toArray<HTMLElement>('[data-motion="glow"]')) {
    const card = el.parentElement;
    if (!card || settled(card)) continue;

    if (el.dataset.glow === "sweep" && !reduce) {
      gsap.fromTo(
        el,
        { "--sweep": "-35%" },
        {
          "--sweep": "100%",
          duration: 2.2,
          delay: 0.3,
          ease: "power2.inOut",
          scrollTrigger: once(card),
        },
      );
      continue;
    }

    gsap.from(el, {
      opacity: 0,
      scale: reduce ? 1 : 0.8,
      duration: 2,
      delay: 0.3,
      ease: "power2.out",
      scrollTrigger: once(card),
      clearProps: "opacity,transform",
    });
  }
}

/**
 * People standing on a floor — `data-motion="figure"` inside a clipping
 * frame — rise up through it, like the mascots behind the hero curtain.
 */
function figures(reduce: boolean) {
  for (const el of gsap.utils.toArray<HTMLElement>('[data-motion="figure"]')) {
    const frame = el.parentElement;
    if (!frame || settled(frame)) continue;

    gsap.from(el, {
      opacity: 0,
      yPercent: reduce ? 0 : 28,
      duration: 1.4,
      delay: 0.2,
      ease: EASE,
      scrollTrigger: once(frame, "top 80%"),
      clearProps: "opacity,transform",
    });
  }
}

/** A display word whose letters rise in turn — `data-motion="chars"`. */
function letters(reduce: boolean) {
  for (const el of pending('[data-motion="chars"]')) {
    if (reduce) {
      gsap.from(el, { opacity: 0, duration: 0.6, scrollTrigger: once(el) });
      continue;
    }

    SplitText.create(el, {
      type: "lines,chars",
      mask: "lines",
      linesClass: "motion-line",
      autoSplit: true,
      onSplit: (split) =>
        gsap.from(split.chars, {
          yPercent: 115,
          duration: 1.2,
          stagger: 0.06,
          delay: 0.15,
          ease: EASE,
          scrollTrigger: once(el),
          onComplete: () => split.revert(),
        }),
    });
  }
}

/**
 * Glass cards marked `data-sheen` catch a soft light where the pointer is.
 * Only the position is tracked here; globals.css draws the light and fades
 * it with hover.
 */
function sheen() {
  const cards = gsap.utils.toArray<HTMLElement>("[data-sheen]");
  const move = (event: PointerEvent) => {
    const card = event.currentTarget as HTMLElement;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--sheen-x", `${event.clientX - box.left}px`);
    card.style.setProperty("--sheen-y", `${event.clientY - box.top}px`);
  };

  cards.forEach((card) => card.addEventListener("pointermove", move));
  return () =>
    cards.forEach((card) => card.removeEventListener("pointermove", move));
}

/**
 * Scroll entrances for the page it is rendered in, driven by `data-motion`
 * attributes so the sections themselves stay Server Components. Setup waits
 * a frame, so a client-side navigation has already scrolled back to the top
 * before it decides what is on screen. Under reduced motion the same
 * entrances fade in place instead of travelling.
 */
export function PageMotion() {
  useGSAP((context) => {
    const frame = requestAnimationFrame(() =>
      context.add(() => {
        const mm = gsap.matchMedia();

        mm.add(
          {
            full: "(prefers-reduced-motion: no-preference)",
            reduce: "(prefers-reduced-motion: reduce)",
          },
          ({ conditions }) => {
            const reduce = Boolean(conditions?.reduce);
            headings(reduce);
            letters(reduce);
            rises(reduce);
            glows(reduce);
            figures(reduce);
          },
        );
        mm.add("(hover: hover) and (pointer: fine)", sheen);
      }),
    );

    return () => cancelAnimationFrame(frame);
  });

  return null;
}
