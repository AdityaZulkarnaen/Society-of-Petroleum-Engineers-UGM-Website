/* Shared link-button styles. Sizes follow the reference frame (--k) with
   pixel floors and ceilings so they stay tappable on phones. */

const pillBase =
  "inline-flex items-center justify-center whitespace-nowrap rounded-full " +
  "h-[clamp(42px,calc(47*var(--k)),58px)] px-[clamp(18px,calc(18*var(--k)),26px)] " +
  "text-[clamp(13.5px,calc(14.5*var(--k)),18px)] font-semibold tracking-[-0.005em] " +
  "transition-[background-color,box-shadow,translate] duration-200 ease-out-soft hover:-translate-y-0.5";

export const pillSolid =
  `${pillBase} bg-ink-deep text-white shadow-[0_12px_26px_-12px_rgba(23,30,45,0.55)] ` +
  "hover:bg-[#111823] hover:shadow-[0_18px_32px_-14px_rgba(23,30,45,0.6)]";

export const pillGhost =
  `${pillBase} bg-white text-ink-deep shadow-[0_10px_24px_-14px_rgba(46,41,82,0.4)] ` +
  "hover:shadow-[0_16px_30px_-14px_rgba(46,41,82,0.45)]";

export const outlineButton =
  "inline-flex items-center justify-center whitespace-nowrap " +
  "h-[clamp(40px,calc(47*var(--k)),58px)] px-[clamp(16px,calc(24*var(--k)),30px)] " +
  "rounded-[clamp(11px,calc(14*var(--k)),18px)] border border-[#e4e4f0] bg-white " +
  "text-[clamp(13.5px,calc(15*var(--k)),18px)] font-medium text-ink-deep " +
  "transition-[background-color,border-color,translate] duration-200 ease-out-soft " +
  "hover:-translate-y-px hover:border-[#d5d4e8] hover:bg-[#fbfaff]";
