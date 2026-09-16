"use client";

import Image from "next/image";
import { useState } from "react";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "About us", href: "#about" },
  { label: "Cabinet", href: "#cabinet" },
  { label: "Event", href: "#event" },
  { label: "Apecx", href: "#apecx" },
  { label: "Contact", href: "#contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-[3]">
      <nav className="nav-shell flex items-center" aria-label="Main">
        <a
          href="#home"
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
        </a>

        <ul className="hidden flex-1 items-center justify-center gap-[calc(31*var(--k))] md:flex">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="nav-link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a href="#join" className="btn-outline ml-auto hidden md:inline-flex">
          Join SPE
        </a>

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
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-[15px] font-medium text-ink-nav transition-colors hover:bg-[#f4f3fc] hover:text-ink-deep"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#join"
          onClick={() => setOpen(false)}
          className="btn-pill btn-pill--solid mt-1 w-full"
        >
          Join SPE
        </a>
      </div>
    </header>
  );
}
