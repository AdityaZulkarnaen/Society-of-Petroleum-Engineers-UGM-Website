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
