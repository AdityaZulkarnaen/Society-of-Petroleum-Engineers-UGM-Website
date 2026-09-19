import type { ReactNode } from "react";

/* Shared pieces of the super admin tables. */

/* Icons ------------------------------------------------------------------ */

export const icons = {
  search: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="7" r="4.75" />
      <path d="m10.5 10.5 3 3" strokeLinecap="round" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  ),
  edit: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="m10.5 2.75 2.75 2.75L6 12.75l-3.5.75.75-3.5 7.25-7.25Z" strokeLinejoin="round" />
    </svg>
  ),
  toggle: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="1.75" y="4.75" width="12.5" height="6.5" rx="3.25" />
      <circle cx="10.75" cy="8" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  trash: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M2.75 4.25h10.5M6.25 4.25V2.75h3.5v1.5M4 4.25l.6 8.6a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.75 7v4M9.25 7v4" strokeLinecap="round" />
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="5.25" y="5.25" width="8.5" height="8.5" rx="1.5" />
      <path d="M10.75 5.25V3.75a1.5 1.5 0 0 0-1.5-1.5h-5.5a1.5 1.5 0 0 0-1.5 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5h1.5" />
    </svg>
  ),
};

export function IconButton({
  label,
  onClick,
  disabled,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid size-7 place-items-center rounded-md text-[#8a8ea3] transition-colors hover:bg-white/[0.06] disabled:opacity-40 ${
        danger ? "hover:text-[#f87171]" : "hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
