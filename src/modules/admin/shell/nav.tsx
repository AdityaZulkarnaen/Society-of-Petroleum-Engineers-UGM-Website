"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const icon = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <rect x="2" y="2" width="6" height="6" rx="1.6" />
      <rect x="10" y="2" width="6" height="6" rx="1.6" />
      <rect x="2" y="10" width="6" height="6" rx="1.6" />
      <rect x="10" y="10" width="6" height="6" rx="1.6" />
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <circle cx="9" cy="7.5" r="2.5" />
      <path d="M4.6 14.1c.9-1.7 2.5-2.6 4.4-2.6s3.5.9 4.4 2.6" strokeLinecap="round" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2.5" y="3.5" width="13" height="12" rx="2" />
      <path d="M2.5 7.5h13M6 2v3M12 2v3" strokeLinecap="round" />
      <path d="M6 10.5h1.5M10.5 10.5H12M6 13h1.5" strokeLinecap="round" />
    </svg>
  ),
  vote: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 9.5h12v5.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" strokeLinejoin="round" />
      <path d="M6 9.5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" strokeLinejoin="round" />
      <path d="m7.4 6 1.2 1.2L10.8 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
} satisfies Record<string, ReactNode>;

export const NAV = [
  { href: "/admin", label: "Overview", icon: icon.overview },
  { href: "/admin/rekap-diri", label: "Rekap Diri", icon: icon.profile },
  { href: "/admin/acara", label: "Acara / Proker", icon: icon.calendar },
  { href: "/admin/voting", label: "Voting Ketua", icon: icon.vote },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function SidebarNav() {
  const isActive = useIsActive();

  return (
    <ul className="space-y-1">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] transition-colors ${
                active
                  ? "bg-[linear-gradient(90deg,#1b2a5c_0%,#16204a_100%)] font-medium text-white shadow-[inset_0_0_0_1px_rgba(79,141,255,0.12)] [&>svg]:text-[#4f8dff]"
                  : "text-[#8a8ea3] hover:bg-white/[0.03] hover:text-[#d5d7e0]"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Phones and tablets: the same links as a scrollable tab row. */
export function TabNav() {
  const isActive = useIsActive();

  return (
    <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] whitespace-nowrap transition-colors ${
                active
                  ? "bg-[#1b2a5c] font-medium text-white [&>svg]:text-[#4f8dff]"
                  : "text-[#8a8ea3] hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
