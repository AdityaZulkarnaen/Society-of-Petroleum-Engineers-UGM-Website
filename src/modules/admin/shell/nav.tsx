"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const icon = {
  overview: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="6" height="6" rx="1.6" />
      <rect x="10" y="2" width="6" height="6" rx="1.6" />
      <rect x="2" y="10" width="6" height="6" rx="1.6" />
      <rect x="10" y="10" width="6" height="6" rx="1.6" />
    </svg>
  ),
  profile: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="7" />
      <circle cx="9" cy="7.5" r="2.5" />
      <path
        d="M4.6 14.1c.9-1.7 2.5-2.6 4.4-2.6s3.5.9 4.4 2.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  calendar: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="2.5" y="3.5" width="13" height="12" rx="2" />
      <path d="M2.5 7.5h13M6 2v3M12 2v3" strokeLinecap="round" />
      <path d="M6 10.5h1.5M10.5 10.5H12M6 13h1.5" strokeLinecap="round" />
    </svg>
  ),
  vote: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M3 9.5h12v5.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"
        strokeLinejoin="round"
      />
      <path
        d="M6 9.5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6"
        strokeLinejoin="round"
      />
      <path
        d="m7.4 6 1.2 1.2L10.8 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  home: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M2.75 7.6 9 2.75l6.25 4.85V15a.75.75 0 0 1-.75.75h-3.75v-4.5h-3.5v4.5H3.5a.75.75 0 0 1-.75-.75V7.6Z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  users: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="6.75" cy="6" r="2.75" />
      <path
        d="M1.75 15c.6-2.4 2.6-3.75 5-3.75s4.4 1.35 5 3.75"
        strokeLinecap="round"
      />
      <path
        d="M11.5 3.4a2.75 2.75 0 0 1 0 5.2M13.25 11.5c1.4.5 2.4 1.7 2.9 3.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  clipboard: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3.25" y="3" width="11.5" height="13" rx="1.75" />
      <path
        d="M6.5 1.75h5v2.5h-5zM6.25 8h5.5M6.25 11h3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  layers: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="m9 2.25 6.75 3.5L9 9.25l-6.75-3.5L9 2.25Z"
        strokeLinejoin="round"
      />
      <path
        d="m2.25 9.25 6.75 3.5 6.75-3.5M2.25 12.5 9 16l6.75-3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  qr: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="5" height="5" rx="1.25" />
      <rect x="10.5" y="2.5" width="5" height="5" rx="1.25" />
      <rect x="2.5" y="10.5" width="5" height="5" rx="1.25" />
      <path d="M10.5 10.5h2.25M15.5 10.5v2.5M10.5 13.25v2.25M13.5 15.5h2" strokeLinecap="round" />
    </svg>
  ),
  log: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="2.75" y="2.25" width="12.5" height="13.5" rx="1.75" />
      <path d="M6 6h6M6 9h6M6 12h3.5" strokeLinecap="round" />
    </svg>
  ),
} satisfies Record<string, ReactNode>;

/* The first item of each menu is its dashboard root. */
const MENUS = {
  admin: [
    { href: "/admin", label: "Overview", icon: icon.overview },
    { href: "/admin/rekap-diri", label: "Rekap Diri", icon: icon.profile },
    { href: "/admin/acara", label: "Acara / Proker", icon: icon.calendar },
    { href: "/admin/presensi", label: "Presensi Rapat", icon: icon.qr },
    { href: "/admin/voting", label: "Voting Ketua", icon: icon.vote },
  ],
  superAdmin: [
    { href: "/super-admin", label: "Dashboard", icon: icon.home },
    { href: "/super-admin/akun", label: "Manajemen Akun", icon: icon.users },
    {
      href: "/super-admin/rekap",
      label: "Rekap Pengurus",
      icon: icon.clipboard,
    },
    { href: "/super-admin/voting", label: "Voting", icon: icon.vote },
    {
      href: "/super-admin/acara",
      label: "Acara / Proker",
      icon: icon.calendar,
    },
    {
      href: "/super-admin/presensi",
      label: "Presensi Rapat",
      icon: icon.qr,
    },
    { href: "/super-admin/divisi", label: "Divisi", icon: icon.layers },
    { href: "/super-admin/audit-log", label: "Audit Log", icon: icon.log },
  ],
};

export type Menu = keyof typeof MENUS;

function useIsActive(menu: Menu) {
  const pathname = usePathname();
  const root = MENUS[menu][0].href;
  return (href: string) =>
    href === root
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ menu = "admin" }: { menu?: Menu }) {
  const isActive = useIsActive(menu);

  return (
    <ul className="space-y-1">
      {MENUS[menu].map((item) => {
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
