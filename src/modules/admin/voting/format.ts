import type { Election } from "./data";

/* Election dates are plain YYYY-MM-DD days, so format them in UTC. */
const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { ...options, timeZone: "UTC" }).format(
    utc(date),
  );

/** '01–15 Okt 2025', widening as the range crosses a month or year. */
export function formatRange(from: string, to: string) {
  const day = (d: string) => d.slice(8, 10);
  const month = (d: string) => fmt(d, { month: "short" });
  const year = (d: string) => d.slice(0, 4);

  if (year(from) !== year(to)) {
    return `${day(from)} ${month(from)} ${year(from)} – ${day(to)} ${month(to)} ${year(to)}`;
  }
  if (from.slice(0, 7) !== to.slice(0, 7)) {
    return `${day(from)} ${month(from)} – ${day(to)} ${month(to)} ${year(to)}`;
  }
  return `${day(from)}–${day(to)} ${month(to)} ${year(to)}`;
}

export const longDate = (date: string) =>
  fmt(date, { day: "numeric", month: "long", year: "numeric" });

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** '8 hari lagi', '5 jam lagi', 'Kurang dari 1 jam', or the phase outside the window. */
export function timeLeft(election: Election) {
  if (election.phase === "upcoming") return "Belum dibuka";
  if (election.phase === "closed") return "Selesai";

  const ms = election.msLeft ?? 0;
  const days = Math.floor(ms / DAY);
  if (days >= 1) return `${days} hari lagi`;
  const hours = Math.floor(ms / HOUR);
  return hours >= 1 ? `${hours} jam lagi` : "Kurang dari 1 jam";
}
