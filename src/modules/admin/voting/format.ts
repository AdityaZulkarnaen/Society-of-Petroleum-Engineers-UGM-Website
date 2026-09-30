import type { Election } from "./data";

/* Election dates are plain YYYY-MM-DD days, so format them in UTC. */
const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(
    utc(date),
  );

/** 'Oct 01–15, 2025', widening as the range crosses a month or year. */
export function formatRange(from: string, to: string) {
  const day = (d: string) => d.slice(8, 10);
  const month = (d: string) => fmt(d, { month: "short" });
  const year = (d: string) => d.slice(0, 4);

  if (year(from) !== year(to)) {
    return `${month(from)} ${day(from)}, ${year(from)} – ${month(to)} ${day(to)}, ${year(to)}`;
  }
  if (from.slice(0, 7) !== to.slice(0, 7)) {
    return `${month(from)} ${day(from)} – ${month(to)} ${day(to)}, ${year(to)}`;
  }
  return `${month(from)} ${day(from)}–${day(to)}, ${year(to)}`;
}

export const longDate = (date: string) =>
  fmt(date, { day: "numeric", month: "long", year: "numeric" });

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** '8d left', '5h left', 'Less than 1 hour left', or the phase outside the window. */
export function timeLeft(election: Election) {
  if (election.phase === "upcoming") return "Upcoming";
  if (election.phase === "closed") return "Ended";

  const ms = election.msLeft ?? 0;
  const days = Math.floor(ms / DAY);
  if (days >= 1) return `${days}d left`;
  const hours = Math.floor(ms / HOUR);
  return hours >= 1 ? `${hours}h left` : "Less than 1 hour left";
}
