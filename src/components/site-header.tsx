"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { outlineButton, pillSolid } from "@/components/ui/button-styles";

/* Home sections are linked as /#…, so the links also work from other pages. */
const LINKS = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about" },
  { label: "Cabinet", href: "/#cabinet" },
  { label: "Event", href: "/#event" },
  { label: "Apecx", href: "/#apecx" },
  { label: "Contact", href: "/#contact" },
];

/**
 * The header floats as a rounded bar while the page's `[data-nav-float]`
 * section (the hero) is still under it, and docks to the top at full width
 * once that section has scrolled away. Pages without such a section get the
 * docked bar straight away, and phones always do (see the `docked` variant).
 */
function useDocked(navRef: React.RefObject<HTMLElement | null>) {
  const pathname = usePathname();
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    const zone = document.querySelector("[data-nav-float]");

    let frame = 0;
    const update = () => {
      frame = 0;
      if (!zone) return setDocked(true);
      const navBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
      setDocked(zone.getBoundingClientRect().bottom <= navBottom);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname, navRef]);

  return docked;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const docked = useDocked(navRef);

  return (
    <>
      {/* Hidden SVG Liquid Glass Filter */}
      <div className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <svg>
          <filter id="liquid-glass-map" primitiveUnits="objectBoundingBox">
            <feImage
              result="map"
              width="100%"
              height="100%"
              x="0"
              y="0"
              href="data:image/webp;base64,UklGRq4vAABXRUJQVlA4WAoAAAAQAAAA5wEAhwAAQUxQSOYWAAABHAVpGzCrf9t7EiJCYdIGTDpvURGm9n7K+YS32rZ1W8q0LSSEBCQgAQlIwEGGA3CQOAAHSEDCJSEk4KDvUmL31vrYkSX3ufgXEb4gSbKt2LatxlqIgNBBzbM3ikHVkvUvq7btKpaOBCQgIRIiAQeNg46DwgE4oB1QDuKgS0IcXBykXieHkwdjX/4iAhZtK3ErSBYGEelp+4aM/5/+z14+//jLlz/++s/Xr4//kl9C8Ns8DaajU+lPX/74+viv/eWxOXsO+eHL3/88/ut/2b0zref99evjX8NLmNt1fP7178e/jJcw9k3G//XP49/Iy2qaa7328Xkk9ZnWx0VUj3bcyCY4Pi7C6reeEagEohnRCbQQwFmUp9ggYQj8MChjTSI0Ck7G/bh6P5ykNU9yP+10G8I2UAwXeQ96DQwNjqyPu/c4tK+5CtGOK0oM7AH5f767lHpotXVYYI66B+HjMhHj43C5wok3YDH4/vZFZRkB7rNnEfC39WS2Q3K78y525wFNTPf5f+/fN9YI1YyDvjuzV5rQtsfn1Ez1ka3PkeGxOZ6IODxDJqCLpF7vdb9Z3s/ufLr6jf/55zbW3LodwwVVg7Lmao+p3eGcqDFDGuuKnlBZAPSbnkYtTX+mZl2y57Gq85F3tDv7m7/yzpjXHoVA3YUObsHz80W3IUK1E8yRqggxTMzD4If2230ys7RDxWrLu9o9GdSWNwNRC2yMIg+HkTVT3BOZER49XLBMdljemLFMjw8VwZ8OdBti4lWdt7c7dzaSc5yILtztsTMT1GFGn/tysM23nF3xbOsnh/eQGKkxhWGEalljCvWZ+LDE+9t97uqEfb08rdYwZGhheLzG2SJzKS77OIAVgPDjf9jHt6c+0mjinS/v13iz9RV3vsPdmbNG1E+nD6s83jBrBEnlBiTojuJogGJNtzxtsIoD2CFuXYipzhGWHhWqCBSqd7l7GMrnuHzH6910FO+XYwgcDxoFRJNk2GUcpQ6I/GhLmqisuBS6uSFpfAz3Yb9Yatyed7r781ZYfr3+3FfXs1MykSbVcg4GiOKX19SZ9xFRwhG+UZGiROjsXhePVu12fCZTJ3CJ4Z3uXnyxz28RutHa5yCKG6jgfTBPuA9jHL7YdlAa2trNEr7BLANd3qNYcWZqnkvlDe8+F5Q/9k8jCFk17ObrIf0O/5U/iDnqcqA70mURr8FUN5pmQEzDcxuWvOPd1+KrbO4fd0vXK5OTtYEy5C2TA5L4ok6Y31WHR9ZR9lQr6IjwruSd775W6NVa2zz1fir2k1GWnT573Eu3mfMjIikYZkM4MDCnTWbmLrpK/Hs0KD5C8rZ3n0tnw0j76WuU8P1YBIjsvcESbnOQMY+gGC/sd/gG+hKKtDijJHhrcSj/GHa/FZ8oGLXeLx1IW+cgU8pqD0PzMzU3oG5lQ/ZaDPDMYq+aAPSEmHN+JiVIp0haHTvPt7733="
            />
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur" />
            <feDisplacementMap
              in="blur"
              in2="map"
              scale="0.8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      </div>

      <header
        data-docked={docked || undefined}
        className="fixed inset-x-0 top-[3svh] z-50 animate-nav-in transition-[top] duration-500 ease-out-soft docked:top-0 motion-reduce:animate-none"
      >
        <nav
          ref={navRef}
          aria-label="Main"
          className={[
            "mx-auto flex h-(--nav-h) items-center border liquid-glass-header",
            "transition-[width,margin,padding,border-radius,border-color,box-shadow,background-color] duration-500 ease-out-soft",
            /* always floating style */
            "mt-[calc(13*var(--k))] w-[min(calc(1270*var(--kw)),calc(100%_-_2rem))] rounded-[clamp(18px,calc(24*var(--k)),30px)] border-white/30 px-[clamp(10px,calc(10*var(--k)),18px)] shadow-nav",
          ].join(" ")}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-xl"
            aria-label="SPE UGM Student Chapter — home"
          >
            <Image
              src="/global/logo.webp"
              alt="SPE UGM Student Chapter"
              width={169}
              height={147}
              priority
              className="h-[clamp(38px,calc(54*var(--k)),66px)] w-auto"
            />
          </Link>

          <ul className="hidden flex-1 items-center justify-center gap-[calc(31*var(--k))] md:flex">
            {LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  aria-current={link.href === pathname ? "page" : undefined}
                  className="text-[clamp(13.5px,calc(15*var(--k)),18px)] font-medium tracking-[-0.005em] text-ink-nav transition-all duration-200 ease-out-soft"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* on phones the CTA lives in the menu */}
          <div className="ml-auto hidden md:block">
            <Link href="/#join" className={outlineButton}>
              Join SPE
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="ml-auto grid size-11 place-items-center rounded-xl border border-[#e4e4f0] bg-white/80 text-ink-deep transition-colors hover:bg-white md:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <>
                  <path d="M5 5l10 10" />
                  <path d="M15 5L5 15" />
                </>
              ) : (
                <>
                  <path d="M3 6.5h14" />
                  <path d="M3 13.5h14" />
                </>
              )}
            </svg>
          </button>
        </nav>

        <div
          id="mobile-nav"
          hidden={!open}
          className="mx-4 mt-2 rounded-2xl border border-white/70 bg-white/85 p-2 shadow-[0_18px_40px_-20px_rgba(60,48,122,0.35)] backdrop-blur-xl md:hidden"
        >
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={link.href === pathname ? "page" : undefined}
                  className="block rounded-xl px-4 py-3 text-[15px] font-medium text-ink-nav transition-colors hover:bg-[#f4f3fc] hover:text-ink-deep aria-[current=page]:bg-[#f4f3fc] aria-[current=page]:text-ink-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#join"
            onClick={() => setOpen(false)}
            className={`${pillSolid} mt-1 w-full`}
          >
            Join SPE
          </Link>
        </div>
      </header>
    </>
  );
}
