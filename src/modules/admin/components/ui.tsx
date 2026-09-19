import type { ReactNode } from "react";

/* Shared pieces of the dashboard's dark card language. */

/* Card surface, after the Figma effect stack. It is translucent, so the page
   background shows through.
     Fill   — linear #FFFFFF 7% → 0% at 50%, corner to corner (fixed angle
              here, Figma's follows the card's aspect ratio)
     Fill   — #FFFFFF 4%
     Stroke — inside, 0.8, #FFFFFF 12%
     Inner shadow — x 6, y 6, blur 12, #FFFFFF 6%
     Inner shadow — x -1.5, y -1.5, blur 6, #308FFF 4% */
export const cardSurface =
  "rounded-[20px] border-[0.8px] border-white/12 " +
  "bg-[linear-gradient(110deg,rgb(255_255_255/0.07)_0%,rgb(255_255_255/0)_50%),linear-gradient(rgb(255_255_255/0.04),rgb(255_255_255/0.04))] " +
  "shadow-[inset_6px_6px_12px_rgb(255_255_255/0.06),inset_-1.5px_-1.5px_6px_rgb(48_143_255/0.04)]";

/** Blue gradient call-to-action button. */
export const primaryButton =
  "inline-flex h-11 items-center justify-center rounded-xl bg-[linear-gradient(90deg,#2f7bff_0%,#4e4eff_100%)] px-6 text-sm font-semibold text-white " +
  "shadow-[0_8px_24px_-8px_rgba(59,111,255,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] transition-[filter,box-shadow] hover:brightness-110 " +
  "disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/[0.06] disabled:text-[#5b5e71] disabled:shadow-none disabled:hover:brightness-100";

/** Quiet bordered button, e.g. "Batal". */
export const secondaryButton =
  "inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-[#c7c9d4] transition-colors hover:border-white/20 hover:text-white disabled:opacity-50";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${cardSurface} ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <header>
      <p className="flex items-center gap-2 text-[13px] text-[#4f8dff]">
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 0c.5 3.9 2.1 5.5 6 6-3.9.5-5.5 2.1-6 6-.5-3.9-2.1-5.5-6-6 3.9-.5 5.5-2.1 6-6Z"
            transform="translate(0 2)"
          />
        </svg>
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-[17px] font-bold tracking-[-0.01em] text-white">
        {title}
      </h2>
    </header>
  );
}

/** Small uppercase field label. */
export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
      {children}
    </p>
  );
}

/** Headline number card: label, value and an optional short caption. */
export function Stat({
  label,
  value,
  caption,
}: {
  label: string;
  value: ReactNode;
  caption?: string;
}) {
  return (
    <Card className="px-6 py-6">
      <Label>{label}</Label>
      <p className="mt-2.5 text-[30px] leading-none font-bold tracking-[-0.02em]">
        {value}
      </p>
      {caption && <p className="mt-3 text-[13px] text-[#6f7286]">{caption}</p>}
    </Card>
  );
}

const TONES = {
  blue: "border-[#3b82f6]/35 bg-[#3b82f6]/12 text-[#6aa5ff]",
  green: "border-[#34d399]/30 bg-[#34d399]/10 text-[#4ade80]",
  amber: "border-[#f59e0b]/35 bg-[#f59e0b]/10 text-[#fbbf24]",
  neutral: "border-white/15 bg-white/[0.03] text-[#c7c9d4]",
  red: "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  children,
  className = "px-2.5 py-1 text-xs font-medium",
}: {
  tone?: Tone;
  children: ReactNode;
  /** Size and weight; replaces the default. */
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Thin gradient bar. A null percent draws the empty track only. */
export function ProgressBar({
  percent,
  label,
  className = "",
}: {
  percent: number | null;
  label: string;
  className?: string;
}) {
  const track = `h-1.5 overflow-hidden rounded-full bg-white/[0.08] ${className}`;
  if (percent == null) return <div aria-hidden="true" className={track} />;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={track}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#4e4eff)]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Placeholder for a section whose data isn't recorded yet. */
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">
      <p className="text-sm font-medium text-[#c7c9d4]">{title}</p>
      <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-[#6f7286]">
        {description}
      </p>
    </div>
  );
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "").slice(0, 2);
  return letters.toUpperCase();
}

export function Avatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full border border-[#4f6bff]/40 bg-[radial-gradient(circle_at_30%_25%,#2d3a8c_0%,#1a2160_100%)] font-bold text-white ${
        size === "lg"
          ? "size-[72px] text-[22px] shadow-[0_0_0_6px_rgba(79,107,255,0.08)]"
          : "size-9 text-[13px]"
      }`}
    >
      {initials(name)}
    </span>
  );
}
